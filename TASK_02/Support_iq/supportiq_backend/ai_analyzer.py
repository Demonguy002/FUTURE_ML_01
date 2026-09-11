import re
from pathlib import Path

import joblib
import pandas as pd
from catboost import CatBoostClassifier


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


# =========================================================
# CATEGORY MODEL PATHS
# =========================================================

CATEGORY_MODEL_PATH = (
    MODEL_DIR / "supportiq_category_svc.joblib"
)

CATEGORY_TFIDF_PATH = (
    MODEL_DIR / "supportiq_category_tfidf.joblib"
)

CATEGORY_METADATA_PATH = (
    MODEL_DIR / "supportiq_category_metadata.joblib"
)


# =========================================================
# PRIORITY MODEL PATHS
# =========================================================

PRIORITY_MODEL_PATH = (
    MODEL_DIR / "supportiq_priority_catboost.cbm"
)

PRIORITY_METADATA_PATH = (
    MODEL_DIR / "supportiq_priority_metadata.joblib"
)


# =========================================================
# LOAD CATEGORY ML MODEL
# =========================================================

try:

    category_model = joblib.load(
        CATEGORY_MODEL_PATH
    )

    category_vectorizer = joblib.load(
        CATEGORY_TFIDF_PATH
    )

    category_metadata = joblib.load(
        CATEGORY_METADATA_PATH
    )

    CATEGORY_MODEL_LOADED = True

    category_accuracy = float(
        category_metadata.get(
            "locked_test_accuracy",
            category_metadata.get("accuracy", 0)
        )
    )

    print(
        "✅ SupportIQ category ML model loaded"
    )

    print(
        f"   Test accuracy: "
        f"{category_accuracy:.2%}"
    )

except Exception as e:

    category_model = None
    category_vectorizer = None
    category_metadata = {}

    CATEGORY_MODEL_LOADED = False

    print(
        "❌ Category ML model could not be loaded"
    )

    print(
        f"   Error: {e}"
    )


# =========================================================
# LOAD PRIORITY CATBOOST MODEL
# =========================================================

try:

    priority_model = CatBoostClassifier()

    priority_model.load_model(
        str(PRIORITY_MODEL_PATH)
    )

    priority_metadata = joblib.load(
        PRIORITY_METADATA_PATH
    )

    PRIORITY_MODEL_LOADED = True

    priority_accuracy = float(
        priority_metadata.get(
            "accuracy",
            0
        )
    )

    print(
        "✅ SupportIQ priority CatBoost model loaded"
    )

    print(
        f"   Test accuracy: "
        f"{priority_accuracy:.2%}"
    )

    print(
        f"   CatBoost features: "
        f"{len(priority_model.feature_names_)}"
    )

    print(
        f"   Categorical indices: "
        f"{priority_model.get_cat_feature_indices()}"
    )

except Exception as e:

    priority_model = None
    priority_metadata = {}

    PRIORITY_MODEL_LOADED = False

    print(
        "❌ Priority CatBoost model could not be loaded"
    )

    print(
        f"   Error: {e}"
    )


# =========================================================
# TEXT NORMALIZATION
# =========================================================

