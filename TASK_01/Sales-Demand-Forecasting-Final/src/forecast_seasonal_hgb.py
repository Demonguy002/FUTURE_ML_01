# ================================================================
# FINAL SALES DEMAND FORECASTING
# SEASONAL HGB-C
# ================================================================
#
# PROJECT:
# E:\Sales-Demand-Forecasting-Final
#
# INPUT:
#   data/processed/daily_sales.csv
#
# MODEL:
#   models/sales_forecasting_seasonal_HGB_C_candidate.joblib
#
# OUTPUT:
#   outputs/forecasts/future_sales_forecast.csv
#   outputs/forecasts/future_sales_forecast.json
#   outputs/forecasts/sales_forecast.png
#
# TRAINED MODEL PERFORMANCE:
#   R²   = 0.957157
#   MAPE = 3.02%
#   RMSE = 31,501.11
#   MAE  = 25,761.64
#
# IMPORTANT:
#   This script does NOT retrain the model.
# ================================================================

import os
import json
import warnings

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")


# ================================================================
# CONFIGURATION
# ================================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATA_PATH = os.path.join(
    BASE_DIR,
    "data",
    "processed",
    "daily_sales.csv"
)

MODEL_PATHS = [
    os.path.join(
        BASE_DIR,
        "models",
        "sales_forecasting_seasonal_HGB_C.joblib"
    ),
    os.path.join(
        BASE_DIR,
        "models",
        "sales_forecasting_seasonal_HGB_C_candidate.joblib"
    )
]

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "outputs",
    "forecasts"
)

CSV_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "future_sales_forecast.csv"
)

JSON_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "future_sales_forecast.json"
)

PNG_OUTPUT = os.path.join(
    OUTPUT_DIR,
    "sales_forecast.png"
)

FORECAST_DAYS = 30

MODEL_R2 = 0.9571570558
MODEL_MAPE = 3.0182
MODEL_RMSE = 31501.11
MODEL_MAE = 25761.64


# ================================================================
# HEADER
# ================================================================

print("=" * 78)
print("FINAL SALES DEMAND FORECAST")
print("SEASONAL HGB-C")
print("=" * 78)


# ================================================================
# OUTPUT DIRECTORY
# ================================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ================================================================
# 1. LOAD DATA
# ================================================================

print("\n[1/7] Loading daily sales data...")

if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(
        f"\nDaily sales file not found:\n{DATA_PATH}"
    )

df = pd.read_csv(DATA_PATH)

if "date" not in df.columns:
    raise ValueError(
        "daily_sales.csv must contain 'date'."
    )

if "sales" not in df.columns:
    raise ValueError(
        "daily_sales.csv must contain 'sales'."
    )

df["date"] = pd.to_datetime(
    df["date"]
)

df = (
    df
    .sort_values("date")
    .drop_duplicates(
        subset=["date"]
    )
    .reset_index(drop=True)
)

df["sales"] = pd.to_numeric(
    df["sales"],
    errors="coerce"
).fillna(0)

# Required external variables
required_columns = [
    "onpromotion",
    "transactions",
    "oil_price",
    "holiday_count",
    "is_holiday"
]

for column in required_columns:

    if column not in df.columns:
        df[column] = 0

    df[column] = pd.to_numeric(
        df[column],
        errors="coerce"
    ).fillna(0)


print(
    f"Rows: {len(df):,}"
)

print(
    f"Date range: "
    f"{df['date'].min().date()} -> "
    f"{df['date'].max().date()}"
)


# ================================================================
# 2. LOAD TRAINED MODEL
# ================================================================

print("\n[2/7] Loading Seasonal HGB-C model...")

MODEL_PATH = None

for path in MODEL_PATHS:

    if os.path.exists(path):
        MODEL_PATH = path
        break

if MODEL_PATH is None:

    raise FileNotFoundError(
        "\nSeasonal HGB-C model not found.\n\n"
        "Checked:"
        f"\n{MODEL_PATHS[0]}"
        f"\n{MODEL_PATHS[1]}"
    )


package = joblib.load(
    MODEL_PATH
)


# ---------------------------------------------------------------
# Extract model and feature names
# ---------------------------------------------------------------

if isinstance(package, dict):

    if "model" in package:
        model = package["model"]

    elif "estimator" in package:
        model = package["estimator"]

    else:
        raise ValueError(
            "Joblib package does not contain "
            "'model' or 'estimator'."
        )

    if "features" in package:
        MODEL_FEATURES = list(
            package["features"]
        )

    elif "feature_names" in package:
        MODEL_FEATURES = list(
            package["feature_names"]
        )

    else:
        raise ValueError(
            "Joblib package does not contain "
            "the model feature list."
        )

