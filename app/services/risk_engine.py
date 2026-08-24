from typing import Dict


class RiskEngine:
    """
    Combines ML fraud probability with real-time
    transaction, spending, device, and behavioral
    risk signals.

    Produces:
    - ML probability
    - Velocity risk
    - Final risk probability
    - Risk level
    - Payment decision
    - Explainable risk reasons
    """

    def __init__(
        self,
        review_threshold: float = 0.40,
        block_threshold: float = 0.70
    ):

        self.review_threshold = review_threshold
        self.block_threshold = block_threshold

    # =====================================================
    # VELOCITY RISK
    # =====================================================

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

        # -------------------------------------------------
        # Customer 5-minute velocity
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Customer 1-hour velocity
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Customer spending
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Device 5-minute velocity
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Device 1-hour velocity
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Device sharing
        # -------------------------------------------------

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

    # =====================================================
    # TRANSACTION / BEHAVIORAL RISK REASONS
    # =====================================================

    def calculate_transaction_risk_reasons(
        self,
        fraud_probability: float,
        amount: float,
        merchant_risk_score: float,
        device_risk_score: float,
        ip_risk_score: float,
        is_international: bool,
        is_new_device: bool,
        is_new_location: bool,
        hour: int
    ):

        reasons = []

        # -------------------------------------------------
        # ML probability
        # -------------------------------------------------

        if fraud_probability >= 0.70:

            reasons.append(
                "Very high ML fraud probability"
            )

        elif fraud_probability >= 0.40:

            reasons.append(
                "Elevated ML fraud probability"
            )

        elif fraud_probability >= 0.25:

            reasons.append(
                "Moderately elevated ML fraud probability"
            )

        # -------------------------------------------------
        # Transaction amount
        # -------------------------------------------------

        if amount >= 50000:

            reasons.append(
                "Very high transaction amount"
            )

        elif amount >= 25000:

            reasons.append(
                "High transaction amount"
            )

        # -------------------------------------------------
        # Merchant risk
        # -------------------------------------------------

        if merchant_risk_score >= 0.80:

            reasons.append(
                "Very high merchant risk"
            )

        elif merchant_risk_score >= 0.60:

            reasons.append(
                "High merchant risk"
            )

        # -------------------------------------------------
        # Device risk
        # -------------------------------------------------

        if device_risk_score >= 0.80:

            reasons.append(
                "Very high device risk"
            )

        elif device_risk_score >= 0.60:

            reasons.append(
                "High device risk"
            )

        # -------------------------------------------------
        # IP risk
        # -------------------------------------------------

        if ip_risk_score >= 0.80:

            reasons.append(
                "Very high IP risk"
            )

        elif ip_risk_score >= 0.60:

            reasons.append(
                "High IP risk"
            )

        # -------------------------------------------------
        # International transaction
        # -------------------------------------------------

        if is_international:

            reasons.append(
                "International transaction"
            )

        # -------------------------------------------------
        # New device
        # -------------------------------------------------

        if is_new_device:

            reasons.append(
                "New device detected"
            )

        # -------------------------------------------------
        # New location
        # -------------------------------------------------

        if is_new_location:

            reasons.append(
                "New transaction location detected"
            )

        # -------------------------------------------------
        # Unusual transaction hour
        # -------------------------------------------------

        if hour >= 0 and hour <= 5:

            reasons.append(
                "Transaction occurred during unusual hours"
            )

        return reasons

    # =====================================================
    # FINAL RISK ASSESSMENT
    # =====================================================

    def assess_risk(
        self,
        fraud_probability: float,

        transactions_last_5min: int = 0,
        transactions_last_1h: int = 0,
        amount_last_1h: float = 0.0,

        device_transactions_last_5min: int = 0,
        device_transactions_last_1h: int = 0,
        unique_customers_last_1h: int = 0,

        amount: float = 0.0,
        merchant_risk_score: float = 0.0,
        device_risk_score: float = 0.0,
        ip_risk_score: float = 0.0,

        is_international: bool = False,
        is_new_device: bool = False,
        is_new_location: bool = False,

        hour: int = 12
    ) -> Dict:

        # =================================================
        # 1. VELOCITY RISK
        # =================================================

        velocity_risk, velocity_reasons = (
            self.calculate_velocity_risk(
                transactions_last_5min,
                transactions_last_1h,
                amount_last_1h,
                device_transactions_last_5min,
                device_transactions_last_1h,
                unique_customers_last_1h
            )
        )

        # =================================================
        # 2. TRANSACTION RISK REASONS
        # =================================================

        transaction_reasons = (
            self.calculate_transaction_risk_reasons(
                fraud_probability=fraud_probability,

                amount=amount,

                merchant_risk_score=
                    merchant_risk_score,

                device_risk_score=
                    device_risk_score,

                ip_risk_score=
                    ip_risk_score,

                is_international=
                    is_international,

                is_new_device=
                    is_new_device,

                is_new_location=
                    is_new_location,

                hour=hour
            )
        )

        # =================================================
        # 3. COMBINE REASONS
        # =================================================

        reasons = (
            transaction_reasons +
            velocity_reasons
        )

        # Remove duplicates while preserving order
        reasons = list(
            dict.fromkeys(reasons)
        )

        # =================================================
        # 4. FINAL RISK
        # =================================================

        final_probability = min(
            fraud_probability + velocity_risk,
            1.0
        )

        # =================================================
        # 5. FINAL DECISION
        # =================================================

        if final_probability >= self.block_threshold:

            risk_level = "HIGH"

            decision = "BLOCK"

        elif final_probability >= self.review_threshold:

            risk_level = "MEDIUM"

            decision = "REVIEW"

        else:

            risk_level = "LOW"

            decision = "APPROVE"

        # =================================================
        # 6. RETURN RESULT
        # =================================================

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

            "risk_level":
                risk_level,

            "decision":
                decision,

            "risk_reasons":
                reasons
        }