def normalize_text(text: str) -> str:

    if text is None:
        return ""

    text = str(text).lower()

    # Keep inference preprocessing aligned with model training.
    text = re.sub(
        r"[^a-z0-9\s']",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# =========================================================
# CATEGORY CLASSIFICATION
# =========================================================

def classify_category(
    subject: str,
    description: str
):

    """
    Category prediction using:

        TF-IDF + LinearSVC

    Held-out test accuracy:
        99.53%
    """

    if not CATEGORY_MODEL_LOADED:

        return (
            "General",
            0.50
        )

    subject = normalize_text(
        subject
    )

    description = normalize_text(
        description
    )

    combined_text = (
        f"{subject} {description}"
    ).strip()

    if not combined_text:

        return (
            "General",
            0.50
        )

    # -----------------------------------------------------
    # TF-IDF
    # -----------------------------------------------------

    X = category_vectorizer.transform(
        [combined_text]
    )

    # -----------------------------------------------------
    # ML PREDICTION
    # -----------------------------------------------------

    predicted_category = (
        str(category_model.predict(X)[0])
    )

    # -----------------------------------------------------
    # USER-FRIENDLY CATEGORY NAMES
    # -----------------------------------------------------
    # Keep the original ML labels internally, but return
    # polished labels to the SupportIQ frontend/API.
    category_display = {
        "api": "API Issue",
        "billing": "Billing & Payment",
        "cancellation": "Cancellation",
        "complaint": "Customer Complaint",
        "technical": "Technical Issue",
        "upgrade": "Plan Upgrade",
    }

    predicted_category_display = category_display.get(
        predicted_category,
        predicted_category.replace("_", " ").title()
    )

    # -----------------------------------------------------
    # INCIDENT / BUSINESS-IMPACT CATEGORY SAFEGUARDS
    # -----------------------------------------------------
    # The frozen English category model has six classes and does not
    # contain dedicated outage/security/payment-incident classes.
    # Keep the ML model as the primary classifier, but correct cases
    # where the ticket text contains explicit business-impact evidence.
    category_rule_applied = None

    category_text = combined_text

    payment_terms = (
        "payment failed", "payment failure", "payments failing",
        "payment not working", "cannot complete payment",
        "can't complete payment", "unable to complete payment",
        "transaction failed", "transactions failing",
        "transactions failed", "checkout failed",
        "checkout is failing", "payment system"
    )

    outage_terms = (
        "system is down", "system down", "application is down",
        "application completely down", "production is down",
        "production system down", "production outage",
        "complete outage", "system outage", "service outage",
        "service unavailable", "completely unavailable",
        "completely down", "site is down", "website is down"
    )

    security_terms = (
        "security incident", "security breach", "data breach",
        "cyber attack", "cyberattack", "unauthorized access",
        "account compromise", "accounts compromised",
        "security threat"
    )

    data_loss_terms = (
        "data loss", "data lost", "information compromised",
        "customer information compromised", "customer data compromised",
        "records compromised", "data compromised", "information exposed",
        "data exposed", "records exposed"
    )

    if any(term in category_text for term in payment_terms):
        predicted_category_display = "Billing & Payment"
        category_rule_applied = "payment-impact safeguard"
    elif any(term in category_text for term in outage_terms):
        predicted_category_display = "Technical Issue"
        category_rule_applied = "service-outage safeguard"
    elif any(term in category_text for term in security_terms + data_loss_terms):
        predicted_category_display = "Technical Issue"
        category_rule_applied = "security/data-loss safeguard"

    # -----------------------------------------------------
    # DECISION SCORE
    # -----------------------------------------------------

    decision_scores = (
        category_model.decision_function(X)
    )

    if decision_scores.ndim == 1:

        scores = decision_scores

    else:

        scores = decision_scores[0]

    # -----------------------------------------------------
    # CONFIDENCE-LIKE SCORE
    #
    # NOTE:
    # This is NOT a calibrated probability.
    # -----------------------------------------------------

    if len(scores) > 1:

        sorted_scores = sorted(
            scores,
            reverse=True
        )

        margin = (
            sorted_scores[0]
            - sorted_scores[1]
        )

        confidence = (
            0.50
            +
            (
                margin
                /
                (1.0 + abs(margin))
            )
            * 0.49
        )

        confidence = max(
            0.50,
            min(
                0.99,
                confidence
            )
        )

    else:

        confidence = 0.75

    return (
        predicted_category_display,
        round(
            float(confidence),
            2
        ),
        category_rule_applied
    )



# =========================================================
# TEXT -> STRUCTURED PRIORITY SIGNALS
# =========================================================

def infer_priority_signals(
    subject: str,
    description: str,
    base_features: dict
) -> dict:
    """
    Infer observable support-impact signals from the ticket text.

    This function does NOT choose Low/Medium/High. The frozen
    CatBoost model remains responsible for the final priority.
    """

    text = normalize_text(f"{subject} {description}")
    features = dict(base_features)

    def contains_any(*phrases):
        return any(phrase in text for phrase in phrases)

    security_incident = contains_any(
        "security incident", "security breach", "data breach",
        "cyber attack", "cyberattack", "cyber-attack",
        "hacked", "system hacked", "account hacked",
        "accounts hacked", "unauthorized access",
        "unauthorised access", "unauthorized login",
        "unauthorized logins", "unauthorised login",
        "unauthorised logins", "suspicious activity",
        "suspicious login", "suspicious logins",
        "account compromise", "account compromised",
        "accounts compromised", "security threat",
        "security vulnerability", "security incident detected",
        "malicious access", "intrusion detected",
        "breach detected", "credentials stolen",
        "passwords stolen", "credential compromise"
    )

    data_loss = contains_any(
        "data loss", "data lost", "data was lost", "data has been lost",
        "lost data", "loss of data", "data missing", "missing data",
        "data is missing", "data are missing", "important data missing",
        "records disappeared", "records have disappeared",
        "customer records disappeared", "customer records have disappeared",
        "records are missing", "records are gone",
        "customer records are missing", "customer records are gone",
        "missing customer records", "missing customer data",
        "customer data is missing", "customer data are missing",
        "customer data has disappeared", "customer data disappeared",
        "records were deleted", "records have been deleted",
        "customer records were deleted",
        "customer records have been deleted",
        "data was deleted", "data has been deleted",
        "accidentally deleted data", "deleted customer data",
        "unable to access customer data",
        "unable to access important customer data",
        "cannot access customer data", "can't access customer data",
        "cannot access important customer data",
        "can't access important customer data",
        "customer data inaccessible", "data inaccessible",
        "database is empty", "database appears empty",
        "records are missing from", "customer records missing from",
        "data corruption", "data corrupted", "database corrupted",
        "corrupted customer data", "corrupted records",
        "information compromised", "customer information compromised",
        "customer data compromised", "records compromised",
        "data compromised", "information exposed",
        "customer information exposed", "customer data exposed",
        "data exposed", "records exposed",
        "sensitive data exposed", "personal data exposed",
        "customer information leaked", "customer data leaked",
        "data breach", "data breach detected"
    )

    payment_impact = contains_any(
        "payment failed", "payment failure", "payments failing",
        "payment not working", "payments not working",
        "payment doesn't work", "payments don't work",
        "payment does not work", "payments do not work",
        "payment unavailable", "payments unavailable",
        "cannot make a payment", "can't make a payment",
        "cannot complete payment", "can't complete payment",
        "unable to complete payment", "unable to make a payment",
        "unable to process payment", "unable to process payments",
        "payment processing failed", "payment processing failure",
        "payment processing stopped", "payment system stopped",
        "payment system has stopped", "payment system is down",
        "payment service is down", "payment service unavailable",
        "card payment failed", "card payments failing",
        "credit card payment failed", "debit card payment failed",
        "transaction failed", "transactions failing",
        "transactions failed", "transactions are failing",
        "transaction processing failed", "transaction processing stopped",
        "checkout failed", "checkout is failing",
        "checkout not working", "checkout does not work",
        "checkout doesn't work", "unable to checkout",
        "cannot checkout", "can't checkout",
        "failed payment", "failed payments"
    )

    outage = contains_any(
        "system is down", "system down", "the system is down",
        "application is down", "application completely down",
        "application is completely down", "production is down",
        "production system down", "production service down",
        "production outage", "production is unavailable",
        "production unavailable", "complete outage", "full outage",
        "major outage", "system outage", "service outage",
        "network outage", "service unavailable",
        "service is unavailable", "completely unavailable",
        "completely down", "site is down", "website is down",
        "website unavailable", "website is unavailable",
        "platform is down", "platform down", "platform unavailable",
        "platform is unavailable", "app is down", "app unavailable",
        "app is unavailable", "nothing is working", "nothing works",
        "entire service is down", "entire service down",
        "service has gone down", "service stopped working",
        "system stopped working", "application stopped working",
        "cannot access the service", "can't access the service",
        "unable to access the service",
        "service cannot be accessed", "service cannot be reached"
    )

    broad_impact = contains_any(
        "all users", "all customers", "every customer",
        "every user", "all accounts", "every account",
        "everyone is affected", "everyone affected",
        "entire company", "entire organization",
        "whole company", "whole organization",
        "company-wide", "organization-wide",
        "business operations have stopped",
        "business operations stopped", "business operations are stopped",
        "business is stopped", "business has stopped",
        "business is unable to operate",
        "cannot access the service", "can't access the service",
        "unable to access the service",
        "none of our customers can access",
        "none of our users can access", "no customers can access",
        "no users can access", "customers cannot access",
        "users cannot access", "customers can't access",
        "users can't access", "all customers are affected",
        "all users are affected", "all customers affected",
        "all users affected", "widespread impact", "widespread outage",
        "system-wide", "service-wide", "affecting everyone",
        "affects everyone", "affecting all", "affects all"
    )

    numeric_impact_match = re.search(
        r"(?<!\\d)(\\d{1,3}(?:,\\d{3})*|\\d+)\\s*"
        r"(?:users?|customers?|accounts?|people|clients?)\\s*"
        r"(?:are\\s+)?(?:affected|impacted|unable|blocked|down)",
        text
    )

    numeric_affected = 0
    if numeric_impact_match:
        try:
            numeric_affected = int(
                numeric_impact_match.group(1).replace(",", "")
            )
        except ValueError:
            numeric_affected = 0

    if numeric_affected >= 2:
        broad_impact = True

    repeated_failure = contains_any(
        "multiple failures", "repeated failures",
        "repeatedly failing", "repeated failure",
        "keeps failing", "keep failing", "keeps failing repeatedly",
        "multiple errors", "many errors", "numerous errors",
        "constant errors", "continuous errors",
        "transactions failed", "transactions failing",
        "transactions are failing", "requests failing",
        "requests are failing", "requests keep failing",
        "repeated errors", "recurring errors",
        "problem keeps occurring", "issue keeps occurring",
        "keeps happening", "happens repeatedly"
    )

    urgent_language = contains_any(
        "immediately", "urgent", "urgently", "emergency",
        "critical", "as soon as possible", "right now",
        "production down", "business operations stopped"
    )

    # Binary impact signals expected by the frozen model.
    if security_incident:
        features["security_incident_flag"] = 1

    if data_loss:
        features["data_loss_flag"] = 1

    if payment_impact:
        features["payment_impact_flag"] = 1

    # A broad-impact phrase gives explicit evidence that more than
    # one customer/user is affected.
    if broad_impact:
        org_users = int(features.get("org_users", 100) or 100)
        features["customers_affected"] = max(
            int(features.get("customers_affected", 1) or 1),
            org_users,
            numeric_affected
        )
    elif contains_any(
        "several customers", "multiple customers",
        "several users", "multiple users",
        "many customers", "many users",
        "several accounts", "multiple accounts"
    ):
        features["customers_affected"] = max(
            int(features.get("customers_affected", 1) or 1),
            5
        )

    # Only infer operational metrics when the text explicitly
    # indicates an outage. We do not invent duration for "slow".
    if outage:
        features["downtime_min"] = max(
            float(features.get("downtime_min", 0) or 0),
            60.0
        )
        features["error_rate_pct"] = max(
            float(features.get("error_rate_pct", 0) or 0),
            100.0
        )

    if repeated_failure:
        features["error_rate_pct"] = max(
            float(features.get("error_rate_pct", 0) or 0),
            50.0
        )

    # Feed the inferred sentiment into the model's existing fields.
    inferred_sentiment = classify_sentiment(text)
    features["customer_sentiment"] = inferred_sentiment

    if inferred_sentiment == "Negative":
        features["customer_sentiment_cat"] = 0
    elif inferred_sentiment == "Positive":
        features["customer_sentiment_cat"] = 2

    features["description_length"] = len(
        normalize_text(description)
    )

    # Diagnostic information is ignored by CatBoost and can be
    # useful when inspecting a prediction.
    features["_inferred_signals"] = {
        "security_incident": security_incident,
        "data_loss": data_loss,
        "payment_impact": payment_impact,
        "outage": outage,
        "broad_impact": broad_impact,
        "urgent_language": urgent_language,
        "repeated_failure": repeated_failure,
        "numeric_affected": numeric_affected,
    }

    return features


# =========================================================
# PRIORITY CATBOOST CLASSIFICATION
# =========================================================

def classify_priority(
    priority_features: dict
):

    """
    Predict ticket priority using the frozen
    CatBoost model.

    IMPORTANT:
    The exact feature order and categorical positions
    are taken directly from the loaded .cbm model.
    """

    if not PRIORITY_MODEL_LOADED:

        return (
            "Medium",
            0.50
        )

    # -----------------------------------------------------
    # MODEL FEATURE ORDER
    # -----------------------------------------------------

    model_features = (
        priority_model.feature_names_
    )

    if not model_features:

        raise RuntimeError(
            "CatBoost model does not contain feature names."
        )

    # -----------------------------------------------------
    # VALIDATE INPUT FEATURES
    # -----------------------------------------------------

    model_input_features = {
        key: value
        for key, value in priority_features.items()
        if not str(key).startswith("_")
    }

    missing_features = [
        feature
        for feature in model_features
        if feature not in model_input_features
    ]

    if missing_features:

        raise ValueError(
            "Missing CatBoost features: "
            + ", ".join(
                missing_features
            )
        )

    # -----------------------------------------------------
    # CREATE ONE ROW IN EXACT MODEL ORDER
    # -----------------------------------------------------

    row = [
        model_input_features[feature]
        for feature in model_features
    ]

    X = pd.DataFrame(
        [row],
        columns=model_features
    )

    # -----------------------------------------------------
    # GET ACTUAL CATEGORICAL INDICES
    # -----------------------------------------------------

    categorical_indices = (
        priority_model.get_cat_feature_indices()
    )

    categorical_columns = [
        model_features[index]
        for index in categorical_indices
    ]

    # -----------------------------------------------------
    # CONVERT CATEGORICAL FEATURES
    # -----------------------------------------------------

    for column in categorical_columns:

        X[column] = (
            X[column]
            .fillna("")
            .astype(str)
        )

    # -----------------------------------------------------
    # CONVERT ALL OTHER FEATURES TO NUMERIC
    # -----------------------------------------------------

    numeric_columns = [
        column
        for index, column
        in enumerate(model_features)
        if index not in categorical_indices
    ]

    for column in numeric_columns:

        X[column] = pd.to_numeric(
            X[column],
            errors="coerce"
        )

    # -----------------------------------------------------
    # HANDLE NUMERIC MISSING VALUES
    # -----------------------------------------------------

    if numeric_columns:

        X[numeric_columns] = (
            X[numeric_columns]
            .fillna(0)
        )

    # -----------------------------------------------------
    # CATBOOST PREDICTION
    # -----------------------------------------------------

    prediction = (
        priority_model.predict(X)
    )

    raw_prediction = prediction[0]

    # CatBoost normally returns [[label]]
    if hasattr(
        raw_prediction,
        "__len__"
    ) and not isinstance(
        raw_prediction,
        str
    ):

        predicted_priority = (
            raw_prediction[0]
        )

    else:

        predicted_priority = (
            raw_prediction
        )

    predicted_priority = str(
        predicted_priority
    ).lower()

    # -----------------------------------------------------
    # CRITICAL SEVERITY SAFEGUARD
    # -----------------------------------------------------
    # CatBoost remains the frozen ML priority model. This safeguard
    # prevents clearly observable critical incidents from being
    # downgraded when the public API does not contain every training
    # feature that would normally describe the incident.
    signals = priority_features.get("_inferred_signals", {})

    critical_incident = any([
        bool(signals.get("security_incident")),
        bool(signals.get("data_loss")),
        bool(signals.get("outage")),
        (
            bool(signals.get("payment_impact"))
            and bool(signals.get("broad_impact"))
        ),
        (
            bool(signals.get("broad_impact"))
            and max(
                float(priority_features.get("customers_affected", 0) or 0),
                float(signals.get("numeric_affected", 0) or 0)
            ) >= 100
        ),
        (
            bool(signals.get("urgent_language"))
            and bool(signals.get("broad_impact"))
        ),
    ])

    priority_rule_applied = None

    if critical_incident:
        predicted_priority = "high"
        priority_rule_applied = "critical-incident safeguard"

    elif (
        bool(signals.get("payment_impact"))
        or bool(signals.get("repeated_failure"))
    ):
        # A single payment/repeated-failure signal is at least medium
        # unless the critical conditions above already promoted it.
        if predicted_priority == "low":
            predicted_priority = "medium"
            priority_rule_applied = "business-impact safeguard"

    # -----------------------------------------------------
    # PREDICTION PROBABILITY
    # -----------------------------------------------------

    probabilities = (
        priority_model.predict_proba(X)[0]
    )

    priority_confidence = float(
        max(probabilities)
    )

    # -----------------------------------------------------
    # HUMAN-READABLE PRIORITY
    # -----------------------------------------------------

    priority_display = {

        "high": "High",

        "medium": "Medium",

        "low": "Low"
    }

    priority = priority_display.get(
        predicted_priority,
        predicted_priority.title()
    )

    return (
        priority,
        round(
            priority_confidence,
            4
        ),
        priority_rule_applied
    )


# =========================================================
# SENTIMENT
# =========================================================

NEGATIVE_WORDS = [
    "angry",
    "frustrated",
    "frustrating",
    "terrible",
    "worst",
    "annoying",
    "disappointed",
    "hate",
    "failed",
    "failure",
    "failing",
    "problem",
    "issue",
    "error",
    "outage",
    "outages",
    "down",
    "unavailable",
    "unable to access",
    "cannot access",
    "can't access",
    "unable to use",
    "cannot use",
    "can't use",
    "security breach",
    "unauthorized access",
    "suspicious activity",
    "compromised",
    "data loss",
    "data lost",
    "payment failed",
    "payments failing",
    "transaction failed",
    "transactions failing"
]


POSITIVE_WORDS = [

    "thanks",
    "thank you",
    "great",
    "good",
    "excellent",
    "happy",
    "helpful",
    "love"

]


def classify_sentiment(
    text: str
):

    text = normalize_text(
        text
    )

    negative_score = sum(
        1
        for word in NEGATIVE_WORDS
        if word in text
    )

    positive_score = sum(
        1
        for word in POSITIVE_WORDS
        if word in text
    )

    if negative_score > positive_score:

        return "Negative"

    if positive_score > negative_score:

        return "Positive"

    return "Neutral"


# =========================================================
# SUGGESTED RESPONSE
# =========================================================

def generate_response(
    category: str,
    priority: str
):
    """Generate a concise priority-aware support response."""

    responses = {
        "API Issue":
            "We understand that you are experiencing an API-related issue. "
            "Our technical team will review the API request, authentication, "
            "and configuration details and assist you.",
        "Billing & Payment":
            "We understand your billing or payment concern. "
            "Our support team will review the transaction and billing details "
            "and assist you as soon as possible.",
        "Cancellation":
            "We understand that you want to cancel your subscription. "
            "Our support team will review your subscription and guide you "
            "through the cancellation process.",
        "Customer Complaint":
            "We are sorry that your experience has not met expectations. "
            "Your concern has been noted and our support team will review it "
            "and work toward an appropriate resolution.",
        "Technical Issue":
            "We are sorry that you are experiencing a technical issue. "
            "Our technical team will investigate the problem and work toward "
            "a resolution.",
        "Plan Upgrade":
            "We understand that you would like to upgrade your plan. "
            "Our support team will review your current plan and help you "
            "with the available upgrade options.",
        "General":
            "Thank you for contacting SupportIQ. "
            "Our support team will review your request and get back to you shortly."
    }

    response = responses.get(
        category,
        responses["General"]
    )

    if priority == "High":
        response = (
            "This issue has been marked as high priority. "
            + response
        )
    elif priority == "Medium":
        response = (
            "This issue has been marked as medium priority. "
            + response
        )

    return response


# =========================================================
# MAIN AI ANALYZER
# =========================================================

def analyze_ticket(
    subject: str,
    description: str,
    priority_features: dict
):

    # -----------------------------------------------------
    # NORMALIZE TEXT
    # -----------------------------------------------------

    subject = normalize_text(
        subject
    )

    description = normalize_text(
        description
    )

    combined_text = (
        f"{subject} {description}"
    ).strip()

    # -----------------------------------------------------
    # TEXT -> STRUCTURED PRIORITY SIGNALS
    #
    # The public form normally supplies subject/description.
    # Enrich the baseline CatBoost fields from the actual text.
    # -----------------------------------------------------

    priority_features = infer_priority_signals(
        subject,
        description,
        priority_features
    )

    # -----------------------------------------------------
    # CATEGORY — REAL ML
    # -----------------------------------------------------

    category, category_confidence, category_rule_applied = (
        classify_category(
            subject,
            description
        )
    )

    # -----------------------------------------------------
    # PRIORITY — REAL CATBOOST
    # -----------------------------------------------------

    priority, priority_confidence, priority_rule_applied = (
        classify_priority(
            priority_features
        )
    )

    # -----------------------------------------------------
    # SENTIMENT
    # -----------------------------------------------------

    sentiment = classify_sentiment(
        combined_text
    )

    # -----------------------------------------------------
    # SUGGESTED RESPONSE
    # -----------------------------------------------------

    suggested_response = (
        generate_response(
            category,
            priority
        )
    )

    # -----------------------------------------------------
    # FINAL RESULT
    # -----------------------------------------------------

    return {

        "category":
            category,

        "priority":
            priority,

        "sentiment":
            sentiment,

        # Existing frontend compatibility
        "confidence":
            category_confidence,

        "category_confidence":
            category_confidence,

        "priority_confidence":
            priority_confidence,

        "classification_safeguards": {
            "category_rule_applied": category_rule_applied,
            "priority_rule_applied": priority_rule_applied,
            "inferred_signals": priority_features.get(
                "_inferred_signals",
                {}
            )
        },

        "suggested_response":
            suggested_response,

        # -------------------------------------------------
        # CATEGORY MODEL INFORMATION
        # -------------------------------------------------

        "category_model": {

            "type":
                "TF-IDF + LinearSVC",

            "test_accuracy":
                round(
                    float(
                        category_metadata.get(
                            "locked_test_accuracy",
                            category_metadata.get("accuracy", 0)
                        )
                    ),
                    4
                ),

            "classes":
                category_metadata.get(
                    "classes",
                    list(getattr(category_model, "classes_", []))
                )
        },

        # -------------------------------------------------
        # PRIORITY MODEL INFORMATION
        # -------------------------------------------------

        "priority_model": {

            "type":
                "CatBoostClassifier",

            "test_accuracy":
                round(
                    float(
                        priority_metadata.get(
                            "accuracy",
                            0
                        )
                    ),
                    4
                )
        }
    }
