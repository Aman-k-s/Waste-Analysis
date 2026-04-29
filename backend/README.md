# Django Backend

This backend exposes analytics APIs for the Waste Analysis dashboard without exposing the raw MySQL schema directly to the frontend.

## Run

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py runserver
```

If `MYSQL_NAME` is not set, Django falls back to SQLite for local bootstrapping and system checks.

## Environment

App database connection:

- `MYSQL_NAME`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `WASTE_SCAN_TABLE`
- `WASTE_COMPANY_ID`

Optional production source sync connection:

- `PROD_SYNC_HOST`
- `PROD_SYNC_PORT`
- `PROD_SYNC_NAME`
- `PROD_SYNC_USER`
- `PROD_SYNC_PASSWORD`
- `PROD_SYNC_SOURCE_TABLE`
- `PROD_SYNC_TARGET_TABLE`
- `PROD_SYNC_CURSOR_COLUMN`
- `PROD_SYNC_COMPANY_ID`
- `PROD_SYNC_BATCH_SIZE`
- `PROD_SYNC_INITIAL_CURSOR`
- `PROD_SYNC_JOB_NAME`

## Endpoints

- `GET /api/dashboard-summary`
- `GET /api/waste-by-category`
- `GET /api/reason-breakdown?category=Rice`
- `GET /api/moisture-data?limit=250`
- `GET /health/`

## Scheduled sync

Preview the approved source query without reading production:

```bash
python manage.py sync_prod_snapshot --preview
```

Run the sync:

```bash
python manage.py sync_prod_snapshot
```

The command reads from the production source DB with read-only credentials, upserts into the dashboard DB table, and records sync progress in `analytics_sync_state`.
