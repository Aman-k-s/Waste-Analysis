import os
import re
from dataclasses import dataclass
from typing import Any

import mysql.connector
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction


IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
STATE_TABLE = "analytics_sync_state"


def _quote_identifier(value: str) -> str:
    if not IDENTIFIER_RE.match(value):
        raise CommandError(f"Unsafe SQL identifier: {value}")
    return f"`{value}`"


@dataclass
class SyncConfig:
    source_host: str
    source_port: int
    source_name: str
    source_user: str
    source_password: str
    source_table: str
    target_table: str
    cursor_column: str
    batch_size: int
    company_id: str | None
    initial_cursor: str
    job_name: str


def _load_config() -> SyncConfig:
    missing = [
        key
        for key in ("PROD_SYNC_HOST", "PROD_SYNC_NAME", "PROD_SYNC_USER", "PROD_SYNC_PASSWORD")
        if not os.getenv(key)
    ]
    if missing:
        raise CommandError(f"Missing sync environment variables: {', '.join(missing)}")

    source_table = os.getenv("PROD_SYNC_SOURCE_TABLE", os.getenv("WASTE_SCAN_TABLE", "scm_scans"))
    target_table = os.getenv("PROD_SYNC_TARGET_TABLE", os.getenv("WASTE_SCAN_TABLE", "scm_scans"))
    cursor_column = os.getenv("PROD_SYNC_CURSOR_COLUMN", "id")

    return SyncConfig(
        source_host=os.getenv("PROD_SYNC_HOST", ""),
        source_port=int(os.getenv("PROD_SYNC_PORT", "3306")),
        source_name=os.getenv("PROD_SYNC_NAME", ""),
        source_user=os.getenv("PROD_SYNC_USER", ""),
        source_password=os.getenv("PROD_SYNC_PASSWORD", ""),
        source_table=source_table,
        target_table=target_table,
        cursor_column=cursor_column,
        batch_size=max(1, int(os.getenv("PROD_SYNC_BATCH_SIZE", "5000"))),
        company_id=os.getenv("PROD_SYNC_COMPANY_ID") or None,
        initial_cursor=os.getenv("PROD_SYNC_INITIAL_CURSOR", "0"),
        job_name=os.getenv("PROD_SYNC_JOB_NAME", "prod_scm_scans_sync"),
    )


def _ensure_state_table() -> None:
    sql = f"""
        CREATE TABLE IF NOT EXISTS {STATE_TABLE} (
            job_name VARCHAR(128) PRIMARY KEY,
            source_table VARCHAR(128) NOT NULL,
            cursor_column VARCHAR(128) NOT NULL,
            last_cursor VARCHAR(255) NULL,
            last_started_at DATETIME NULL,
            last_finished_at DATETIME NULL,
            last_row_count INT NOT NULL DEFAULT 0,
            last_status VARCHAR(32) NULL,
            last_error TEXT NULL
        )
    """
    with connection.cursor() as cursor:
        cursor.execute(sql)


def _get_last_cursor(job_name: str) -> str | None:
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT last_cursor FROM {STATE_TABLE} WHERE job_name = %s", [job_name])
        row = cursor.fetchone()
    return row[0] if row else None


def _get_target_max_cursor(config: SyncConfig) -> str | None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT MAX({_quote_identifier(config.cursor_column)}) FROM {_quote_identifier(config.target_table)}"
        )
        row = cursor.fetchone()
    if not row or row[0] is None:
        return None
    return str(row[0])


def _resolve_start_cursor(config: SyncConfig, override_cursor: str | None) -> tuple[str, str]:
    if override_cursor:
        return str(override_cursor), "command override"

    saved_cursor = _get_last_cursor(config.job_name)
    if saved_cursor not in (None, ""):
        return str(saved_cursor), "saved sync state"

    initial_cursor = str(config.initial_cursor)
    if initial_cursor not in ("", "0"):
        return initial_cursor, "PROD_SYNC_INITIAL_CURSOR"

    target_max_cursor = _get_target_max_cursor(config)
    if target_max_cursor not in (None, ""):
        return target_max_cursor, "target table max cursor"

    return initial_cursor, "default initial cursor"


def _mark_started(config: SyncConfig, cursor_value: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            INSERT INTO {STATE_TABLE} (job_name, source_table, cursor_column, last_cursor, last_started_at, last_status, last_error)
            VALUES (%s, %s, %s, %s, NOW(), %s, NULL)
            ON DUPLICATE KEY UPDATE
                source_table = VALUES(source_table),
                cursor_column = VALUES(cursor_column),
                last_cursor = VALUES(last_cursor),
                last_started_at = NOW(),
                last_status = VALUES(last_status),
                last_error = NULL
            """,
            [config.job_name, config.source_table, config.cursor_column, cursor_value, "running"],
        )


def _mark_finished(config: SyncConfig, cursor_value: str, row_count: int) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            UPDATE {STATE_TABLE}
            SET last_cursor = %s,
                last_finished_at = NOW(),
                last_row_count = %s,
                last_status = %s,
                last_error = NULL
            WHERE job_name = %s
            """,
            [cursor_value, row_count, "success", config.job_name],
        )


