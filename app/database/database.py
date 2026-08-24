import sqlite3
from pathlib import Path
import json


DATABASE_PATH = Path("data/transactions.db")


def get_connection():

    DATABASE_PATH.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    connection = sqlite3.connect(
        DATABASE_PATH,
        timeout=10
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        # =========================================
        # TRANSACTIONS
        # =========================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                transaction_id TEXT UNIQUE NOT NULL,

                customer_id TEXT NOT NULL,

                device_id TEXT NOT NULL,

                amount REAL NOT NULL,

                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP

            )
        """)

        # =========================================
        # RISK ASSESSMENTS
        # =========================================

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS risk_assessments (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                transaction_id TEXT UNIQUE NOT NULL,

                ml_probability REAL NOT NULL,

                velocity_risk REAL NOT NULL,

                risk_probability REAL NOT NULL,

                risk_level TEXT NOT NULL,

                decision TEXT NOT NULL,

                risk_reasons TEXT,

                transactions_last_5min INTEGER DEFAULT 0,

                transactions_last_1h INTEGER DEFAULT 0,

                amount_last_1h REAL DEFAULT 0,

                device_transactions_last_5min INTEGER DEFAULT 0,

                device_transactions_last_1h INTEGER DEFAULT 0,

                unique_customers_last_1h INTEGER DEFAULT 0,

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY(transaction_id)
                REFERENCES transactions(transaction_id)

            )
        """)

        # =========================================
        # DATABASE MIGRATION
        # =========================================
        # Adds columns if an older database already
        # contains risk_assessments without them.

        cursor.execute("""
            PRAGMA table_info(risk_assessments)
        """)

        existing_columns = {
            row["name"]
            for row in cursor.fetchall()
        }

        new_columns = {
            "transactions_last_5min":
                "INTEGER DEFAULT 0",

            "transactions_last_1h":
                "INTEGER DEFAULT 0",

            "amount_last_1h":
                "REAL DEFAULT 0",

            "device_transactions_last_5min":
                "INTEGER DEFAULT 0",

            "device_transactions_last_1h":
                "INTEGER DEFAULT 0",

            "unique_customers_last_1h":
                "INTEGER DEFAULT 0"
        }

        for column, definition in new_columns.items():

            if column not in existing_columns:

                cursor.execute(
                    f"""
                    ALTER TABLE risk_assessments
                    ADD COLUMN {column} {definition}
                    """
                )

        # =========================================
        # INDEXES
        # =========================================

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_customer_timestamp
            ON transactions(customer_id, timestamp)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_device_timestamp
            ON transactions(device_id, timestamp)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_risk_level
            ON risk_assessments(risk_level)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS
            idx_decision
            ON risk_assessments(decision)
        """)

        connection.commit()

    finally:

        connection.close()


def save_transaction(
    transaction_id: str,
    customer_id: str,
    device_id: str,
    amount: float
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO transactions (
                transaction_id,
                customer_id,
                device_id,
                amount
            )
            VALUES (?, ?, ?, ?)
        """, (
            transaction_id,
            customer_id,
            device_id,
            amount
        ))

        connection.commit()

    finally:

        connection.close()


def save_risk_assessment(
    transaction_id: str,
    ml_probability: float,
    velocity_risk: float,
    risk_probability: float,
    risk_level: str,
    decision: str,
    risk_reasons: list,
    transactions_last_5min: int,
    transactions_last_1h: int,
    amount_last_1h: float,
    device_transactions_last_5min: int,
    device_transactions_last_1h: int,
    unique_customers_last_1h: int
):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO risk_assessments (

                transaction_id,

                ml_probability,

                velocity_risk,

                risk_probability,

                risk_level,

                decision,

                risk_reasons,

                transactions_last_5min,

                transactions_last_1h,

                amount_last_1h,

                device_transactions_last_5min,

                device_transactions_last_1h,

                unique_customers_last_1h

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (

            transaction_id,

            ml_probability,

            velocity_risk,

            risk_probability,

            risk_level,

            decision,

            json.dumps(risk_reasons),

            transactions_last_5min,

            transactions_last_1h,

            amount_last_1h,

            device_transactions_last_5min,

            device_transactions_last_1h,

            unique_customers_last_1h

        ))

        connection.commit()

    finally:

        connection.close()


def get_transaction(transaction_id: str):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            SELECT

                t.transaction_id,
                t.customer_id,
                t.device_id,
                t.amount,
                t.timestamp,

                r.ml_probability,
                r.velocity_risk,
                r.risk_probability,
                r.risk_level,
                r.decision,
                r.risk_reasons,

                r.transactions_last_5min,
                r.transactions_last_1h,
                r.amount_last_1h,

                r.device_transactions_last_5min,
                r.device_transactions_last_1h,

                r.unique_customers_last_1h,

                r.created_at

            FROM transactions t

            LEFT JOIN risk_assessments r
                ON t.transaction_id = r.transaction_id

            WHERE t.transaction_id = ?
        """, (
            transaction_id,
        ))

        row = cursor.fetchone()

        if row is None:
            return None

        result = dict(row)

        if result["risk_reasons"]:

            result["risk_reasons"] = json.loads(
                result["risk_reasons"]
            )

        else:

            result["risk_reasons"] = []

        return result

    finally:

        connection.close()


def get_all_transactions(limit: int = 50):

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            SELECT

                t.transaction_id,
                t.customer_id,
                t.device_id,
                t.amount,
                t.timestamp,

                r.ml_probability,
                r.velocity_risk,
                r.risk_probability,
                r.risk_level,
                r.decision

            FROM transactions t

            LEFT JOIN risk_assessments r
                ON t.transaction_id = r.transaction_id

            ORDER BY t.timestamp DESC

            LIMIT ?
        """, (
            limit,
        ))

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:

        connection.close()

