/**
 * Graceful Degradation Handler for Bilibili Content Filter Extension
 * 
 * Handles unknown page structures, layout changes, and provides
 * fallback mechanisms when primary filtering methods fail.
 */

import { logger, LOG_CATEGORIES } from './logger.js';
import { errorHandler, ERROR_CATEGORIES, RECOVERY_STRATEGIES } from './error-handler.js';

/**
 * Page structure detection confidence levels
 */
const CONFIDENCE_LEVELS = {
  HIGH: 'high',        // 80%+ selectors found
  MEDIUM: 'medium',    // 50-79% selectors found
  LOW: 'low',          // 20-49% selectors found
  UNKNOWN: 'unknown'   // <20% selectors found
};

/**
 * Fallback strategies for different confidence levels
 */
const FALLBACK_STRATEGIES = {
  [CONFIDENCE_LEVELS.HIGH]: 'standard_filtering',
  [CONFIDENCE_LEVELS.MEDIUM]: 'adaptive_filtering',
  [CONFIDENCE_LEVELS.LOW]: 'basic_filtering',
  [CONFIDENCE_LEVELS.UNKNOWN]: 'minimal_filtering'
};

/**
 * Known Bilibili page patterns and their characteristics
 */
const PAGE_PATTERNS = {
  HOME: {
    url: /^https?:\/\/(www\.)?bilibili\.com\/?$/,
    indicators: ['.bili-feed', '.recommended-container', '.feed-card'],
    confidence: CONFIDENCE_LEVELS.HIGH
  },
  VIDEO: {
    url: /^https?:\/\/(www\.)?bilibili\.com\/video\//,
    indicators: ['.video-info', '.video-desc', '.comment-container'],
    confidence: CONFIDENCE_LEVELS.HIGH
  },
  SPACE: {
    url: /^https?:\/\/space\.bilibili\.com\//,
    indicators: ['.h-inner', '.section', '.user-info'],
    confidence: CONFIDENCE_LEVELS.MEDIUM
  },
  SEARCH: {
    url: /^https?:\/\/search\.bilibili\.com\//,
    indicators: ['.search-result', '.result-item', '.search-page'],
    confidence: CONFIDENCE_LEVELS.MEDIUM
  },
  LIVE: {
    url: /^https?:\/\/live\.bilibili\.com\//,
    indicators: ['.live-room', '.chat-container', '.live-info'],
    confidence: CONFIDENCE_LEVELS.MEDIUM
  },
  UNKNOWN: {
    url: /.*/,
    indicators: [],
    confidence: CONFIDENCE_LEVELS.UNKNOWN
  }
};

/**
 * Graceful Degradation Manager
 */
class GracefulDegradationManager {
  constructor() {
    this.currentPageType = null;
    this.confidenceLevel = CONFIDENCE_LEVELS.UNKNOWN;
    this.fallbackStrategy = FALLBACK_STRATEGIES[CONFIDENCE_LEVELS.UNKNOWN];
    this.detectionCache = new Map();
    this.adaptiveSelectors = new Map();
    this.failedSelectors = new Set();
    
    // Initialize page analysis
    this.analyzeCurrentPage();
    
    // Setup periodic re-analysis for SPA navigation
    this.setupPeriodicAnalysis();
  }

