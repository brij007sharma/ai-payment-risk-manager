from fastapi import FastAPI, HTTPException
import sqlite3

from app.schemas.transaction import Transaction

from app.services.ml_service import MLService
from app.services.risk_engine import RiskEngine
from app.services.feature_service import FeatureService

from app.database.database import (
    initialize_database,
    save_transaction
)


app = FastAPI(
    title="AI Payment Risk Manager",
    description="AI-powered payment risk assessment system",
    version="0.3.0"
)


ml_service = MLService()
risk_engine = RiskEngine()
feature_service = FeatureService()


@app.on_event("startup")
def startup():

    initialize_database()


@app.get("/")
def root():

    return {
        "message": "AI Payment Risk Manager is running"
    }


@app.post("/transaction")
def assess_transaction(
    transaction: Transaction
):

    transaction_data = transaction.model_dump()

    # =========================================
    # REAL-TIME CUSTOMER FEATURES
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
    # REAL-TIME DEVICE FEATURES
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
    # ML FRAUD PREDICTION
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

        fraud_probability,

        transactions_last_5min,

        transactions_last_1h,

        amount_last_1h,

        device_transactions_last_5min,

        device_transactions_last_1h,

        unique_customers_last_1h
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
    # FINAL RESPONSE
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