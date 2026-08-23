from app.database.database import get_connection


class FeatureService:

    def get_customer_velocity(
        self,
        customer_id: str,
        minutes: int
    ) -> int:

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM transactions
                WHERE customer_id = ?
                AND timestamp >= datetime('now', ?)
                """,
                (
                    customer_id,
                    f"-{minutes} minutes"
                )
            )

            return cursor.fetchone()[0]

        finally:

            connection.close()

    def get_customer_amount(
        self,
        customer_id: str,
        hours: int
    ) -> float:

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0)
                FROM transactions
                WHERE customer_id = ?
                AND timestamp >= datetime('now', ?)
                """,
                (
                    customer_id,
                    f"-{hours} hours"
                )
            )

            return float(
                cursor.fetchone()[0]
            )

        finally:

            connection.close()

    def get_device_velocity(
        self,
        device_id: str,
        minutes: int
    ) -> int:

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM transactions
                WHERE device_id = ?
                AND timestamp >= datetime('now', ?)
                """,
                (
                    device_id,
                    f"-{minutes} minutes"
                )
            )

            return cursor.fetchone()[0]

        finally:

            connection.close()

    def get_device_unique_customers(
        self,
        device_id: str,
        hours: int
    ) -> int:

        connection = get_connection()

        try:

            cursor = connection.cursor()

            cursor.execute(
                """
                SELECT COUNT(DISTINCT customer_id)
                FROM transactions
                WHERE device_id = ?
                AND timestamp >= datetime('now', ?)
                """,
                (
                    device_id,
                    f"-{hours} hours"
                )
            )

            return cursor.fetchone()[0]

        finally:

            connection.close()