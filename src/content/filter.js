/**
 * Content Filtering System
 * 
 * This module handles the injection and management of CSS filters
 * to hide content elements on Bilibili pages.
 */

import { 
  getSelectorsForFilter, 
  getIntelligentSelector, 
  isSelectorSafe 
} from './selectors.js';

/**
 * CSS Filter Manager
 * Handles the creation, injection, and management of CSS filters
 */
export class FilterManager {
  constructor() {
    this.injectedStyles = new Map(); // Track injected style elements
    this.hiddenElements = new Map(); // Track hidden elements for restoration
    this.observer = null; // DOM mutation observer
    this.currentDomain = window.location.hostname;
    this.activeFilters = new Set(); // Track currently active filters
  }

  /**
   * Initialize the filter manager
   */
  initialize() {
    this.createBaseStyles();
    this.setupDOMObserver();
  }

  /**
   * Create base CSS styles for filtering
   */
  createBaseStyles() {
    const baseCSS = `
      /* Base filter styles */
      .bilibili-filter-hidden {
        display: none !important;
      }
      
      .bilibili-filter-fade {
        opacity: 0.1 !important;
        pointer-events: none !important;
        transition: opacity 0.3s ease !important;
      }
      
      /* Layout preservation styles */
      .bilibili-filter-preserve-layout {
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }
      
      /* Smooth transitions */
      .bilibili-filter-transition {
        transition: all 0.3s ease !important;
      }
    `;

    this.injectCSS('base-filter-styles', baseCSS);
  }

  /**
   * Apply a filter for a specific content type
   * @param {string} filterType - Type of content to filter
   * @param {boolean} preserveLayout - Whether to preserve layout when hiding
   * @returns {boolean} True if filter was successfully applied
   */
  applyFilter(filterType, preserveLayout = true) {
    if (this.activeFilters.has(filterType)) {
      return true; // Filter already active
    }

    const selectors = getSelectorsForFilter(filterType, this.currentDomain);
    const elements = this.findElementsToHide(selectors, filterType);
    
    if (elements.length === 0) {
      // Try intelligent detection if no elements found
      const intelligentElements = this.findElementsIntelligently(filterType);
      elements.push(...intelligentElements);
    }

    if (elements.length > 0) {
      this.hideElements(elements, filterType, preserveLayout);
      this.activeFilters.add(filterType);
      
      // Create CSS rule for dynamic content
      this.createDynamicFilterRule(filterType, selectors, preserveLayout);
      return true;
    }

    // Even if no elements found now, mark as active for future dynamic content
    this.activeFilters.add(filterType);
    this.createDynamicFilterRule(filterType, selectors, preserveLayout);
    return true;
  }

  /**
   * Remove a filter for a specific content type with enhanced restoration
   * @param {string} filterType - Type of content to restore
   * @returns {boolean} True if filter was successfully removed
   */
  removeFilter(filterType) {
    if (!this.activeFilters.has(filterType)) {
      return true; // Filter not active, consider it successfully "removed"
    }

    // Restore hidden elements
    const hiddenElements = this.hiddenElements.get(filterType) || [];
    hiddenElements.forEach(element => {
      if (element && element.parentNode) {
        // Remove filter classes
        element.classList.remove('bilibili-filter-hidden', 'bilibili-filter-preserve-layout');
        
        // Restore original styles
        if (element.dataset.originalDisplay) {
          element.style.removeProperty('display');
          delete element.dataset.originalDisplay;
        }
        if (element.dataset.originalVisibility) {
          element.style.removeProperty('visibility');
          delete element.dataset.originalVisibility;
        }
        
        // Remove layout preservation styles
        element.style.removeProperty('width');
        element.style.removeProperty('min-width');
        element.style.removeProperty('height');
        element.style.removeProperty('margin');
        element.style.removeProperty('margin-top');
        element.style.removeProperty('margin-bottom');
        element.style.removeProperty('padding');
        element.style.removeProperty('overflow');
        
        // Remove transition class after a delay to allow smooth restoration
        setTimeout(() => {
          element.classList.remove('bilibili-filter-transition');
        }, 300);
      }
    });

    // Remove dynamic CSS rule
    this.removeDynamicFilterRule(filterType);
    
    this.hiddenElements.delete(filterType);
    this.activeFilters.delete(filterType);
    
    return true;
  }

