# Lunch Money Stock Tracker

Lunch Money Stock Tracker is a temporary Chrome extension that helps you track your stock investments directly within the Lunch Money app. It provides and calculates the cumulative value of your investments.

## Features

- Toggle the extension on and off from the popup.
- Refresh investment data without reloading the page.
- Display cumulative values of investments by currency.
- Show detailed investment data including current prices and profit/loss.

## Installation

1. Clone this repository to your local machine.
2. Open any Chromium based browser and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle switch in the top right corner.
4. Click the "Load unpacked" button and select the directory where you cloned this repository.

## Usage

1. Click the Lunch Money Stock Tracker extension icon in the Chrome toolbar to open the popup.
2. Use the toggle switch to enable or disable the extension.
3. Click the "Refresh" button to refresh investment data without reloading the page.
4. View the cumulative value of your investments in the popup.

## Files

- **investments.trades**: Sample file containing trades and prices data for the extension to process; Format loosely based on Beancount. Please make sure that the Display Name mathced the Ticker Symbol in `YYYY-MM-DD * SHARES TICKER {PRICE CURRENCY}`


## Example `investments.trades`

```plaintext

#FORMAT
  #Trades
    # YYYY-MM-DD * SHARES DISPLAY_NAME {PRICE CURRENCY} --> Buy
    # YYYY-MM-DD * -SHARES DISPLAY_NAME {PRICE CURRENCY} --> Sell
  #Prices
    # % YYYY-MM-DD DISPLAY_NAME PRICE CURRENCY
#Trades

2023-02-23 * 1000 LCID {2.9 USD}
2023-03-28 * 1000 BDRX {1.4500 USD}
2023-06-01 * 200 IBIT {24.66 USD}
2023-07-15 * 500 AAPL {150.0 USD}
2023-08-20 * 300 TSLA {700.0 USD}
2023-09-10 * 400 MSFT {250.0 USD}
2023-10-05 * 100 GOOGL {2800.0 USD}
2023-11-01 * 600 SAP {120.0 EUR}
2023-12-01 * 800 BMW {90.0 EUR}
2024-01-10 * 100 SHOP {1500.0 CAD}
2024-02-15 * 200 RY {120.0 CAD}
2024-03-01 * -100 LCID {2.7 USD}
2024-03-15 * -500 BDRX {0.95 USD}
2024-04-01 * 300 NFLX {400.0 USD}
2024-04-20 * -200 TSLA {720.0 USD}
2024-05-05 * 150 AMZN {3300.0 USD}
2024-05-20 * -50 AAPL {160.0 USD}
2024-06-01 * 100 ORCL {85.0 USD}
2024-06-15 * -300 MSFT {260.0 USD}
2024-06-20 * 200 ADYEN {1450.0 EUR}
2024-06-25 * -150 SAP {135.0 EUR}
2024-06-27 * 500 VW {190.0 EUR}
2024-06-28 * -100 BMW {100.0 EUR}
2024-06-29 * 50 TCEHY {550.0 HKD}
2024-06-30 * 100 SHOP {1600.0 CAD}
2024-06-30 * -3 RY {100.0 CAD}
2024-06-30 * 200 TD {85.0 CAD}

# Prices
  # USD
% 2024-06-25 LCID 2.6560 USD
% 2024-06-25 BDRX 0.8930 USD 
% 2024-06-25 IBIT 35.23 USD
% 2024-06-25 IBIT 35.02 USD 
% 2024-06-25 IBIT 34.98 USD 
% 2024-06-25 LCID 2.67 USD 
% 2024-06-25 BDRX 0.87 USD
% 2024-06-26 LCID 2.61 USD
% 2024-06-26 BDRX 0.9 USD
% 2024-06-26 IBIT 34.14 USD
% 2024-06-27 AAPL 155.0 USD
% 2024-06-27 TSLA 710.0 USD
% 2024-06-27 MSFT 255.0 USD
% 2024-06-27 GOOGL 2820.0 USD
% 2024-06-28 NFLX 405.0 USD
% 2024-06-28 AMZN 3400.0 USD
% 2024-06-28 ORCL 90.0 USD
% 2024-06-29 ADYEN 1470.0 USD
% 2024-06-29 TCEHY 560.0 USD

  # EUR
% 2024-06-25 SAP 125.0 EUR
% 2024-06-25 BMW 95.0 EUR
% 2024-06-26 SAP 130.0 EUR
% 2024-06-26 BMW 93.0 EUR
% 2024-06-27 ADYEN 1470.0 EUR
% 2024-06-27 VW 195.0 EUR
% 2024-06-28 BMW 100.0 EUR
% 2024-06-28 SAP 140.0 EUR

  # CAD
% 2024-06-25 SHOP 1550.0 CAD
% 2024-06-25 RY 125.0 CAD
% 2024-06-26 SHOP 1570.0 CAD
% 2024-06-26 RY 123.0 CAD
% 2024-06-27 TD 90.0 CAD
% 2024-06-27 SHOP 1600.0 CAD
% 2024-06-28 RY 128.0 CAD
% 2024-06-28 TD 88.0 CAD

```

## Limitations

- Manual Prices: Currently, the extension requires users to manually input their trades and prices into the `investments.trades` file. This means users need to keep the file updated with their latest transactions and price data for accurate calculations. While this approach provides flexibility, it also adds a layer of manual effort and can be prone to errors if the data is not kept up-to-date.

-Passive Calculations: The calculations performed by the extension are passive and not persistent. This means that the extension processes and displays investment data in real-time based on the current state of the `investments.trades` file. However, these calculations are not stored or recorded anywhere. Each time the extension is loaded or refreshed, it recalculates everything from scratch. This approach does not provide a historical record of past calculations or changes over time.