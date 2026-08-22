import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)


DATA_PATH = "data/transactions.csv"


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


def load_data():

    df = pd.read_csv(DATA_PATH)

    df["amount_ratio"] = (
        df["amount"] /
        (df["avg_transaction_amount"] + 1)
    )

    return df


def train_random_forest(df):

    X = df[FEATURES]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=3,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    y_probability = model.predict_proba(
        X_test
    )[:, 1]

    print("\n===== RANDOM FOREST =====")

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print(
        "ROC-AUC:",
        round(
            roc_auc_score(
                y_test,
                y_probability
            ),
            4
        )
    )

    print("\n===== FEATURE IMPORTANCE =====")

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES
    ).sort_values(
        ascending=False
    )

    print(importance)


if __name__ == "__main__":

    df = load_data()

    print("Dataset shape:", df.shape)

    train_random_forest(df)