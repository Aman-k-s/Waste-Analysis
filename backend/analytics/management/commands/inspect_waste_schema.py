from django.core.management.base import BaseCommand, CommandError
from django.db import connection


TABLE_QUERY = """
SELECT
    t.table_name,
    COALESCE(t.table_rows, 0) AS table_rows
FROM information_schema.tables AS t
WHERE t.table_schema = DATABASE()
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_rows DESC, t.table_name ASC
"""


COLUMN_QUERY = """
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_key,
    c.extra
FROM information_schema.columns AS c
WHERE c.table_schema = DATABASE()
  AND (
      c.table_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s OR
      c.column_name LIKE %s
  )
ORDER BY c.table_name, c.ordinal_position
"""


FOREIGN_KEY_QUERY = """
SELECT
    kcu.table_name,
    kcu.column_name,
    kcu.referenced_table_name,
    kcu.referenced_column_name
FROM information_schema.key_column_usage AS kcu
WHERE kcu.table_schema = DATABASE()
  AND kcu.referenced_table_name IS NOT NULL
ORDER BY kcu.table_name, kcu.column_name
"""


SAMPLE_QUERY_TEMPLATE = """
SELECT *
FROM `{table_name}`
LIMIT %s
"""


class Command(BaseCommand):
    help = (
        "Inspect the connected MySQL schema and print the most likely tables, columns, "
        "and foreign keys for a waste dashboard."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--table",
            dest="table",
            help="Show sample rows for a specific table after the schema summary.",
        )
        parser.add_argument(
            "--limit",
            dest="limit",
            type=int,
            default=5,
            help="Number of sample rows to print when --table is used.",
        )

    def handle(self, *args, **options):
        if connection.vendor != "mysql":
            raise CommandError(
                "This command only works when Django is connected to MySQL. "
                "Set MYSQL_NAME / MYSQL_USER / MYSQL_PASSWORD / MYSQL_HOST / MYSQL_PORT first."
            )

        self.stdout.write(self.style.SUCCESS("Connected schema inspection"))
        self.stdout.write(f"Database: {connection.settings_dict.get('NAME')}")
        self.stdout.write("")

        self._print_tables()
        self.stdout.write("")
        self._print_candidate_columns()
        self.stdout.write("")
        self._print_foreign_keys()

        table_name = options.get("table")
        if table_name:
            self.stdout.write("")
            self._print_sample_rows(table_name, max(1, min(options["limit"], 20)))

    def _print_tables(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Top tables by row count"))
        with connection.cursor() as cursor:
            cursor.execute(TABLE_QUERY)
            rows = cursor.fetchall()

        for table_name, table_rows in rows[:25]:
            self.stdout.write(f"- {table_name}: {table_rows}")

    def _print_candidate_columns(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Candidate waste-related columns"))
        search_terms = (
            "%scan%",
            "%waste%",
            "%weight%",
            "%device%",
            "%reason%",
            "%category%",
            "%meal%",
            "%cost%",
            "%co2%",
            "%abnormal%",
        )
        with connection.cursor() as cursor:
            cursor.execute(COLUMN_QUERY, search_terms)
            rows = cursor.fetchall()

        current_table = None
        for table_name, column_name, data_type, is_nullable, column_key, extra in rows:
            if table_name != current_table:
                current_table = table_name
                self.stdout.write(f"[{table_name}]")
            flags = ", ".join(flag for flag in (column_key, extra, is_nullable) if flag)
            self.stdout.write(f"  - {column_name} ({data_type}) [{flags}]")

    def _print_foreign_keys(self):
        self.stdout.write(self.style.MIGRATE_HEADING("Foreign key map"))
        with connection.cursor() as cursor:
            cursor.execute(FOREIGN_KEY_QUERY)
            rows = cursor.fetchall()

        if not rows:
            self.stdout.write("No foreign keys were found in information_schema.")
            self.stdout.write("If the dump has no FK constraints, infer joins from *_id columns and sample rows.")
            return

        for table_name, column_name, referenced_table_name, referenced_column_name in rows:
            self.stdout.write(
                f"- {table_name}.{column_name} -> {referenced_table_name}.{referenced_column_name}"
            )

    def _print_sample_rows(self, table_name: str, limit: int):
        self.stdout.write(self.style.MIGRATE_HEADING(f"Sample rows from {table_name}"))
        with connection.cursor() as cursor:
            try:
                cursor.execute(SAMPLE_QUERY_TEMPLATE.format(table_name=table_name), [limit])
            except Exception as exc:  # pragma: no cover - depends on live MySQL schema
                raise CommandError(f"Could not read table '{table_name}': {exc}") from exc

            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()

        if not rows:
            self.stdout.write("Table exists but returned no rows.")
            return

        for index, row in enumerate(rows, start=1):
            self.stdout.write(f"Row {index}")
            for column_name, value in zip(columns, row):
                self.stdout.write(f"  {column_name}: {value}")
