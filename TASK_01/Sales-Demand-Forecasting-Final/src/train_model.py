from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)


# ============================================================
# PROJECT PATHS
# ============================================================

ROOT = Path(__file__).resolve().parent.parent

DATA_FILE = (
    ROOT
    / "data"
    / "processed"
    / "daily_sales.csv"
)

MODEL_DIR = ROOT / "models"
METRIC_DIR = ROOT / "outputs" / "metrics"

MODEL_DIR.mkdir(
    parents=True,
    exist_ok=True
)

METRIC_DIR.mkdir(
    parents=True,
    exist_ok=True
)

MODEL_FILE = (
    MODEL_DIR
    / "sales_forecasting_seasonal_HGB_C_candidate.joblib"
)

METRICS_FILE = (
    METRIC_DIR
    / "seasonal_HGB_C_metrics.json"
)

PREDICTION_FILE = (
    METRIC_DIR
    / "seasonal_HGB_C_predictions.csv"
)


# ============================================================
# SETTINGS
# ============================================================

VALIDATION_DAYS = 60
RANDOM_STATE = 42

BENCHMARK_R2 = 0.9496
BENCHMARK_MAPE = 3.16
BENCHMARK_RMSE = 34159.03


print("=" * 82)
print("SEASONAL HGB C — HIGH ACCURACY SALES FORECASTING")
print("=" * 82)


# ============================================================
# LOAD DATA
# ============================================================

print("\nLoading processed data...")

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(
    df["date"]
)

df = (
    df
    .sort_values("date")
    .reset_index(drop=True)
)

print(
    f"Rows loaded: {len(df):,}"
)

print(
    f"Date range: "
    f"{df['date'].min().date()} "
    f"-> "
    f"{df['date'].max().date()}"
)


# ============================================================
# CORE LAGS
# ============================================================

print("\nCreating short/medium lags...")

short_lags = [
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
    84
]

for lag in short_lags:

    df[f"lag_{lag}"] = (
        df["sales"]
        .shift(lag)
    )


# ============================================================
# YEAR-OVER-YEAR LAGS
# ============================================================

print(
    "Creating year-over-year seasonal lags..."
)

year_lags = [
    364,
    365,
    366
]

for lag in year_lags:

    df[f"lag_{lag}"] = (
        df["sales"]
        .shift(lag)
    )


# ============================================================
# ROLLING FEATURES
# ============================================================

print(
    "Creating rolling features..."
)

shifted_sales = (
    df["sales"]
    .shift(1)
)

rolling_mean_features = {}

for window in [
    7,
    14,
    21,
    28,
    42,
    56,
    84
]:

    rolling_mean_features[
        f"rolling_mean_{window}"
    ] = (
        shifted_sales
        .rolling(window)
        .mean()
    )

rolling_mean_df = pd.DataFrame(
    rolling_mean_features,
    index=df.index
)

df = pd.concat(
    [
        df,
        rolling_mean_df
    ],
    axis=1
)


# ============================================================
# ROLLING MEDIANS
# ============================================================

median_features = {}

for window in [
    7,
    14,
    28,
    56
]:

    median_features[
        f"rolling_median_{window}"
    ] = (
        shifted_sales
        .rolling(window)
        .median()
    )

df = pd.concat(
    [
        df,
        pd.DataFrame(
            median_features,
            index=df.index
        )
    ],
    axis=1
)


# ============================================================
# ROLLING STANDARD DEVIATION
# ============================================================

std_features = {}

for window in [
    7,
    14,
    28,
    56,
    84
]:

    std_features[
        f"rolling_std_{window}"
    ] = (
        shifted_sales
        .rolling(window)
        .std()
    )

df = pd.concat(
    [
        df,
        pd.DataFrame(
            std_features,
            index=df.index
        )
    ],
    axis=1
)


# ============================================================
# EXPONENTIAL MOVING AVERAGE
# ============================================================

print(
    "Creating exponential moving averages..."
)

ewm_features = {}

for span in [
    7,
    14,
    28,
    56
]:

    ewm_features[
        f"ewm_{span}"
    ] = (
        shifted_sales
        .ewm(
            span=span,
            adjust=False
        )
        .mean()
    )

