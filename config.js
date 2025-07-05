// config.js
// Central configuration file for VM Helper extension

/**
 * Application configuration constants
 */
const VM_CONFIG = {
  // Extension metadata
  APP_NAME: '비전메이커 번역 도우미',
  VERSION: '1.0',
  
  // DOM selectors - centralized for easy maintenance
  SELECTORS: {
    // Letter form elements
    TRANSLATION_TEXTAREA: '#letter_1thcont',
    KOREAN_NAME: '#popupWrap > div > div > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2)',
    ENGLISH_NAME: '#popupWrap > div > div > table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(4)',
    SPONSOR_NAME: '#popupWrap > div > div > table:nth-child(1) > tbody > tr:nth-child(4) > td:nth-child(2)',
    
    // Service rating element
    RATING_ELEMENT: '#service_rating > p:nth-child(4) > span',
    
    // Popup to tab conversion
    TIMES_INPUT: '#times'
  },
  
  // URL patterns and parameters
  URLS: {
    TARGET_DOMAIN: 'https://letter.worldvision.or.kr',
    LETTER_VIEW_PATH: '/mypage/letterlist/letterview.do',
    AUTO_HELPER_PARAM: 'auto_helper=1'
  },
  
  // UI configuration
  UI: {
    // Position and sizing
    HELPER_POSITION: {
      bottom: '20px',
      right: '20px',
      width: '300px'
    },
    
    // Animation timing
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    
    // Color scheme (World Vision inspired)
    COLORS: {
      PRIMARY: '#ff6b35',
      SECONDARY: '#f7931e',
      SUCCESS: '#10b981',
      INFO: '#3b82f6',
      GRAY_LIGHT: '#f8f9fa',
      GRAY_MEDIUM: '#6c757d',
      GRAY_DARK: '#1a1a1a'
    }
  },
  
  // Letter template types
  LETTER_TYPES: {
    HANDPRINT: 'HANDPRINT',
    PORTRAIT: 'PORTRAIT',
    OTHER: 'OTHER'
  },
  
  // Author types
  AUTHOR_TYPES: {
    CHILD: 'CHILD',
    ANONYMOUS_HELPER: 'ANONYMOUS_HELPER',
    NAMED_HELPER: 'NAMED_HELPER'
  },
  
  // Timing configuration
  TIMING: {
    AUTO_RATING_DELAY: 1000,
    AUTO_RATING_RETRY_DELAY: 2000,
    TOAST_AUTO_HIDE: 3000
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VM_CONFIG;
}
