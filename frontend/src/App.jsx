import { useEffect, useMemo, useState } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

import "./App.css";


const API_URL = "http://127.0.0.1:8000";


function App() {

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // TRANSACTION FORM
  // =====================================================

  const [form, setForm] = useState({
    transaction_id: "",
    customer_id: "",
    device_id: "",

    amount: "",
    customer_age: 25,
    account_age_days: 100,

    transactions_last_24h: 2,
    avg_transaction_amount: 2000,

    merchant_risk_score: 0.1,
    device_risk_score: 0.1,
    ip_risk_score: 0.1,

    is_international: false,
    is_new_device: false,
    is_new_location: false,

    hour: new Date().getHours()
  });


  const [submitting, setSubmitting] =
    useState(false);

  const [submitMessage, setSubmitMessage] =
    useState("");


  // =====================================================
  // TRANSACTION MODAL
  // =====================================================

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);


  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [riskFilter, setRiskFilter] =
    useState("ALL");

  const [decisionFilter, setDecisionFilter] =
    useState("ALL");

  const [sortOrder, setSortOrder] =
    useState("latest");


  // =====================================================
  // AI INVESTIGATOR
  // =====================================================

  const [aiInvestigation, setAiInvestigation] =
    useState(null);

  const [aiLoading, setAiLoading] =
    useState(false);

  const [aiError, setAiError] =
    useState("");


  // =====================================================
  // ANALYTICS
  // =====================================================

  const [analytics, setAnalytics] =
    useState(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(true);

  const [analyticsError, setAnalyticsError] =
    useState("");


  // =====================================================
  // FETCH TRANSACTIONS
  // =====================================================

  const fetchTransactions = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(
        `${API_URL}/transactions?limit=100`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch transactions"
        );
      }

      const data =
        await response.json();

      setTransactions(
        Array.isArray(data)
          ? data
          : data.transactions || []
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load transactions."
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // FETCH ANALYTICS
  // =====================================================

  const fetchAnalytics = async () => {

    try {

      setAnalyticsLoading(true);

      setAnalyticsError("");

      const response = await fetch(
        `${API_URL}/analytics`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch analytics"
        );
      }

      const data =
        await response.json();

      setAnalytics(data);

    } catch (err) {

      console.error(err);

      setAnalyticsError(
        "Unable to load analytics."
      );

    } finally {

      setAnalyticsLoading(false);

    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchTransactions();

    fetchAnalytics();

  }, []);


  // =====================================================
  // CLEAR AI WHEN TRANSACTION CHANGES
  // =====================================================

  useEffect(() => {

    setAiInvestigation(null);

    setAiError("");

    setAiLoading(false);

  }, [selectedTransaction]);


  // =====================================================
  // FORM HANDLER
  // =====================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value
    }));
  };


  // =====================================================
  // SUBMIT TRANSACTION
  // =====================================================

  const submitTransaction = async (event) => {

    event.preventDefault();

    setSubmitting(true);

    setSubmitMessage("");

    try {

      const payload = {
        ...form,

        amount:
          Number(form.amount),

        customer_age:
          Number(form.customer_age),

        account_age_days:
          Number(form.account_age_days),

        transactions_last_24h:
          Number(form.transactions_last_24h),

        avg_transaction_amount:
          Number(form.avg_transaction_amount),

        merchant_risk_score:
          Number(form.merchant_risk_score),

        device_risk_score:
          Number(form.device_risk_score),

        ip_risk_score:
          Number(form.ip_risk_score),

        hour:
          Number(form.hour)
      };


      const response = await fetch(
        `${API_URL}/transaction`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(payload)
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Transaction failed"
        );

      }


      setSubmitMessage(
        `Transaction ${data.transaction_id} assessed successfully.`
      );


      // Refresh both datasets
      await fetchTransactions();

      await fetchAnalytics();


      // Reset only transaction-specific fields
      setForm((previous) => ({
        ...previous,

        transaction_id: "",
        amount: ""
      }));


    } catch (err) {

      console.error(err);

      setSubmitMessage(
        err.message ||
        "Unable to process transaction."
      );

    } finally {

      setSubmitting(false);

    }
  };


  // =====================================================
  // OPEN TRANSACTION
  // =====================================================

  const openTransaction = async (transaction) => {

    // Clear previous AI result immediately
    setAiInvestigation(null);

    setAiError("");

    setAiLoading(false);


    try {

      const response = await fetch(
        `${API_URL}/transaction/${transaction.transaction_id}`
      );


      if (response.ok) {

        const detailed =
          await response.json();

        setSelectedTransaction(
          detailed
        );

        return;
      }

    } catch (err) {

      console.error(err);

    }


    // Fallback to table data
    setSelectedTransaction(
      transaction
    );
  };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {

    setSelectedTransaction(null);

    setAiInvestigation(null);

    setAiError("");

    setAiLoading(false);
  };


  // =====================================================
  // AI INVESTIGATION
  // =====================================================

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
          method: "POST"
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "AI investigation failed"
        );

      }


      setAiInvestigation(
        data.investigation
      );


    } catch (err) {

      console.error(err);

      setAiError(
        err.message ||
        "Unable to generate AI investigation."
      );

    } finally {

      setAiLoading(false);

    }
  };


  // =====================================================
  // FILTERED TRANSACTIONS
  // =====================================================

  const filteredTransactions = useMemo(() => {

    let result = [
      ...transactions
    ];


    // Search
    if (search.trim()) {

      const query =
        search
          .toLowerCase()
          .trim();

      result =
        result.filter(
          (transaction) =>
            String(
              transaction.transaction_id || ""
            )
              .toLowerCase()
              .includes(query)

            ||

            String(
              transaction.customer_id || ""
            )
              .toLowerCase()
              .includes(query)

            ||

            String(
              transaction.device_id || ""
            )
              .toLowerCase()
              .includes(query)
        );
    }


    // Risk filter
    if (riskFilter !== "ALL") {

      result =
        result.filter(
          (transaction) =>
            transaction.risk_level ===
            riskFilter
        );
    }


    // Decision filter
    if (decisionFilter !== "ALL") {

      result =
        result.filter(
          (transaction) =>
            transaction.decision ===
            decisionFilter
        );
    }


    // Sort
    if (sortOrder === "highest") {

      result.sort(
        (a, b) =>
          (b.risk_probability || 0) -
          (a.risk_probability || 0)
      );

    } else if (sortOrder === "lowest") {

      result.sort(
        (a, b) =>
          (a.risk_probability || 0) -
          (b.risk_probability || 0)
      );

    } else {

      result.sort(
        (a, b) =>
          new Date(
            b.timestamp || 0
          ) -
          new Date(
            a.timestamp || 0
          )
      );
    }


    return result;

  }, [
    transactions,
    search,
    riskFilter,
    decisionFilter,
    sortOrder
  ]);


  // =====================================================
  // CHART DATA
  // =====================================================

  const riskChartData = analytics
  ? [
      {
        name: "Low",
        value: analytics.risk_distribution?.LOW || 0,
        color: "#12B76A"
      },
      {
        name: "Medium",
        value: analytics.risk_distribution?.MEDIUM || 0,
        color: "#F79009"
      },
      {
        name: "High",
        value: analytics.risk_distribution?.HIGH || 0,
        color: "#F04438"
      }
    ]
  : [];


  const decisionChartData = analytics
  ? [
      {
        name: "Approve",
        value:
          analytics.decision_distribution?.APPROVE || 0,
        color: "#12B76A"
      },
      {
        name: "Review",
        value:
          analytics.decision_distribution?.REVIEW || 0,
        color: "#F79009"
      },
      {
        name: "Block",
        value:
          analytics.decision_distribution?.BLOCK || 0,
        color: "#F04438"
      }
    ]
  : [];


  // =====================================================
  // FORMAT RISK
  // =====================================================

  const formatRisk = (value) => {

    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    return `${(
      Number(value) * 100
    ).toFixed(1)}%`;
  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (Number.isNaN(
      date.getTime()
    )) {
      return value;
    }

    return date.toLocaleString();
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div>

          <h1>
            AI Payment Risk Manager
          </h1>

          <p>
            AI-powered payment fraud detection
            and risk monitoring
          </p>

        </div>


        <div className="status-badge">

          <span className="status-dot"></span>

          System Online

        </div>

      </header>


      <main className="main-container">


        {/* =================================================
            SUBMIT TRANSACTION
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <span className="eyebrow">
                Payment Risk
              </span>

              <h2>
                Assess Transaction
              </h2>

              <p>
                Submit a payment for real-time
                fraud risk assessment.
              </p>

            </div>

          </div>


          <form
            className="transaction-form"
            onSubmit={submitTransaction}
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Transaction ID
                </label>

                <input
                  name="transaction_id"
                  value={
                    form.transaction_id
                  }
                  onChange={handleChange}
                  required
                  placeholder="TXN_001"
                />

              </div>


              <div className="form-group">

                <label>
                  Customer ID
                </label>

                <input
                  name="customer_id"
                  value={
                    form.customer_id
                  }
                  onChange={handleChange}
                  required
                  placeholder="CUST001"
                />

              </div>


              <div className="form-group">

                <label>
                  Device ID
                </label>

                <input
                  name="device_id"
                  value={
                    form.device_id
                  }
                  onChange={handleChange}
                  required
                  placeholder="DEVICE001"
                />

              </div>


              <div className="form-group">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  value={
                    form.amount
                  }
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="2500"
                />

              </div>


              <div className="form-group">

                <label>
                  Customer Age
                </label>

                <input
                  type="number"
                  name="customer_age"
                  value={
                    form.customer_age
                  }
                  onChange={handleChange}
                  min="18"
                  max="100"
                />

              </div>


              <div className="form-group">

                <label>
                  Account Age (days)
                </label>

                <input
                  type="number"
                  name="account_age_days"
                  value={
                    form.account_age_days
                  }
                  onChange={handleChange}
                  min="0"
                />

              </div>


              <div className="form-group">

                <label>
                  Transactions / 24h
                </label>

                <input
                  type="number"
                  name="transactions_last_24h"
                  value={
                    form.transactions_last_24h
                  }
                  onChange={handleChange}
                  min="0"
                />

              </div>


              <div className="form-group">

                <label>
                  Average Transaction
                </label>

                <input
                  type="number"
                  name="avg_transaction_amount"
                  value={
                    form.avg_transaction_amount
                  }
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />

              </div>


              <div className="form-group">

                <label>
                  Merchant Risk
                </label>

                <input
                  type="number"
                  name="merchant_risk_score"
                  value={
                    form.merchant_risk_score
                  }
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                />

              </div>


              <div className="form-group">

                <label>
                  Device Risk
                </label>

                <input
                  type="number"
                  name="device_risk_score"
                  value={
                    form.device_risk_score
                  }
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                />

              </div>


              <div className="form-group">

                <label>
                  IP Risk
                </label>

                <input
                  type="number"
                  name="ip_risk_score"
                  value={
                    form.ip_risk_score
                  }
                  onChange={handleChange}
                  min="0"
                  max="1"
                  step="0.01"
                />

              </div>


              <div className="form-group">

                <label>
                  Hour
                </label>

                <input
                  type="number"
                  name="hour"
                  value={
                    form.hour
                  }
                  onChange={handleChange}
                  min="0"
                  max="23"
                />

              </div>

            </div>


            <div className="checkbox-row">

              <label className="checkbox-label">

                <input
                  type="checkbox"
                  name="is_international"
                  checked={
                    form.is_international
                  }
                  onChange={handleChange}
                />

                International

              </label>


              <label className="checkbox-label">

                <input
                  type="checkbox"
                  name="is_new_device"
                  checked={
                    form.is_new_device
                  }
                  onChange={handleChange}
                />

                New Device

              </label>


              <label className="checkbox-label">

                <input
                  type="checkbox"
                  name="is_new_location"
                  checked={
                    form.is_new_location
                  }
                  onChange={handleChange}
                />

                New Location

              </label>

            </div>


            <div className="form-actions">

              <button
                className="primary-button"
                type="submit"
                disabled={submitting}
              >

                {submitting
                  ? "Assessing..."
                  : "Assess Transaction"}

              </button>


              {submitMessage && (

                <span className="submit-message">
                  {submitMessage}
                </span>

              )}

            </div>

          </form>

        </section>


        {/* =================================================
            ANALYTICS
        ================================================= */}

        <section className="analytics-section">

          <div className="section-heading">

            <div>

              <span className="eyebrow">
                Monitoring
              </span>

              <h2>
                Risk Analytics
              </h2>

              <p>
                Live metrics generated from
                assessed transactions.
              </p>

            </div>


            <button
              className="secondary-button"
              onClick={() => {
                fetchTransactions();
                fetchAnalytics();
              }}
            >
              Refresh
            </button>

          </div>


          {analyticsError && (

            <div className="error-message">
              {analyticsError}
            </div>

          )}


          {/* STAT CARDS */}

          <div className="stats-grid">

            <div className="stat-card">

              <span>
                Total Transactions
              </span>

              <strong>
                {analytics?.total_transactions ?? 0}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                Approved
              </span>

              <strong className="approved-value">
                {analytics?.approved ?? 0}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                Review
              </span>

              <strong className="review-value">
                {analytics?.review ?? 0}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                Blocked
              </span>

              <strong className="blocked-value">
                {analytics?.blocked ?? 0}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                High Risk
              </span>

              <strong>
                {analytics?.high_risk ?? 0}
              </strong>

            </div>


            <div className="stat-card">

              <span>
                Average Risk
              </span>

              <strong>
                {formatRisk(
                  analytics?.average_risk
                )}
              </strong>

            </div>

          </div>


          {/* CHARTS */}

          <div className="analytics-grid">

            <div className="analytics-card">

              <div className="analytics-card-header">

                <div>

                  <span className="eyebrow">
                    Risk Profile
                  </span>

                  <h3>
                    Risk Distribution
                  </h3>

                </div>

              </div>


              <div className="chart-container">

                {riskChartData.some(
                  (item) => item.value > 0
                ) ? (

                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >

                    <PieChart>

                      <Pie
                        data={riskChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >

                        {riskChartData.map(
                            (entry, index) => (
                              <Cell
                                key={`risk-${index}`}
                                fill={entry.color}
                              />
                            )
                          )}

                      </Pie>

                      <Tooltip />

                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="empty-chart">
                    No assessed transactions yet.
                  </div>

                )}

              </div>

            </div>


            <div className="analytics-card">

              <div className="analytics-card-header">

                <div>

                  <span className="eyebrow">
                    Decisions
                  </span>

                  <h3>
                    Decision Distribution
                  </h3>

                </div>

              </div>


              <div className="chart-container">

                {decisionChartData.some(
                  (item) => item.value > 0
                ) ? (

                  <ResponsiveContainer
                    width="100%"
                    height={280}
                  >

                    <PieChart>

                      <Pie
                        data={decisionChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label
                      >

                        {decisionChartData.map(
                          (entry, index) => (
                            <Cell
                              key={`decision-${index}`}
                              fill={entry.color}
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip />

                      <Legend />

                    </PieChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="empty-chart">
                    No decisions yet.
                  </div>

                )}

              </div>

            </div>

          </div>


          {/* TRANSACTION ACTIVITY */}

          <div className="analytics-card analytics-wide">

            <div className="analytics-card-header">

              <div>

                <span className="eyebrow">
                  Activity
                </span>

                <h3>
                  Transaction Activity
                </h3>

              </div>

            </div>


            <div className="chart-container">

              {analytics?.transaction_volume?.length ? (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      analytics.transaction_volume
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="count"
                      strokeWidth={3}
                      dot
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="empty-chart">
                  No transaction activity yet.
                </div>

              )}

            </div>

          </div>


          {/* RISK TREND */}

          <div className="analytics-card analytics-wide">

            <div className="analytics-card-header">

              <div>

                <span className="eyebrow">
                  Risk Monitoring
                </span>

                <h3>
                  Average Risk Trend
                </h3>

              </div>

            </div>


            <div className="chart-container">

              {analytics?.risk_trend?.length ? (

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={
                      analytics.risk_trend
                    }
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="date"
                    />

                    <YAxis
                      domain={[0, 1]}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="average_risk"
                      strokeWidth={3}
                      dot
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="empty-chart">
                  No risk trend available yet.
                </div>

              )}

            </div>

          </div>

        </section>


        {/* =================================================
            TRANSACTION TABLE
        ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <span className="eyebrow">
                Live Monitoring
              </span>

              <h2>
                Recent Transactions
              </h2>

              <p>
                Review transactions and investigate
                suspicious activity.
              </p>

            </div>

          </div>


          {/* FILTERS */}

          <div className="filters">

            <input
              className="search-input"
              placeholder="Search transaction, customer or device..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />


            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Risk Levels
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>

            </select>


            <select
              value={decisionFilter}
              onChange={(event) =>
                setDecisionFilter(
                  event.target.value
                )
              }
            >

              <option value="ALL">
                All Decisions
              </option>

              <option value="APPROVE">
                Approve
              </option>

              <option value="REVIEW">
                Review
              </option>

              <option value="BLOCK">
                Block
              </option>

            </select>


            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >

              <option value="latest">
                Latest
              </option>

              <option value="highest">
                Highest Risk
              </option>

              <option value="lowest">
                Lowest Risk
              </option>

            </select>

          </div>


          {/* TABLE */}

          {loading ? (

            <div className="table-state">
              Loading transactions...
            </div>

          ) : error ? (

            <div className="table-state error-state">
              {error}
            </div>

          ) : filteredTransactions.length === 0 ? (

            <div className="table-state">
              No transactions found.
            </div>

          ) : (

            <div className="table-wrapper">

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

                    <th>
                      Time
                    </th>

                    <th>
                      Action
                    </th>

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

                        <td>
                          <strong>
                            {
                              transaction.transaction_id
                            }
                          </strong>
                        </td>


                        <td>
                          {
                            transaction.customer_id ||
                            "—"
                          }
                        </td>


                        <td>
                          ₹
                          {Number(
                            transaction.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>


                        <td>
                          <span className="risk-number">
                            {formatRisk(
                              transaction.risk_probability
                            )}
                          </span>
                        </td>


                        <td>

                          <span
                            className={`badge ${
                              (
                                transaction.risk_level ||
                                "UNASSESSED"
                              ).toLowerCase()
                            }`}
                          >

                            {
                              transaction.risk_level ||
                              "UNASSESSED"
                            }

                          </span>

                        </td>


                        <td>

                          <span
                            className={`badge decision-${(
                              transaction.decision ||
                              "UNASSESSED"
                            ).toLowerCase()}`}
                          >

                            {
                              transaction.decision ||
                              "UNASSESSED"
                            }

                          </span>

                        </td>


                        <td>
                          {formatDate(
                            transaction.timestamp
                          )}
                        </td>


                        <td>

                          <button
                            className="small-button"
                            onClick={() =>
                              openTransaction(
                                transaction
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

      </main>


      {/* =================================================
          TRANSACTION MODAL
      ================================================= */}

      {selectedTransaction && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

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
                onClick={closeModal}
              >
                ×
              </button>

            </div>


            {/* RISK SUMMARY */}

            <div className="investigation-summary">

              <div className="summary-card">

                <span>
                  Risk Probability
                </span>

                <strong>
                  {formatRisk(
                    selectedTransaction.risk_probability
                  )}
                </strong>

              </div>


              <div className="summary-card">

                <span>
                  Risk Level
                </span>

                <strong>
                  {
                    selectedTransaction.risk_level ||
                    "UNASSESSED"
                  }
                </strong>

              </div>


              <div className="summary-card">

                <span>
                  Decision
                </span>

                <strong>
                  {
                    selectedTransaction.decision ||
                    "UNASSESSED"
                  }
                </strong>

              </div>

            </div>


            {/* TRANSACTION DETAILS */}

            <div className="detail-grid">

              <div>

                <span>
                  Customer
                </span>

                <strong>
                  {
                    selectedTransaction.customer_id ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Device
                </span>

                <strong>
                  {
                    selectedTransaction.device_id ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Amount
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedTransaction.amount || 0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div>

                <span>
                  ML Probability
                </span>

                <strong>
                  {formatRisk(
                    selectedTransaction.ml_probability
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Velocity Risk
                </span>

                <strong>
                  {formatRisk(
                    selectedTransaction.velocity_risk
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Transactions / 5 min
                </span>

                <strong>
                  {
                    selectedTransaction.transactions_last_5min ??
                    0
                  }
                </strong>

              </div>


              <div>

                <span>
                  Transactions / 1 hour
                </span>

                <strong>
                  {
                    selectedTransaction.transactions_last_1h ??
                    0
                  }
                </strong>

              </div>


              <div>

                <span>
                  Spending / 1 hour
                </span>

                <strong>
                  ₹
                  {Number(
                    selectedTransaction.amount_last_1h ||
                    0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            </div>


            {/* RISK REASONS */}

            <div className="reasons-section">

              <h3>
                Risk Reasons
              </h3>


              {selectedTransaction.risk_reasons?.length ? (

                <ul className="risk-reasons">

                  {selectedTransaction.risk_reasons.map(
                    (reason, index) => (

                      <li key={index}>
                        {reason}
                      </li>

                    )
                  )}

                </ul>

              ) : (

                <p className="muted">
                  No specific risk reasons
                  recorded.
                </p>

              )}

            </div>


            {/* =================================================
                AI INVESTIGATOR
            ================================================= */}

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
                    AI-generated explanation based
                    on verified risk evidence.
                  </p>

                </div>


                <button
                  className="ai-button"
                  onClick={() =>
                    runAIInvestigation(
                      selectedTransaction.transaction_id
                    )
                  }
                  disabled={
                    aiLoading ||
                    !selectedTransaction.decision
                  }
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
                          aiInvestigation.risk_factors?.map(
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
                          aiInvestigation.evidence?.map(
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
                          aiInvestigation.recommended_action
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

    </div>
  );
}


export default App;