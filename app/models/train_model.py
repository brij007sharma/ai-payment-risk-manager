import pandas as pd

import joblib
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)


DATA_PATH = "data/transactions.csv"


def load_data():
    df = pd.read_csv(DATA_PATH)

    # Feature engineering
    df["amount_ratio"] = (
        df["amount"] /
        (df["avg_transaction_amount"] + 1)
    )

    return df


def train_model(df):
    features = [
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

    X = df[features]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(
        max_iter=1000,
        random_state=42
    )

    model.fit(X_train_scaled, y_train)

    joblib.dump(
        model,
        "app/models/risk_model.joblib"
    )

    joblib.dump(
        scaler,
        "app/models/scaler.joblib"
    )

    print("\nModel saved successfully.")

    y_pred = model.predict(X_test_scaled)
    y_probability = model.predict_proba(X_test_scaled)[:, 1]

    print("\n===== THRESHOLD ANALYSIS =====")

    for threshold in [0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]:
        y_threshold = (
            y_probability >= threshold
        ).astype(int)

        precision = precision_score(
            y_test,
            y_threshold,
            zero_division=0
        )

        recall = recall_score(
            y_test,
            y_threshold,
            zero_division=0
        )

        f1 = f1_score(
            y_test,
            y_threshold,
            zero_division=0
        )

        print(
            f"Threshold: {threshold:.2f} | "
            f"Precision: {precision:.3f} | "
            f"Recall: {recall:.3f} | "
            f"F1: {f1:.3f}"
        )

    print("\n===== MODEL PERFORMANCE =====")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print(
        "ROC-AUC:",
        round(roc_auc_score(y_test, y_probability), 4)
    )

    return model, scaler


if __name__ == "__main__":
    df = load_data()

    print("Dataset shape:", df.shape)

    print("\nFraud distribution:")
    print(df["is_fraud"].value_counts())

    train_model(df)