from fastapi import FastAPI

from app.schemas.transaction import Transaction
from app.services.ml_service import MLService
from app.services.risk_engine import RiskEngine


app = FastAPI(
    title="AI Payment Risk Manager",
    description="AI-powered payment risk assessment system",
    version="0.1.0"
)


ml_service = MLService()
risk_engine = RiskEngine()


@app.get("/")
def root():
    return {
        "message": "AI Payment Risk Manager is running"
    }


@app.post("/transaction")
def assess_transaction(transaction: Transaction):

    transaction_data = transaction.model_dump()

    # Get fraud probability from ML model
    fraud_probability = (
        ml_service.predict_fraud_probability(
            transaction_data
        )
    )

    # Convert probability into business decision
    risk_result = risk_engine.assess_risk(
        fraud_probability
    )

    return {
        "transaction_id": transaction.transaction_id,
        **risk_result
    }