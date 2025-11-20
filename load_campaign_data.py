"""Utilities for loading the Products Campaign Excel report accurately."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Any

import pandas as pd

# Columns that should be treated as numeric. We will coerce them below so that they
# are represented as numbers rather than strings when converting to JSON.
NUMERIC_COLUMNS = [
    "Impressions",
    "Last Year Impressions",
    "Clicks",
    "Last Year Clicks",
    "Spend",
    "Last Year Spend",
    "Cost Per Click (CPC)",
    "Last Year Cost Per Click (CPC)",
    "7 Day Total Orders (#)",
    "Total Advertising Cost of Sales (ACOS)",
    "Total Return on Advertising Spend (ROAS)",
    "7 Day Total Sales",
]


def load_campaign_data() -> List[Dict[str, Any]]:
    """Load the campaign report with the correct headers and numeric types."""
    excel_path = Path(__file__).resolve().parent / "Products Campaign.xlsx"

    # The first row in Products Campaign.xlsx is a blank spacer row. Using
    # ``header=1`` (0-based index) tells pandas to use the second row for column
    # names so that we align perfectly with the headers shown in Excel.
    df = pd.read_excel(excel_path, header=1, engine="openpyxl")

    # Drop only columns that are completely empty while keeping all data rows.
    df = df.dropna(axis=1, how="all")

    for column in NUMERIC_COLUMNS:
        if column in df.columns:
            df[column] = pd.to_numeric(df[column], errors="coerce")

    return df.to_dict(orient="records")


if __name__ == "__main__":
    records = load_campaign_data()
    df_preview = pd.DataFrame(records)
    print(f"Rows: {len(df_preview)} | Columns: {len(df_preview.columns)}")
    print(json.dumps(records[:3], indent=2, default=str))
