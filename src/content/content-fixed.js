/**
 * Bilibili Content Filter - Content Script (Fixed Version)
 * 
 * This script runs on Bilibili pages to apply content filtering
 * based on user preferences stored in browser storage.
 * 
 * Note: This version doesn't use ES6 imports to ensure Chrome compatibility
 */

(function() {
  'use strict';

  // Browser compatibility setup
  const storageAPI = (typeof chrome !== 'undefined' && chrome.storage) ? chrome.storage : 
                    (typeof browser !== 'undefined' && browser.storage) ? browser.storage : null;

  if (!storageAPI) {
    console.error('Bilibili Filter: No storage API available');
    return;
  }

  // CSS Selectors for different content types
  const SELECTORS = {
    hideHeadChannel: [
      '.bili-header__channel'
    ],
    rightSidebar: [
      '.right-container',
      '.playlist-container--right',
      '.rec-list',
      '.video-page-card-small',
      '[class*="right-container"]'
    ],
    comments: [
      '#commentapp',
      '.strip-ad-inner',
      '.bb-comment',
      '.comment-container',
      '.reply-wrap',
      '#comment',
      '[class*="comment"]',
      '.reply-list',
      '.comment-bilibili-fold'
    ],
    relatedVideos: [
      '.video-page-card-small',
      '.rec-list',
      '.next-play',
      '[class*="related"]',
      '[class*="recommend"]'
    ]
  };

  // Default settings
  const DEFAULT_SETTINGS = {
    hideHeadChannel: false,
    rightSidebar: false,
    comments: false,
    relatedVideos: false
  };

  // Content Filter Manager
  class ContentFilter {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.injectedStyles = new Map();
      this.isInitialized = false;
    }

    async initialize() {
      try {
        console.log('Bilibili Filter: Initializing content script...');
        
        // Load settings
        await this.loadSettings();
        
        // Apply initial filters
        this.applyAllFilters();
        
        // Set up storage listener
        this.setupStorageListener();
        
        // Set up DOM observer for dynamic content
        this.setupDOMObserver();
        
        this.isInitialized = true;
        console.log('Bilibili Filter: Content script initialized successfully');
        
      } catch (error) {
        console.error('Bilibili Filter: Failed to initialize:', error);
      }
    }

    async loadSettings() {
      return new Promise((resolve) => {
        storageAPI.sync.get(['bilibiliFilterSettings'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('Bilibili Filter: Failed to load from sync storage, trying local');
            storageAPI.local.get(['bilibiliFilterSettings'], (localResult) => {
              this.settings = { ...DEFAULT_SETTINGS, ...(localResult.bilibiliFilterSettings || {}) };
              resolve();
            });
          } else {
            this.settings = { ...DEFAULT_SETTINGS, ...(result.bilibiliFilterSettings || {}) };
            resolve();
          }
        });
      });
    }

    setupStorageListener() {
      if (storageAPI.onChanged) {
        storageAPI.onChanged.addListener((changes, areaName) => {
          if (changes.bilibiliFilterSettings) {
            this.settings = { ...DEFAULT_SETTINGS, ...changes.bilibiliFilterSettings.newValue };
            this.applyAllFilters();
          }
        });
      }
    }

    setupDOMObserver() {
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver((mutations) => {
          let shouldReapply = false;
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              shouldReapply = true;
            }
          });
          
          if (shouldReapply) {
            // Debounce reapplication
            clearTimeout(this.reapplyTimeout);
            this.reapplyTimeout = setTimeout(() => {
              this.applyAllFilters();
            }, 500);
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    applyAllFilters() {
      Object.keys(this.settings).forEach(filterType => {
        if (this.settings[filterType] && SELECTORS[filterType]) {
          this.applyFilter(filterType);
        } else {
          this.removeFilter(filterType);
        }
      });
    }

    applyFilter(filterType) {
      const selectors = SELECTORS[filterType];
      if (!selectors) return;

      // Create CSS to hide elements
      const css = selectors.map(selector => `${selector} { display: none !important; }`).join('\n');
      
      // Inject or update style
      let styleElement = this.injectedStyles.get(filterType);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = `bilibili-filter-${filterType}`;
        document.head.appendChild(styleElement);
        this.injectedStyles.set(filterType, styleElement);
      }
      
      styleElement.textContent = css;
      console.log(`Bilibili Filter: Applied ${filterType} filter`);
    }

    removeFilter(filterType) {
      const styleElement = this.injectedStyles.get(filterType);
      if (styleElement) {
        styleElement.remove();
        this.injectedStyles.delete(filterType);
        console.log(`Bilibili Filter: Removed ${filterType} filter`);
      }
    }
  }

  // Initialize when DOM is ready
  function initializeFilter() {
    const filter = new ContentFilter();
    filter.initialize();
    
    // Make it globally accessible for debugging
    window.bilibiliFilter = filter;
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFilter);
  } else {
    initializeFilter();
  }

  console.log('Bilibili Filter: Content script loaded');

})();