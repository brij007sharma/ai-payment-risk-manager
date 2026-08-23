from typing import Dict


class RiskEngine:
    """
    Combines ML fraud probability with real-time
    transaction, spending, and device-risk signals.
    """

    def __init__(
        self,
        review_threshold: float = 0.40,
        block_threshold: float = 0.70
    ):

        self.review_threshold = review_threshold
        self.block_threshold = block_threshold

    def calculate_velocity_risk(
        self,
        transactions_last_5min: int,
        transactions_last_1h: int,
        amount_last_1h: float,
        device_transactions_last_5min: int,
        device_transactions_last_1h: int,
        unique_customers_last_1h: int
    ):

        risk = 0.0
        reasons = []

        # -----------------------------
        # Customer 5-minute velocity
        # -----------------------------

        if transactions_last_5min >= 10:

            risk += 0.30

            reasons.append(
                "Very high customer transaction velocity"
            )

        elif transactions_last_5min >= 5:

            risk += 0.15

            reasons.append(
                "High customer transaction velocity"
            )

        elif transactions_last_5min >= 3:

            risk += 0.05

            reasons.append(
                "Elevated customer transaction velocity"
            )

        # -----------------------------
        # Customer 1-hour velocity
        # -----------------------------

        if transactions_last_1h >= 15:

            risk += 0.15

            reasons.append(
                "Very high transaction volume in the last hour"
            )

        elif transactions_last_1h >= 10:

            risk += 0.10

            reasons.append(
                "High transaction volume in the last hour"
            )

        # -----------------------------
        # Customer spending
        # -----------------------------

        if amount_last_1h >= 50000:

            risk += 0.20

            reasons.append(
                "Very high spending volume in the last hour"
            )

        elif amount_last_1h >= 25000:

            risk += 0.10

            reasons.append(
                "High spending volume in the last hour"
            )

        # -----------------------------
        # Device 5-minute velocity
        # -----------------------------

        if device_transactions_last_5min >= 10:

            risk += 0.20

            reasons.append(
                "Very high device transaction velocity"
            )

        elif device_transactions_last_5min >= 5:

            risk += 0.10

            reasons.append(
                "High device transaction velocity"
            )

        # -----------------------------
        # Device 1-hour velocity
        # -----------------------------

        if device_transactions_last_1h >= 20:

            risk += 0.15

            reasons.append(
                "Very high device transaction volume"
            )

        elif device_transactions_last_1h >= 10:

            risk += 0.08

            reasons.append(
                "High device transaction volume"
            )

        # -----------------------------
        # Device sharing
        # -----------------------------

        if unique_customers_last_1h >= 5:

            risk += 0.20

            reasons.append(
                "Device used by many customers recently"
            )

        elif unique_customers_last_1h >= 3:

            risk += 0.10

            reasons.append(
                "Device shared across multiple customers"
            )

        return min(risk, 0.60), reasons

    def assess_risk(
        self,
        fraud_probability: float,
        transactions_last_5min: int = 0,
        transactions_last_1h: int = 0,
        amount_last_1h: float = 0.0,
        device_transactions_last_5min: int = 0,
        device_transactions_last_1h: int = 0,
        unique_customers_last_1h: int = 0
    ) -> Dict:

        velocity_risk, reasons = (
            self.calculate_velocity_risk(
                transactions_last_5min,
                transactions_last_1h,
                amount_last_1h,
                device_transactions_last_5min,
                device_transactions_last_1h,
                unique_customers_last_1h
            )
        )

        final_probability = min(
            fraud_probability + velocity_risk,
            1.0
        )

        # -----------------------------
        # Final decision
        # -----------------------------

        if final_probability >= self.block_threshold:

            risk_level = "HIGH"
            decision = "BLOCK"

        elif final_probability >= self.review_threshold:

            risk_level = "MEDIUM"
            decision = "REVIEW"

        else:

            risk_level = "LOW"
            decision = "APPROVE"

        return {
            "ml_probability": round(
                fraud_probability,
                4
            ),

            "velocity_risk": round(
                velocity_risk,
                4
            ),

            "risk_probability": round(
                final_probability,
                4
            ),

            "risk_level": risk_level,

            "decision": decision,

            "risk_reasons": reasons
        }