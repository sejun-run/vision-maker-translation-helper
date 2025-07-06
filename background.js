// background.js
// Background service worker for VM Helper extension - Enhanced version

/**
 * Background Script Manager for VM Helper
 */
class BackgroundManager {
  constructor() {
    this.initializeExtension();
  }

  /**
   * Initialize the extension background functionality
   */
  initializeExtension() {
    console.log('VM Helper Background: Initializing...');
    
    // Set up action click handler (for toolbar button only)
    this.setupActionHandler();
    
    // Set up message handler for content script communication
    this.setupMessageHandler();
    
    console.log('VM Helper Background: Initialization complete');
  }

  /**
   * Set up the action click handler for toolbar button
   */
  setupActionHandler() {
    // Check if chrome.action is available before using it
    if (!chrome.action || !chrome.action.onClicked) {
      console.error('VM Helper Background: chrome.action.onClicked is not available');
      return;
    }

    // Handle action clicks (toolbar button only)
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    console.log('VM Helper Background: Action handler set up');
  }

  /**
   * Handle action click events
   * @param {Object} tab - The active tab object
   */
  async handleActionClick(tab) {
    try {
      console.log('VM Helper Background: Action clicked for tab:', tab.id);

      // Validate tab
      if (!tab || !tab.id) {
        console.error('VM Helper Background: Invalid tab object');
        return;
      }

      // Check if tab URL is the letter translation page
      if (!this.isTargetDomain(tab.url)) {
        console.log('VM Helper Background: Not on letter translation page, ignoring');
        return;
      }

      // Execute the content script to show the helper
      await this.executeContentScript(tab.id);

    } catch (error) {
      console.error('VM Helper Background: Error handling action click:', error);
    }
  }

  /**
   * Check if the current URL is the letter translation page
   * @param {string} url - URL to check
   * @returns {boolean} True if on letter translation page
   */
  isTargetDomain(url) {
    if (!url) return false;
    return url.includes('letter.worldvision.or.kr') && url.includes('letterview.do');
  }

  /**
   * Execute content script to show the helper
   * @param {number} tabId - Tab ID to execute script in
   */
  async executeContentScript(tabId) {
    try {
      // Execute script to trigger the helper
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          // Call the global function to show VM Helper
          if (typeof window.showVMHelper === 'function') {
            window.showVMHelper();
          } else {
            console.error('VM Helper: showVMHelper function not available');
          }
        }
      });

      console.log('VM Helper Background: Content script executed successfully');

    } catch (error) {
      console.error('VM Helper Background: Failed to execute content script:', error);
      
      // Fallback: try to inject the content script files
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [
            'config.js',
            'utils.js', 
            'letter-templates.js',
            'ui-components.js',
            'auto-rating.js',
            'content.js'
          ]
        });
        console.log('VM Helper Background: Fallback content script injection successful');
      } catch (fallbackError) {
        console.error('VM Helper Background: Fallback content script injection failed:', fallbackError);
      }
    }
  }

  /**
   * Set up message handler for content script communication
   */
  setupMessageHandler() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      
      // Return true to indicate we will send a response asynchronously
      return true;
    });

    console.log('VM Helper Background: Message handler set up');
  }

  /**
   * Handle messages from content scripts
   * @param {Object} message - Message object
   * @param {Object} sender - Sender information
   * @param {Function} sendResponse - Response callback
   */
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('VM Helper Background: Received message:', message);

      // Handle different message types
      switch (message.action) {
        case 'openInNewTab':
          await this.handleOpenInNewTab(message, sendResponse);
          break;
          
        case 'log':
          this.handleLogMessage(message);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('VM Helper Background: Unknown message action:', message.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }

    } catch (error) {
      console.error('VM Helper Background: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Handle opening URL in new tab
   * @param {Object} message - Message with URL
   * @param {Function} sendResponse - Response callback
   */
  async handleOpenInNewTab(message, sendResponse) {
    try {
      if (!message.url) {
        throw new Error('URL is required for openInNewTab action');
      }

      // Validate URL is from expected domain
      if (!this.isTargetDomain(message.url)) {
        throw new Error('URL is not from allowed domain');
      }

      // Create new tab
      const tab = await chrome.tabs.create({
        url: message.url,
        active: true // Make the new tab active
      });

      console.log('VM Helper Background: New tab created with ID:', tab.id);
      console.log('VM Helper Background: Auto-helper will be triggered by URL parameter');

      sendResponse({ 
        success: true, 
        tabId: tab.id,
        message: 'Tab created successfully'
      });

    } catch (error) {
      console.error('VM Helper Background: Failed to open new tab:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Handle log messages from content scripts
   * @param {Object} message - Log message
   */
  handleLogMessage(message) {
    const { level = 'log', text, data } = message;
    
    // Forward log messages to background console with prefix
    console[level](`VM Helper Content: ${text}`, data || '');
  }
}

// Initialize the background manager when the service worker starts
new BackgroundManager();
