from fastapi import FastAPI, HTTPException
import sqlite3


from app.services.ai_investigator import AIInvestigator
from app.schemas.transaction import Transaction

from fastapi.middleware.cors import CORSMiddleware

from app.services.ml_service import MLService
from app.services.risk_engine import RiskEngine
from app.services.feature_service import FeatureService

from app.database.database import (
    initialize_database,
    save_transaction,
    save_risk_assessment,
    get_transaction,
    get_all_transactions
)


app = FastAPI(
    title="AI Payment Risk Manager",
    description="AI-powered payment risk assessment system",
    version="0.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


ml_service = MLService()
risk_engine = RiskEngine()
ai_investigator = AIInvestigator()
feature_service = FeatureService()


@app.on_event("startup")
def startup():

    initialize_database()


@app.get("/")
def root():

    return {
        "message": "AI Payment Risk Manager is running"
    }


# =====================================================
# TRANSACTION RISK ASSESSMENT
# =====================================================

@app.post("/transaction")
def assess_transaction(
    transaction: Transaction
):

    transaction_data = transaction.model_dump()

    # =========================================
    # CUSTOMER FEATURES
    # =========================================

    transactions_last_5min = (
        feature_service.get_customer_velocity(
            transaction.customer_id,
            minutes=5
        )
    )

    transactions_last_1h = (
        feature_service.get_customer_velocity(
            transaction.customer_id,
            minutes=60
        )
    )

    amount_last_1h = (
        feature_service.get_customer_amount(
            transaction.customer_id,
            hours=1
        )
    )

    # =========================================
    # DEVICE FEATURES
    # =========================================

    device_transactions_last_5min = (
        feature_service.get_device_velocity(
            transaction.device_id,
            minutes=5
        )
    )

    device_transactions_last_1h = (
        feature_service.get_device_velocity(
            transaction.device_id,
            minutes=60
        )
    )

    unique_customers_last_1h = (
        feature_service.get_device_unique_customers(
            transaction.device_id,
            hours=1
        )
    )

    # =========================================
    # ML PREDICTION
    # =========================================

    fraud_probability = (
        ml_service.predict_fraud_probability(
            transaction_data
        )
    )

    # =========================================
    # RISK ENGINE
    # =========================================

    risk_result = risk_engine.assess_risk(

    fraud_probability=fraud_probability,

    transactions_last_5min=
        transactions_last_5min,

    transactions_last_1h=
        transactions_last_1h,

    amount_last_1h=
        amount_last_1h,

    device_transactions_last_5min=
        device_transactions_last_5min,

    device_transactions_last_1h=
        device_transactions_last_1h,

    unique_customers_last_1h=
        unique_customers_last_1h,

    amount=
        transaction.amount,

    merchant_risk_score=
        transaction.merchant_risk_score,

    device_risk_score=
        transaction.device_risk_score,

    ip_risk_score=
        transaction.ip_risk_score,

    is_international=
        transaction.is_international,

    is_new_device=
        transaction.is_new_device,

    is_new_location=
        transaction.is_new_location,

    hour=
        transaction.hour
)

    # =========================================
    # SAVE TRANSACTION
    # =========================================

    try:

        save_transaction(

            transaction_id=transaction.transaction_id,

            customer_id=transaction.customer_id,

            device_id=transaction.device_id,

            amount=transaction.amount
        )

    except sqlite3.IntegrityError:

        raise HTTPException(
            status_code=409,
            detail="Transaction ID already exists"
        )

    # =========================================
    # SAVE RISK ASSESSMENT
    # =========================================

    save_risk_assessment(
    transaction_id=transaction.transaction_id,

    ml_probability=risk_result[
        "ml_probability"
    ],

    velocity_risk=risk_result[
        "velocity_risk"
    ],

    risk_probability=risk_result[
        "risk_probability"
    ],

    risk_level=risk_result[
        "risk_level"
    ],

    decision=risk_result[
        "decision"
    ],

    risk_reasons=risk_result[
        "risk_reasons"
    ],

    transactions_last_5min=transactions_last_5min,

    transactions_last_1h=transactions_last_1h,

    amount_last_1h=amount_last_1h,

    device_transactions_last_5min=
        device_transactions_last_5min,

    device_transactions_last_1h=
        device_transactions_last_1h,

    unique_customers_last_1h=
        unique_customers_last_1h
    )

    # =========================================
    # RESPONSE
    # =========================================

    return {

        "transaction_id":
            transaction.transaction_id,

        "customer_id":
            transaction.customer_id,

        "device_id":
            transaction.device_id,

        "transactions_last_5min":
            transactions_last_5min,

        "transactions_last_1h":
            transactions_last_1h,

        "amount_last_1h":
            round(amount_last_1h, 2),

        "device_transactions_last_5min":
            device_transactions_last_5min,

        "device_transactions_last_1h":
            device_transactions_last_1h,

        "unique_customers_last_1h":
            unique_customers_last_1h,

        **risk_result
    }


# =====================================================
# TRANSACTION INVESTIGATION
# =====================================================

@app.get("/transaction/{transaction_id}")
def investigate_transaction(
    transaction_id: str
):

    transaction = get_transaction(
        transaction_id
    )

    if transaction is None:

        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    return transaction


# =====================================================
# TRANSACTION HISTORY
# =====================================================

@app.get("/transactions")
def list_transactions(
    limit: int = 50
):

    if limit < 1 or limit > 100:

        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100"
        )

    transactions = get_all_transactions(
        limit
    )

    return {
        "count": len(transactions),
        "transactions": transactions
    }

@app.post("/investigate/{transaction_id}")
def investigate_transaction(
    transaction_id: str
):

    transaction = get_transaction(
        transaction_id
    )

    if transaction is None:

        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )

    if transaction.get("decision") is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "Transaction has not been "
                "risk-assessed yet."
            )
        )

    investigation = (
        ai_investigator.investigate(
            transaction
        )
    )

    return {
        "transaction_id":
            transaction_id,

        "decision":
            transaction.get(
                "decision"
            ),

        "risk_level":
            transaction.get(
                "risk_level"
            ),

        "risk_probability":
            transaction.get(
                "risk_probability"
            ),

        "investigation":
            investigation
    }