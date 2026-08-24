import json
import os
from typing import Dict

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


class AIInvestigator:
    """
    AI-powered payment risk investigator.

    The model receives only structured evidence produced
    by our transaction and risk systems.

    It does not make the original fraud decision.
    It explains the existing decision and evidence.
    """

    def __init__(self):

        api_key = os.getenv(
            "OPENAI_API_KEY"
        )

        if not api_key:

            raise RuntimeError(
                "OPENAI_API_KEY is not configured."
            )

        self.client = OpenAI(
            api_key=api_key
        )

        self.model = os.getenv(
            "OPENAI_MODEL",
            "gpt-5.6-luna"
        )

    

    def investigate(
        self,
        transaction: Dict
    ) -> Dict:

        evidence = self._build_evidence(
            transaction
        )

        response = self.client.responses.create(

            model=self.model,

            instructions=self._system_prompt(),

            input=json.dumps(
                evidence,
                indent=2
            ),

            text={
                "format": {
                    "type": "json_schema",

                    "name": "payment_risk_investigation",

                    "strict": True,

                    "schema": {
                        "type": "object",

                        "properties": {

                            "summary": {
                                "type": "string"
                            },

                            "primary_risk": {
                                "type": "string"
                            },

                            "risk_factors": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },

                            "evidence": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                }
                            },

                            "recommended_action": {
                                "type": "string",
                                "enum": [
                                    "APPROVE",
                                    "REVIEW",
                                    "BLOCK"
                                ]
                            },

                            

                            "analyst_note": {
                                "type": "string"
                            }

                        },

                        "required": [
                            "summary",
                            "primary_risk",
                            "risk_factors",
                            "evidence",
                            "recommended_action",
                            
                            "analyst_note"
                        ],

                        "additionalProperties": False
                    }
                }
            }
        )

        if not response.output_text:

            raise RuntimeError(
                "AI Investigator returned no output."
            )

        try:

            result = json.loads(
                response.output_text
            )

        except json.JSONDecodeError as exc:

            raise RuntimeError(
                "AI Investigator returned invalid JSON."
            ) from exc

        result["confidence"] = self._calculate_confidence(
                transaction
            )

        # -----------------------------------------
        # Decision safety check
        # -----------------------------------------

        result[
            "recommended_action"
        ] = transaction.get(
            "decision"
        )

        return result

    @staticmethod
    def _calculate_confidence(transaction: Dict) -> str:
    
            risk_level = transaction.get(
                "risk_level"
            )
    
            if risk_level == "HIGH":
                return "HIGH"
    
            if risk_level == "MEDIUM":
                return "MEDIUM"
    
            return "LOW"

    # =====================================================
    # SYSTEM PROMPT
    # =====================================================

    @staticmethod
    def _system_prompt():

        return """
You are an AI payment-risk investigation assistant.

Your job is to help a fraud analyst understand an
existing transaction-risk decision.

IMPORTANT RULES:

1. Do NOT make up transaction facts.

2. Use ONLY the evidence supplied in the input.

3. Do NOT invent customer behavior, location,
   merchant information, device information,
   or historical activity.

4. The numerical risk decision has already been
   calculated by the deterministic risk engine.

5. Explain why the existing decision makes sense.

6. Do not override the existing decision.

7. If evidence is weak, explicitly say that the
   evidence is limited.

8. Keep the investigation concise and useful
   to a payment-risk analyst.

9. Distinguish between:
   - ML probability
   - velocity signals
   - transaction risk signals
   - final risk decision

10. Recommended action MUST match the supplied
    decision.

Return structured investigation data only.
"""

    # =====================================================
    # BUILD EVIDENCE
    # =====================================================

    @staticmethod
    def _build_evidence(
        transaction: Dict
    ) -> Dict:

        return {

            "transaction": {

                "transaction_id":
                    transaction.get(
                        "transaction_id"
                    ),

                "customer_id":
                    transaction.get(
                        "customer_id"
                    ),

                "device_id":
                    transaction.get(
                        "device_id"
                    ),

                "amount":
                    transaction.get(
                        "amount"
                    ),

                "timestamp":
                    transaction.get(
                        "timestamp"
                    )

            },

            "risk_assessment": {

                "ml_probability":
                    transaction.get(
                        "ml_probability"
                    ),

                "velocity_risk":
                    transaction.get(
                        "velocity_risk"
                    ),

                "risk_probability":
                    transaction.get(
                        "risk_probability"
                    ),

                "risk_level":
                    transaction.get(
                        "risk_level"
                    ),

                "decision":
                    transaction.get(
                        "decision"
                    )

            },

            "velocity_signals": {

                "transactions_last_5min":
                    transaction.get(
                        "transactions_last_5min"
                    ),

                "transactions_last_1h":
                    transaction.get(
                        "transactions_last_1h"
                    ),

                "amount_last_1h":
                    transaction.get(
                        "amount_last_1h"
                    ),

                "device_transactions_last_5min":
                    transaction.get(
                        "device_transactions_last_5min"
                    ),

                "device_transactions_last_1h":
                    transaction.get(
                        "device_transactions_last_1h"
                    ),

                "unique_customers_last_1h":
                    transaction.get(
                        "unique_customers_last_1h"
                    )

            },

            "risk_reasons":
                transaction.get(
                    "risk_reasons",
                    []
                )

        }