df = pd.concat(
    [
        df,
        pd.DataFrame(
            ewm_features,
            index=df.index
        )
    ],
    axis=1
)


# ============================================================
# DIFFERENCE FEATURES
# ============================================================

print(
    "Creating difference features..."
)

df["diff_1"] = (
    df["sales"].shift(1)
    -
    df["sales"].shift(2)
)

df["diff_7"] = (
    df["sales"].shift(1)
    -
    df["sales"].shift(8)
)

df["diff_28"] = (
    df["sales"].shift(1)
    -
    df["sales"].shift(29)
)


# ============================================================
# YEAR-OVER-YEAR FEATURES
# ============================================================

print(
    "Creating YOY features..."
)

epsilon = 1e-6

df["yoy_avg"] = (
    df["lag_364"]
    +
    df["lag_365"]
    +
    df["lag_366"]
) / 3


df["yoy_weekday_ratio"] = (
    df["lag_7"]
    /
    (
        df["lag_364"]
        +
        epsilon
    )
)


df["yoy_change_364"] = (
    (
        df["lag_1"]
        -
        df["lag_364"]
    )
    /
    (
        np.abs(
            df["lag_364"]
        )
        +
        epsilon
    )
)


df["yoy_change_365"] = (
    (
        df["lag_1"]
        -
        df["lag_365"]
    )
    /
    (
        np.abs(
            df["lag_365"]
        )
        +
        epsilon
    )
)


# ============================================================
# SAME-WEEKDAY HISTORY
# ============================================================

print(
    "Creating weekday history..."
)

df["weekday_mean_4weeks"] = (
    df["sales"]
    .shift(7)
    .rolling(4)
    .mean()
)

df["weekday_mean_8weeks"] = (
    df["sales"]
    .shift(7)
    .rolling(8)
    .mean()
)


# ============================================================
# MOMENTUM / TREND FEATURES
# ============================================================

print(
    "Creating momentum features..."
)

df["short_long_ratio"] = (
    df["rolling_mean_7"]
    /
    (
        df["rolling_mean_56"]
        +
        epsilon
    )
)


df["momentum_7"] = (
    df["lag_1"]
    /
    (
        df["rolling_mean_7"]
        +
        epsilon
    )
)


df["momentum_28"] = (
    df["lag_1"]
    /
    (
        df["rolling_mean_28"]
        +
        epsilon
    )
)


df["mean_change_7_28"] = (
    df["rolling_mean_7"]
    -
    df["rolling_mean_28"]
)


df["mean_change_28_84"] = (
    df["rolling_mean_28"]
    -
    df["rolling_mean_84"]
)


df["volatility_ratio"] = (
    df["rolling_std_7"]
    /
    (
        df["rolling_std_28"]
        +
        epsilon
    )
)


# ============================================================
# PROMOTION HISTORY
# ============================================================

print(
    "Creating promotion history..."
)

df["promotion_lag_1"] = (
    df["onpromotion"]
    .shift(1)
)

df["promotion_lag_7"] = (
    df["onpromotion"]
    .shift(7)
)

df["promotion_mean_7"] = (
    df["onpromotion"]
    .shift(1)
    .rolling(7)
    .mean()
)

df["promotion_mean_28"] = (
    df["onpromotion"]
    .shift(1)
    .rolling(28)
    .mean()
)


# ============================================================
# TRANSACTION HISTORY
# ============================================================

print(
    "Creating transaction history..."
)

df["transactions_lag_1"] = (
    df["transactions"]
    .shift(1)
)

df["transactions_lag_7"] = (
    df["transactions"]
    .shift(7)
)

df["transactions_mean_7"] = (
    df["transactions"]
    .shift(1)
    .rolling(7)
    .mean()
)

df["transactions_mean_28"] = (
    df["transactions"]
    .shift(1)
    .rolling(28)
    .mean()
)


# ============================================================
# CALENDAR
# ============================================================

print(
    "Creating calendar features..."
)

df["trend"] = np.arange(
    len(df)
)

df["day"] = (
    df["date"]
    .dt
    .day
)

df["year"] = (
    df["date"]
    .dt
    .year
)

df["month"] = (
    df["date"]
    .dt
    .month
)

df["quarter"] = (
    df["date"]
    .dt
    .quarter
)

