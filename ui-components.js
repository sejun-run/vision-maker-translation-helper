// ui-components.js
// UI components and management for VM Helper extension

/**
 * UI Manager class for handling the helper interface
 */
class UIManager {
  constructor() {
    this.container = null;
    this.floatingButton = null; // Add floating button property
    this.isVisible = false;
    this.letterTemplateGenerator = new LetterTemplateGenerator();
  }

  /**
   * Initialize and show the helper UI
   * @returns {Promise} Promise that resolves when UI is ready
   */
  async initialize() {
    if (this.container && document.body.contains(this.container)) {
      console.log('VM Helper: UI already exists, bringing to front');
      this.show();
      return;
    }

    try {
      await this.createFloatingButton(); // Create floating button first
      await this.createUI();
      this.attachEventListeners();
      await this.show();
      console.log('VM Helper: UI initialized successfully');
    } catch (error) {
      ErrorUtils.logError('UI initialization', error);
      throw error;
    }
  }

  /**
   * Create a floating button that's always visible on the page
   * @returns {Promise} Promise that resolves when floating button is created
   */
  async createFloatingButton() {
    // Don't create if already exists
    if (this.floatingButton && document.body.contains(this.floatingButton)) {
      return;
    }

    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'wv-floating-helper-btn';
    this.floatingButton.innerHTML = `
      <div class="wv-floating-content">
        <img src="${chrome.runtime.getURL('VM_logo.png')}" alt="월드비전 로고" class="wv-floating-logo">
        <span class="wv-floating-text">번역 도우미</span>
      </div>
    `;

    // Add floating button styles
    this.loadFloatingButtonStyles();
    
    // Add click event
    this.floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleFloatingButtonClick();
    });

    document.body.appendChild(this.floatingButton);
    console.log('VM Helper: Floating button created');
  }

  /**
   * Handle floating button click
   */
  async handleFloatingButtonClick() {
    try {
      if (!this.container || !document.body.contains(this.container)) {
        await this.createUI();
        this.attachEventListeners();
      }
      
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    } catch (error) {
      ErrorUtils.logError('Floating button click', error);
      ErrorUtils.showUserError('도우미를 여는 중 오류가 발생했습니다.', true);
    }
  }

  /**
   * Create the main UI structure
   * @returns {Promise} Promise that resolves when UI is created
   */
  async createUI() {
    this.container = this.createContainer();
    this.loadStyles();
    
    // Try to load the logo
    await this.loadLogo();
    
    document.body.appendChild(this.container);
  }

  /**
   * Create the main container element
   * @returns {Element} Container element
   */
  createContainer() {
    const container = DOMUtils.createElement('div', {
      id: 'wv-helper-container',
      innerHTML: this.getContainerHTML()
    }, {
      position: 'fixed',
      bottom: VM_CONFIG.UI.HELPER_POSITION.bottom,
      right: VM_CONFIG.UI.HELPER_POSITION.right,
      width: VM_CONFIG.UI.HELPER_POSITION.width,
      backgroundColor: '#ffffff',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      zIndex: '9999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '14px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
      opacity: '0',
      transform: 'translateY(100%) scale(0.9)'
    });

    return container;
  }

  /**
   * Get the HTML content for the container
   * @returns {string} HTML content
   */
  getContainerHTML() {
    const letterTypes = this.letterTemplateGenerator.getLetterTypes();
    const authorTypes = this.letterTemplateGenerator.getAuthorTypes();

    return `
      <div id="wv-helper-header">
        <div class="wv-header-content">
          <div class="wv-logo">
            <img id="wv-logo-img" class="wv-logo-img" style="display: none;" alt="VM Logo">
            <div id="wv-logo-fallback" class="wv-logo-fallback">VM</div>
            <span class="wv-title">번역 봉사 도우미</span>
          </div>
          <button id="wv-helper-close" class="wv-close-btn">×</button>
        </div>
      </div>
      <div id="wv-helper-content">
        <div class="wv-form-section">
          <h3 class="wv-section-title">편지 유형 선택</h3>
          <div class="wv-card-group">
            ${letterTypes.map((type, index) => `
              <label class="wv-card ${index === 0 ? 'wv-card-selected' : ''}">
                <input type="radio" name="letterType" value="${type.value}" ${index === 0 ? 'checked' : ''}>
                <div class="wv-card-content">
                  <div class="wv-card-icon">${type.icon}</div>
                  <span class="wv-card-label">${type.label}</span>
                  <span class="wv-card-sublabel">${type.sublabel}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="wv-form-section">
          <h3 class="wv-section-title">작성자 유형</h3>
          <div class="wv-option-group">
            ${authorTypes.map((type, index) => `
              <label class="wv-option ${index === 2 ? 'wv-option-selected' : ''}">
                <input type="radio" name="authorType" value="${type.value}" ${index === 2 ? 'checked' : ''}>
                <span class="wv-radio-custom"></span>
                <div class="wv-option-text">
                  <span class="wv-option-label">${type.label}</span>
                  <span class="wv-option-desc">${type.description}</span>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
        
        <button id="wv-helper-button" class="wv-primary-button">
          <span class="wv-button-icon">📋</span>
          템플릿 생성하기
        </button>
      </div>
    `;
  }

  /**
   * Load and handle logo image
   * @returns {Promise} Promise that resolves when logo handling is complete
   */
  async loadLogo() {
    const logoImg = DOMUtils.safeQuerySelector('#wv-logo-img', this.container);
    const logoFallback = DOMUtils.safeQuerySelector('#wv-logo-fallback', this.container);
    
    if (!logoImg || !logoFallback) return;

    try {
      const logoUrl = ChromeUtils.getResourceURL('VM_logo.png');
      
      if (logoUrl) {
        logoImg.src = logoUrl;
        
        return new Promise((resolve) => {
          logoImg.onload = () => {
            console.log('VM Helper: Logo loaded successfully');
            logoImg.style.display = 'block';
            logoFallback.style.display = 'none';
            resolve();
          };
          
          logoImg.onerror = () => {
            console.log('VM Helper: Logo failed to load, using fallback');
            this.showLogoFallback(logoImg, logoFallback);
            resolve();
          };
        });
      } else {
        this.showLogoFallback(logoImg, logoFallback);
      }
    } catch (error) {
      console.log('VM Helper: Error loading logo, using fallback:', error);
      this.showLogoFallback(logoImg, logoFallback);
    }
  }

  /**
   * Show logo fallback
   * @param {Element} logoImg - Logo image element
   * @param {Element} logoFallback - Logo fallback element
   */
  showLogoFallback(logoImg, logoFallback) {
    logoImg.style.display = 'none';
    logoFallback.style.display = 'flex';
  }

  /**
   * Attach event listeners to UI elements
   */
  attachEventListeners() {
    // Main button functionality
    const mainButton = DOMUtils.safeQuerySelector('#wv-helper-button', this.container);
    if (mainButton) {
      mainButton.addEventListener('click', () => this.handleTemplateGeneration());
    }

    // Close button functionality
    const closeButton = DOMUtils.safeQuerySelector('#wv-helper-close', this.container);
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    // Letter type card selection
    const letterTypeRadios = DOMUtils.safeQuerySelectorAll('input[name="letterType"]', this.container);
    letterTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => this.handleLetterTypeChange(radio));
    });

    // Author type option selection
    const authorTypeRadios = DOMUtils.safeQuerySelectorAll('input[name="authorType"]', this.container);
    authorTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => this.handleAuthorTypeChange(radio));
    });
  }

  /**
   * Handle letter type selection change
   * @param {Element} radio - Selected radio input
   */
  handleLetterTypeChange(radio) {
    if (!radio.checked) return;
    
    // Remove selection from all cards
    const allCards = DOMUtils.safeQuerySelectorAll('.wv-card', this.container);
    allCards.forEach(card => card.classList.remove('wv-card-selected'));
    
    // Add selection to current card
    const currentCard = radio.closest('.wv-card');
    if (currentCard) {
      currentCard.classList.add('wv-card-selected');
    }
  }

  /**
   * Handle author type selection change
   * @param {Element} radio - Selected radio input
   */
  handleAuthorTypeChange(radio) {
    if (!radio.checked) return;
    
    // Remove selection from all options
    const allOptions = DOMUtils.safeQuerySelectorAll('.wv-option', this.container);
    allOptions.forEach(option => option.classList.remove('wv-option-selected'));
    
    // Add selection to current option
    const currentOption = radio.closest('.wv-option');
    if (currentOption) {
      currentOption.classList.add('wv-option-selected');
    }
  }

  /**
   * Handle template generation
   */
  async handleTemplateGeneration() {
    try {
      // Get selected options
      const letterTypeInput = DOMUtils.safeQuerySelector('input[name="letterType"]:checked', this.container);
      const authorTypeInput = DOMUtils.safeQuerySelector('input[name="authorType"]:checked', this.container);
      
      if (!letterTypeInput || !authorTypeInput) {
        ErrorUtils.showUserError('편지 유형과 작성자 유형을 선택해주세요.');
        return;
      }

      const letterType = letterTypeInput.value;
      const authorType = authorTypeInput.value;

      // Extract data from page
      const letterData = this.extractLetterData();

      // Generate template
      const template = this.letterTemplateGenerator.generatePersonalizedLetter(
        letterType, 
        authorType, 
        letterData
      );

      // Insert template into textarea
      const success = this.insertTemplate(template);
      
      if (success) {
        // Show success notification and close
        this.showToast('✨ 템플릿이 성공적으로 생성되었습니다!', 'success');
        await this.hide();
      }

    } catch (error) {
      ErrorUtils.logError('Template generation', error);
      ErrorUtils.showUserError('템플릿 생성 중 오류가 발생했습니다: ' + error.message, true);
    }
  }

  /**
   * Extract letter data from the page
   * @returns {Object} Extracted letter data
   */
  extractLetterData() {
    const koreanNameElement = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.KOREAN_NAME);
    const englishNameElement = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.ENGLISH_NAME);
    const sponsorNameElement = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.SPONSOR_NAME);

    const koreanNameRaw = StringUtils.getTextContent(koreanNameElement);
    const englishNameRaw = StringUtils.getTextContent(englishNameElement);
    const sponsorNameRaw = StringUtils.getTextContent(sponsorNameElement);

    const koreanName = StringUtils.extractName(koreanNameRaw);
    const englishName = StringUtils.extractName(englishNameRaw);

    // Validate extracted data
    const validation = StringUtils.validateRequiredFields({
      '한글 이름': koreanName,
      '영문 이름': englishName
    });

    if (!validation.isValid) {
      throw new Error(`필수 정보를 찾을 수 없습니다: ${validation.missing.join(', ')}\n(페이지 선택자를 확인해주세요)`);
    }

    return {
      sponsorName: sponsorNameRaw,
      childKoreanName: koreanName,
      childEnglishName: englishName
    };
  }

  /**
   * Insert template into the translation textarea
   * @param {string} template - Template to insert
   * @returns {boolean} Success status
   */
  insertTemplate(template) {
    const textarea = DOMUtils.safeQuerySelector(VM_CONFIG.SELECTORS.TRANSLATION_TEXTAREA);
    
    if (!textarea) {
      ErrorUtils.showUserError('번역 입력창을 찾을 수 없습니다.\n(페이지 선택자를 확인해주세요)');
      return false;
    }

    textarea.value = template;
    textarea.focus();
    
    console.log('VM Helper: Template inserted successfully');
    console.log(template);
    
    return true;
  }

  /**
   * Show the UI with animation
   * @returns {Promise} Promise that resolves when animation completes
   */
  async show() {
    if (!this.container) return;
    
    this.isVisible = true;
    
    return AnimationUtils.transition(
      this.container,
      { opacity: '0', transform: 'translateY(100%) scale(0.9)' },
      { opacity: '1', transform: 'translateY(0) scale(1)' },
      VM_CONFIG.UI.ANIMATION_DURATION
    );
  }

  /**
   * Hide the UI with animation
   * @returns {Promise} Promise that resolves when animation completes
   */
  async hide() {
    if (!this.container) return;
    
    this.isVisible = false;
    
    await AnimationUtils.transition(
      this.container,
      { opacity: '1', transform: 'translateY(0) scale(1)' },
      { opacity: '0', transform: 'translateY(100%) scale(0.9)' },
      VM_CONFIG.UI.ANIMATION_DURATION
    );
    
    // Remove from DOM after animation
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Type of toast ('success', 'info', 'error')
   */
  showToast(message, type = 'info') {
    const toast = this.createToast(message, type);
    document.body.appendChild(toast);
    
    // Animate in
    AnimationUtils.slideIn(toast, 'right', 300);
    
    // Auto remove after configured duration
    setTimeout(() => {
      AnimationUtils.slideOut(toast, 'right', 300).then(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
    }, VM_CONFIG.TIMING.TOAST_AUTO_HIDE);
  }

  /**
   * Create toast notification element
   * @param {string} message - Toast message
   * @param {string} type - Toast type
   * @returns {Element} Toast element
   */
  createToast(message, type) {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      error: '❌'
    };

    const colors = {
      success: VM_CONFIG.UI.COLORS.SUCCESS,
      info: VM_CONFIG.UI.COLORS.INFO,
      error: '#ef4444'
    };

    return DOMUtils.createElement('div', {
      className: `wv-toast wv-toast-${type}`,
      innerHTML: `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 18px;">${icons[type] || icons.info}</div>
          <span style="flex: 1;">${message}</span>
        </div>
      `
    }, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: colors[type] || colors.info,
      color: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: '500',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
      zIndex: '10001',
      opacity: '0',
      transform: 'translateX(100%) scale(0.9)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${colors[type]}33`,
      maxWidth: '320px',
      minWidth: '280px'
    });
  }

  /**
   * Load CSS styles for the UI
   */
  loadStyles() {
    if (document.getElementById('wv-helper-styles')) return;
    
    const styleSheet = DOMUtils.createElement('style', {
      id: 'wv-helper-styles',
      type: 'text/css',
      textContent: this.getStylesCSS()
    });
    
    document.head.appendChild(styleSheet);
  }

  /**
   * Get CSS styles for the UI
   * @returns {string} CSS styles
   */
  getStylesCSS() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      #wv-helper-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      @keyframes slideIn {
        from {
          transform: translateY(100%) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }
      
      #wv-helper-header { 
        background: linear-gradient(135deg, ${VM_CONFIG.UI.COLORS.PRIMARY} 0%, ${VM_CONFIG.UI.COLORS.SECONDARY} 100%);
        padding: 0;
        border: none;
        border-radius: 16px 16px 0 0;
        position: relative;
        overflow: hidden;
      }
      
      #wv-helper-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }
      
      .wv-header-content {
        display: flex;
        align-items: center;
        padding: 14px 80px 14px 16px;
        position: relative;
        z-index: 1;
      }
      
      .wv-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
        padding-right: 12px;
      }
      
      .wv-logo-img {
        height: 32px;
        width: auto;
        border-radius: 8px;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
      
      .wv-logo-fallback {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 1px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .wv-title {
        color: white;
        font-weight: 700;
        font-size: 18px;
        letter-spacing: -0.3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-right: 8px;
      }
      
      .wv-close-btn { 
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        font-size: 18px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);
        flex-shrink: 0;
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .wv-close-btn:hover { 
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-50%) scale(1.05);
      }
      
      #wv-helper-content {
        padding: 16px;
        background: white;
      }
      
      .wv-form-section { 
        margin-bottom: 20px; 
      }
      
      .wv-form-section:last-of-type {
        margin-bottom: 16px;
      }
      
      .wv-section-title { 
        color: ${VM_CONFIG.UI.COLORS.GRAY_DARK};
        font-weight: 600; 
        font-size: 15px;
        margin: 0 0 16px 0;
        letter-spacing: -0.2px;
      }
      
      .wv-card-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .wv-card {
        display: block;
        background: ${VM_CONFIG.UI.COLORS.GRAY_LIGHT};
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 0;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      
      .wv-card:hover {
        border-color: ${VM_CONFIG.UI.COLORS.PRIMARY};
        background: #fff5f1;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
      }
      
      .wv-card-selected {
        border-color: ${VM_CONFIG.UI.COLORS.PRIMARY} !important;
        background: #fff5f1 !important;
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
      }
      
      .wv-card input[type="radio"] {
        display: none;
      }
      
      .wv-card-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
      }
      
      .wv-card-icon {
        font-size: 20px;
        width: 32px;
        text-align: center;
      }
      
      .wv-card-label {
        font-weight: 500;
        color: ${VM_CONFIG.UI.COLORS.GRAY_DARK};
        font-size: 14px;
      }
      
      .wv-card-sublabel {
        font-size: 12px;
        color: ${VM_CONFIG.UI.COLORS.GRAY_MEDIUM};
        margin-left: auto;
      }
      
      .wv-option-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .wv-option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }
      
      .wv-option:hover {
        background: ${VM_CONFIG.UI.COLORS.GRAY_LIGHT};
      }
      
      .wv-option-selected {
        background: #fff5f1 !important;
        border-color: ${VM_CONFIG.UI.COLORS.PRIMARY};
      }
      
      .wv-option input[type="radio"] {
        display: none;
      }
      
      .wv-radio-custom {
        width: 20px;
        height: 20px;
        border: 2px solid #dee2e6;
        border-radius: 50%;
        position: relative;
        flex-shrink: 0;
        margin-top: 2px;
        transition: all 0.2s ease;
      }
      
      .wv-option-selected .wv-radio-custom {
        border-color: ${VM_CONFIG.UI.COLORS.PRIMARY};
        background: ${VM_CONFIG.UI.COLORS.PRIMARY};
      }
      
      .wv-option-selected .wv-radio-custom::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 6px;
        height: 6px;
        background: white;
        border-radius: 50%;
      }
      
      .wv-option-text {
        flex: 1;
      }
      
      .wv-option-label {
        display: block;
        font-weight: 500;
        color: ${VM_CONFIG.UI.COLORS.GRAY_DARK};
        font-size: 14px;
        margin-bottom: 2px;
      }
      
      .wv-option-desc {
        font-size: 12px;
        color: ${VM_CONFIG.UI.COLORS.GRAY_MEDIUM};
        line-height: 1.4;
      }
      
      .wv-primary-button { 
        width: 100%; 
        padding: 14px 20px; 
        font-size: 14px; 
        font-weight: 600;
        background: linear-gradient(135deg, ${VM_CONFIG.UI.COLORS.PRIMARY} 0%, ${VM_CONFIG.UI.COLORS.SECONDARY} 100%);
        color: white; 
        border: none; 
        border-radius: 12px; 
        cursor: pointer; 
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        letter-spacing: -0.2px;
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      }
      
      .wv-primary-button:hover { 
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
      }
      
      .wv-primary-button:active {
        transform: translateY(0);
      }
      
      .wv-button-icon {
        font-size: 16px;
      }
      
      .wv-toast {
        border-radius: 12px !important;
        backdrop-filter: blur(10px);
        font-weight: 500;
        letter-spacing: -0.2px;
      }
    `;
  }

  /**
   * Load floating button styles
   */
  loadFloatingButtonStyles() {
    if (document.getElementById('wv-floating-styles')) return;
    
    const styleSheet = DOMUtils.createElement('style', {
      id: 'wv-floating-styles',
      type: 'text/css',
      textContent: this.getFloatingButtonCSS()
    });
    
    document.head.appendChild(styleSheet);
  }

  /**
   * Get CSS styles for the floating button
   * @returns {string} CSS styles
   */
  getFloatingButtonCSS() {
    return `
      #wv-floating-helper-btn {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 80px !important;
        height: 80px !important;
        background: linear-gradient(135deg, ${VM_CONFIG.UI.COLORS.PRIMARY} 0%, ${VM_CONFIG.UI.COLORS.SECONDARY} 100%) !important;
        border-radius: 50% !important;
        box-shadow: 0 4px 20px rgba(255, 102, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        cursor: pointer !important;
        z-index: 9998 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        animation: floatingPulse 2s infinite ease-in-out !important;
      }

      #wv-floating-helper-btn:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 6px 25px rgba(255, 102, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }

      #wv-floating-helper-btn:active {
        transform: scale(0.95) !important;
      }

      .wv-floating-content {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        color: white !important;
        gap: 2px !important;
      }

      .wv-floating-logo {
        width: 24px !important;
        height: 24px !important;
        border-radius: 4px !important;
        object-fit: cover !important;
      }

      .wv-floating-text {
        font-size: 10px !important;
        font-weight: 600 !important;
        line-height: 1.1 !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
      }

      @keyframes floatingPulse {
        0%, 100% {
          box-shadow: 0 4px 20px rgba(255, 102, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        50% {
          box-shadow: 0 4px 20px rgba(255, 102, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.15);
        }
      }

      @media (max-width: 768px) {
        #wv-floating-helper-btn {
          width: 70px !important;
          height: 70px !important;
          bottom: 15px !important;
          right: 15px !important;
        }
        
        .wv-floating-logo {
          width: 20px !important;
          height: 20px !important;
        }
        
        .wv-floating-text {
          font-size: 9px !important;
        }
      }
    `;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}
