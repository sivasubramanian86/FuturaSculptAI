"""Main application entrypoint for FuturaSculptAI backend API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import evidence, health, onboarding, scenarios, scoring, workgraph

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

# Register routers
app.include_router(health.router)
app.include_router(onboarding.router)
app.include_router(workgraph.router)
app.include_router(scenarios.router)
app.include_router(evidence.router)
app.include_router(scoring.router)


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
