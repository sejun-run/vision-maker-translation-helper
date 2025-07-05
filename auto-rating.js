// auto-rating.js
// Auto-rating functionality for VM Helper extension

/**
 * Auto Rating Manager class
 */
class AutoRatingManager {
  constructor() {
    this.maxRetries = 2;
    this.retryDelay = VM_CONFIG.TIMING.AUTO_RATING_RETRY_DELAY;
    this.initialDelay = VM_CONFIG.TIMING.AUTO_RATING_DELAY;
  }

  /**
   * Handle auto rating when page loads with auto_helper parameter
   * @returns {Promise} Promise that resolves when auto rating is complete
   */
  async handleAutoRating() {
    console.log('VM Helper: Setting up auto rating...');
    
    try {
      // Wait for page to load, then try to click rating
      await this.delay(this.initialDelay);
      
      const success = await this.clickRatingWithRetry();
      
      if (success) {
        console.log('VM Helper: Auto rating completed successfully');
      } else {
        console.log('VM Helper: Auto rating failed after all retries');
      }
      
      return success;
    } catch (error) {
      ErrorUtils.logError('Auto rating', error);
      return false;
    }
  }

  /**
   * Click rating element with retry logic
   * @returns {Promise<boolean>} Success status
   */
  async clickRatingWithRetry() {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const success = await this.clickRating(attempt);
      
      if (success) {
        return true;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < this.maxRetries) {
        console.log(`VM Helper: Rating attempt ${attempt + 1} failed, retrying in ${this.retryDelay}ms...`);
        await this.delay(this.retryDelay);
      }
    }
    
    return false;
  }

  /**
   * Attempt to click the rating element
   * @param {number} attemptNumber - Current attempt number
   * @returns {Promise<boolean>} Success status
   */
  async clickRating(attemptNumber) {
    try {
      const ratingElement = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.RATING_ELEMENT);
      
      if (!ratingElement) {
        console.log(`VM Helper: Rating element not found (attempt ${attemptNumber + 1})`);
        return false;
      }

      // Check if element is visible and clickable
      if (!DOMUtils.isVisible(ratingElement)) {
        console.log(`VM Helper: Rating element not visible (attempt ${attemptNumber + 1})`);
        return false;
      }

      // Simulate click
      ratingElement.click();
      console.log(`VM Helper: Auto rating clicked successfully (attempt ${attemptNumber + 1})`);
      
      // Wait a bit to see if the click was processed
      await this.delay(500);
      
      // Verify the click was successful (you might want to add specific validation here)
      return this.validateRatingClick();
      
    } catch (error) {
      ErrorUtils.logError(`Auto rating attempt ${attemptNumber + 1}`, error);
      return false;
    }
  }

  /**
   * Validate that the rating click was successful
   * This is a placeholder - you might want to add specific validation logic
   * @returns {boolean} True if click appears to be successful
   */
  validateRatingClick() {
    // Basic validation - just check if element still exists and is clickable
    // You could add more sophisticated validation here based on page behavior
    const ratingElement = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.RATING_ELEMENT);
    return ratingElement !== null;
  }

  /**
   * Check if auto rating should be performed based on URL parameters
   * @returns {boolean} True if auto rating should be performed
   */
  shouldPerformAutoRating() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hasAutoHelper = urlParams.has('auto_helper');
      
      console.log('VM Helper: URL params check:', window.location.search);
      console.log('VM Helper: Should perform auto rating:', hasAutoHelper);
      
      return hasAutoHelper;
    } catch (error) {
      ErrorUtils.logError('Auto rating URL check', error);
      return false;
    }
  }

  /**
   * Utility method to create a delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rating element info for debugging
   * @returns {Object} Information about the rating element
   */
  getRatingElementInfo() {
    const element = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.RATING_ELEMENT);
    
    if (!element) {
      return { found: false };
    }

    const computedStyle = window.getComputedStyle(element);
    
    return {
      found: true,
      visible: DOMUtils.isVisible(element),
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      text: StringUtils.getTextContent(element),
      classList: Array.from(element.classList),
      boundingRect: element.getBoundingClientRect()
    };
  }

  /**
   * Manual rating trigger for testing/debugging
   * @returns {Promise<boolean>} Success status
   */
  async triggerManualRating() {
    console.log('VM Helper: Manually triggering rating...');
    
    const elementInfo = this.getRatingElementInfo();
    console.log('VM Helper: Rating element info:', elementInfo);
    
    return await this.clickRatingWithRetry();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoRatingManager;
}
