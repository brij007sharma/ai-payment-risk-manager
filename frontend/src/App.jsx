import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import "./App.css";


const API_URL = "http://127.0.0.1:8000";


function App() {

  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [error, setError] = useState("");


  const fetchTransactions = async () => {

    try {

      setError("");

      const response = await fetch(
        `${API_URL}/transactions?limit=100`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      setTransactions(data.transactions || []);

    } catch (err) {

      setError(
        "Unable to connect to the risk engine."
      );

    } finally {

      setLoading(false);

    }
  };


  const investigateTransaction = async (
    transactionId
  ) => {

    try {

      setInvestigating(true);

      const response = await fetch(
        `${API_URL}/transaction/${transactionId}`
      );

      if (!response.ok) {
        throw new Error("Transaction not found");
      }

      const data = await response.json();

      setSelectedTransaction(data);

    } catch (err) {

      setError(
        "Unable to load transaction details."
      );

    } finally {

      setInvestigating(false);

    }
  };


  useEffect(() => {

    fetchTransactions();

    const interval = setInterval(
      fetchTransactions,
      10000
    );

    return () => clearInterval(interval);

  }, []);


  const statistics = useMemo(() => {

    const total = transactions.length;

    const approved = transactions.filter(
      (transaction) =>
        transaction.decision === "APPROVE"
    ).length;

    const review = transactions.filter(
      (transaction) =>
        transaction.decision === "REVIEW"
    ).length;

    const blocked = transactions.filter(
      (transaction) =>
        transaction.decision === "BLOCK"
    ).length;

    const scoredTransactions =
      transactions.filter(
        (transaction) =>
          transaction.risk_probability !== null
      );

    const averageRisk =
      scoredTransactions.length > 0
        ? scoredTransactions.reduce(
            (sum, transaction) =>
              sum + transaction.risk_probability,
            0
          ) / scoredTransactions.length
        : 0;

    return {
      total,
      approved,
      review,
      blocked,
      averageRisk,
    };

  }, [transactions]);


  const chartData = [
    {
      name: "Approved",
      value: statistics.approved,
    },
    {
      name: "Review",
      value: statistics.review,
    },
    {
      name: "Blocked",
      value: statistics.blocked,
    },
  ];


  return (

    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="header">

        <div>

          <h1>AI Payment Risk Manager</h1>

          <p>
            Real-time payment fraud monitoring
          </p>

        </div>

        <div className="status">

          <span className="status-dot"></span>

          Risk Engine Online

        </div>

      </header>


      {/* ================= ERROR ================= */}

      {error && (

        <div className="error">

          {error}

          <button onClick={fetchTransactions}>
            Retry
          </button>

        </div>

      )}


      {/* ================= STATS ================= */}

      <section className="stats-grid">

        <div className="stat-card">

          <span className="stat-label">
            Total Transactions
          </span>

          <strong>
            {statistics.total}
          </strong>

        </div>


        <div className="stat-card approved">

          <span className="stat-label">
            Approved
          </span>

          <strong>
            {statistics.approved}
          </strong>

        </div>


        <div className="stat-card review">

          <span className="stat-label">
            Under Review
          </span>

          <strong>
            {statistics.review}
          </strong>

        </div>


        <div className="stat-card blocked">

          <span className="stat-label">
            Blocked
          </span>

          <strong>
            {statistics.blocked}
          </strong>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Average Risk
          </span>

          <strong>
            {(statistics.averageRisk * 100).toFixed(1)}%
          </strong>

        </div>

      </section>


      {/* ================= MAIN ================= */}

      <main className="main-grid">


        {/* ================= TRANSACTION TABLE ================= */}

        <section className="panel transactions-panel">

          <div className="panel-header">

            <div>

              <h2>Recent Transactions</h2>

              <p>
                Live payment-risk activity
              </p>

            </div>

            <button
              className="refresh-button"
              onClick={fetchTransactions}
            >
              Refresh
            </button>

          </div>


          {loading ? (

            <div className="loading">
              Loading transactions...
            </div>

          ) : transactions.length === 0 ? (

            <div className="empty">
              No transactions found.
            </div>

          ) : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>Transaction</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Risk</th>
                    <th>Decision</th>
                    <th></th>

                  </tr>

                </thead>


                <tbody>

                  {transactions.map(
                    (transaction) => (

                      <tr
                        key={
                          transaction.transaction_id
                        }
                      >

                        <td className="transaction-id">

                          {transaction.transaction_id}

                        </td>


                        <td>
                          {transaction.customer_id}
                        </td>


                        <td>
                          ₹
                          {Number(
                            transaction.amount
                          ).toLocaleString("en-IN")}
                        </td>


                        <td>

                          {transaction.risk_probability !==
                          null
                            ? `${(
                                transaction.risk_probability *
                                100
                              ).toFixed(1)}%`
                            : "—"}

                        </td>


                        <td>

                          <span
                            className={`badge ${
                              transaction.decision
                                ?.toLowerCase() ||
                              "unknown"
                            }`}
                          >

                            {transaction.decision ||
                              "N/A"}

                          </span>

                        </td>


                        <td>

                          <button
                            className="investigate-button"
                            onClick={() =>
                              investigateTransaction(
                                transaction.transaction_id
                              )
                            }
                          >
                            Investigate
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ================= CHART ================= */}

        <section className="panel chart-panel">

          <div className="panel-header">

            <div>

              <h2>Risk Distribution</h2>

              <p>
                Current transaction decisions
              </p>

            </div>

          </div>


          <div className="chart">

            <ResponsiveContainer
              width="100%"
              height={260}
            >

              <PieChart>

                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={4}
                >
                  <Cell fill="#12b76a" />
                  <Cell fill="#f79009" />
                  <Cell fill="#f04438" />
                </Pie>

                <Tooltip />

              </PieChart>

            </ResponsiveContainer>

          </div>


          <div className="legend">

            <div>
              <span className="legend-dot approved-dot"></span>
              Approved
            </div>

            <div>
              <span className="legend-dot review-dot"></span>
              Review
            </div>

            <div>
              <span className="legend-dot blocked-dot"></span>
              Blocked
            </div>

          </div>

        </section>

      </main>


      {/* ================= INVESTIGATION ================= */}

      {selectedTransaction && (

        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedTransaction(null)
          }
        >

          <div
            className="investigation"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="investigation-header">

              <div>

                <span className="eyebrow">
                  Transaction Investigation
                </span>

                <h2>
                  {selectedTransaction.transaction_id}
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setSelectedTransaction(null)
                }
              >
                ×
              </button>

            </div>


            <div className="investigation-decision">

              <div className="risk-score-section">

                <span>
                  Final Risk Score
                </span>

                <strong>
                  {selectedTransaction.risk_probability !== null
                    ? `${(
                        selectedTransaction.risk_probability * 100
                      ).toFixed(2)}%`
                    : "N/A"}
                </strong>

                <div className="risk-bar">

                  <div
                    className={`risk-bar-fill ${
                      selectedTransaction.risk_level
                        ?.toLowerCase()
                    }`}
                    style={{
                      width: `${
                        Math.min(
                          (selectedTransaction.risk_probability || 0) *
                          100,
                          100
                        )
                      }%`
                    }}
                  />

                </div>

              </div>


              <span
                className={`badge large ${
                  selectedTransaction.decision?.toLowerCase()
                }`}
              >
                {selectedTransaction.decision}
              </span>

            </div>


            <div className="details-grid">

              <div className="detail">

                <span>Customer</span>

                <strong>
                  {selectedTransaction.customer_id}
                </strong>

              </div>


              <div className="detail">

                <span>Device</span>

                <strong>
                  {selectedTransaction.device_id}
                </strong>

              </div>


              <div className="detail">

                <span>Amount</span>

                <strong>
                  ₹
                  {Number(
                    selectedTransaction.amount
                  ).toLocaleString("en-IN")}
                </strong>

              </div>


              <div className="detail">

                <span>ML Probability</span>

                <strong>

                  {selectedTransaction.ml_probability !==
                  null
                    ? `${(
                        selectedTransaction.ml_probability *
                        100
                      ).toFixed(2)}%`
                    : "N/A"}

                </strong>

              </div>


              <div className="detail">

                <span>Velocity Risk</span>

                <strong>

                  {selectedTransaction.velocity_risk !==
                  null
                    ? `${(
                        selectedTransaction.velocity_risk *
                        100
                      ).toFixed(2)}%`
                    : "N/A"}

                </strong>

              </div>


              <div className="detail">

                <span>Risk Level</span>

                <strong>
                  {selectedTransaction.risk_level ||
                    "N/A"}
                </strong>

              </div>

            </div>


            <div className="risk-signals">

                  <h3>
                    Real-Time Risk Signals
                  </h3>

                  <div className="signal-grid">

                    <div className="signal-card">

                      <span>
                        Customer / 5 min
                      </span>

                      <strong>
                        {
                          selectedTransaction
                            .transactions_last_5min
                        }
                      </strong>

                      <small>
                        transactions
                      </small>

                    </div>


                    <div className="signal-card">

                      <span>
                        Customer / 1 hour
                      </span>

                      <strong>
                        {
                          selectedTransaction
                            .transactions_last_1h
                        }
                      </strong>

                      <small>
                        transactions
                      </small>

                    </div>


                    <div className="signal-card">

                      <span>
                        Spending / 1 hour
                      </span>

                      <strong>
                        ₹
                        {Number(
                          selectedTransaction
                            .amount_last_1h || 0
                        ).toLocaleString("en-IN")}
                      </strong>

                      <small>
                        recent spending
                      </small>

                    </div>


                    <div className="signal-card">

                      <span>
                        Device / 5 min
                      </span>

                      <strong>
                        {
                          selectedTransaction
                            .device_transactions_last_5min
                        }
                      </strong>

                      <small>
                        transactions
                      </small>

                    </div>


                    <div className="signal-card">

                      <span>
                        Device / 1 hour
                      </span>

                      <strong>
                        {
                          selectedTransaction
                            .device_transactions_last_1h
                        }
                      </strong>

                      <small>
                        transactions
                      </small>

                    </div>


                    <div className="signal-card">

                      <span>
                        Device Customers
                      </span>

                      <strong>
                        {
                          selectedTransaction
                            .unique_customers_last_1h
                        }
                      </strong>

                      <small>
                        unique customers / hour
                      </small>

                    </div>

                  </div>

                </div>


            <div className="reasons">

              <h3>
                Risk Reasons
              </h3>


              {selectedTransaction.risk_reasons?.length >
              0 ? (

                <ul>

                  {selectedTransaction.risk_reasons.map(
                    (reason, index) => (

                      <li key={index}>
                        {reason}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p className="no-reasons">
                  No additional risk factors detected.
                </p>

              )}

            </div>

          </div>

        </div>

      )}


      {investigating && (

        <div className="loading-overlay">

          Loading investigation...

        </div>

      )}

    </div>
  );
}


export default App;