  /**
   * Analyze current page structure and determine confidence level
   */
  analyzeCurrentPage() {
    try {
      const url = window.location.href;
      const pageType = this.detectPageType(url);
      const confidence = this.assessPageConfidence(pageType);
      
      this.currentPageType = pageType;
      this.confidenceLevel = confidence;
      this.fallbackStrategy = FALLBACK_STRATEGIES[confidence];
      
      logger.info(LOG_CATEGORIES.COMPATIBILITY, 
        `Page analysis complete: ${pageType} (${confidence} confidence)`, {
          url,
          strategy: this.fallbackStrategy
        });
      
      // Cache the analysis
      this.detectionCache.set(url, {
        pageType,
        confidence,
        timestamp: Date.now()
      });
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.COMPATIBILITY, 
        'Failed to analyze page structure', error);
      
      this.currentPageType = 'UNKNOWN';
      this.confidenceLevel = CONFIDENCE_LEVELS.UNKNOWN;
      this.fallbackStrategy = FALLBACK_STRATEGIES[CONFIDENCE_LEVELS.UNKNOWN];
    }
  }

  /**
   * Detect page type based on URL and DOM structure
   * @param {string} url - Current page URL
   * @returns {string} Page type
   */
  detectPageType(url) {
    // Check cache first
    const cached = this.detectionCache.get(url);
    if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 second cache
      return cached.pageType;
    }

    // Match against known patterns
    for (const [type, pattern] of Object.entries(PAGE_PATTERNS)) {
      if (pattern.url.test(url)) {
        // Verify with DOM indicators if available
        if (pattern.indicators.length > 0) {
          const foundIndicators = pattern.indicators.filter(selector => 
            document.querySelector(selector) !== null
          );
          
          if (foundIndicators.length > 0) {
            return type;
          }
        } else {
          return type;
        }
      }
    }

    return 'UNKNOWN';
  }

  /**
   * Assess confidence level based on page type and DOM structure
   * @param {string} pageType - Detected page type
   * @returns {string} Confidence level
   */
  assessPageConfidence(pageType) {
    const pattern = PAGE_PATTERNS[pageType];
    if (!pattern || pattern.indicators.length === 0) {
      return CONFIDENCE_LEVELS.UNKNOWN;
    }

    // Count how many indicators are present
    const foundIndicators = pattern.indicators.filter(selector => 
      document.querySelector(selector) !== null
    );
    
    const confidenceRatio = foundIndicators.length / pattern.indicators.length;
    
    if (confidenceRatio >= 0.8) {
      return CONFIDENCE_LEVELS.HIGH;
    } else if (confidenceRatio >= 0.5) {
      return CONFIDENCE_LEVELS.MEDIUM;
    } else if (confidenceRatio >= 0.2) {
      return CONFIDENCE_LEVELS.LOW;
    } else {
      return CONFIDENCE_LEVELS.UNKNOWN;
    }
  }

  /**
   * Get appropriate selectors based on current fallback strategy
   * @param {string} filterType - Type of filter
   * @returns {Array} Array of selectors to try
   */
  getAdaptiveSelectors(filterType) {
    const baseSelectors = this.getBaseSelectors(filterType);
    const adaptiveSelectors = this.adaptiveSelectors.get(filterType) || [];
    const fallbackSelectors = this.getFallbackSelectors(filterType);
    
    // Combine selectors based on strategy
    switch (this.fallbackStrategy) {
      case 'standard_filtering':
        return [...baseSelectors, ...adaptiveSelectors];
        
      case 'adaptive_filtering':
        return [...baseSelectors, ...adaptiveSelectors, ...fallbackSelectors];
        
      case 'basic_filtering':
        return [...fallbackSelectors, ...baseSelectors.slice(0, 2)];
        
      case 'minimal_filtering':
        return fallbackSelectors.slice(0, 3);
        
      default:
        return fallbackSelectors;
    }
  }

  /**
   * Get base selectors for a filter type
   * @param {string} filterType - Type of filter
   * @returns {Array} Base selectors
   */
  getBaseSelectors(filterType) {
    const selectorMap = {
      homeRecommendations: [
        '.bili-feed',
        '.recommended-container',
        '.feed-card',
        '.rec-list',
        '.bili-video-card'
      ],
      rankingTrending: [
        '.ranking-container',
        '.trending-list',
        '.hot-list',
        '.rank-item',
        '.popular-list'
      ],
      rightSidebar: [
        '.right-container',
        '.sidebar',
        '.side-toolbar',
        '.right-panel',
        '.aside-area'
      ],
      comments: [
        '.comment-container',
        '.bb-comment',
        '.reply-box',
        '.comment-list',
        '.comment-area'
      ],
      relatedVideos: [
        '.related-video',
        '.rec-footer',
        '.next-play',
        '.recommend-list',
        '.related-container'
      ]
    };
    
    return selectorMap[filterType] || [];
  }

  /**
   * Get fallback selectors for unknown page structures
   * @param {string} filterType - Type of filter
   * @returns {Array} Fallback selectors
   */
  getFallbackSelectors(filterType) {
    // Generic selectors that might work across different layouts
    const fallbackMap = {
      homeRecommendations: [
        '[class*="recommend"]',
        '[class*="feed"]',
        '[class*="card"]',
        '[data-module-name*="recommend"]'
      ],
      rankingTrending: [
        '[class*="rank"]',
        '[class*="hot"]',
        '[class*="trend"]',
        '[class*="popular"]'
      ],
      rightSidebar: [
        '[class*="sidebar"]',
        '[class*="right"]',
        '[class*="aside"]',
        '.layout-right'
      ],
      comments: [
        '[class*="comment"]',
        '[class*="reply"]',
        '[id*="comment"]',
        '[data-module-name*="comment"]'
      ],
      relatedVideos: [
        '[class*="related"]',
        '[class*="recommend"]',
        '[class*="next"]',
        '[data-module-name*="related"]'
      ]
    };
    
    return fallbackMap[filterType] || [];
  }

  /**
   * Attempt to find elements using progressive selector fallback
   * @param {string} filterType - Type of filter
   * @returns {Array} Found elements
   */
  findElementsWithFallback(filterType) {
    const selectors = this.getAdaptiveSelectors(filterType);
    const foundElements = [];
    const workingSelectors = [];
    
    for (const selector of selectors) {
      // Skip selectors that have previously failed
      if (this.failedSelectors.has(selector)) {
        continue;
      }
      
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements.push(...elements);
          workingSelectors.push(selector);
          
          logger.debug(LOG_CATEGORIES.DOM, 
            `Selector "${selector}" found ${elements.length} elements for ${filterType}`);
        }
      } catch (error) {
        logger.warn(LOG_CATEGORIES.DOM, 
          `Selector "${selector}" failed for ${filterType}`, error);
        
        this.failedSelectors.add(selector);
      }
    }
    
    // Update adaptive selectors with working ones
    if (workingSelectors.length > 0) {
      this.adaptiveSelectors.set(filterType, workingSelectors);
    }
    
    return foundElements;
  }

  /**
   * Apply graceful filtering based on current strategy
   * @param {string} filterType - Type of filter
   * @param {boolean} enabled - Whether to enable or disable filter
   * @returns {boolean} Success status
   */
  applyGracefulFiltering(filterType, enabled) {
    try {
      const elements = this.findElementsWithFallback(filterType);
      
      if (elements.length === 0) {
        logger.warn(LOG_CATEGORIES.FILTERING, 
          `No elements found for ${filterType} filter using ${this.fallbackStrategy} strategy`);
        
        // Try intelligent element discovery
        const discoveredElements = this.discoverSimilarElements(filterType);
        if (discoveredElements.length > 0) {
          elements.push(...discoveredElements);
        }
      }
      
      // Apply filtering based on strategy
      let successCount = 0;
      
      elements.forEach(element => {
        try {
          if (enabled) {
            this.hideElement(element, filterType);
          } else {
            this.showElement(element, filterType);
          }
          successCount++;
        } catch (error) {
          logger.warn(LOG_CATEGORIES.DOM, 
            `Failed to ${enabled ? 'hide' : 'show'} element for ${filterType}`, error);
        }
      });
      
      const success = successCount > 0;
      
      logger.info(LOG_CATEGORIES.FILTERING, 
        `${enabled ? 'Applied' : 'Removed'} ${filterType} filter: ${successCount}/${elements.length} elements processed`);
      
      return success;
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.FILTERING, 
        `Graceful filtering failed for ${filterType}`, error);
      
      errorHandler.handleError(error, {
        category: ERROR_CATEGORIES.DOM_MANIPULATION,
        context: `graceful_filtering_${filterType}`,
        recoveryStrategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
      });
      
      return false;
    }
  }

  /**
   * Hide element with graceful degradation
   * @param {Element} element - Element to hide
   * @param {string} filterType - Filter type for tracking
   */
  hideElement(element, filterType) {
    // Try multiple hiding methods based on strategy
    switch (this.fallbackStrategy) {
      case 'standard_filtering':
        element.style.display = 'none';
        element.setAttribute('data-bilibili-filter', filterType);
        break;
        
      case 'adaptive_filtering':
        element.style.visibility = 'hidden';
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.setAttribute('data-bilibili-filter', filterType);
        break;
        
      case 'basic_filtering':
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        element.setAttribute('data-bilibili-filter', filterType);
        break;
        
      case 'minimal_filtering':
        element.classList.add('bilibili-filter-hidden');
        element.setAttribute('data-bilibili-filter', filterType);
        break;
        
      default:
        element.style.display = 'none';
        element.setAttribute('data-bilibili-filter', filterType);
    }
  }

  /**
   * Show element by reversing hiding method
   * @param {Element} element - Element to show
   * @param {string} filterType - Filter type for tracking
   */
  showElement(element, filterType) {
    // Remove filter attribute
    element.removeAttribute('data-bilibili-filter');
    
    // Restore visibility based on how it was hidden
    if (element.style.display === 'none') {
      element.style.display = '';
    }
    
    if (element.style.visibility === 'hidden') {
      element.style.visibility = '';
      element.style.height = '';
      element.style.overflow = '';
    }
    
    if (element.style.opacity === '0') {
      element.style.opacity = '';
      element.style.pointerEvents = '';
    }
    
    element.classList.remove('bilibili-filter-hidden');
  }

  /**
   * Discover similar elements using heuristics
   * @param {string} filterType - Type of filter
   * @returns {Array} Discovered elements
   */
  discoverSimilarElements(filterType) {
    const discoveredElements = [];
    
    try {
      // Use heuristics based on filter type
      switch (filterType) {
        case 'homeRecommendations':
          discoveredElements.push(...this.discoverRecommendationElements());
          break;
          
        case 'comments':
          discoveredElements.push(...this.discoverCommentElements());
          break;
          
        case 'rightSidebar':
          discoveredElements.push(...this.discoverSidebarElements());
          break;
          
        default:
          // Generic discovery based on common patterns
          discoveredElements.push(...this.discoverGenericElements(filterType));
      }
      
      if (discoveredElements.length > 0) {
        logger.info(LOG_CATEGORIES.DOM, 
          `Discovered ${discoveredElements.length} elements for ${filterType} using heuristics`);
      }
      
    } catch (error) {
      logger.warn(LOG_CATEGORIES.DOM, 
        `Element discovery failed for ${filterType}`, error);
    }
    
    return discoveredElements;
  }

  /**
   * Discover recommendation elements using heuristics
   * @returns {Array} Discovered elements
   */
  discoverRecommendationElements() {
    const elements = [];
    
    // Look for elements with video thumbnails and titles
    const videoCards = document.querySelectorAll('[class*="video"], [class*="card"]');
    videoCards.forEach(card => {
      const hasImage = card.querySelector('img');
      const hasTitle = card.querySelector('[class*="title"], h1, h2, h3, h4');
      
      if (hasImage && hasTitle) {
        elements.push(card);
      }
    });
    
    return elements;
  }

  /**
   * Discover comment elements using heuristics
   * @returns {Array} Discovered elements
   */
  discoverCommentElements() {
    const elements = [];
    
    // Look for elements that look like comments
    const potentialComments = document.querySelectorAll('[class*="comment"], [class*="reply"]');
    potentialComments.forEach(element => {
      // Check if it has typical comment structure
      const hasAvatar = element.querySelector('img[class*="avatar"], [class*="avatar"] img');
      const hasText = element.querySelector('[class*="content"], [class*="text"], p');
      
      if (hasAvatar && hasText) {
        elements.push(element);
      }
    });
    
    return elements;
  }

  /**
   * Discover sidebar elements using heuristics
   * @returns {Array} Discovered elements
   */
  discoverSidebarElements() {
    const elements = [];
    
    // Look for elements positioned on the right side
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      // Check if element is positioned on the right side
      if (rect.left > windowWidth * 0.7 && rect.width > 200) {
        elements.push(element);
      }
    });
    
    return elements;
  }

  /**
   * Generic element discovery
   * @param {string} filterType - Filter type
   * @returns {Array} Discovered elements
   */
  discoverGenericElements(filterType) {
    const elements = [];
    
    // Use text content analysis for discovery
    const allElements = document.querySelectorAll('div, section, article');
    allElements.forEach(element => {
      const text = element.textContent.toLowerCase();
      
      // Simple keyword matching based on filter type
      const keywords = this.getKeywordsForFilter(filterType);
      const hasKeyword = keywords.some(keyword => text.includes(keyword));
      
      if (hasKeyword && element.children.length > 0) {
        elements.push(element);
      }
    });
    
    return elements;
  }

  /**
   * Get keywords for filter type
   * @param {string} filterType - Filter type
   * @returns {Array} Keywords
   */
  getKeywordsForFilter(filterType) {
    const keywordMap = {
      homeRecommendations: ['推荐', '为你推荐', 'recommend', '热门'],
      rankingTrending: ['排行', '热门', '榜单', 'ranking', 'trending'],
      comments: ['评论', '回复', 'comment', 'reply'],
      relatedVideos: ['相关', '推荐', '下一个', 'related', 'next']
    };
    
    return keywordMap[filterType] || [];
  }

  /**
   * Setup periodic page analysis for SPA navigation
   */
  setupPeriodicAnalysis() {
    let lastUrl = window.location.href;
    
    // Check for URL changes (SPA navigation)
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        logger.info(LOG_CATEGORIES.COMPATIBILITY, 'URL changed, re-analyzing page structure');
        
        // Clear failed selectors for new page
        this.failedSelectors.clear();
        
        // Re-analyze after a short delay to allow content to load
        setTimeout(() => {
          this.analyzeCurrentPage();
        }, 1000);
      }
    }, 2000);
    
    // Periodic confidence re-assessment
    setInterval(() => {
      const newConfidence = this.assessPageConfidence(this.currentPageType);
      if (newConfidence !== this.confidenceLevel) {
        logger.info(LOG_CATEGORIES.COMPATIBILITY, 
          `Confidence level changed: ${this.confidenceLevel} -> ${newConfidence}`);
        
        this.confidenceLevel = newConfidence;
        this.fallbackStrategy = FALLBACK_STRATEGIES[newConfidence];
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get current degradation status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      pageType: this.currentPageType,
      confidenceLevel: this.confidenceLevel,
      fallbackStrategy: this.fallbackStrategy,
      adaptiveSelectorsCount: this.adaptiveSelectors.size,
      failedSelectorsCount: this.failedSelectors.size,
      cacheSize: this.detectionCache.size
    };
  }

  /**
   * Reset degradation state
   */
  reset() {
    this.detectionCache.clear();
    this.adaptiveSelectors.clear();
    this.failedSelectors.clear();
    this.analyzeCurrentPage();
    
    logger.info(LOG_CATEGORIES.COMPATIBILITY, 'Graceful degradation state reset');
  }
}

// Create singleton instance
const gracefulDegradationManager = new GracefulDegradationManager();

// Export for use in other modules
export {
  gracefulDegradationManager,
  GracefulDegradationManager,
  CONFIDENCE_LEVELS,
  FALLBACK_STRATEGIES,
  PAGE_PATTERNS
};