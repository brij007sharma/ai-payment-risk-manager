import { useEffect, useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";


const API_URL = "http://127.0.0.1:8000";


function App() {

  const [transactions, setTransactions] = useState([]);

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [investigating, setInvestigating] =
    useState(false);

  const [error, setError] = useState("");

  const [aiInvestigation, setAiInvestigation] =
  useState(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiError, setAiError] =
    useState("");

  // =========================================
  // FILTERS
  // =========================================

  const [search, setSearch] = useState("");

  const [decisionFilter, setDecisionFilter] =
    useState("ALL");

  const [riskFilter, setRiskFilter] =
    useState("ALL");

  const [sortBy, setSortBy] =
    useState("latest");


    useEffect(() => {
  // Clear previous AI investigation
  // whenever a different transaction is opened.
  setAiInvestigation(null);
  setAiError("");
  setAiLoading(false);
}, [selectedTransaction]);

  // =========================================
  // FETCH TRANSACTIONS
  // =========================================

  const runAIInvestigation = async (
  transactionId
) => {

  try {

    setAiLoading(true);

    setAiError("");

    setAiInvestigation(null);

    const response = await fetch(
      `${API_URL}/investigate/${transactionId}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {

      throw new Error(
        "AI investigation failed"
      );

    }

    const data =
      await response.json();

    setAiInvestigation(
      data.investigation
    );

  } catch (error) {

    setAiError(
      "Unable to generate AI investigation."
    );

  } finally {

    setAiLoading(false);

  }
};

  const fetchTransactions = async () => {

    try {

      setError("");

      const response = await fetch(
        `${API_URL}/transactions?limit=100`
      );

      if (!response.ok) {

        throw new Error(
          "Failed to fetch transactions"
        );

      }

      const data = await response.json();

      setTransactions(
        data.transactions || []
      );

    } catch (err) {

      setError(
        "Unable to connect to the risk engine."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================
  // INVESTIGATE TRANSACTION
  // =========================================

  const investigateTransaction = async (
    transactionId
  ) => {

    try {

      setInvestigating(true);

      const response = await fetch(
        `${API_URL}/transaction/${transactionId}`
      );

      if (!response.ok) {

        throw new Error(
          "Transaction not found"
        );

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


  // =========================================
  // AUTO REFRESH
  // =========================================

  useEffect(() => {

    fetchTransactions();

    const interval = setInterval(
      fetchTransactions,
      10000
    );

    return () => clearInterval(interval);

  }, []);


  // =========================================
  // STATISTICS
  // =========================================

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

    const highRisk = transactions.filter(
      (transaction) =>
        transaction.risk_level === "HIGH"
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
              sum +
              transaction.risk_probability,
            0
          ) /
          scoredTransactions.length
        : 0;

    const reviewRate =
      total > 0
        ? review / total
        : 0;

    return {
      total,
      approved,
      review,
      blocked,
      highRisk,
      averageRisk,
      reviewRate,
    };

  }, [transactions]);


  // =========================================
  // FILTER + SORT
  // =========================================

  const filteredTransactions = useMemo(() => {

    let result = [...transactions];

    // Search
    if (search.trim()) {

      const query =
        search.toLowerCase().trim();

      result = result.filter(
        (transaction) =>
          transaction.transaction_id
            ?.toLowerCase()
            .includes(query) ||

          transaction.customer_id
            ?.toLowerCase()
            .includes(query) ||

          transaction.device_id
            ?.toLowerCase()
            .includes(query)
      );

    }


    // Decision filter
    if (decisionFilter !== "ALL") {

      result = result.filter(
        (transaction) =>
          transaction.decision ===
          decisionFilter
      );

    }


    // Risk filter
    if (riskFilter !== "ALL") {

      result = result.filter(
        (transaction) =>
          transaction.risk_level ===
          riskFilter
      );

    }


    // Sorting
    if (sortBy === "risk-high") {

      result.sort(
        (a, b) =>
          (b.risk_probability || 0) -
          (a.risk_probability || 0)
      );

    } else if (sortBy === "risk-low") {

      result.sort(
        (a, b) =>
          (a.risk_probability || 0) -
          (b.risk_probability || 0)
      );

    } else if (sortBy === "amount-high") {

      result.sort(
        (a, b) =>
          Number(b.amount || 0) -
          Number(a.amount || 0)
      );

    } else {

      result.sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

    }

    return result;

  }, [
    transactions,
    search,
    decisionFilter,
    riskFilter,
    sortBy,
  ]);


  // =========================================
  // PIE CHART DATA
  // =========================================

  const decisionChartData = [

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


  // =========================================
  // RISK LEVEL DATA
  // =========================================

  const riskChartData = [

    {
      name: "Low",
      value: transactions.filter(
        (transaction) =>
          transaction.risk_level === "LOW"
      ).length,
    },

    {
      name: "Medium",
      value: transactions.filter(
        (transaction) =>
          transaction.risk_level === "MEDIUM"
      ).length,
    },

    {
      name: "High",
      value: statistics.highRisk,
    },

  ];


  // =========================================
  // HIGH-RISK TRANSACTIONS
  // =========================================

  const highRiskTransactions = useMemo(() => {

    return [...transactions]

      .filter(
        (transaction) =>
          transaction.risk_probability !== null
      )

      .sort(
        (a, b) =>
          (b.risk_probability || 0) -
          (a.risk_probability || 0)
      )

      .slice(0, 5);

  }, [transactions]);


  // =========================================
  // RENDER
  // =========================================

  return (

    <div className="app">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="header">

        <div>

          <h1>
            AI Payment Risk Manager
          </h1>

          <p>
            Real-time payment fraud monitoring
          </p>

        </div>

        <div className="status">

          <span className="status-dot"></span>

          Risk Engine Online

        </div>

      </header>


      {/* =====================================
          ERROR
      ===================================== */}

      {error && (

        <div className="error">

          <span>
            {error}
          </span>

          <button
            onClick={fetchTransactions}
          >
            Retry
          </button>

        </div>

      )}


      {/* =====================================
          KPI CARDS
      ===================================== */}

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


        <div className="stat-card high-risk">

          <span className="stat-label">
            High Risk
          </span>

          <strong>
            {statistics.highRisk}
          </strong>

        </div>


        <div className="stat-card">

          <span className="stat-label">
            Average Risk
          </span>

          <strong>
            {(statistics.averageRisk * 100)
              .toFixed(1)}
            %
          </strong>

        </div>

      </section>


      {/* =====================================
          ANALYTICS
      ===================================== */}

      <section className="analytics-grid">

        {/* DECISION DISTRIBUTION */}

        <div className="panel analytics-panel">

          <div className="panel-header">

            <div>

              <h2>
                Decision Distribution
              </h2>

              <p>
                Payment decision breakdown
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
                  data={decisionChartData}
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

        </div>


        {/* RISK LEVEL */}

        <div className="panel analytics-panel">

          <div className="panel-header">

            <div>

              <h2>
                Risk Levels
              </h2>

              <p>
                Risk score classification
              </p>

            </div>

          </div>


          <div className="bar-chart">

            <ResponsiveContainer
              width="100%"
              height={290}
            >

              <BarChart
                data={riskChartData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  fill="#475467"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* HIGH RISK */}

        <div className="panel high-risk-panel">

          <div className="panel-header">

            <div>

              <h2>
                Highest Risk Transactions
              </h2>

              <p>
                Transactions requiring attention
              </p>

            </div>

          </div>


          <div className="high-risk-list">

            {highRiskTransactions.length === 0 ? (

              <div className="empty-small">

                No scored transactions.

              </div>

            ) : (

              highRiskTransactions.map(
                (transaction) => (

                  <div
                    className="high-risk-item"
                    key={
                      transaction.transaction_id
                    }
                  >

                    <div>

                      <strong>
                        {
                          transaction.transaction_id
                        }
                      </strong>

                      <span>
                        {
                          transaction.customer_id
                        }
                      </span>

                    </div>


                    <div className="high-risk-score">

                      <strong>
                        {(
                          transaction.risk_probability *
                          100
                        ).toFixed(1)}
                        %
                      </strong>

                      <span
                        className={`badge ${
                          transaction.decision
                            ?.toLowerCase()
                        }`}
                      >
                        {
                          transaction.decision ||
                          "N/A"
                        }
                      </span>

                    </div>


                    <button
                      className="investigate-button"
                      onClick={() =>
                        investigateTransaction(
                          transaction.transaction_id
                        )
                      }
                    >
                      View
                    </button>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </section>


      {/* =====================================
          TRANSACTION OPERATIONS
      ===================================== */}

      <section className="panel transactions-panel">

        <div className="panel-header">

          <div>

            <h2>
              Transaction Monitoring
            </h2>

            <p>
              Search, filter and investigate payment activity
            </p>

          </div>


          <button
            className="refresh-button"
            onClick={fetchTransactions}
          >
            Refresh
          </button>

        </div>


        {/* FILTER BAR */}

        <div className="filter-bar">

          <input
            type="text"
            placeholder="Search transaction, customer or device..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />


          <select
            value={decisionFilter}
            onChange={(event) =>
              setDecisionFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All decisions
            </option>

            <option value="APPROVE">
              Approved
            </option>

            <option value="REVIEW">
              Review
            </option>

            <option value="BLOCK">
              Blocked
            </option>

          </select>


          <select
            value={riskFilter}
            onChange={(event) =>
              setRiskFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All risk levels
            </option>

            <option value="LOW">
              Low risk
            </option>

            <option value="MEDIUM">
              Medium risk
            </option>

            <option value="HIGH">
              High risk
            </option>

          </select>


          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(
                event.target.value
              )
            }
          >

            <option value="latest">
              Latest
            </option>

            <option value="risk-high">
              Highest risk
            </option>

            <option value="risk-low">
              Lowest risk
            </option>

            <option value="amount-high">
              Highest amount
            </option>

          </select>

        </div>


        <div className="results-count">

          Showing{" "}
          <strong>
            {filteredTransactions.length}
          </strong>{" "}
          of{" "}
          <strong>
            {transactions.length}
          </strong>{" "}
          transactions

        </div>


        {/* TABLE */}

        {loading ? (

          <div className="loading">
            Loading transactions...
          </div>

        ) : filteredTransactions.length === 0 ? (

          <div className="empty">
            No transactions match the current filters.
          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Transaction
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Device
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Level
                  </th>

                  <th>
                    Decision
                  </th>

                  <th></th>

                </tr>

              </thead>


              <tbody>

                {filteredTransactions.map(
                  (transaction) => (

                    <tr
                      key={
                        transaction.transaction_id
                      }
                    >

                      <td className="transaction-id">

                        {
                          transaction.transaction_id
                        }

                      </td>


                      <td>
                        {
                          transaction.customer_id
                        }
                      </td>


                      <td>
                        {
                          transaction.device_id
                        }
                      </td>


                      <td>

                        ₹
                        {Number(
                          transaction.amount
                        ).toLocaleString(
                          "en-IN"
                        )}

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

                        {transaction.risk_level ? (

                          <span
                            className={`risk-level ${
                              transaction.risk_level.toLowerCase()
                            }`}
                          >
                            {
                              transaction.risk_level
                            }
                          </span>

                        ) : (
                          "—"
                        )}

                      </td>


                      <td>

                        <span
                          className={`badge ${
                            transaction.decision
                              ?.toLowerCase() ||
                            "unknown"
                          }`}
                        >

                          {
                            transaction.decision ||
                            "N/A"
                          }

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


      {/* =====================================
          INVESTIGATION MODAL
      ===================================== */}

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
                  {
                    selectedTransaction.transaction_id
                  }
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


            {/* RISK SCORE */}

            <div className="investigation-decision">

              <div className="risk-score-section">

                <span>
                  Final Risk Score
                </span>

                <strong>

                  {
                    selectedTransaction.risk_probability !==
                    null

                      ? `${(
                          selectedTransaction.risk_probability *
                          100
                        ).toFixed(2)}%`

                      : "N/A"
                  }

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
                          (
                            selectedTransaction
                              .risk_probability ||
                            0
                          ) * 100,
                          100
                        )
                      }%`,
                    }}
                  />

                </div>

              </div>


              <span
                className={`badge large ${
                  selectedTransaction.decision
                    ?.toLowerCase()
                }`}
              >

                {
                  selectedTransaction.decision
                }

              </span>

            </div>


            {/* DETAILS */}

            <div className="details-grid">

              <div className="detail">

                <span>
                  Customer
                </span>

                <strong>
                  {
                    selectedTransaction.customer_id
                  }
                </strong>

              </div>


              <div className="detail">

                <span>
                  Device
                </span>

                <strong>
                  {
                    selectedTransaction.device_id
                  }
                </strong>

              </div>


              <div className="detail">

                <span>
                  Amount
                </span>

                <strong>

                  ₹
                  {Number(
                    selectedTransaction.amount
                  ).toLocaleString(
                    "en-IN"
                  )}

                </strong>

              </div>


              <div className="detail">

                <span>
                  ML Probability
                </span>

                <strong>

                  {
                    selectedTransaction.ml_probability !==
                    null

                      ? `${(
                          selectedTransaction.ml_probability *
                          100
                        ).toFixed(2)}%`

                      : "N/A"
                  }

                </strong>

              </div>


              <div className="detail">

                <span>
                  Velocity Risk
                </span>

                <strong>

                  {
                    selectedTransaction.velocity_risk !==
                    null

                      ? `${(
                          selectedTransaction.velocity_risk *
                          100
                        ).toFixed(2)}%`

                      : "N/A"
                  }

                </strong>

              </div>


              <div className="detail">

                <span>
                  Risk Level
                </span>

                <strong>

                  {
                    selectedTransaction.risk_level ||
                    "N/A"
                  }

                </strong>

              </div>

            </div>


            {/* REAL-TIME SIGNALS */}

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
                        .amount_last_1h ||
                      0
                    ).toLocaleString(
                      "en-IN"
                    )}

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


            {/* REASONS */}

            <div className="reasons">

              <h3>
                Risk Reasons
              </h3>


              {
                selectedTransaction.risk_reasons
                  ?.length > 0

                  ? (

                    <ul>

                      {
                        selectedTransaction.risk_reasons.map(
                          (reason, index) => (

                            <li key={index}>
                              {reason}
                            </li>

                          )
                        )
                      }

                    </ul>

                  )

                  : (

                    <p className="no-reasons">
                      No additional risk factors detected.
                    </p>

                  )
              }

            </div>

            <div className="ai-investigator">

              <div className="ai-investigator-header">

                <div>

                  <span className="eyebrow">
                    AI Investigator
                  </span>

                  <h3>
                    Analyst Investigation
                  </h3>

                  <p>
                    AI-generated explanation based on
                    verified risk evidence.
                  </p>

                </div>

                <button
                  className="ai-button"
                  onClick={() =>
                    runAIInvestigation(
                      selectedTransaction.transaction_id
                    )
                  }
                  disabled={aiLoading}
                >

                  {aiLoading
                    ? "Investigating..."
                    : "Run AI Investigation"}

                </button>

              </div>


              {aiError && (

                <div className="ai-error">
                  {aiError}
                </div>

              )}


              {aiInvestigation && (

                <div className="ai-result">

                  <div className="ai-summary">

                    <span>
                      Investigation Summary
                    </span>

                    <p>
                      {
                        aiInvestigation.summary
                      }
                    </p>

                  </div>


                  <div className="ai-primary-risk">

                    <span>
                      Primary Risk
                    </span>

                    <strong>
                      {
                        aiInvestigation.primary_risk
                      }
                    </strong>

                  </div>


                  <div className="ai-columns">

                    <div>

                      <h4>
                        Risk Factors
                      </h4>

                      <ul>

                        {
                          aiInvestigation.risk_factors
                            ?.map(
                              (factor, index) => (

                                <li key={index}>
                                  {factor}
                                </li>

                              )
                            )
                        }

                      </ul>

                    </div>


                    <div>

                      <h4>
                        Evidence
                      </h4>

                      <ul>

                        {
                          aiInvestigation.evidence
                            ?.map(
                              (item, index) => (

                                <li key={index}>
                                  {item}
                                </li>

                              )
                            )
                        }

                      </ul>

                    </div>

                  </div>


                  <div className="ai-footer">

                    <div>

                      <span>
                        Confidence
                      </span>

                      <strong>
                        {
                          aiInvestigation.confidence
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Recommended Action
                      </span>

                      <strong>
                        {
                          aiInvestigation
                            .recommended_action
                        }
                      </strong>

                    </div>

                  </div>


                  <div className="analyst-note">

                    <strong>
                      Analyst Note
                    </strong>

                    <p>
                      {
                        aiInvestigation.analyst_note
                      }
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          INVESTIGATION LOADING
      ===================================== */}

      {investigating && (

        <div className="loading-overlay">

          Loading investigation...

        </div>

      )}

    </div>

  );

}


export default App;