else:

    model = package

    if hasattr(
        model,
        "feature_names_in_"
    ):
        MODEL_FEATURES = list(
            model.feature_names_in_
        )

    else:
        raise ValueError(
            "Unable to determine model features."
        )


print(
    "Model loaded successfully."
)

print(
    f"Model file: {os.path.basename(MODEL_PATH)}"
)

print(
    f"Expected features: "
    f"{len(MODEL_FEATURES)}"
)


# ================================================================
# 3. FEATURE ENGINEERING
# ================================================================

def create_features(data):

    x = data.copy()

    x["date"] = pd.to_datetime(
        x["date"]
    )

    x = (
        x
        .sort_values("date")
        .reset_index(drop=True)
    )

    # ============================================================
    # CALENDAR FEATURES
    # ============================================================

    x["year"] = (
        x["date"].dt.year
    )

    x["month"] = (
        x["date"].dt.month
    )

    x["quarter"] = (
        x["date"].dt.quarter
    )

    x["day"] = (
        x["date"].dt.day
    )

    x["day_of_week"] = (
        x["date"].dt.dayofweek
    )

    x["day_of_year"] = (
        x["date"].dt.dayofyear
    )

    x["week_of_year"] = (
        x["date"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    x["is_weekend"] = (
        x["day_of_week"] >= 5
    ).astype(int)

    x["is_month_start"] = (
        x["date"]
        .dt.is_month_start
        .astype(int)
    )

    x["is_month_end"] = (
        x["date"]
        .dt.is_month_end
        .astype(int)
    )

    # ============================================================
    # CYCLICAL FEATURES
    # ============================================================

    x["month_sin"] = np.sin(
        2 * np.pi *
        x["month"] / 12
    )

    x["month_cos"] = np.cos(
        2 * np.pi *
        x["month"] / 12
    )

    x["weekday_sin"] = np.sin(
        2 * np.pi *
        x["day_of_week"] / 7
    )

    x["weekday_cos"] = np.cos(
        2 * np.pi *
        x["day_of_week"] / 7
    )

    x["year_sin"] = np.sin(
        2 * np.pi *
        x["day_of_year"] / 365.25
    )

    x["year_cos"] = np.cos(
        2 * np.pi *
        x["day_of_year"] / 365.25
    )

    # ============================================================
    # SALES LAGS
    # ============================================================

    sales_lags = [
        1,
        2,
        3,
        7,
        14,
        21,
        28,
        35,
        42,
        56,
        84,
        364,
        365,
        366
    ]

    for lag in sales_lags:

        x[f"lag_{lag}"] = (
            x["sales"].shift(lag)
        )

    # ============================================================
    # ROLLING MEANS
    # ============================================================

    rolling_mean_windows = [
        7,
        14,
        21,
        28,
        42,
        56,
        84
    ]

    for window in rolling_mean_windows:

        x[f"rolling_mean_{window}"] = (
            x["sales"]
            .shift(1)
            .rolling(
                window,
                min_periods=1
            )
            .mean()
        )

    # ============================================================
    # ROLLING MEDIANS
    # ============================================================

    for window in [
        7,
        14,
        28,
        56
    ]:

        x[f"rolling_median_{window}"] = (
            x["sales"]
            .shift(1)
            .rolling(
                window,
                min_periods=1
            )
            .median()
        )

    # ============================================================
    # ROLLING STANDARD DEVIATION
    # ============================================================

    for window in [
        7,
        14,
        28,
        56,
        84
    ]:

        x[f"rolling_std_{window}"] = (
            x["sales"]
            .shift(1)
            .rolling(
                window,
                min_periods=2
            )
            .std()
        )

    # ============================================================
    # ROLLING MIN / MAX
    # ============================================================

    for window in [
        7,
        14,
        28,
        56
    ]:

        x[f"rolling_min_{window}"] = (
            x["sales"]
            .shift(1)
            .rolling(
                window,
                min_periods=1
            )
            .min()
        )

        x[f"rolling_max_{window}"] = (
            x["sales"]
            .shift(1)
            .rolling(
                window,
                min_periods=1
            )
            .max()
        )

    # ============================================================
    # EXPONENTIAL MOVING AVERAGES
    # ============================================================

    for span in [
        7,
        14,
        28,
        56
    ]:

        x[f"ewm_{span}"] = (
            x["sales"]
            .shift(1)
            .ewm(
                span=span,
                adjust=False,
                min_periods=1
            )
            .mean()
        )

    # ============================================================
    # DIFFERENCE FEATURES
    # ============================================================

    x["diff_1"] = (
        x["sales"].diff(1)
    )

    x["diff_7"] = (
        x["sales"].diff(7)
    )

    x["diff_28"] = (
        x["sales"].diff(28)
    )

    # ============================================================
    # GROWTH FEATURES
    # ============================================================

    x["growth_1"] = (
        x["sales"].pct_change(1)
    )

    x["growth_7"] = (
        x["sales"].pct_change(7)
    )

    x["growth_28"] = (
        x["sales"].pct_change(28)
    )

    # ============================================================
    # YEAR-OVER-YEAR FEATURES
    # ============================================================

    x["yoy_avg"] = (
        x["sales"]
        .shift(364)
        .rolling(
            7,
            min_periods=1
        )
        .mean()
    )

    x["yoy_weekday_ratio"] = (
        x["sales"].shift(1)
        /
        x["sales"]
        .shift(364)
        .replace(
            0,
            np.nan
        )
    )

    x["yoy_change_364"] = (
        x["sales"]
        -
        x["sales"].shift(364)
    )

    x["yoy_change_365"] = (
        x["sales"]
        -
        x["sales"].shift(365)
    )

    # ============================================================
    # WEEKDAY HISTORICAL FEATURES
    # ============================================================

    shifted_sales = (
        x["sales"].shift(1)
    )

    x["weekday_mean_4weeks"] = (
        shifted_sales
        .groupby(
            x["day_of_week"]
        )
        .transform(
            lambda s:
            s.rolling(
                4,
                min_periods=1
            ).mean()
        )
    )

    x["weekday_mean_8weeks"] = (
        shifted_sales
        .groupby(
            x["day_of_week"]
        )
        .transform(
            lambda s:
            s.rolling(
                8,
                min_periods=1
            ).mean()
        )
    )

    # ============================================================
    # SAME WEEKDAY FEATURES
    # ============================================================

    x["same_weekday_mean_7"] = (
        shifted_sales
        .groupby(
            x["day_of_week"]
        )
        .transform(
            lambda s:
            s.rolling(
                4,
                min_periods=1
            ).mean()
        )
    )

    x["same_weekday_mean_28"] = (
        shifted_sales
        .groupby(
            x["day_of_week"]
        )
        .transform(
            lambda s:
            s.rolling(
                8,
                min_periods=1
            ).mean()
        )
    )

    x["same_weekday_mean_56"] = (
        shifted_sales
        .groupby(
            x["day_of_week"]
        )
        .transform(
            lambda s:
            s.rolling(
                12,
                min_periods=1
            ).mean()
        )
    )

    # ============================================================
    # MOMENTUM FEATURES
    # ============================================================

    x["momentum_7"] = (
        x["rolling_mean_7"]
        /
        x["rolling_mean_14"]
        .replace(
            0,
            np.nan
        )
    )

    x["momentum_28"] = (
        x["rolling_mean_28"]
        /
        x["rolling_mean_56"]
        .replace(
            0,
            np.nan
        )
    )

    x["momentum_7_28"] = (
        x["rolling_mean_7"]
        /
        x["rolling_mean_28"]
        .replace(
            0,
            np.nan
        )
    )

    x["momentum_14_56"] = (
        x["rolling_mean_14"]
        /
        x["rolling_mean_56"]
        .replace(
            0,
            np.nan
        )
    )

    # ============================================================
    # TREND FEATURES
    # ============================================================

    x["trend_7_14"] = (
        x["rolling_mean_7"]
        /
        x["rolling_mean_14"]
        .replace(
            0,
            np.nan
        )
    )

    x["trend_28_84"] = (
        x["rolling_mean_28"]
        /
        x["rolling_mean_84"]
        .replace(
            0,
            np.nan
        )
    )

    x["short_long_ratio"] = (
        x["rolling_mean_7"]
        /
        x["rolling_mean_84"]
        .replace(
            0,
            np.nan
        )
    )

    x["trend"] = (
        x["rolling_mean_7"]
        /
        x["rolling_mean_28"]
        .replace(
            0,
            np.nan
        )
    )

    # ============================================================
    # MEAN CHANGE FEATURES
    # ============================================================

    x["mean_change_7_28"] = (
        x["rolling_mean_7"]
        -
        x["rolling_mean_28"]
    )

    x["mean_change_28_84"] = (
        x["rolling_mean_28"]
        -
        x["rolling_mean_84"]
    )

    # ============================================================
    # VOLATILITY
    # ============================================================

    x["volatility_ratio"] = (
        x["rolling_std_7"]
        /
        x["rolling_std_28"]
        .replace(
            0,
            np.nan
        )
    )

    # ============================================================
    # PROMOTION FEATURES
    # ============================================================

    x["promotion_lag_1"] = (
        x["onpromotion"].shift(1)
    )

    x["promotion_lag_7"] = (
        x["onpromotion"].shift(7)
    )

    x["promotion_mean_7"] = (
        x["onpromotion"]
        .shift(1)
        .rolling(
            7,
            min_periods=1
        )
        .mean()
    )

    x["promotion_mean_28"] = (
        x["onpromotion"]
        .shift(1)
        .rolling(
            28,
            min_periods=1
        )
        .mean()
    )

    x["promotion_rolling_7"] = (
        x["onpromotion"]
        .shift(1)
        .rolling(
            7,
            min_periods=1
        )
        .mean()
    )

    x["promotion_rolling_28"] = (
        x["onpromotion"]
        .shift(1)
        .rolling(
            28,
            min_periods=1
        )
        .mean()
    )

    # ============================================================
    # TRANSACTION FEATURES
    # ============================================================

    x["transactions_lag_1"] = (
        x["transactions"].shift(1)
    )

    x["transactions_lag_7"] = (
        x["transactions"].shift(7)
    )

    x["transactions_mean_7"] = (
        x["transactions"]
        .shift(1)
        .rolling(
            7,
            min_periods=1
        )
        .mean()
    )

    x["transactions_mean_28"] = (
        x["transactions"]
        .shift(1)
        .rolling(
            28,
            min_periods=1
        )
        .mean()
    )

    x["transactions_rolling_7"] = (
        x["transactions"]
        .shift(1)
        .rolling(
            7,
            min_periods=1
        )
        .mean()
    )

    x["transactions_rolling_28"] = (
        x["transactions"]
        .shift(1)
        .rolling(
            28,
            min_periods=1
        )
        .mean()
    )

    # ============================================================
    # INTERACTION FEATURES
    # ============================================================

    x["sales_promotion_interaction"] = (
        x["rolling_mean_7"]
        *
        x["promotion_mean_7"]
    )

    x["sales_transaction_interaction"] = (
        x["rolling_mean_7"]
        *
        x["transactions_mean_7"]
    )

    x["promotion_transaction_interaction"] = (
        x["promotion_mean_7"]
        *
        x["transactions_mean_7"]
    )

    x["weekend_sales_interaction"] = (
        x["rolling_mean_7"]
        *
        x["is_weekend"]
    )

    x["month_sales_interaction"] = (
        x["rolling_mean_28"]
        *
        x["month"]
    )

    # ============================================================
    # OIL FEATURES
    # ============================================================

    x["oil_price_lag_1"] = (
        x["oil_price"].shift(1)
    )

    x["oil_price_change"] = (
        x["oil_price"]
        -
        x["oil_price"].shift(1)
    )

    # ============================================================
    # HOLIDAY FEATURES
    # ============================================================

    x["holiday_lag_1"] = (
        x["is_holiday"].shift(1)
    )

    # ============================================================
    # CLEAN NUMERICAL VALUES
    # ============================================================

    x = x.replace(
        [np.inf, -np.inf],
        np.nan
    )

    return x


# ================================================================
# 4. PREPARE FUTURE DATES
# ================================================================

print("\n[3/7] Preparing future dates...")

last_date = df["date"].max()

future_dates = pd.date_range(
    start=(
        last_date +
        pd.Timedelta(days=1)
    ),
    periods=FORECAST_DAYS,
    freq="D"
)

print(
    f"Forecast: "
    f"{future_dates.min().date()} -> "
    f"{future_dates.max().date()}"
)


# ================================================================
# FUTURE INPUT ASSUMPTIONS
# ================================================================

recent_28 = df.tail(28)

future_promotion = float(
    recent_28["onpromotion"].mean()
)

future_transactions = float(
    recent_28["transactions"].mean()
)

future_oil = float(
    df["oil_price"].iloc[-1]
)

print("\nFuture input assumptions:")

print(
    f"Promotion    : "
    f"{future_promotion:.2f}"
)

print(
    f"Transactions : "
    f"{future_transactions:.2f}"
)

print(
    f"Oil price    : "
    f"{future_oil:.2f}"
)


# ================================================================
# BUILD FUTURE DATA
# ================================================================

future_df = pd.DataFrame({

    "date": future_dates,

    "sales": np.nan,

    "onpromotion": (
        future_promotion
    ),

    "transactions": (
        future_transactions
    ),

    "oil_price": (
        future_oil
    ),

    "holiday_count": 0,

    "is_holiday": 0
})


# ================================================================
# 5. GENERATE RECURSIVE FORECAST
# ================================================================

print("\n[4/7] Generating forecast...")

history = df.copy()

predictions = []


for i in range(
    FORECAST_DAYS
):

    current_date = (
        future_dates[i]
    )

    current_row = (
        future_df
        .iloc[[i]]
        .copy()
    )

    # ------------------------------------------------------------
    # Add future row to historical data
    # ------------------------------------------------------------

    working = pd.concat(
        [
            history,
            current_row
        ],
        ignore_index=True
    )

    # ------------------------------------------------------------
    # Create all features
    # ------------------------------------------------------------

    featured = create_features(
        working
    )

    current_features = (
        featured
        .iloc[[-1]]
        .copy()
    )

    # ------------------------------------------------------------
    # Check exact model features
    # ------------------------------------------------------------

    missing_features = [
        feature
        for feature in MODEL_FEATURES
        if feature not in current_features.columns
    ]

    if missing_features:

        print(
            "\nERROR: Missing model features:"
        )

        for feature in missing_features:
            print(
                f"  - {feature}"
            )

        raise RuntimeError(
            "\nForecast feature engineering does "
            "not match the trained model."
        )

    # ------------------------------------------------------------
    # Select exact feature order
    # ------------------------------------------------------------

    X_future = (
        current_features[
            MODEL_FEATURES
        ]
        .copy()
    )

    # ------------------------------------------------------------
    # Numerical cleanup
    # ------------------------------------------------------------

    X_future = X_future.replace(
        [np.inf, -np.inf],
        np.nan
    )

    X_future = X_future.fillna(0)

    # ------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------

    prediction = model.predict(
        X_future
    )[0]

    prediction = float(
        max(
            0,
            prediction
        )
    )

    predictions.append(
        prediction
    )

    # ------------------------------------------------------------
    # Recursive feedback
    # ------------------------------------------------------------

    new_history_row = (
        current_row.copy()
    )

    new_history_row["sales"] = (
        prediction
    )

    history = pd.concat(
        [
            history,
            new_history_row
        ],
        ignore_index=True
    )

    print(
        f"  {current_date.date()} "
        f"-> {prediction:,.2f}"
    )


# ================================================================
# 6. SAVE FORECAST DATA
# ================================================================

print("\n[5/7] Saving forecast files...")

forecast_df = pd.DataFrame({

    "date": future_dates,

    "predicted_sales": predictions
})

forecast_df["date"] = (
    forecast_df["date"]
    .dt.strftime(
        "%Y-%m-%d"
    )
)


# ================================================================
# SAVE CSV
# ================================================================

forecast_df.to_csv(
    CSV_OUTPUT,
    index=False
)

print(
    f"CSV saved: "
    f"{CSV_OUTPUT}"
)


# ================================================================
# CALCULATE SUMMARY
# ================================================================

forecast_values = np.array(
    predictions,
    dtype=float
)

total_forecast = float(
    forecast_values.sum()
)

average_forecast = float(
    forecast_values.mean()
)

minimum_forecast = float(
    forecast_values.min()
)

maximum_forecast = float(
    forecast_values.max()
)

peak_index = int(
    np.argmax(
        forecast_values
    )
)

peak_date = (
    future_dates[
        peak_index
    ]
    .strftime(
        "%Y-%m-%d"
    )
)


# ================================================================
# SAVE JSON
# ================================================================

forecast_json = {

    "model": {

        "name": "Seasonal HGB-C",

        "r2": MODEL_R2,

        "r2_percent": (
            MODEL_R2 * 100
        ),

        "mape_percent": (
            MODEL_MAPE
        ),

        "rmse": (
            MODEL_RMSE
        ),

        "mae": (
            MODEL_MAE
        )
    },

    "forecast": {

        "horizon_days": (
            FORECAST_DAYS
        ),

        "start_date": (
            future_dates.min()
            .strftime(
                "%Y-%m-%d"
            )
        ),

        "end_date": (
            future_dates.max()
            .strftime(
                "%Y-%m-%d"
            )
        ),

        "total_predicted_sales": (
            total_forecast
        ),

        "average_daily_sales": (
            average_forecast
        ),

        "minimum_daily_sales": (
            minimum_forecast
        ),

        "maximum_daily_sales": (
            maximum_forecast
        ),

        "peak_date": peak_date
    },

    "assumptions": {

        "future_promotion": (
            future_promotion
        ),

        "future_transactions": (
            future_transactions
        ),

        "future_oil_price": (
            future_oil
        ),

        "future_holiday_count": 0,

        "future_is_holiday": 0
    },

    "daily_forecast": [

        {
            "date": row["date"],

            "predicted_sales": float(
                row[
                    "predicted_sales"
                ]
            )
        }

        for _, row
        in forecast_df.iterrows()
    ]
}


with open(
    JSON_OUTPUT,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        forecast_json,
        file,
        indent=4
    )


print(
    f"JSON saved: "
    f"{JSON_OUTPUT}"
)


# ================================================================
# 7. CREATE PNG
# ================================================================

print(
    "\n[6/7] Creating forecast visualization..."
)

# Last 90 historical days
historical_plot = (
    df[
        [
            "date",
            "sales"
        ]
    ]
    .tail(90)
    .copy()
)

historical_dates = (
    historical_plot["date"]
)

historical_sales = (
    historical_plot["sales"]
)

plot_future_dates = pd.to_datetime(
    forecast_df["date"]
)

plot_future_sales = (
    forecast_df[
        "predicted_sales"
    ]
)


plt.figure(
    figsize=(16, 8)
)


# Historical
plt.plot(
    historical_dates,
    historical_sales,
    label="Historical Sales",
    linewidth=2
)


# Forecast
plt.plot(
    plot_future_dates,
    plot_future_sales,
    label="30-Day Forecast",
    linewidth=2
)


# Connection point
plt.plot(
    [
        historical_dates.iloc[-1],
        plot_future_dates.iloc[0]
    ],
    [
        historical_sales.iloc[-1],
        plot_future_sales.iloc[0]
    ],
    linewidth=2
)


# Forecast start
plt.axvline(
    x=historical_dates.iloc[-1],
    linestyle="--",
    linewidth=1.5,
    label="Forecast Start"
)


plt.title(
    "Sales Demand Forecast — Seasonal HGB-C",
    fontsize=18,
    fontweight="bold"
)

plt.xlabel(
    "Date",
    fontsize=12
)

plt.ylabel(
    "Sales",
    fontsize=12
)

plt.grid(
    True,
    alpha=0.25
)

plt.legend()

plt.xticks(
    rotation=45
)

plt.tight_layout()


plt.savefig(
    PNG_OUTPUT,
    dpi=180,
    bbox_inches="tight"
)

plt.close()


print(
    f"PNG saved: "
    f"{PNG_OUTPUT}"
)


# ================================================================
# FINAL SUMMARY
# ================================================================

print(
    "\n[7/7] Forecast completed successfully."
)

print("=" * 78)
print("FORECAST SUMMARY")
print("=" * 78)

print(
    "Model               : Seasonal HGB-C"
)

print(
    f"Model R²            : "
    f"{MODEL_R2:.6f}"
)

print(
    f"Model R² percentage  : "
    f"{MODEL_R2 * 100:.2f}%"
)

print(
    f"Model MAPE           : "
    f"{MODEL_MAPE:.2f}%"
)

print(
    f"Model RMSE           : "
    f"{MODEL_RMSE:,.2f}"
)

print(
    f"Model MAE            : "
    f"{MODEL_MAE:,.2f}"
)

print(
    f"Forecast horizon     : "
    f"{FORECAST_DAYS} days"
)

print(
    f"Total forecast sales : "
    f"{total_forecast:,.2f}"
)

print(
    f"Average daily sales  : "
    f"{average_forecast:,.2f}"
)

print(
    f"Minimum daily sales  : "
    f"{minimum_forecast:,.2f}"
)

print(
    f"Maximum daily sales  : "
    f"{maximum_forecast:,.2f}"
)

print(
    f"Peak forecast date   : "
    f"{peak_date}"
)

print("=" * 78)

print("\nOUTPUT FILES")
print("-" * 78)

print(
    f"CSV : {CSV_OUTPUT}"
)

print(
    f"JSON: {JSON_OUTPUT}"
)

print(
    f"PNG : {PNG_OUTPUT}"
)

print("=" * 78)

print("\nDONE.")
