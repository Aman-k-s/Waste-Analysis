# Django Backend

This backend exposes analytics APIs for the waste dashboard without exposing the raw MySQL schema.

## Run

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py runserver
```

If `MYSQL_NAME` is not set, Django falls back to SQLite for local bootstrapping and system checks.

## Environment

Copy `.env.example` into your shell environment or your preferred env loader and point it at the production-dump MySQL database.

## Endpoints

- `GET /api/dashboard-summary`
- `GET /api/waste-by-category`
- `GET /api/reason-breakdown?category=Rice`
- `GET /api/moisture-data?limit=250`

## Supported Filters

- `date_from=2026-03-01`
- `date_to=2026-03-31`
- `device=D3`
- `week=2026-W13`