df["day_of_week"] = (
    df["date"]
    .dt
    .dayofweek
)

df["day_of_year"] = (
    df["date"]
    .dt
    .dayofyear
)

df["week_of_year"] = (
    df["date"]
    .dt
    .isocalendar()
    .week
    .astype(int)
)

df["is_weekend"] = (
    df["day_of_week"] >= 5
).astype(int)


df["is_month_start"] = (
    df["date"]
    .dt
    .is_month_start
    .astype(int)
)

df["is_month_end"] = (
    df["date"]
    .dt
    .is_month_end
    .astype(int)
)


# ============================================================
# CYCLICAL FEATURES
# ============================================================

df["month_sin"] = np.sin(
    2
    * np.pi
    * df["month"]
    / 12
)

df["month_cos"] = np.cos(
    2
    * np.pi
    * df["month"]
    / 12
)

df["dow_sin"] = np.sin(
    2
    * np.pi
    * df["day_of_week"]
    / 7
)

df["dow_cos"] = np.cos(
    2
    * np.pi
    * df["day_of_week"]
    / 7
)

df["year_sin"] = np.sin(
    2
    * np.pi
    * df["day_of_year"]
    / 365.25
)

df["year_cos"] = np.cos(
    2
    * np.pi
    * df["day_of_year"]
    / 365.25
)


# ============================================================
# SANITIZE RATIO FEATURES
# ============================================================

ratio_columns = [
    "yoy_weekday_ratio",
    "yoy_change_364",
    "yoy_change_365",
    "short_long_ratio",
    "momentum_7",
    "momentum_28",
    "volatility_ratio"
]

for col in ratio_columns:

    df[col] = (
        df[col]
        .replace(
            [np.inf, -np.inf],
            np.nan
        )
        .clip(
            lower=-10,
            upper=10
        )
    )


# ============================================================
# FEATURE LIST
# ============================================================

FEATURES = [

    # Current known variables
    "onpromotion",
    "transactions",
    "oil_price",
    "holiday_count",
    "is_holiday",

    # Calendar
    "year",
    "month",
    "quarter",
    "day",
    "day_of_week",
    "day_of_year",
    "week_of_year",
    "is_weekend",
    "is_month_start",
    "is_month_end",

    # Cyclical
    "month_sin",
    "month_cos",
    "dow_sin",
    "dow_cos",
    "year_sin",
    "year_cos",

    # Short / medium lags
    *[
        f"lag_{lag}"
        for lag in short_lags
    ],

    # YOY lags
    "lag_364",
    "lag_365",
    "lag_366",

    # Rolling means
    *[
        f"rolling_mean_{window}"
        for window in [
            7,
            14,
            21,
            28,
            42,
            56,
            84
        ]
    ],

    # Rolling median
    "rolling_median_7",
    "rolling_median_14",
    "rolling_median_28",
    "rolling_median_56",

    # Rolling std
    *[
        f"rolling_std_{window}"
        for window in [
            7,
            14,
            28,
            56,
            84
        ]
    ],

    # EWM
    "ewm_7",
    "ewm_14",
    "ewm_28",
    "ewm_56",

    # Difference
    "diff_1",
    "diff_7",
    "diff_28",

    # YOY
    "yoy_avg",
    "yoy_weekday_ratio",
    "yoy_change_364",
    "yoy_change_365",

    # Same weekday
    "weekday_mean_4weeks",
    "weekday_mean_8weeks",

    # Momentum
    "short_long_ratio",
    "momentum_7",
    "momentum_28",
    "mean_change_7_28",
    "mean_change_28_84",
    "volatility_ratio",

    # Promotion history
    "promotion_lag_1",
    "promotion_lag_7",
    "promotion_mean_7",
    "promotion_mean_28",

    # Transaction history
    "transactions_lag_1",
    "transactions_lag_7",
    "transactions_mean_7",
    "transactions_mean_28",

    # Trend
    "trend"
]


TARGET = "sales"


# ============================================================
# CHECK FEATURES
# ============================================================

missing_features = [
    col
    for col in FEATURES
    if col not in df.columns
]

if missing_features:

    raise ValueError(
        "Missing features:\n"
        +
        "\n".join(
            missing_features
        )
    )


