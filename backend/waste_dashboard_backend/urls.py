from django.contrib import admin
from django.urls import include, path, re_path

from waste_dashboard_backend.views import frontend_app, health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("analytics.urls")),
    path("health/", health_check, name="health-check"),
    re_path(r"^(?!api/|admin/|static/|health/).*$", frontend_app, name="frontend-app"),
]
