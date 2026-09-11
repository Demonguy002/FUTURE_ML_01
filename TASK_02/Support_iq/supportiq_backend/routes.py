from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from database import tickets_collection, predictions_collection
from ai_analyzer import analyze_ticket

import jwt
import os


router = APIRouter(prefix="/api")


# =========================================================
# AUTHENTICATION
# =========================================================

security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return user_id

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# =========================================================
# REQUEST MODEL
# =========================================================

class TicketCreate(BaseModel):

    # -----------------------------------------------------
    # BASIC TICKET INFORMATION
    # -----------------------------------------------------

    subject: str
    description: str

    # -----------------------------------------------------
    # CATBOOST CATEGORICAL FEATURES
    # -----------------------------------------------------

    day_of_week: str = "Monday"

    company_size: str = "Medium"

    industry: str = "Technology"

    customer_tier: str = "Standard"

    region: str = "North America"

    product_area: str = "Other"

    booking_channel: str = "Email"

    reported_by_role: str = "User"

    customer_sentiment: str = "Neutral"

    # -----------------------------------------------------
    # CATBOOST NUMERIC FEATURES
    #
    # These remain safe API-compatible baselines. The AI analyzer
    # enriches impact-related fields from subject/description
    # before the frozen CatBoost model is called.
    # -----------------------------------------------------

    day_of_week_num: int = 0

    company_id: int = 1

    company_size_cat: int = 1

    industry_cat: int = 0

    customer_tier_cat: int = 1

    org_users: int = 100

    region_cat: int = 0

    past_30d_tickets: int = 0

    past_90d_incidents: int = 0

    product_area_cat: int = 0

    booking_channel_cat: int = 0

    reported_by_role_cat: int = 0

    customers_affected: int = Field(
        default=1,
        ge=0
    )

    error_rate_pct: float = Field(
        default=0.0,
        ge=0
    )

    downtime_min: float = Field(
        default=0.0,
        ge=0
    )

    payment_impact_flag: int = Field(
        default=0,
        ge=0,
        le=1
    )

    security_incident_flag: int = Field(
        default=0,
        ge=0,
        le=1
    )

    data_loss_flag: int = Field(
        default=0,
        ge=0,
        le=1
    )

    has_runbook: int = Field(
        default=0,
        ge=0,
        le=1
    )

    customer_sentiment_cat: int = 1

    description_length: int = 0


# =========================================================
# BUILD STRUCTURED FEATURES
# =========================================================

def build_priority_features(ticket: TicketCreate):

    """
    Create the baseline structured feature dictionary expected
    by the frozen CatBoost priority model.

    The analyzer enriches text-observable impact signals before
    inference, while preserving this endpoint's existing schema.
    """

    return {

        # Categorical features
        "day_of_week": ticket.day_of_week,

        "company_size": ticket.company_size,

        "industry": ticket.industry,

        "customer_tier": ticket.customer_tier,

        "region": ticket.region,

        "product_area": ticket.product_area,

        "booking_channel": ticket.booking_channel,

        "reported_by_role": ticket.reported_by_role,

        "customer_sentiment": ticket.customer_sentiment,

        # Numeric features
        "day_of_week_num": ticket.day_of_week_num,

        "company_id": ticket.company_id,

        "company_size_cat": ticket.company_size_cat,

        "industry_cat": ticket.industry_cat,

        "customer_tier_cat": ticket.customer_tier_cat,

        "org_users": ticket.org_users,

        "region_cat": ticket.region_cat,

        "past_30d_tickets": ticket.past_30d_tickets,

        "past_90d_incidents": ticket.past_90d_incidents,

        "product_area_cat": ticket.product_area_cat,

        "booking_channel_cat": ticket.booking_channel_cat,

        "reported_by_role_cat": ticket.reported_by_role_cat,

        "customers_affected": ticket.customers_affected,

        "error_rate_pct": ticket.error_rate_pct,

        "downtime_min": ticket.downtime_min,

        "payment_impact_flag": ticket.payment_impact_flag,

        "security_incident_flag": ticket.security_incident_flag,

        "data_loss_flag": ticket.data_loss_flag,

        "has_runbook": ticket.has_runbook,

        "customer_sentiment_cat": ticket.customer_sentiment_cat,

        "description_length": ticket.description_length,
    }


# =========================================================
# CREATE TICKET
# =========================================================

