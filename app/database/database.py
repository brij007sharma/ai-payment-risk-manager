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

        # -----------------------------------------
        # Transaction history
        # -----------------------------------------

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

        # -----------------------------------------
        # Risk assessment history
        # -----------------------------------------

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

                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY(transaction_id)
                REFERENCES transactions(transaction_id)

            )
        """)

        # -----------------------------------------
        # Indexes
        # -----------------------------------------

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
    risk_reasons: list
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
                risk_reasons
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            transaction_id,
            ml_probability,
            velocity_risk,
            risk_probability,
            risk_level,
            decision,
            json.dumps(risk_reasons)
        ))

        connection.commit()

    finally:

        connection.close()


def get_transaction(
    transaction_id: str
):

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


def get_all_transactions(
    limit: int = 50
):

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