# ============================================================
# CLEAN
# ============================================================

df = df.replace(
    [np.inf, -np.inf],
    np.nan
)

before = len(df)

df = (
    df
    .dropna(
        subset=FEATURES + [TARGET]
    )
    .reset_index(drop=True)
)

print(
    f"\nRows used for modelling: "
    f"{len(df):,}"
)

print(
    f"Rows removed: "
    f"{before - len(df):,}"
)


# ============================================================
# FINAL 60-DAY VALIDATION
# ============================================================

split_index = (
    len(df)
    -
    VALIDATION_DAYS
)

train_df = (
    df
    .iloc[:split_index]
    .copy()
)

valid_df = (
    df
    .iloc[split_index:]
    .copy()
)

X_train = train_df[FEATURES]
y_train = train_df[TARGET]

X_valid = valid_df[FEATURES]
y_valid = valid_df[TARGET]


print("\n" + "=" * 82)
print("TIME-SERIES VALIDATION")
print("=" * 82)

print(
    "Training:",
    train_df["date"].min().date(),
    "->",
    train_df["date"].max().date()
)

print(
    "Validation:",
    valid_df["date"].min().date(),
    "->",
    valid_df["date"].max().date()
)


# ============================================================
# METRICS
# ============================================================

def calculate_metrics(
    actual,
    predicted
):

    actual = np.asarray(
        actual
    )

    predicted = np.maximum(
        np.asarray(predicted),
        0
    )

    mae = mean_absolute_error(
        actual,
        predicted
    )

    rmse = np.sqrt(
        mean_squared_error(
            actual,
            predicted
        )
    )

    r2 = r2_score(
        actual,
        predicted
    )

    mask = actual != 0

    mape = (
        np.mean(
            np.abs(
                (
                    actual[mask]
                    -
                    predicted[mask]
                )
                /
                actual[mask]
            )
        )
        * 100
    )

    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "MAPE": float(mape),
        "R2": float(r2)
    }


# ============================================================
# SEASONAL HGB C
# ============================================================

print("\n" + "=" * 82)
print("TRAINING SEASONAL HGB C")
print("=" * 82)

model = HistGradientBoostingRegressor(

    learning_rate=0.03,

    max_iter=750,

    max_leaf_nodes=31,

    min_samples_leaf=15,

    l2_regularization=1.5,

    early_stopping=False,

    random_state=RANDOM_STATE
)


print("\nConfiguration:")

print(
    "learning_rate      : 0.03"
)

print(
    "max_iter            : 750"
)

print(
    "max_leaf_nodes      : 31"
)

print(
    "min_samples_leaf    : 15"
)

print(
    "l2_regularization   : 1.5"
)


print("\nTraining model...")

model.fit(
    X_train,
    y_train
)


# ============================================================
# PREDICT
# ============================================================

print(
    "\nPredicting final 60 days..."
)

prediction = model.predict(
    X_valid
)

prediction = np.maximum(
    prediction,
    0
)


# ============================================================
# EVALUATE
# ============================================================

result = calculate_metrics(
    y_valid,
    prediction
)


print("\n" + "=" * 82)
print("SEASONAL HGB C RESULTS")
print("=" * 82)

print(
    f"R²   : {result['R2']:.6f}"
)

print(
    f"MAPE : {result['MAPE']:.2f}%"
)

print(
    f"MAE  : {result['MAE']:,.2f}"
)

print(
    f"RMSE : {result['RMSE']:,.2f}"
)


# ============================================================
# BENCHMARK COMPARISON
# ============================================================

r2_change = (
    result["R2"]
    -
    BENCHMARK_R2
)

mape_change = (
    result["MAPE"]
    -
    BENCHMARK_MAPE
)

rmse_change = (
    result["RMSE"]
    -
    BENCHMARK_RMSE
)

print("\n" + "=" * 82)
print("BENCHMARK COMPARISON")
print("=" * 82)

print(
    f"Benchmark R² : "
    f"{BENCHMARK_R2:.4f}"
)

print(
    f"New R²       : "
    f"{result['R2']:.4f}"
)

print(
    f"R² Change    : "
    f"{r2_change:+.4f}"
)

