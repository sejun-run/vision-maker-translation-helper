// utils.js
// Utility functions for VM Helper extension

/**
 * DOM utility functions
 */
const DOMUtils = {
  /**
   * Safely query selector with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Found element or null
   */
  safeQuerySelector(selector, context = document) {
    try {
      return context.querySelector(selector);
    } catch (error) {
      console.error('VM Helper: Invalid selector:', selector, error);
      return null;
    }
  },

  /**
   * Safely query all selectors with error handling
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {NodeList} Found elements or empty NodeList
   */
  safeQuerySelectorAll(selector, context = document) {
    try {
      return context.querySelectorAll(selector);
    } catch (error) {
      console.error('VM Helper: Invalid selector:', selector, error);
      return [];
    }
  },

  /**
   * Create element with attributes and styles
   * @param {string} tag - HTML tag name
   * @param {Object} attributes - Element attributes
   * @param {Object} styles - CSS styles
   * @returns {Element} Created element
   */
  createElement(tag, attributes = {}, styles = {}) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'innerHTML') {
        element.innerHTML = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Set styles
    Object.assign(element.style, styles);
    
    return element;
  },

  /**
   * Check if element exists and is visible
   * @param {Element} element - Element to check
   * @returns {boolean} True if element exists and is visible
   */
  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
};

/**
 * String utility functions
 */
const StringUtils = {
  /**
   * Extract name from formatted text (removes parentheses and extra info)
   * @param {string} text - Text containing name
   * @returns {string|null} Extracted name or null
   */
  extractName(text) {
    if (!text || typeof text !== 'string') return null;
    
    const regex = /,\s*([^()]+)(?:\s*\([^)]*\))?$/;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  },

  /**
   * Safely get text content from element
   * @param {Element} element - Element to get text from
   * @returns {string} Text content or empty string
   */
  getTextContent(element) {
    return element ? element.textContent.trim() : '';
  },

  /**
   * Validate required string fields
   * @param {Object} fields - Object with field names and values
   * @returns {Object} Validation result with isValid and missing fields
   */
  validateRequiredFields(fields) {
    const missing = [];
    
    Object.entries(fields).forEach(([name, value]) => {
      if (!value || typeof value !== 'string' || value.trim() === '') {
        missing.push(name);
      }
    });
    
    return {
      isValid: missing.length === 0,
      missing: missing
    };
  }
};

/**
 * Animation utility functions
 */
const AnimationUtils = {
  /**
   * Animate element with CSS transitions
   * @param {Element} element - Element to animate
   * @param {Object} fromStyles - Starting styles
   * @param {Object} toStyles - Ending styles
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  transition(element, fromStyles, toStyles, duration = 300) {
    return new Promise((resolve) => {
      // Set initial styles
      Object.assign(element.style, fromStyles);
      
      // Set transition
      element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
      
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        Object.assign(element.style, toStyles);
        
        // Resolve promise when animation completes
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  },

  /**
   * Slide in animation
   * @param {Element} element - Element to animate
   * @param {string} direction - Direction ('up', 'down', 'left', 'right')
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  slideIn(element, direction = 'up', duration = 300) {
    const transforms = {
      up: 'translateY(100%)',
      down: 'translateY(-100%)',
      left: 'translateX(100%)',
      right: 'translateX(-100%)'
    };
    
    return this.transition(
      element,
      { transform: transforms[direction], opacity: '0' },
      { transform: 'translate(0)', opacity: '1' },
      duration
    );
  },

  /**
   * Slide out animation
   * @param {Element} element - Element to animate
   * @param {string} direction - Direction ('up', 'down', 'left', 'right')
   * @param {number} duration - Animation duration in ms
   * @returns {Promise} Promise that resolves when animation completes
   */
  slideOut(element, direction = 'down', duration = 300) {
    const transforms = {
      up: 'translateY(-100%)',
      down: 'translateY(100%)',
      left: 'translateX(-100%)',
      right: 'translateX(100%)'
    };
    
    return this.transition(
      element,
      { transform: 'translate(0)', opacity: '1' },
      { transform: transforms[direction], opacity: '0' },
      duration
    );
  }
};

/**
 * Error handling utilities
 */
const ErrorUtils = {
  /**
   * Log error with context information
   * @param {string} context - Context where error occurred
   * @param {Error|string} error - Error object or message
   * @param {Object} additionalInfo - Additional debug information
   */
  logError(context, error, additionalInfo = {}) {
    const errorMessage = error instanceof Error ? error.message : error;
    console.error(`VM Helper [${context}]:`, errorMessage, additionalInfo);
  },

  /**
   * Show user-friendly error message
   * @param {string} message - Error message to show user
   * @param {boolean} includeContactInfo - Whether to include contact information
   */
  showUserError(message, includeContactInfo = false) {
    let fullMessage = message;
    if (includeContactInfo) {
      fullMessage += '\n\n문제가 지속되면 개발자에게 문의해주세요.';
    }
    alert(fullMessage);
  },

  /**
   * Safely execute function with error handling
   * @param {Function} fn - Function to execute
   * @param {string} context - Context for error logging
   * @param {*} fallbackValue - Value to return on error
   * @returns {*} Function result or fallback value
   */
  safeExecute(fn, context, fallbackValue = null) {
    try {
      return fn();
    } catch (error) {
      this.logError(context, error);
      return fallbackValue;
    }
  }
};

/**
 * Chrome extension utilities
 */
const ChromeUtils = {
  /**
   * Check if Chrome extension APIs are available
   * @returns {boolean} True if Chrome APIs are available
   */
  isExtensionContext() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  },

  /**
   * Get extension resource URL safely
   * @param {string} path - Resource path
   * @returns {string|null} Resource URL or null if not available
   */
  getResourceURL(path) {
    if (!this.isExtensionContext()) return null;
    
    try {
      return chrome.runtime.getURL(path);
    } catch (error) {
      ErrorUtils.logError('getResourceURL', error, { path });
      return null;
    }
  },

  /**
   * Send message to background script safely
   * @param {Object} message - Message to send
   * @param {Function} callback - Callback function
   */
  sendMessage(message, callback) {
    if (!this.isExtensionContext()) {
      ErrorUtils.logError('sendMessage', 'Extension context not available');
      return;
    }
    
    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          ErrorUtils.logError('sendMessage', chrome.runtime.lastError.message);
        } else if (callback) {
          callback(response);
        }
      });
    } catch (error) {
      ErrorUtils.logError('sendMessage', error, { message });
    }
  }
};

// Export utilities for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMUtils, StringUtils, AnimationUtils, ErrorUtils, ChromeUtils };
}
