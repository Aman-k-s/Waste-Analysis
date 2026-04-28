from django.http import HttpRequest, HttpResponse, JsonResponse

from waste_dashboard_backend.settings import FRONTEND_DIST_DIR


def health_check(_request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})


def frontend_app(_request: HttpRequest) -> HttpResponse:
    index_file = FRONTEND_DIST_DIR / "index.html"
    if not index_file.exists():
        return HttpResponse(
            "Frontend build artifacts are missing. Run `npm run build` before starting the production server.",
            status=503,
            content_type="text/plain",
        )

    return HttpResponse(index_file.read_text(encoding="utf-8"), content_type="text/html")
