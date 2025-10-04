// Background script for handling extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Form Helper Extension Installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('[Content Script]:', request.message);
  }
  return true;
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Enable side panel to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  // Ignore errors in older Chrome versions
  console.log('Side panel behavior setting not supported:', error);
});