def _mark_failed(config: SyncConfig, error: str) -> None:
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            INSERT INTO {STATE_TABLE} (job_name, source_table, cursor_column, last_started_at, last_status, last_error)
            VALUES (%s, %s, %s, NOW(), %s, %s)
            ON DUPLICATE KEY UPDATE
                last_started_at = NOW(),
                last_status = VALUES(last_status),
                last_error = VALUES(last_error)
            """,
            [config.job_name, config.source_table, config.cursor_column, "failed", error[:5000]],
        )


def _build_source_query(config: SyncConfig) -> tuple[str, list[Any]]:
    where_parts = []
    params: list[Any] = []
    if config.company_id is not None:
        where_parts.append(f"company_id = %s")
        params.append(config.company_id)
    where_parts.append(f"{_quote_identifier(config.cursor_column)} > %s")
    query = f"SELECT * FROM {_quote_identifier(config.source_table)} WHERE {' AND '.join(where_parts)} ORDER BY {_quote_identifier(config.cursor_column)} ASC LIMIT %s"
    return query, params


def _fetch_target_columns(table_name: str) -> tuple[list[str], set[str]]:
    with connection.cursor() as cursor:
        cursor.execute(f"SHOW COLUMNS FROM {_quote_identifier(table_name)}")
        rows = cursor.fetchall()
    columns = [row[0] for row in rows]
    primary_keys = {row[0] for row in rows if row[3] == "PRI"}
    return columns, primary_keys


def _build_upsert_sql(table_name: str, columns: list[str], primary_keys: set[str]) -> str:
    quoted_columns = ", ".join(_quote_identifier(column) for column in columns)
    placeholders = ", ".join(["%s"] * len(columns))
    update_columns = [column for column in columns if column not in primary_keys]
    if update_columns:
        update_sql = ", ".join(f"{_quote_identifier(column)} = VALUES({_quote_identifier(column)})" for column in update_columns)
    else:
        update_sql = ", ".join(f"{_quote_identifier(column)} = VALUES({_quote_identifier(column)})" for column in columns)
    return f"INSERT INTO {_quote_identifier(table_name)} ({quoted_columns}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {update_sql}"


class Command(BaseCommand):
    help = "Read incrementally from a read-only production MySQL source and upsert into the dashboard reporting table."

    def add_arguments(self, parser):
        parser.add_argument("--preview", action="store_true", help="Print the exact source query and stop before reading production.")
        parser.add_argument("--start-cursor", dest="start_cursor", help="Override the saved cursor for this run.")
        parser.add_argument("--limit", dest="limit", type=int, help="Override batch size for this run.")

    def handle(self, *args, **options):
        if connection.vendor != "mysql":
            raise CommandError("The target dashboard database must be MySQL for sync_prod_snapshot.")

        config = _load_config()
        _ensure_state_table()

        start_cursor, cursor_source = _resolve_start_cursor(config, options.get("start_cursor"))
        limit = options.get("limit") or config.batch_size

        source_query, static_params = _build_source_query(config)
        preview_params = [*static_params, start_cursor, limit]

        self.stdout.write(self.style.MIGRATE_HEADING("Production sync plan"))
        self.stdout.write(f"Source DB: {config.source_name} @ {config.source_host}:{config.source_port}")
        self.stdout.write(f"Source table: {config.source_table}")
        self.stdout.write(f"Target table: {config.target_table}")
        self.stdout.write(f"Cursor column: {config.cursor_column}")
        self.stdout.write(f"Job name: {config.job_name}")
        self.stdout.write(f"Resolved start cursor: {start_cursor} ({cursor_source})")
        self.stdout.write(f"Batch size: {limit}")
        self.stdout.write("Source query:")
        self.stdout.write(source_query)
        self.stdout.write(f"Source params: {preview_params}")

        if options.get("preview"):
            self.stdout.write(self.style.SUCCESS("Preview only. No production query was executed."))
            return

        source_conn = None
        try:
            _mark_started(config, str(start_cursor))
            source_conn = mysql.connector.connect(
                host=config.source_host,
                port=config.source_port,
                user=config.source_user,
                password=config.source_password,
                database=config.source_name,
            )
            source_cursor = source_conn.cursor(dictionary=True)
            target_columns, primary_keys = _fetch_target_columns(config.target_table)

            current_cursor = str(start_cursor)
            total_rows = 0
            latest_cursor = str(start_cursor)
            common_columns: list[str] | None = None
            upsert_sql: str | None = None

            while True:
                batch_params = [*static_params, current_cursor, limit]
                source_cursor.execute(source_query, batch_params)
                rows = source_cursor.fetchall()

                if not rows:
                    break

                if common_columns is None:
                    source_columns = set(rows[0].keys())
                    common_columns = [column for column in target_columns if column in source_columns]
                    if not common_columns:
                        raise CommandError(
                            f"No common columns found between source table {config.source_table} and target table {config.target_table}."
                        )
                    upsert_sql = _build_upsert_sql(config.target_table, common_columns, primary_keys)

                payload = [tuple(row.get(column) for column in common_columns) for row in rows]
                latest_cursor = str(rows[-1][config.cursor_column])

                with transaction.atomic():
                    with connection.cursor() as target_cursor:
                        target_cursor.executemany(upsert_sql, payload)

                total_rows += len(rows)
                current_cursor = latest_cursor

                if len(rows) < limit:
                    break

            source_cursor.close()

            if total_rows == 0:
                _mark_finished(config, str(start_cursor), 0)
                self.stdout.write(self.style.SUCCESS("No new rows found. Sync state updated."))
                return

            _mark_finished(config, latest_cursor, total_rows)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Synced {total_rows} rows into {config.target_table}. Latest cursor: {latest_cursor}"
                )
            )
        except Exception as exc:
            _mark_failed(config, str(exc))
            raise CommandError(f"Production sync failed: {exc}") from exc
        finally:
            if source_conn is not None and source_conn.is_connected():
                source_conn.close()
