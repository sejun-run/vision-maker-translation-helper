// content.js
// Main content script for VM Helper extension - refactored for better maintainability

// Block all alert dialogs on the translation page
window.alert = function() { /* Blocked alert */ };

// Monitor URL changes and close tab if target URL is detected
const TARGET_URL = 'https://letter.worldvision.or.kr/mypage/letterlist/letterviewok.do';

// Track the last known URL
let lastUrl = location.href;

// Helper: Send closeTab message to background
function sendCloseTab(openerTabId = null) {
  chrome.runtime.sendMessage({ action: 'closeTab', openerTabId });
}


// Check if the current URL is the target and close if needed
function checkUrlAndCloseIfNeeded() {
  if (location.href === TARGET_URL) {
    // Try to get the opener tab ID (if available)
    let openerTabId = null;
    if (window.opener && window.opener.chrome && window.opener.chrome.tabs) {
      openerTabId = window.opener.tabId || null;
    }
    sendCloseTab(openerTabId);
  }
}

// Detect if the window is forcibly closed (for popup->tab conversion)
window.addEventListener('beforeunload', () => {
  // If the window is being closed, try to notify background
  sendCloseTab();
});


// Listen for history changes (pushState, replaceState, hashchange)
window.addEventListener('popstate', checkUrlAndCloseIfNeeded);
window.addEventListener('hashchange', checkUrlAndCloseIfNeeded);

// Poll for location changes (for SPA navigation)
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkUrlAndCloseIfNeeded();
  }
}, 500);

// Listen for form submit (letter_view)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[name="letter_view"]');
  if (form) {
    form.addEventListener('submit', function(e) {
      // Form is being submitted, but only act if on the target page
      setTimeout(() => {
        // Wait a tick for possible navigation/response
        checkUrlAndCloseIfNeeded();
      }, 100);
    });
  }
});

// MutationObserver: Watch for success alert or DOM changes (fallback)
const observer = new MutationObserver(() => {
  // Check for success message in DOM (if site ever changes to DOM-based alert)
  if (document.body && document.body.innerText.includes('번역완료 되었습니다.')) {
    sendCloseTab();
    observer.disconnect();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
/**
 * Main VM Helper class that coordinates all functionality
 */
class VMHelper {
  constructor() {
    this.uiManager = null;
    this.autoRatingManager = null;
    this.isInitialized = false;
    this.setupKeyboardShortcuts();
  }

  /**
   * Initialize the VM Helper
   * @returns {Promise} Promise that resolves when initialization is complete
   */
  async initialize() {
    console.log('VM Helper: Content script loaded');
    
    // Prevent multiple initializations
    if (this.isInitialized || document.getElementById('wv-helper-container')) {
      console.log('VM Helper: Already initialized, skipping');
      return;
    }

    try {
      // Initialize managers
      this.uiManager = new UIManager();
      this.autoRatingManager = new AutoRatingManager();
      
      // Always show floating button for easy access
      await this.uiManager.createFloatingButton();
      
      // Check if we should auto-run
      const shouldAutoRun = this.autoRatingManager.shouldPerformAutoRating();
      

      if (shouldAutoRun) {
        console.log('VM Helper: Auto helper parameter detected');
        await this.handleAutoMode();
      }
      // Always override alert to catch success message
      const originalAlert = window.alert;
      window.alert = function(message) {
        try {
          if (typeof message === 'string' && message.includes('번역완료')) {
            sendCloseTab();
          }
        } catch (e) {
          // Ignore errors
        }
        try {
          originalAlert.apply(window, arguments);
        } catch (e) {
          // Ignore errors
        }
      };
      // ...existing code...
      
      this.isInitialized = true;
      console.log('VM Helper: Initialization complete');
      
    } catch (error) {
      ErrorUtils.logError('VM Helper initialization', error);
      throw error;
    }
  }

  /**
   * Handle automatic mode (when auto_helper parameter is present)
   * @returns {Promise} Promise that resolves when auto mode handling is complete
   */
  async handleAutoMode() {
    try {
      // Show the helper UI
      await this.showHelper();
      
      // Perform auto rating
      await this.autoRatingManager.handleAutoRating();
      
      console.log('VM Helper: Auto mode completed');
    } catch (error) {
      ErrorUtils.logError('Auto mode handling', error);
    }
  }

  /**
   * Show the helper UI (called manually or automatically)
   * @returns {Promise} Promise that resolves when UI is shown
   */
  async showHelper() {
    try {
      if (!this.uiManager) {
        this.uiManager = new UIManager();
      }
      
      await this.uiManager.initialize();
      console.log('VM Helper: Helper UI shown');
    } catch (error) {
      ErrorUtils.logError('Show helper', error);
      ErrorUtils.showUserError('도우미를 표시하는 중 오류가 발생했습니다.', true);
    }
  }

  /**
   * Setup keyboard shortcuts for the helper
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Check for Alt+Shift+V
      const isShortcut = event.altKey && event.shiftKey && event.key === 'V';
      
      if (isShortcut) {
        event.preventDefault();
        event.stopPropagation();
        console.log('VM Helper: Keyboard shortcut triggered');
        this.showHelper();
      }
    }, true); // Use capture phase to ensure we catch the event first
  }

  /**
   * Get the current instance or create a new one
   * @returns {VMHelper} VM Helper instance
   */
  static getInstance() {
    if (!window.vmHelperInstance) {
      window.vmHelperInstance = new VMHelper();
    }
    return window.vmHelperInstance;
  }
}

// Initialize the helper when DOM is ready
(() => {

  // Wait for DOM to be ready and initialize
  const waitForDOM = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        VMHelper.getInstance().initialize();
      });
    } else {
      // DOM is already ready
      VMHelper.getInstance().initialize();
    }
  };

  // Start the initialization process
  waitForDOM();
})();

// Expose VMHelper to global scope for manual triggering (e.g., from background script)
window.showVMHelper = async () => {
  try {
    const vmHelper = VMHelper.getInstance();
    await vmHelper.showHelper();
  } catch (error) {
    console.error('VM Helper: Failed to show helper manually:', error);
  }
};