  /**
   * Find elements to hide using CSS selectors
   * @param {string[]} selectors - Array of CSS selectors
   * @param {string} filterType - Type of filter for safety checking
   * @returns {Element[]} Array of elements to hide
   */
  findElementsToHide(selectors, filterType) {
    const elements = [];
    
    for (const selector of selectors) {
      if (!isSelectorSafe(selector)) {
        console.warn(`Skipping unsafe selector: ${selector}`);
        continue;
      }

      try {
        const found = document.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (error) {
        console.warn(`Invalid selector: ${selector}`, error);
      }
    }

    // Remove duplicates
    return [...new Set(elements)];
  }

  /**
   * Find elements using intelligent detection when selectors fail
   * @param {string} filterType - Type of content to detect
   * @returns {Element[]} Array of detected elements
   */
  findElementsIntelligently(filterType) {
    const config = getIntelligentSelector(filterType);
    if (!config) {
      return [];
    }

    const elements = [];
    const containers = document.querySelectorAll(config.containerPattern);

    for (const container of containers) {
      if (this.matchesIntelligentCriteria(container, config)) {
        elements.push(container);
      }
    }

    return elements;
  }

  /**
   * Check if a container matches intelligent detection criteria
   * @param {Element} container - Container element to check
   * @param {Object} config - Intelligent selector configuration
   * @returns {boolean} True if container matches criteria
   */
  matchesIntelligentCriteria(container, config) {
    // Check content pattern count
    if (config.contentPattern && config.minimumCount) {
      const contentElements = container.querySelectorAll(config.contentPattern);
      if (contentElements.length < config.minimumCount) {
        return false;
      }
    }

    // Check text patterns
    if (config.textPatterns) {
      const text = container.textContent || '';
      const hasTextPattern = config.textPatterns.some(pattern => 
        text.includes(pattern)
      );
      if (!hasTextPattern) {
        return false;
      }
    }

    // Check position for sidebar detection
    if (config.positionCheck && config.locationCheck === 'right') {
      const rect = container.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      if (rect.left < windowWidth * 0.6) { // Not on the right side
        return false;
      }
    }

    // Check width threshold
    if (config.widthThreshold) {
      const rect = container.getBoundingClientRect();
      if (rect.width > config.widthThreshold * 2) { // Too wide to be sidebar
        return false;
      }
    }

    // Check proximity for related videos
    if (config.proximityCheck) {
      const proximityElement = document.querySelector(config.proximityCheck);
      if (proximityElement) {
        const containerRect = container.getBoundingClientRect();
        const proximityRect = proximityElement.getBoundingClientRect();
        const distance = Math.abs(containerRect.top - proximityRect.bottom);
        if (distance > 500) { // Too far from video player
          return false;
        }
      }
    }

    // Check exclude patterns
    if (config.excludePatterns) {
      for (const excludePattern of config.excludePatterns) {
        if (container.matches(excludePattern)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Hide elements with the specified method and enhanced layout preservation
   * @param {Element[]} elements - Elements to hide
   * @param {string} filterType - Type of filter
   * @param {boolean} preserveLayout - Whether to preserve layout
   */
  hideElements(elements, filterType, preserveLayout) {
    const hiddenElements = [];

    elements.forEach(element => {
      if (element && element.parentNode) {
        // Add transition class for smooth hiding
        element.classList.add('bilibili-filter-transition');
        
        // Store original styles for restoration
        if (!element.dataset.originalDisplay) {
          element.dataset.originalDisplay = window.getComputedStyle(element).display;
        }
        if (!element.dataset.originalVisibility) {
          element.dataset.originalVisibility = window.getComputedStyle(element).visibility;
        }
        
        if (preserveLayout) {
          // Use visibility hidden to preserve layout
          element.classList.add('bilibili-filter-preserve-layout');
          
          // For certain elements, we need special handling to maintain layout integrity
          this.applyLayoutPreservation(element, filterType);
        } else {
          // Use display none for complete removal
          element.classList.add('bilibili-filter-hidden');
        }
        
        hiddenElements.push(element);
      }
    });

    this.hiddenElements.set(filterType, hiddenElements);
  }

  /**
   * Apply special layout preservation techniques based on element type
   * @param {Element} element - Element to preserve layout for
   * @param {string} filterType - Type of filter being applied
   */
  applyLayoutPreservation(element, filterType) {
    const rect = element.getBoundingClientRect();
    
    // For sidebar elements, maintain the space to prevent content shift
    if (filterType === 'rightSidebar' && rect.width > 200) {
      element.style.setProperty('width', rect.width + 'px', 'important');
      element.style.setProperty('min-width', rect.width + 'px', 'important');
    }
    
    // For feed elements, maintain vertical spacing
    if (filterType === 'homeRecommendations' || filterType === 'relatedVideos') {
      const computedStyle = window.getComputedStyle(element);
      const marginTop = computedStyle.marginTop;
      const marginBottom = computedStyle.marginBottom;
      
      if (marginTop !== '0px' || marginBottom !== '0px') {
        element.style.setProperty('margin-top', marginTop, 'important');
        element.style.setProperty('margin-bottom', marginBottom, 'important');
      }
    }
    
    // For comment sections, maintain the container structure
    if (filterType === 'comments') {
      const parent = element.parentElement;
      if (parent && parent.children.length === 1) {
        // This is likely the only child, preserve parent height
        parent.style.setProperty('min-height', '50px', 'important');
      }
    }
  }

  /**
   * Create dynamic CSS rule for newly added content
   * @param {string} filterType - Type of filter
   * @param {string[]} selectors - CSS selectors
   * @param {boolean} preserveLayout - Whether to preserve layout
   */
  createDynamicFilterRule(filterType, selectors, preserveLayout) {
    const safeSelectors = selectors.filter(isSelectorSafe);
    if (safeSelectors.length === 0) {
      return;
    }

    const className = preserveLayout ? 'bilibili-filter-preserve-layout' : 'bilibili-filter-hidden';
    const css = safeSelectors.map(selector => `${selector} { }`).join('\n') +
                `\n${safeSelectors.join(', ')} { display: none !important; }`;

    this.injectCSS(`dynamic-filter-${filterType}`, css);
  }

  /**
   * Remove dynamic CSS rule
   * @param {string} filterType - Type of filter
   */
  removeDynamicFilterRule(filterType) {
    const styleId = `dynamic-filter-${filterType}`;
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
      this.injectedStyles.delete(styleId);
    }
  }

  /**
   * Inject CSS into the page
   * @param {string} id - Unique identifier for the style element
   * @param {string} css - CSS content to inject
   */
  injectCSS(id, css) {
    // Remove existing style if present
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    
    // Insert at the beginning of head to ensure low specificity
    const head = document.head || document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
    
    this.injectedStyles.set(id, style);
  }

  /**
   * Setup DOM mutation observer to handle dynamically loaded content with enhanced detection
   */
  setupDOMObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldReapplyFilters = false;
      let hasSignificantChanges = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain filterable content
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the added node or its children match any filter selectors
              if (this.containsFilterableContent(node)) {
                shouldReapplyFilters = true;
                hasSignificantChanges = true;
                break;
              }
            }
          }
        }
        
        // Also watch for attribute changes that might affect filtering
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'id')) {
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE && this.containsFilterableContent(target)) {
            shouldReapplyFilters = true;
          }
        }
      });

      if (shouldReapplyFilters) {
        // Use different debounce times based on change significance
        const debounceTime = hasSignificantChanges ? 50 : 200;
        
        clearTimeout(this.reapplyTimeout);
        this.reapplyTimeout = setTimeout(() => {
          this.reapplyActiveFilters();
        }, debounceTime);
      }
    });

    // Enhanced observation options
    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'data-module-name']
    });
  }

  /**
   * Check if a node contains filterable content
   * @param {Element} node - DOM node to check
   * @returns {boolean} True if node contains filterable content
   */
  containsFilterableContent(node) {
    // Quick check for common filterable patterns
    const filterablePatterns = [
      'video-card', 'feed', 'recommend', 'rank', 'trending', 'hot', 'popular',
      'comment', 'reply', 'sidebar', 'right', 'related', 'next'
    ];
    
    const nodeClass = node.className || '';
    const nodeId = node.id || '';
    const nodeText = nodeClass + ' ' + nodeId;
    
    return filterablePatterns.some(pattern => 
      nodeText.toLowerCase().includes(pattern)
    ) || node.querySelector && (
      node.querySelector('a[href*="/video/"]') ||
      node.querySelector('[class*="video"]') ||
      node.querySelector('[class*="card"]')
    );
  }

  /**
   * Reapply all currently active filters (for dynamic content)
   */
  reapplyActiveFilters() {
    const activeFilters = Array.from(this.activeFilters);
    activeFilters.forEach(filterType => {
      const selectors = getSelectorsForFilter(filterType, this.currentDomain);
      const newElements = this.findElementsToHide(selectors, filterType);
      
      // Only hide elements that aren't already hidden
      const currentlyHidden = this.hiddenElements.get(filterType) || [];
      const elementsToHide = newElements.filter(element => 
        !currentlyHidden.includes(element) && 
        !element.classList.contains('bilibili-filter-hidden') &&
        !element.classList.contains('bilibili-filter-preserve-layout')
      );

      if (elementsToHide.length > 0) {
        this.hideElements(elementsToHide, filterType, true);
        // Update the stored hidden elements list
        this.hiddenElements.set(filterType, [...currentlyHidden, ...elementsToHide]);
      }
    });
  }

  /**
   * Toggle a filter on or off with immediate application
   * @param {string} filterType - Type of content to toggle
   * @param {boolean} enabled - Whether to enable or disable the filter
   * @param {boolean} preserveLayout - Whether to preserve layout when hiding
   * @returns {boolean} True if toggle was successful
   */
  toggleFilter(filterType, enabled, preserveLayout = true) {
    try {
      if (enabled) {
        return this.applyFilter(filterType, preserveLayout);
      } else {
        return this.removeFilter(filterType);
      }
    } catch (error) {
      console.error(`Error toggling filter ${filterType}:`, error);
      return false;
    }
  }

  /**
   * Test round-trip consistency for a filter type
   * @param {string} filterType - Type of filter to test
   * @returns {boolean} True if round-trip is consistent
   */
  testRoundTripConsistency(filterType) {
    try {
      // Get initial state
      const initialState = this.getFilterStatus();
      const wasActive = initialState[filterType];
      
      // Apply filter if not active
      if (!wasActive) {
        this.applyFilter(filterType);
      }
      
      // Check that filter is now active
      const afterApplyState = this.getFilterStatus();
      if (!afterApplyState[filterType]) {
        console.warn(`Filter ${filterType} failed to activate during round-trip test`);
        return false;
      }
      
      // Remove filter
      this.removeFilter(filterType);
      
      // Check that filter is now inactive
      const afterRemoveState = this.getFilterStatus();
      if (afterRemoveState[filterType]) {
        console.warn(`Filter ${filterType} failed to deactivate during round-trip test`);
        return false;
      }
      
      // Restore original state
      if (wasActive) {
        this.applyFilter(filterType);
      }
      
      // Verify we're back to original state
      const finalState = this.getFilterStatus();
      if (finalState[filterType] !== wasActive) {
        console.warn(`Filter ${filterType} failed to restore original state during round-trip test`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error during round-trip test for ${filterType}:`, error);
      return false;
    }
  }

  /**
   * Test round-trip consistency for all filter types
   * @returns {Object} Object with filter types as keys and test results as values
   */
  testAllRoundTripConsistency() {
    const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
    const results = {};
    
    filterTypes.forEach(filterType => {
      results[filterType] = this.testRoundTripConsistency(filterType);
    });
    
    return results;
  }

  /**
   * Get current filter status
   * @returns {Object} Object with filter types as keys and boolean status as values
   */
  getFilterStatus() {
    return {
      homeRecommendations: this.activeFilters.has('homeRecommendations'),
      rankingTrending: this.activeFilters.has('rankingTrending'),
      rightSidebar: this.activeFilters.has('rightSidebar'),
      comments: this.activeFilters.has('comments'),
      relatedVideos: this.activeFilters.has('relatedVideos')
    };
  }

  /**
   * Comprehensive verification that all toggle functionality requirements are met
   * This method tests all aspects of Task 7 requirements
   * @returns {Object} Detailed verification results
   */
  verifyToggleFunctionality() {
    const results = {
      enableDisableLogic: {},
      stateRestoration: {},
      immediateApplication: {},
      roundTripConsistency: {},
      overallSuccess: true
    };

    const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];

    try {
      // Test 1: Enable/Disable logic for each filter type
      console.log('Testing enable/disable logic...');
      filterTypes.forEach(filterType => {
        try {
          // Test enable
          const enableResult = this.toggleFilter(filterType, true);
          const isEnabled = this.activeFilters.has(filterType);
          
          // Test disable
          const disableResult = this.toggleFilter(filterType, false);
          const isDisabled = !this.activeFilters.has(filterType);
          
          results.enableDisableLogic[filterType] = {
            enableSuccess: enableResult && isEnabled,
            disableSuccess: disableResult && isDisabled,
            success: enableResult && isEnabled && disableResult && isDisabled
          };
          
          if (!results.enableDisableLogic[filterType].success) {
            results.overallSuccess = false;
          }
        } catch (error) {
          results.enableDisableLogic[filterType] = {
            success: false,
            error: error.message
          };
          results.overallSuccess = false;
        }
      });

      // Test 2: State restoration when filters are toggled off
      console.log('Testing state restoration...');
      filterTypes.forEach(filterType => {
        try {
          // Enable filter
          this.toggleFilter(filterType, true);
          const hasHiddenElements = this.hiddenElements.has(filterType);
          
          // Disable filter
          this.toggleFilter(filterType, false);
          const hiddenElementsCleared = !this.hiddenElements.has(filterType);
          
          results.stateRestoration[filterType] = {
            hiddenElementsTracked: hasHiddenElements,
            hiddenElementsCleared: hiddenElementsCleared,
            success: hiddenElementsCleared
          };
          
          if (!results.stateRestoration[filterType].success) {
            results.overallSuccess = false;
          }
        } catch (error) {
          results.stateRestoration[filterType] = {
            success: false,
            error: error.message
          };
          results.overallSuccess = false;
        }
      });

      // Test 3: Immediate application of filter changes
      console.log('Testing immediate application...');
      filterTypes.forEach(filterType => {
        try {
          const startTime = performance.now();
          
          // Toggle filter and measure time
          this.toggleFilter(filterType, true);
          const toggleTime = performance.now() - startTime;
          
          // Verify immediate state change
          const immediateStateChange = this.activeFilters.has(filterType);
          
          // Clean up
          this.toggleFilter(filterType, false);
          
          results.immediateApplication[filterType] = {
            toggleTime: toggleTime,
            immediateStateChange: immediateStateChange,
            success: toggleTime < 50 && immediateStateChange // 50ms threshold
          };
          
          if (!results.immediateApplication[filterType].success) {
            results.overallSuccess = false;
          }
        } catch (error) {
          results.immediateApplication[filterType] = {
            success: false,
            error: error.message
          };
          results.overallSuccess = false;
        }
      });

      // Test 4: Round-trip consistency for all filter types
      console.log('Testing round-trip consistency...');
      const roundTripResults = this.testAllRoundTripConsistency();
      
      filterTypes.forEach(filterType => {
        const success = roundTripResults[filterType] === true;
        results.roundTripConsistency[filterType] = {
          success: success,
          result: roundTripResults[filterType]
        };
        
        if (!success) {
          results.overallSuccess = false;
        }
      });

      // Summary
      results.summary = {
        totalTests: filterTypes.length * 4, // 4 test categories
        passedTests: Object.values(results.enableDisableLogic).filter(r => r.success).length +
                    Object.values(results.stateRestoration).filter(r => r.success).length +
                    Object.values(results.immediateApplication).filter(r => r.success).length +
                    Object.values(results.roundTripConsistency).filter(r => r.success).length,
        testCategories: {
          enableDisableLogic: Object.values(results.enableDisableLogic).every(r => r.success),
          stateRestoration: Object.values(results.stateRestoration).every(r => r.success),
          immediateApplication: Object.values(results.immediateApplication).every(r => r.success),
          roundTripConsistency: Object.values(results.roundTripConsistency).every(r => r.success)
        }
      };

      console.log('Toggle functionality verification completed:', results);
      return results;

    } catch (error) {
      console.error('Error during toggle functionality verification:', error);
      results.overallSuccess = false;
      results.error = error.message;
      return results;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Remove all injected styles
    this.injectedStyles.forEach(style => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    });
    this.injectedStyles.clear();

    // Restore all hidden elements
    this.activeFilters.forEach(filterType => {
      this.removeFilter(filterType);
    });

    this.activeFilters.clear();
    this.hiddenElements.clear();
  }
}

/**
 * Global filter manager instance
 */
export const filterManager = new FilterManager();