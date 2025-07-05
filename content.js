// content.js
// Main content script for VM Helper extension - refactored for better maintainability

/**
 * Main VM Helper class that coordinates all functionality
 */
class VMHelper {
  constructor() {
    this.uiManager = null;
    this.autoRatingManager = null;
    this.isInitialized = false;
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
      } else {
        console.log('VM Helper: Manual mode - floating button ready for user interaction');
      }
      
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
