# AI Payment Risk Manager

An AI-powered payment risk assessment system designed to detect suspicious transactions and make explainable payment-risk decisions.

## Current Features

- Synthetic payment transaction dataset
- Fraud-risk feature engineering
- Logistic Regression baseline
- Random Forest comparison
- XGBoost comparison
- Fraud probability prediction
- Risk scoring engine
- APPROVE / REVIEW / BLOCK decisions
- FastAPI REST API
- Pydantic transaction validation
- Persisted ML model using Joblib

## Architecture

Transaction
    ↓
Pydantic Validation
    ↓
Feature Engineering
    ↓
ML Risk Model
    ↓
Fraud Probability
    ↓
Risk Engine
    ↓
APPROVE / REVIEW / BLOCK

## ML Models

| Model | ROC-AUC | Fraud Precision | Fraud Recall | Fraud F1 |
|---|---:|---:|---:|---:|
| Logistic Regression | 0.8141 | 0.821 | 0.397 | 0.535 |
| Random Forest | 0.8072 | 0.579 | 0.516 | 0.545 |
| XGBoost | 0.8023 | 0.780 | 0.419 | 0.546 |

Logistic Regression currently provides the strongest overall ROC-AUC and fraud precision on the synthetic dataset and is being used as the primary probability model.

## Risk Decisions

| Fraud Probability | Risk Level | Decision |
|---:|---|---|
| < 0.40 | LOW | APPROVE |
| 0.40 - 0.70 | MEDIUM | REVIEW |
| >= 0.70 | HIGH | BLOCK |

These thresholds are initial development thresholds and will be refined as the risk engine evolves.

## Tech Stack

- Python
- FastAPI
- Pydantic
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- Joblib
- Jupyter

## Running Locally

Create and activate the virtual environment:
python -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --reload
http://127.0.0.1:8000/docs

```bash
python -m venv venv
