let enabled = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleExtension") {
    enabled = request.enabled;
    if (enabled) {
      main();
    } else {
      clearPreviousData();
    }
    sendResponse({ status: `Extension ${enabled ? 'enabled' : 'disabled'}` });
  } else if (request.action === "refreshData") {
    if (enabled) {
      main();
    }
    sendResponse({ status: 'Data refreshed' });
  } else if (request.action === "getCumulativeValue") {
    fetchTrades().then(tradesData => {
      const investments = calculateInvestmentData(tradesData);
      const cumulativeValues = calculateCumulativeValues(investments);
      sendResponse({ cumulativeValues: cumulativeValues });
    });
    return true; // Keep the message channel open for sendResponse
  }
});

async function fetchTrades() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "fetchTradesFile" }, response => {
      if (response.status === "Trades file fetched and stored") {
        chrome.storage.local.get('trades', (result) => {
          resolve(parseTrades(result.trades));
        });
      } else {
        console.error('Failed to fetch trades file');
        resolve({});
      }
    });
  });
}

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

function clearPreviousData() {
  document.querySelectorAll('.injected-investment').forEach(element => {
    element.remove();
  });
}

function injectInvestmentData(investments) {
  clearPreviousData(); // Clear any previously injected data

  document.querySelectorAll('.label-investment').forEach(element => {
    const parentRow = element.closest('tr');
    if (!parentRow) return;

    const symbolElement = parentRow.querySelector('.ellipsis span');
    if (!symbolElement) {
      console.log('No symbol element found in row:', parentRow);
      return;
    }
    const symbol = symbolElement.textContent.trim();
    const investment = investments[symbol];

    if (investment) {
      console.log(`Injecting data for symbol: ${symbol}`, investment);

      const cellMetadataElements = parentRow.querySelectorAll('.cell-metadata');
      cellMetadataElements.forEach(cellMetadata => {
        const primaryValueSpan = cellMetadata.querySelector('.no-wrap.primary');
        if (primaryValueSpan) {
          primaryValueSpan.textContent = `${investment.currency} ${investment.currentValue.toFixed(2)}`;
          console.log(`Updated primary value span for ${symbol} to ${primaryValueSpan.textContent}`);
        }
      });

      // Map asset-price-XXXXXX with symbol
      document.querySelectorAll('.transaction-details .transaction-detail').forEach(detail => {
        const displayNameInput = detail.querySelector('input#display-name');
        if (displayNameInput && displayNameInput.value.trim() === symbol) {
          const priceInput = detail.querySelector(`input[id^='asset-price-']`);
          if (priceInput) {
            priceInput.value = investment.currentValue.toFixed(2);
            console.log(`Updated price input for ${symbol} to ${priceInput.value}`);
          }
        }
      });

      // Check if already exists and update or create new span
      let investmentSpan = parentRow.querySelector('.injected-investment');
      if (!investmentSpan) {
        investmentSpan = document.createElement('span');
        investmentSpan.className = 'no-wrap secondary display--block injected-investment';
        parentRow.querySelector('.cell-metadata').appendChild(investmentSpan);
      }

      const currentPriceText = investment.currentPrice ? `${investment.currentPrice} ${investment.currency}` : 'N/A';
      const profitText = investment.profit ? `${investment.profit.toFixed(2)} ${investment.currency}` : 'N/A';
      const profitColor = investment.profit >= 0 ? "rgb(59, 209, 130)" : "rgb(249, 93, 106)";

      investmentSpan.innerHTML = `<i aria-hidden="true" class="yellow exchange fitted icon"></i> 
      <span class="darker">${investment.shares} Shares @ ${investment.cost.toFixed(2)} ${investment.currency} 
      <span style="color: #FBB700">&rarr;</span> 
      <span style="color: ${profitColor}">${profitText} @ ${currentPriceText}</span></span>`;
      console.log(`Updated or created investment span for ${symbol}`);
    } else {
      console.log(`No investment data found for symbol: ${symbol}`);
    }
  });
}

function injectTrades(tradesData) {
  const displayNameInput = document.querySelector('input#display-name');
  if (!displayNameInput) return;

  const symbol = displayNameInput.value.trim();
  if (!symbol) return;

  const trades = tradesData.trades[symbol];
  if (!trades) return;

  const transactionDetail = Array.from(document.querySelectorAll('.transaction-detail')).find(detail => 
    detail.querySelector('label') && detail.querySelector('label').textContent.includes('Balance last updated')
  );
  if (!transactionDetail) return;

  const label = transactionDetail.querySelector('label');
  if (label) label.textContent = 'Trades';

  const tradesList = document.createElement('div');
  trades.forEach(trade => {
    const tradeDiv = document.createElement('div');
    tradeDiv.textContent = `${trade.date} ${trade.shares > 0 ? 'Bought' : 'Sold'} ${Math.abs(trade.shares)} shares @ ${trade.cost} ${trade.currency}`;
    tradesList.appendChild(tradeDiv);
  });

  const span = transactionDetail.querySelector('span');
  if (span) {
    span.innerHTML = ''; // Clear existing content
    span.appendChild(tradesList);
  }

  const investments = calculateInvestmentData(tradesData);
  const investment = investments[symbol];
  if (investment) {
    const currentPriceText = investment.currentPrice ? `${investment.currentPrice} ${investment.currency}` : 'N/A';
    const profitText = investment.profit ? `${investment.profit.toFixed(2)} ${investment.currency}` : 'N/A';
    const profitColor = investment.profit >= 0 ? "rgb(59, 209, 130)" : "rgb(249, 93, 106)";

    const currentValueLabel = document.createElement('label');
    currentValueLabel.textContent = 'Current Value';
    transactionDetail.appendChild(currentValueLabel);

    const currentValueSpan = document.createElement('span');
    currentValueSpan.innerHTML = `Current: ${profitText} @ ${currentPriceText} = ${investment.currentValue.toFixed(2)}`;
    transactionDetail.appendChild(currentValueSpan);
  }
}

async function main() {
  const tradesData = await fetchTrades();
  const investments = calculateInvestmentData(tradesData);
  injectInvestmentData(investments);
  injectTrades(tradesData);
}

window.addEventListener('load', () => {
  if (window.location.pathname === '/accounts') {
    // Load the toggle state from storage
    chrome.storage.local.get('extensionEnabled', (result) => {
      enabled = result.extensionEnabled || false;
      if (enabled) {
        main();
      }
    });
  }
});
