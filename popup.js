document.addEventListener('DOMContentLoaded', () => {
  const extensionToggle = document.getElementById('extension-toggle');
  const refreshButton = document.getElementById('refresh');
  const cumulativeValueDiv = document.getElementById('cumulative-value');

  // Load the toggle state from storage
  chrome.storage.local.get('extensionEnabled', (result) => {
    extensionToggle.checked = result.extensionEnabled || false;
  });

  // Handle extension toggle state change
  extensionToggle.addEventListener('change', () => {
    const enabled = extensionToggle.checked;
    chrome.storage.local.set({ extensionEnabled: enabled }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: 'toggleExtension', enabled }, (response) => {
          console.log(response.status);
        });
      });
    });
  });

  // Handle refresh button click
  refreshButton.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { action: 'refreshData' }, (response) => {
        console.log(response.status);
        updateCumulativeValues();
      });
    });
  });

  // Update cumulative values on popup load
  updateCumulativeValues();

  function updateCumulativeValues() {
    chrome.runtime.sendMessage({ action: "getCumulativeValue" }, (response) => {
      if (response && response.cumulativeValues) {
        cumulativeValueDiv.innerHTML = ''; // Clear existing content
        for (const [currency, value] of Object.entries(response.cumulativeValues)) {
          const valueElement = document.createElement('div');
          valueElement.textContent = `Cumulative Value (${currency}): ${value}`;
          cumulativeValueDiv.appendChild(valueElement);
        }
      } else {
        cumulativeValueDiv.textContent = 'Failed to fetch cumulative values';
      }
    });
  }
});