@router.post("/tickets")
def create_ticket(
    ticket: TicketCreate,
    user_id: str = Depends(get_current_user)
):

    # -----------------------------------------------------
    # BUILD STRUCTURED FEATURES
    # -----------------------------------------------------

    priority_features = build_priority_features(ticket)

    # -----------------------------------------------------
    # AI ANALYSIS
    # -----------------------------------------------------

    analysis = analyze_ticket(
        ticket.subject,
        ticket.description,
        priority_features
    )

    # -----------------------------------------------------
    # SAVE TICKET
    # -----------------------------------------------------

    ticket_data = {

        # Basic ticket
        "subject": ticket.subject,
        "description": ticket.description,

        # Ticket status
        "status": "Open",

        # User
        "user_id": user_id,

        # AI results
        "category": analysis["category"],
        "priority": analysis["priority"],
        "sentiment": analysis["sentiment"],
        "confidence": analysis["confidence"],
        "suggested_response": analysis["suggested_response"],

        # -------------------------------------------------
        # STRUCTURED FEATURES USED BY PRIORITY MODEL
        # -------------------------------------------------

        "priority_features": priority_features,

        # Timestamp
        "created_at": datetime.now(timezone.utc)
    }

    result = tickets_collection.insert_one(
        ticket_data
    )

    # -----------------------------------------------------
    # SAVE AI PREDICTION
    # -----------------------------------------------------

    prediction_data = {

        "ticket_id": str(result.inserted_id),

        "user_id": user_id,

        "category": analysis["category"],

        "priority": analysis["priority"],

        "sentiment": analysis["sentiment"],

        "confidence": analysis["confidence"],

        "suggested_response":
            analysis["suggested_response"],

        # Store model information
        "category_model":
            analysis.get("category_model"),

        "priority_model":
            analysis.get("priority_model"),

        # Timestamp
        "created_at":
            datetime.now(timezone.utc)
    }

    predictions_collection.insert_one(
        prediction_data
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Ticket created and analyzed successfully",

        "ticket_id":
            str(result.inserted_id),

        "analysis":
            analysis
    }


# =========================================================
# GET TICKETS
# =========================================================

@router.get("/tickets")
def get_tickets(
    user_id: str = Depends(get_current_user)
):

    tickets = list(
        tickets_collection.find(
            {
                "user_id": user_id
            },
            {
                "_id": 1,

                "subject": 1,

                "description": 1,

                "status": 1,

                "category": 1,

                "priority": 1,

                "sentiment": 1,

                "confidence": 1,

                "suggested_response": 1,

                "created_at": 1,

                "user_id": 1
            }
        )
    )

    for ticket in tickets:

        ticket["_id"] = str(
            ticket["_id"]
        )

        if "user_id" in ticket:

            ticket["user_id"] = str(
                ticket["user_id"]
            )

    return tickets


# =========================================================
# AI TICKET ANALYSIS
# =========================================================

@router.post("/tickets/analyze")
def analyze_ticket_endpoint(
    ticket: TicketCreate,
    user_id: str = Depends(get_current_user)
):

    # -----------------------------------------------------
    # BUILD STRUCTURED FEATURES
    # -----------------------------------------------------

    priority_features = build_priority_features(ticket)

    # -----------------------------------------------------
    # RUN AI ANALYSIS
    # -----------------------------------------------------

    analysis = analyze_ticket(
        ticket.subject,
        ticket.description,
        priority_features
    )

    # -----------------------------------------------------
    # SAVE PREDICTION TO MONGODB
    # -----------------------------------------------------

    prediction_data = {

        "user_id": user_id,

        "subject": ticket.subject,

        "description": ticket.description,

        "category": analysis["category"],

        "priority": analysis["priority"],

        "sentiment": analysis["sentiment"],

        "confidence": analysis["confidence"],

        "suggested_response":
            analysis["suggested_response"],

        # Model information
        "category_model":
            analysis.get("category_model"),

        "priority_model":
            analysis.get("priority_model"),

        # Structured features
        "priority_features":
            priority_features,

        "created_at":
            datetime.now(timezone.utc)
    }

    result = predictions_collection.insert_one(
        prediction_data
    )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "message":
            "Ticket analyzed successfully",

        "prediction_id":
            str(result.inserted_id),

        "analysis":
            analysis
    }
