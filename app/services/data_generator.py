import numpy as np
import pandas as pd


def generate_transactions(n=10000, seed=42):
    rng = np.random.default_rng(seed)

    # -----------------------------
    # Basic customer information
    # -----------------------------
    customer_age = rng.integers(18, 70, n)

    account_age_days = np.clip(
        rng.exponential(scale=450, size=n).astype(int),
        1,
        3000
    )

    # -----------------------------
    # Transaction behavior
    # -----------------------------
    avg_transaction_amount = np.clip(
        rng.lognormal(mean=7.0, sigma=0.7, size=n),
        100,
        50000
    )

    # Most transactions are relatively normal
    amount = np.clip(
        avg_transaction_amount * rng.lognormal(
            mean=0,
            sigma=0.55,
            size=n
        ),
        50,
        100000
    )

    transactions_last_24h = rng.poisson(
        lam=3,
        size=n
    )

    high_velocity = rng.binomial(
    1,
    0.08,
    size=n
    )

    transactions_last_24h += (
        high_velocity *
        rng.integers(8, 25, size=n)
    )

    # -----------------------------
    # Risk-related signals
    # -----------------------------
    merchant_risk_score = rng.beta(
        2,
        8,
        size=n
    )

    device_risk_score = rng.beta(
        2,
        8,
        size=n
    )

    ip_risk_score = rng.beta(
        2,
        8,
        size=n
    )

    is_international = rng.binomial(
        1,
        0.12,
        size=n
    )

    is_new_device = rng.binomial(
        1,
        0.10,
        size=n
    )

    is_new_location = rng.binomial(
        1,
        0.08,
        size=n
    )

    hour = rng.integers(0, 24, n)

    # -----------------------------
    # Build fraud probability
    # -----------------------------
    fraud_score = (
        -4.5
        + 1.8 * merchant_risk_score
        + 2.0 * device_risk_score
        + 2.0 * ip_risk_score
        + 0.7 * is_international
        + 1.0 * is_new_device
        + 1.0 * is_new_location
        + 0.10 * transactions_last_24h
    )

    # High amount compared with customer's normal spending
    amount_ratio = amount / (avg_transaction_amount + 1)

    fraud_score += np.where(
        amount_ratio > 3,
        1.5,
        0
    )

    fraud_score += np.where(
    transactions_last_24h >= 10,
    1.5,
    0
    )

    fraud_score += np.where(
        transactions_last_24h >= 20,
        1.5,
        0
)

    fraud_score += np.where(
        amount_ratio > 6,
        1.5,
        0
    )

    # Very new accounts are somewhat riskier
    fraud_score += np.where(
        account_age_days < 30,
        1.0,
        0
    )

    # Late-night transactions get a small risk increase
    fraud_score += np.where(
        (hour <= 4) | (hour >= 23),
        0.5,
        0
    )

    # Convert score into probability
    fraud_probability = 1 / (1 + np.exp(-fraud_score))

    # Generate actual fraud label
    is_fraud = rng.binomial(
        1,
        fraud_probability
    )

    # -----------------------------
    # Create DataFrame
    # -----------------------------
    df = pd.DataFrame({
        "transaction_id": [
            f"TXN{i:06d}"
            for i in range(1, n + 1)
        ],
        "amount": np.round(amount, 2),
        "customer_age": customer_age,
        "account_age_days": account_age_days,
        "transactions_last_24h": transactions_last_24h,
        "avg_transaction_amount": np.round(
            avg_transaction_amount,
            2
        ),
        "merchant_risk_score": np.round(
            merchant_risk_score,
            4
        ),
        "device_risk_score": np.round(
            device_risk_score,
            4
        ),
        "ip_risk_score": np.round(
            ip_risk_score,
            4
        ),
        "is_international": is_international,
        "is_new_device": is_new_device,
        "is_new_location": is_new_location,
        "hour": hour,
        "is_fraud": is_fraud
    })

    return df


if __name__ == "__main__":
    df = generate_transactions()

    output_path = "data/transactions.csv"
    df.to_csv(output_path, index=False)

    print(f"Generated {len(df)} transactions")
    print(f"Saved to: {output_path}")
    print()
    print("Fraud distribution:")
    print(df["is_fraud"].value_counts())
    print()
    print("Fraud percentage:")
    print(
        round(df["is_fraud"].mean() * 100, 2),
        "%"
    )
    print()
    print("First 5 transactions:")
    print(df.head())