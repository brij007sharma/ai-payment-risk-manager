from typing import Dict


class RiskEngine:
    """
    Converts a fraud probability into a risk level
    and recommended payment action.
    """

    def __init__(
        self,
        review_threshold: float = 0.40,
        block_threshold: float = 0.70
    ):
        self.review_threshold = review_threshold
        self.block_threshold = block_threshold

    def assess_risk(
        self,
        fraud_probability: float
    ) -> Dict:

        if fraud_probability >= self.block_threshold:
            risk_level = "HIGH"
            decision = "BLOCK"

        elif fraud_probability >= self.review_threshold:
            risk_level = "MEDIUM"
            decision = "REVIEW"

        else:
            risk_level = "LOW"
            decision = "APPROVE"

        return {
            "risk_probability": round(
                fraud_probability,
                4
            ),
            "risk_level": risk_level,
            "decision": decision
        }

if __name__ == "__main__":

    engine = RiskEngine()

    test_probabilities = [
        0.15,
        0.35,
        0.50,
        0.75,
        0.95
    ]

    for probability in test_probabilities:

        result = engine.assess_risk(
            probability
        )

        print(result)