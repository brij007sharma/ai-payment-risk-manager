from pydantic import BaseModel, Field


class Transaction(BaseModel):
    transaction_id: str

    amount: float = Field(gt=0)

    customer_age: int = Field(ge=18, le=100)
    account_age_days: int = Field(ge=0)

    transactions_last_24h: int = Field(ge=0)
    avg_transaction_amount: float = Field(ge=0)

    merchant_risk_score: float = Field(ge=0, le=1)
    device_risk_score: float = Field(ge=0, le=1)
    ip_risk_score: float = Field(ge=0, le=1)

    is_international: bool
    is_new_device: bool
    is_new_location: bool

    hour: int = Field(ge=0, le=23)