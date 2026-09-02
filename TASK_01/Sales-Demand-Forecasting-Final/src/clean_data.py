from pathlib import Path
import pandas as pd
import numpy as np


# ============================================================
# PROJECT PATHS
# ============================================================

ROOT = Path(__file__).resolve().parent.parent

RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"

PROCESSED.mkdir(parents=True, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("SALES FORECASTING - DATA CLEANING")
print("=" * 60)

print("\nLoading training data...")

train = pd.read_csv(
    RAW / "train.csv",
    usecols=[
        "date",
        "store_nbr",
        "family",
        "sales",
        "onpromotion"
    ]
)

print(f"Training rows loaded: {len(train):,}")


print("Loading oil data...")

oil = pd.read_csv(
    RAW / "oil.csv"
)

print("Loading transaction data...")

transactions = pd.read_csv(
    RAW / "transactions.csv"
)

print("Loading holidays/events...")

holidays = pd.read_csv(
    RAW / "holidays_events.csv"
)


# ============================================================
# DATE CONVERSION
# ============================================================

train["date"] = pd.to_datetime(train["date"])
oil["date"] = pd.to_datetime(oil["date"])
transactions["date"] = pd.to_datetime(transactions["date"])
holidays["date"] = pd.to_datetime(holidays["date"])


# ============================================================
# BASIC CLEANING
# ============================================================

print("\nCleaning sales data...")

# Negative sales are not meaningful for this forecasting target.
train["sales"] = train["sales"].clip(lower=0)

# Promotion counts cannot be negative.
train["onpromotion"] = train["onpromotion"].clip(lower=0)


# ============================================================
# AGGREGATE SALES BY DATE
# ============================================================

print("Aggregating sales by date...")

daily_sales = (
    train
    .groupby("date", as_index=False)
    .agg(
        sales=("sales", "sum"),
        onpromotion=("onpromotion", "sum")
    )
)


# ============================================================
# AGGREGATE TRANSACTIONS BY DATE
# ============================================================

print("Aggregating transactions...")

daily_transactions = (
    transactions
    .groupby("date", as_index=False)
    .agg(
        transactions=("transactions", "sum")
    )
)


# ============================================================
# OIL DATA
# ============================================================

oil = oil[["date", "dcoilwtico"]].copy()

oil = oil.rename(
    columns={
        "dcoilwtico": "oil_price"
    }
)

# Oil prices occasionally contain missing values.
oil["oil_price"] = oil["oil_price"].interpolate(
    method="linear"
)

oil["oil_price"] = oil["oil_price"].ffill().bfill()


# ============================================================
# HOLIDAY FEATURES
# ============================================================

print("Creating holiday features...")

holiday_features = (
    holidays
    .groupby("date")
    .agg(
        holiday_count=("description", "count")
    )
    .reset_index()
)

holiday_features["is_holiday"] = 1


# ============================================================
# MERGE DAILY DATA
# ============================================================

print("Combining datasets...")

daily = daily_sales.merge(
    daily_transactions,
    on="date",
    how="left"
)

daily = daily.merge(
    oil,
    on="date",
    how="left"
)

daily = daily.merge(
    holiday_features,
    on="date",
    how="left"
)


# ============================================================
# FILL MISSING VALUES
# ============================================================

daily["transactions"] = (
    daily["transactions"]
    .fillna(0)
)

daily["holiday_count"] = (
    daily["holiday_count"]
    .fillna(0)
)

daily["is_holiday"] = (
    daily["is_holiday"]
    .fillna(0)
)

daily["oil_price"] = (
    daily["oil_price"]
    .interpolate()
    .ffill()
    .bfill()
)


# ============================================================
# TIME FEATURES
# ============================================================

daily = daily.sort_values("date").reset_index(drop=True)

daily["year"] = daily["date"].dt.year
daily["month"] = daily["date"].dt.month
daily["quarter"] = daily["date"].dt.quarter
daily["day_of_week"] = daily["date"].dt.dayofweek
daily["day_of_year"] = daily["date"].dt.dayofyear
daily["week_of_year"] = daily["date"].dt.isocalendar().week.astype(int)

daily["is_weekend"] = (
    daily["day_of_week"] >= 5
).astype(int)


# ============================================================
# CYCLICAL SEASONAL FEATURES
# ============================================================

daily["month_sin"] = np.sin(
    2 * np.pi * daily["month"] / 12
)

daily["month_cos"] = np.cos(
    2 * np.pi * daily["month"] / 12
)

daily["dow_sin"] = np.sin(
    2 * np.pi * daily["day_of_week"] / 7
)

daily["dow_cos"] = np.cos(
    2 * np.pi * daily["day_of_week"] / 7
)


# ============================================================
# FINAL CLEAN DATASET
# ============================================================

output_file = PROCESSED / "daily_sales.csv"

daily.to_csv(
    output_file,
    index=False
)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 60)
print("CLEANING COMPLETED")
print("=" * 60)

print(f"Rows: {len(daily):,}")
print(f"Columns: {len(daily.columns)}")
print(f"Start date: {daily['date'].min().date()}")
print(f"End date: {daily['date'].max().date()}")

print("\nMissing values:")
print(daily.isna().sum())

print(f"\nSaved to:")
print(output_file)

print("\nFirst 5 rows:")
print(daily.head())
