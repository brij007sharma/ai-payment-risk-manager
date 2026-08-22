import joblib
import pandas as pd


MODEL_PATH = "app/models/risk_model.joblib"
SCALER_PATH = "app/models/scaler.joblib"


FEATURES = [
    "amount",
    "customer_age",
    "account_age_days",
    "transactions_last_24h",
    "avg_transaction_amount",
    "merchant_risk_score",
    "device_risk_score",
    "ip_risk_score",
    "is_international",
    "is_new_device",
    "is_new_location",
    "hour",
    "amount_ratio"
]


class MLService:

    def __init__(self):

        self.model = joblib.load(
            MODEL_PATH
        )

        self.scaler = joblib.load(
            SCALER_PATH
        )

    def predict_fraud_probability(
        self,
        transaction: dict
    ):

        transaction = transaction.copy()

        # Feature engineering
        transaction["amount_ratio"] = (
            transaction["amount"] /
            (transaction["avg_transaction_amount"] + 1)
        )

        df = pd.DataFrame(
            [transaction]
        )

        X = df[FEATURES]

        X_scaled = self.scaler.transform(X)

        probability = self.model.predict_proba(
            X_scaled
        )[0][1]

        return float(probability)

if __name__ == "__main__":

    service = MLService()

    test_transaction = {
        "transaction_id": "TEST001",
        "amount": 2500,
        "customer_age": 22,
        "account_age_days": 180,
        "transactions_last_24h": 3,
        "avg_transaction_amount": 1800,
        "merchant_risk_score": 0.15,
        "device_risk_score": 0.10,
        "ip_risk_score": 0.08,
        "is_international": False,
        "is_new_device": False,
        "is_new_location": False,
        "hour": 14
    }

    probability = service.predict_fraud_probability(
        test_transaction
    )

    print("Fraud probability:", probability)