"""
Tests for the health endpoints.
"""

import pytest


class TestHealthLiveness:
    def test_health_returns_200(self, client):
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_returns_json(self, client):
        response = client.get("/api/v1/health")
        body = response.json()
        assert isinstance(body, dict)

    def test_health_has_required_fields(self, client):
        body = client.get("/api/v1/health").json()
        assert body["status"] == "ok"
        assert "version" in body
        assert "environment" in body
        assert "uptime_seconds" in body

    def test_health_uptime_is_non_negative(self, client):
        body = client.get("/api/v1/health").json()
        assert body["uptime_seconds"] >= 0


class TestHealthReadiness:
    def test_readiness_returns_200(self, client):
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 200

    def test_readiness_has_checks(self, client):
        body = client.get("/api/v1/health/ready").json()
        assert "checks" in body
        assert "config" in body["checks"]
        assert "gemini_api_key" in body["checks"]

    def test_readiness_config_is_ok(self, client):
        body = client.get("/api/v1/health/ready").json()
        assert body["checks"]["config"]["status"] == "ok"

    def test_readiness_has_python_version(self, client):
        body = client.get("/api/v1/health/ready").json()
        assert "python_version" in body
        assert body["python_version"].startswith("3.")


class TestAPIRouting:
    def test_unknown_route_returns_404(self, client):
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404

    def test_root_is_not_exposed(self, client):
        response = client.get("/")
        # Should return 404, not a generic server error
        assert response.status_code == 404

    def test_404_returns_json_error(self, client):
        response = client.get("/api/v1/nonexistent")
        body = response.json()
        assert "error" in body


class TestConfiguration:
    def test_settings_load_successfully(self):
        """Config must load without raising exceptions in test environment."""
        from app.core.config import get_settings

        settings = get_settings()
        assert settings.APP_NAME == "Legal Assistance AI"
        assert settings.ENVIRONMENT == "development"

    def test_settings_have_sensible_defaults(self):
        from app.core.config import get_settings

        settings = get_settings()
        assert settings.BACKEND_PORT == 8000
        assert settings.MAX_UPLOAD_SIZE_MB > 0
        assert len(settings.ALLOWED_EXTENSIONS) > 0

    def test_settings_singleton(self):
        """get_settings() must return the same instance each time."""
        from app.core.config import get_settings

        s1 = get_settings()
        s2 = get_settings()
        assert s1 is s2

