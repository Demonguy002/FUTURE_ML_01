from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import test_database
from routes import router as ticket_router
from auth import router as auth_router


app = FastAPI(
    title="SupportIQ API",
    description="AI-powered Support Ticket Classification & Prioritization",
    version="1.0.0"
)

# Local + frontend browser access. For production, replace "*" with
# the exact Vercel frontend origin once local testing is complete.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(ticket_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "SupportIQ API is running"}


@app.get("/health")
def health():
    database_status = test_database()
    return {
        "status": "healthy",
        "database": "connected" if database_status else "disconnected"
    }
