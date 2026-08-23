import sqlite3
from pathlib import Path


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