chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchTradesFile") {
    fetch(chrome.runtime.getURL('investments.trades'))
      .then(response => response.text())
      .then(text => {
        chrome.storage.local.set({ trades: text }, () => {
          sendResponse({ status: "Trades file fetched and stored" });
        });
      })
      .catch(error => {
        console.error('Failed to fetch trades file:', error);
        sendResponse({ status: "Error fetching trades file" });
      });
    return true; // Keep the message channel open for sendResponse
  } else if (request.action === "getCumulativeValue") {
    chrome.storage.local.get('trades', (result) => {
      const tradesText = result.trades;
      if (tradesText) {
        const tradesData = parseTrades(tradesText);
        const investments = calculateInvestmentData(tradesData);
        const cumulativeValues = calculateCumulativeValues(investments);
        sendResponse({ cumulativeValues: cumulativeValues });
      } else {
        sendResponse({ cumulativeValues: null });
      }
    });
    return true; // Keep the message channel open for sendResponse
  } else if (request.action === "getTradesFilePath") {
    sendResponse({ filePath: chrome.runtime.getURL('investments.trades') });
  }
});

function parseTrades(tradesText) {
  const lines = tradesText.split('\n');
  const trades = {};
  const prices = {};

  lines.forEach(line => {
    line = line.trim();
    if (line.length === 0 || line.startsWith('#')) return;

    if (line.startsWith('%')) {
      const parts = line.split(' ');
      const date = parts[1]; // date is the second element
      const symbol = parts[2];
      const price = parseFloat(parts[3].replace(/[^\d.-]/g, ''));
      const currency = parts[4];

      if (!prices[symbol]) prices[symbol] = [];
      prices[symbol].push({ date, price, currency });
      return;
    }

    const parts = line.split(' ');
    const date = parts[0];
    const shares = parseInt(parts[2]);
    const symbol = parts[3];
    const costMatch = line.match(/\{([\d.]+)\s(\w+)\}/);

    if (!costMatch) {
      console.error('Failed to parse cost and currency from line:', line);
      return;
    }

    const cost = parseFloat(costMatch[1]);
    const currency = costMatch[2];

    const trade = {
      date,
      shares,
      symbol,
      cost,
      currency
    };

    if (!trades[symbol]) {
      trades[symbol] = [];
    }
    trades[symbol].push(trade);
  });

  return { trades, prices };
}

function calculateInvestmentData(tradesData) {
  const { trades, prices } = tradesData;
  const investments = {};

  for (const symbol in trades) {
    const symbolTrades = trades[symbol];
    let totalShares = 0;
    let totalCost = 0;
    let currency = symbolTrades[0].currency;

    symbolTrades.forEach(trade => {
      if (trade.shares > 0) {
        // Buying shares
        totalShares += trade.shares;
        totalCost += trade.shares * trade.cost;
      } else {
        // Selling shares
        totalShares += trade.shares; // trade.shares is negative here
        totalCost += trade.shares * trade.cost; // deducting cost of sold shares (trade.shares is negative)
      }
    });

    const averageCost = totalShares > 0 ? totalCost / totalShares : 0;
    const latestPrice = prices[symbol] && prices[symbol][prices[symbol].length - 1].price;
    const currentValue = latestPrice ? latestPrice * totalShares : totalCost;
    const profit = latestPrice ? (latestPrice - averageCost) * totalShares : 0;

    investments[symbol] = {
      shares: totalShares,
      cost: averageCost,
      currency: currency,
      currentPrice: latestPrice,
      currentValue: currentValue,
      profit: profit
    };
  }

  return investments;
}

function calculateCumulativeValues(investments) {
  const cumulativeValues = {};

  for (const symbol in investments) {
    const { currentValue, currency } = investments[symbol];
    if (!cumulativeValues[currency]) {
      cumulativeValues[currency] = 0;
    }
    cumulativeValues[currency] += currentValue;
  }

  for (const currency in cumulativeValues) {
    cumulativeValues[currency] = cumulativeValues[currency].toFixed(2);
  }

  return cumulativeValues;
}
