# EcoSync Insights

This repo is set up for `Node/npm` frontend builds and `Django + Gunicorn` runtime deployment.

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

## Production build

Build the frontend with npm:

```bash
npm run build
```

This writes the production frontend into `backend/frontend_dist`, and Django serves it together with the `/api` endpoints.

## Coolify deployment

Use the included `Dockerfile` as a single-service deployment.

Suggested settings:

- Port: `8000`
- Health check path: `/health/`
- Build pack: `Dockerfile`

Set these environment variables in Coolify:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS=your-domain.com`
- `DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com`
- `MYSQL_NAME`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT` if using MySQL
- `GEMINI_API_KEY` if you want Gemini chat responses

## Notes

- Bun lockfiles are not part of the deployment path, so Coolify will use the Node/npm workflow.
- The frontend and backend run behind the same origin in production, so the existing `/api/...` calls continue to work without extra frontend environment variables.
