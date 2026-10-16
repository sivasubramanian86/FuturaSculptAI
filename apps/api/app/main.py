"""Main application entrypoint for FuturaSculptAI backend API."""

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import FuturaSculptException
from app.core.logging import configure_logging, get_log_tenant, get_logger, set_log_tenant
from app.core.monitoring import telemetry_registry
from app.routers import (
    agents,
    auth,
    evidence,
    governance,
    health,
    onboarding,
    opportunity,
    scenarios,
    scoring,
    tasks,
    workgraph,
    worktwin,
)

# Initialize structured logging system
configure_logging(settings.log_level)
logger = get_logger("futurasculpt.api")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Autonomous, evidence-grounded Work Transformation Operating System.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def tenant_logging_middleware(request: Request, call_next):
    """Propagate tenant ID from request headers into structured logging context."""
    tenant_id = request.headers.get("X-Tenant-ID", settings.default_tenant_id)
    set_log_tenant(tenant_id)
    response = await call_next(request)
    if settings.metrics_enabled:
        telemetry_registry.record_request(request.method, request.url.path, response.status_code)
    return response


@app.exception_handler(FuturaSculptException)
async def handle_domain_exception(request: Request, exc: FuturaSculptException):
    """Handle domain-specific business and governance exceptions."""
    logger.warning("Domain exception encountered on %s: %s", request.url.path, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "detail": exc.detail,
            "tenant_id": get_log_tenant(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    """Handle standard FastAPI HTTPExceptions with structured payload."""
    logger.warning("HTTP %d error on %s: %s", exc.status_code, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"HTTP_{exc.status_code}",
            "message": str(exc.detail),
            "detail": exc.detail,
            "tenant_id": get_log_tenant(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    """Handle Pydantic schema validation failures with detailed diagnostics."""
    logger.warning("Schema validation failure on %s", request.url.path)
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Input validation failed against API schema.",
            "detail": str(exc.errors()),
            "tenant_id": get_log_tenant(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(Exception)
async def handle_unhandled_exception(request: Request, exc: Exception):
    """Catch-all safety net preventing raw stack trace exposure."""
    logger.error("Unhandled server exception on %s: %s", request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected internal server error occurred.",
            "detail": "Internal server error" if not settings.debug else str(exc),
            "tenant_id": get_log_tenant(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(workgraph.router)
app.include_router(scenarios.router)
app.include_router(evidence.router)
app.include_router(scoring.router)
app.include_router(agents.router)
app.include_router(tasks.router)
app.include_router(opportunity.router)
app.include_router(worktwin.router, prefix="/api/v1")
app.include_router(worktwin.router, prefix="/api")
app.include_router(worktwin.router)
app.include_router(governance.router, prefix="/api/v1/governance")
app.include_router(governance.router, prefix="/governance")


@app.get("/", tags=["Root"])
def root_status():
    """Root metadata probe."""
    return {
        "product": "FuturaSculptAI",
        "tagline": "Predict change. Sculpt work. Create opportunity.",
        "track": "AI Builder Cup 2026 - Future of Work",
        "control_loop": "Sense -> Model -> Simulate -> Sculpt -> Govern -> Execute -> Measure -> Learn",
        "version": settings.app_version,
        "docs": "/docs",
    }