print(
    f"\nBenchmark MAPE : "
    f"{BENCHMARK_MAPE:.2f}%"
)

print(
    f"New MAPE       : "
    f"{result['MAPE']:.2f}%"
)

print(
    f"MAPE Change    : "
    f"{mape_change:+.2f} pp"
)

print(
    f"\nBenchmark RMSE : "
    f"{BENCHMARK_RMSE:,.2f}"
)

print(
    f"New RMSE       : "
    f"{result['RMSE']:,.2f}"
)

print(
    f"RMSE Change    : "
    f"{rmse_change:+,.2f}"
)


# ============================================================
# SAVE MODEL
# ============================================================

package = {

    "type":
        "seasonal_hgb_c",

    "model":
        model,

    "features":
        FEATURES,

    "best_model":
        "SEASON_HGB_C",

    "metrics":
        result,

    "validation_days":
        VALIDATION_DAYS,

    "validation_start":
        str(
            valid_df["date"]
            .min()
            .date()
        ),

    "validation_end":
        str(
            valid_df["date"]
            .max()
            .date()
        ),

    "configuration": {

        "learning_rate":
            0.03,

        "max_iter":
            750,

        "max_leaf_nodes":
            31,

        "min_samples_leaf":
            15,

        "l2_regularization":
            1.5
    },

    "benchmark": {

        "R2":
            BENCHMARK_R2,

        "MAPE":
            BENCHMARK_MAPE,

        "RMSE":
            BENCHMARK_RMSE
    }
}


joblib.dump(
    package,
    MODEL_FILE
)


# ============================================================
# SAVE PREDICTIONS
# ============================================================

comparison = pd.DataFrame({

    "date":
        valid_df[
            "date"
        ].values,

    "actual_sales":
        y_valid.values,

    "predicted_sales":
        prediction,

    "absolute_error":
        np.abs(
            y_valid.values
            -
            prediction
        )
})


comparison.to_csv(
    PREDICTION_FILE,
    index=False
)


# ============================================================
# SAVE METRICS
# ============================================================

output = {

    "model":
        "SEASON_HGB_C",

    "metrics":
        result,

    "benchmark":
        {
            "R2":
                BENCHMARK_R2,

            "MAPE":
                BENCHMARK_MAPE,

            "RMSE":
                BENCHMARK_RMSE
        },

    "improvement":
        {
            "R2":
                r2_change,

            "MAPE":
                mape_change,

            "RMSE":
                rmse_change
        },

    "features":
        FEATURES,

    "configuration":
        {
            "learning_rate":
                0.03,

            "max_iter":
                750,

            "max_leaf_nodes":
                31,

            "min_samples_leaf":
                15,

            "l2_regularization":
                1.5
        },

    "validation":
        {
            "days":
                VALIDATION_DAYS,

            "start":
                str(
                    valid_df[
                        "date"
                    ]
                    .min()
                    .date()
                ),

            "end":
                str(
                    valid_df[
                        "date"
                    ]
                    .max()
                    .date()
                )
        }
    }


with open(
    METRICS_FILE,
    "w"
) as file:

    json.dump(
        output,
        file,
        indent=4
    )


# ============================================================
# FINAL DECISION
# ============================================================

print("\n" + "=" * 82)
print("FINAL DECISION")
print("=" * 82)

if result["R2"] >= 0.9560:

    print(
        "*** TARGET 0.9560 ACHIEVED ***"
    )

elif result["R2"] > BENCHMARK_R2:

    print(
        "*** NEW MODEL BEATS CURRENT BENCHMARK ***"
    )

else:

    print(
        "CURRENT BENCHMARK REMAINS STRONGER."
    )


print(
    f"\nFinal R²   : "
    f"{result['R2']:.6f}"
)

print(
    f"Final MAPE : "
    f"{result['MAPE']:.2f}%"
)

print(
    f"Final RMSE : "
    f"{result['RMSE']:,.2f}"
)

print(
    "\nModel saved:"
)

print(
    MODEL_FILE
)

print(
    "\nMetrics saved:"
)

print(
    METRICS_FILE
)

print(
    "\nPredictions saved:"
)

print(
    PREDICTION_FILE
)

print(
    "\nExisting production model was NOT overwritten."
)
