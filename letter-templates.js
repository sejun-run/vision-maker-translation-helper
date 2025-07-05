// letter-templates.js
// Letter template generation module for VM Helper extension

/**
 * Letter template generator class
 */
class LetterTemplateGenerator {
  constructor() {
    // Template configurations for different letter types
    this.templateConfigs = {
      [VM_CONFIG.LETTER_TYPES.HANDPRINT]: {
        artElement: '손도장',
        includeVillageQuestion: false
      },
      [VM_CONFIG.LETTER_TYPES.PORTRAIT]: {
        artElement: '자화상',
        includeVillageQuestion: true
      },
      [VM_CONFIG.LETTER_TYPES.OTHER]: {
        isSimpleTemplate: true
      }
    };

    // Helper statements for different author types
    this.helperStatements = {
      [VM_CONFIG.AUTHOR_TYPES.NAMED_HELPER]: '*이 편지를 작성하는데 (자원봉사자/엄마/아빠/할머니/고모 등)인 한글독음(영문병기)가 도와주셨어요.',
      [VM_CONFIG.AUTHOR_TYPES.ANONYMOUS_HELPER]: '*이 편지는 현지사업장 자원봉사자 혹은 가족의 도움으로 작성되었어요.',
      [VM_CONFIG.AUTHOR_TYPES.CHILD]: ''
    };
  }

  /**
   * Generate personalized letter based on type and author
   * @param {string} letterType - Type of letter (HANDPRINT, PORTRAIT, OTHER)
   * @param {string} authorType - Type of author (CHILD, ANONYMOUS_HELPER, NAMED_HELPER)
   * @param {Object} letterData - Data to populate in the template
   * @param {string} letterData.sponsorName - Sponsor's name
   * @param {string} letterData.childKoreanName - Child's Korean name
   * @param {string} letterData.childEnglishName - Child's English name
   * @returns {string} Generated letter template
   */
  generatePersonalizedLetter(letterType, authorType, letterData) {
    // Validate input parameters
    const validation = this.validateInputs(letterType, authorType, letterData);
    if (!validation.isValid) {
      throw new Error(`Template generation failed: ${validation.errors.join(', ')}`);
    }

    // Prepare data with fallbacks
    const data = letterData;

    // Handle simple OTHER type letters
    if (letterType === VM_CONFIG.LETTER_TYPES.OTHER) {
      return this.generateSimpleTemplate(authorType, data);
    }

    // Generate full template for HANDPRINT and PORTRAIT types
    return this.generateFullTemplate(letterType, authorType, data);
  }

  /**
   * Validate input parameters
   * @param {string} letterType - Letter type to validate
   * @param {string} authorType - Author type to validate
   * @param {Object} letterData - Letter data to validate
   * @returns {Object} Validation result
   */
  validateInputs(letterType, authorType, letterData) {
    const errors = [];

    // Validate letter type
    if (!Object.values(VM_CONFIG.LETTER_TYPES).includes(letterType)) {
      errors.push(`Invalid letter type: ${letterType}`);
    }

    // Validate author type
    if (!Object.values(VM_CONFIG.AUTHOR_TYPES).includes(authorType)) {
      errors.push(`Invalid author type: ${authorType}`);
    }

    // Validate letter data
    if (!letterData || typeof letterData !== 'object') {
      errors.push('Letter data is required and must be an object');
    } else {
      // Check required fields for non-OTHER types
      if (letterType !== VM_CONFIG.LETTER_TYPES.OTHER) {
        const requiredFields = ['sponsorName', 'childKoreanName', 'childEnglishName'];
        const missing = requiredFields.filter(field => !letterData[field]);
        if (missing.length > 0) {
          errors.push(`Missing required fields: ${missing.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate simple template for OTHER type letters
   * @param {string} authorType - Author type
   * @param {Object} data - Prepared letter data
   * @returns {string} Simple template
   */
  generateSimpleTemplate(authorType, data) {
    const helperStatement = this.helperStatements[authorType];
    
    const parts = [
      `사랑하는 ${data.sponsorName} 후원자님께,`,
      ''
    ];

    if (helperStatement) {
      parts.push(helperStatement, '');
    }

    parts.push(`후원자님의 후원아동, ${data.childKoreanName}(${data.childEnglishName}) 올림`);

    return parts.join('\n');
  }

  /**
   * Generate full template for HANDPRINT and PORTRAIT types
   * @param {string} letterType - Letter type
   * @param {string} authorType - Author type
   * @param {Object} data - Prepared letter data
   * @returns {string} Full template
   */
  generateFullTemplate(letterType, authorType, data) {
    const config = this.templateConfigs[letterType];
    const helperStatement = this.helperStatements[authorType];

    // Build the main template parts
    const parts = [
      `사랑하는 ${data.sponsorName} 후원자님께,`,
      '',
      '안녕하세요!',
      '',
      `제 이름은 ${data.childKoreanName}(${data.childEnglishName})이에요. 우리 서로 알아가요!`,
      '',
      `- 저의 ${config.artElement}을 그려 보았어요.`,
      '',
      '- 제게 특별한 사람 :',
      '',
      '- 이 사람이 제게 특별한 이유 :',
      '',
      '',
      '- 저를 행복하게 해주는 것 :',
      ''
    ];

    // Add village question for PORTRAIT type
    if (config.includeVillageQuestion) {
      parts.push('- 우리 마을에서 가장 좋아하는 것과 그 이유 :', '');
    }

    // Add final questions and closing
    parts.push(
      '- 후원자님께 궁금한 것 :',
      '',
      '저를 후원해 주셔서 감사해요.',
      '후원자님의 소식을 빨리 듣고 싶어요!',
      ''
    );

    // Add helper statement if present
    if (helperStatement) {
      parts.push(helperStatement, '');
    }

    // Add signature
    parts.push(`후원자님의 후원아동, ${data.childKoreanName}(${data.childEnglishName}) 올림`);

    return parts.join('\n');
  }

  /**
   * Get available letter types with descriptions
   * @returns {Array} Array of letter type objects
   */
  getLetterTypes() {
    return [
      {
        value: VM_CONFIG.LETTER_TYPES.HANDPRINT,
        label: 'IL (손도장)',
        sublabel: '손도장 그림',
        icon: '✋'
      },
      {
        value: VM_CONFIG.LETTER_TYPES.PORTRAIT,
        label: 'IL (자화상)',
        sublabel: '자화상 그림, 마을 질문',
        icon: '🎨'
      },
      {
        value: VM_CONFIG.LETTER_TYPES.OTHER,
        label: '기타 편지',
        sublabel: 'RL, GAL, FL',
        icon: '📝'
      }
    ];
  }

  /**
   * Get available author types with descriptions
   * @returns {Array} Array of author type objects
   */
  getAuthorTypes() {
    return [
      {
        value: VM_CONFIG.AUTHOR_TYPES.CHILD,
        label: '아동 스스로',
        description: '아동이 직접 작성한 편지'
      },
      {
        value: VM_CONFIG.AUTHOR_TYPES.ANONYMOUS_HELPER,
        label: '자원봉사자/가족',
        description: '익명의 도움으로 작성'
      },
      {
        value: VM_CONFIG.AUTHOR_TYPES.NAMED_HELPER,
        label: '이름이 적힌 대필자',
        description: '특정인의 도움으로 작성'
      }
    ];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LetterTemplateGenerator;
}