def delete_unassessed_transactions():
    """
    Deletes transactions that do not have
    a corresponding risk assessment.

    Used for cleaning old/incomplete test data.
    """

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            DELETE FROM transactions
            WHERE transaction_id NOT IN (
                SELECT transaction_id
                FROM risk_assessments
            )
        """)

        deleted_count = cursor.rowcount

        connection.commit()

        return deleted_count

    finally:

        connection.close()

def get_analytics():
    """
    Returns aggregated transaction-risk analytics
    from the database.
    """

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # =========================================
        # TOTAL TRANSACTIONS
        # =========================================

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM transactions
        """)

        total_transactions = cursor.fetchone()["count"]

        # =========================================
        # DECISION COUNTS
        # =========================================

        cursor.execute("""
            SELECT
                COALESCE(r.decision, 'UNASSESSED') AS decision,
                COUNT(*) AS count
            FROM transactions t
            LEFT JOIN risk_assessments r
                ON t.transaction_id = r.transaction_id
            GROUP BY COALESCE(r.decision, 'UNASSESSED')
        """)

        decision_rows = cursor.fetchall()

        decisions = {
            "APPROVE": 0,
            "REVIEW": 0,
            "BLOCK": 0,
            "UNASSESSED": 0
        }

        for row in decision_rows:
            decisions[row["decision"]] = row["count"]

        # =========================================
        # RISK LEVEL COUNTS
        # =========================================

        cursor.execute("""
            SELECT
                COALESCE(r.risk_level, 'UNASSESSED') AS risk_level,
                COUNT(*) AS count
            FROM transactions t
            LEFT JOIN risk_assessments r
                ON t.transaction_id = r.transaction_id
            GROUP BY COALESCE(r.risk_level, 'UNASSESSED')
        """)

        risk_rows = cursor.fetchall()

        risk_distribution = {
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "UNASSESSED": 0
        }

        for row in risk_rows:
            risk_distribution[row["risk_level"]] = row["count"]

        # =========================================
        # AVERAGE RISK
        # =========================================

        cursor.execute("""
            SELECT
                COALESCE(
                    AVG(risk_probability),
                    0
                ) AS average_risk
            FROM risk_assessments
        """)

        average_risk = cursor.fetchone()["average_risk"]

        # =========================================
        # HIGH-RISK RATE
        # =========================================

        cursor.execute("""
            SELECT
                COUNT(*) AS count
            FROM risk_assessments
            WHERE risk_level = 'HIGH'
        """)

        high_risk_count = cursor.fetchone()["count"]

        if total_transactions > 0:
            high_risk_rate = (
                high_risk_count /
                total_transactions
            )
        else:
            high_risk_rate = 0.0

        # =========================================
        # TRANSACTION VOLUME
        # =========================================

        cursor.execute("""
            SELECT
                DATE(timestamp) AS date,
                COUNT(*) AS count
            FROM transactions
            GROUP BY DATE(timestamp)
            ORDER BY DATE(timestamp) ASC
        """)

        volume_rows = cursor.fetchall()

        transaction_volume = [
            {
                "date": row["date"],
                "count": row["count"]
            }
            for row in volume_rows
        ]

        # =========================================
        # RISK TREND
        # =========================================

        cursor.execute("""
            SELECT
                DATE(created_at) AS date,
                AVG(risk_probability) AS average_risk
            FROM risk_assessments
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        """)

        risk_rows = cursor.fetchall()

        risk_trend = [
            {
                "date": row["date"],
                "average_risk": round(
                    row["average_risk"] or 0,
                    4
                )
            }
            for row in risk_rows
        ]

        # =========================================
        # RETURN ANALYTICS
        # =========================================

        return {
            "total_transactions":
                total_transactions,

            "approved":
                decisions["APPROVE"],

            "review":
                decisions["REVIEW"],

            "blocked":
                decisions["BLOCK"],

            "unassessed":
                decisions["UNASSESSED"],

            "high_risk":
                risk_distribution["HIGH"],

            "average_risk":
                round(
                    average_risk or 0,
                    4
                ),

            "high_risk_rate":
                round(
                    high_risk_rate,
                    4
                ),

            "risk_distribution":
                risk_distribution,

            "decision_distribution": {
                "APPROVE":
                    decisions["APPROVE"],

                "REVIEW":
                    decisions["REVIEW"],

                "BLOCK":
                    decisions["BLOCK"]
            },

            "transaction_volume":
                transaction_volume,

            "risk_trend":
                risk_trend
        }

    finally:
        connection.close()