# AI Payment Risk Manager

An end-to-end AI-powered payment fraud detection and risk management platform.

The system combines machine-learning fraud probability with real-time behavioral, velocity, spending, and device-risk signals to evaluate payment transactions and produce explainable:

- APPROVE
- REVIEW
- BLOCK

decisions.

It also includes a React monitoring dashboard and an OpenAI-powered AI Investigator that converts verified risk evidence into an analyst-friendly investigation.

---

## 🚀 Features

### 🤖 Machine Learning Fraud Detection

The system uses a trained machine-learning model to generate a fraud probability for every transaction.

The ML probability is combined with deterministic real-time risk signals rather than being used as the only decision factor.

---

### ⚡ Real-Time Risk Engine

The deterministic risk engine evaluates:

- Customer transaction velocity
- Customer 5-minute activity
- Customer 1-hour activity
- Spending volume
- Device transaction velocity
- Device transaction volume
- Device sharing across customers

Example:

```text
ML Probability     = 0.0495
Velocity Risk      = 0.3800
                    -------
Final Risk         = 0.4295

🛡️ Risk Decisions
Risk Probability	Risk Level	Decision
< 0.40	LOW	APPROVE
0.40 - < 0.70	MEDIUM	REVIEW
>= 0.70	HIGH	BLOCK

The thresholds are configurable through the risk engine.

🔎 Explainable Risk Reasons

The risk engine produces human-readable reasons when behavioral signals increase risk.

Examples:
High customer transaction velocity
High transaction volume in the last hour
High spending volume in the last hour
High device transaction volume
Device shared across multiple customers

📱 Real-Time Monitoring Dashboard

The React dashboard provides:

Total transactions
Approved transactions
Transactions under review
Blocked transactions
High-risk transactions
Average risk
Decision distribution
Risk distribution
Transaction activity
Risk trends
Highest-risk transactions

The dashboard reads analytics from the backend instead of relying on hardcoded frontend values.

🗄️ Transaction Persistence

Transactions and risk assessments are stored in SQLite.

The database records:

Transaction data
Transaction ID
Customer ID
Device ID
Amount
Timestamp
Risk data
ML probability
Velocity risk
Final risk probability
Risk level
Decision
Risk reasons
Behavioral signals
Transactions in last 5 minutes
Transactions in last hour
Amount spent in last hour
Device transactions in last 5 minutes
Device transactions in last hour
Unique customers using the device

Indexes are used for customer, device, risk-level, and decision queries

##Architecture
                         ┌──────────────────────┐
                         │      React UI        │
                         │                      │
                         │ Dashboard            │
                         │ Transactions         │
                         │ Analytics            │
                         │ Investigation        │
                         └──────────┬───────────┘
                                    │
                                   HTTP
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      FastAPI         │
                         │                      │
                         │ Transaction API      │
                         │ Analytics API        │
                         │ Investigation API    │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
        │ ML Fraud     │   │ Risk Engine   │   │ SQLite       │
        │ Model        │   │               │   │ Database     │
        └──────┬───────┘   └───────┬───────┘   └──────────────┘
               │                   │
               └─────────┬─────────┘
                         ▼
                 Final Risk Decision
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           APPROVE     REVIEW     BLOCK
                         │
                         ▼
                 ┌───────────────┐
                 │ AI Investigator│
                 │    OpenAI      │
                 └───────────────┘

🧰 Tech Stack
##Backend
Python
FastAPI
Uvicorn
Pydantic
SQLite
##Machine Learning
Scikit-learn
Pandas
NumPy
Joblib
XGBoost
##Frontend
React
Vite
Recharts
CSS
##AI
OpenAI API
#3Development
Git
GitHub
VS Code

## Author
### Brij Sharma
B.Tech Computer Science & Engineering
Github: https://github.com/brij007sharma
