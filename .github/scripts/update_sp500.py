import yfinance as yf
import pandas as pd
from datetime import datetime

ticker = yf.Ticker("^GSPC")
hist = ticker.history(period="1mo")

if hist.empty:
    raise Exception("No data received from Yahoo Finance.")

last = hist.tail(1).iloc[0]
closing = round(last["Close"], 2)
date = last.name.strftime("%d/%m/%Y")

csv_path = "public/data/sp500_data.csv"
df = pd.read_csv(csv_path)

if not df['Month'].astype(str).str.contains(date).any():
    df = pd.concat([df, pd.DataFrame([{"Month": date, "Closing": closing}])], ignore_index=True)
    df.to_csv(csv_path, index=False)
    print(f"Added new row: {date}, {closing}")
else:
    print(f"Data for {date} already exists.")
