# Waste Analysis

This repository deploys a React frontend and Django analytics backend as a single Coolify application using the included `Dockerfile`. The dashboard reads from a reporting MySQL database and can optionally sync data from a separate read-only production MySQL source on a schedule.

## Local development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py runserver
```

The Vite dev server proxies `/api` requests to the Django backend on `127.0.0.1:8000`.

## Coolify deployment

Use the included `Dockerfile` as a single-service deployment.

Suggested settings:

- Build pack: `Dockerfile`
- Port: `8000`
- Health check path: `/health/`

Required app environment variables:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS=your-domain.com`
- `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com`
- `DJANGO_TIME_ZONE=Asia/Kolkata`
- `MYSQL_NAME`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`
- `WASTE_SCAN_TABLE=scm_scans` unless your reporting table has another name
- `WASTE_COMPANY_ID=312` unless your tenant/company id differs
- `GEMINI_API_KEY` if Gemini answers are needed

## Reporting database contract

The live dashboard reads from one main business table only:

- `WASTE_SCAN_TABLE` with default value `scm_scans`

Expected columns on that table:

- `id`
- `company_id`
- `commodity_name`
- `created_on_date`
- `device_serial_no`
- `request`
- `weight`
- `amount`
- `sample_id`

Expected JSON keys inside the `request` column:

- `scan_data.weight`
- `scan_data.day_part`
- `scan_data.food_waste_type`
- `scan_data.amount`

## Scheduled sync from production

A management command is included for scheduled read-only syncs from a production MySQL source into the dashboard database:

```bash
cd /app/backend
python manage.py sync_prod_snapshot --preview
python manage.py sync_prod_snapshot
```

Use `--preview` to print the exact source query before any production read happens. The command stores sync progress in the dashboard database table `analytics_sync_state`.

Recommended Coolify scheduled task command:

```bash
cd /app/backend && python manage.py sync_prod_snapshot
```

Typical schedule: once per day.
