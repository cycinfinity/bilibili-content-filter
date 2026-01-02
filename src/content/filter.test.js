/**
 * Tests for content filtering system
 */

import { FilterManager } from './filter.js';

// Mock DOM methods
const mockElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false)
  },
  style: {
    removeProperty: jest.fn()
  },
  parentNode: true,
  getBoundingClientRect: jest.fn(() => ({
    left: 100,
    top: 100,
    width: 200,
    height: 100
  })),
  textContent: 'test content',
  matches: jest.fn(() => false),
  querySelectorAll: jest.fn(() => [])
};

describe('FilterManager', () => {
  let filterManager;
  let mockDocument;

  beforeEach(() => {
    filterManager = new FilterManager();
    
    // Mock document methods
    mockDocument = {
      querySelectorAll: jest.fn(() => [mockElement]),
      querySelector: jest.fn(() => mockElement),
      createElement: jest.fn(() => ({
        id: '',
        textContent: '',
        remove: jest.fn()
      })),
      head: {
        insertBefore: jest.fn(),
        firstChild: null
      },
      getElementsByTagName: jest.fn(() => [{ insertBefore: jest.fn(), firstChild: null }]),
      body: mockElement,
      readyState: 'complete'
    };
    
    global.document = mockDocument;
    global.window = {
      location: { hostname: 'www.bilibili.com' },
      innerWidth: 1200,
      MutationObserver: jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
      }))
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize without errors', () => {
      expect(() => filterManager.initialize()).not.toThrow();
    });

    test('should create base styles on initialization', () => {
      filterManager.initialize();
      expect(mockDocument.createElement).toHaveBeenCalledWith('style');
    });
  });

  describe('applyFilter', () => {
    beforeEach(() => {
      filterManager.initialize();
    });

    test('should apply filter for valid filter type', () => {
      filterManager.applyFilter('homeRecommendations');
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
    });

    test('should not apply same filter twice', () => {
      filterManager.applyFilter('homeRecommendations');
      const initialSize = filterManager.activeFilters.size;
      filterManager.applyFilter('homeRecommendations');
      expect(filterManager.activeFilters.size).toBe(initialSize);
    });

    test('should hide elements when filter is applied', () => {
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      filterManager.applyFilter('homeRecommendations');
      expect(mockElement.classList.add).toHaveBeenCalledWith('bilibili-filter-transition');
    });
  });

  describe('removeFilter', () => {
    beforeEach(() => {
      filterManager.initialize();
      filterManager.applyFilter('homeRecommendations');
    });

    test('should remove active filter', () => {
      filterManager.removeFilter('homeRecommendations');
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(false);
    });

    test('should restore hidden elements', () => {
      filterManager.removeFilter('homeRecommendations');
      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'bilibili-filter-hidden', 
        'bilibili-filter-preserve-layout'
      );
    });

    test('should not error when removing non-active filter', () => {
      expect(() => filterManager.removeFilter('nonExistentFilter')).not.toThrow();
    });
  });

  describe('findElementsToHide', () => {
    beforeEach(() => {
      filterManager.initialize();
    });

    test('should find elements using valid selectors', () => {
      const selectors = ['.video-card', '.feed-item'];
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      
      const elements = filterManager.findElementsToHide(selectors, 'homeRecommendations');
      expect(elements).toContain(mockElement);
    });

    test('should skip unsafe selectors', () => {
      const selectors = ['html', '.video-card'];
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      
      const elements = filterManager.findElementsToHide(selectors, 'homeRecommendations');
      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.video-card');
      expect(mockDocument.querySelectorAll).not.toHaveBeenCalledWith('html');
    });

    test('should handle invalid selectors gracefully', () => {
      const selectors = ['invalid[selector'];
      mockDocument.querySelectorAll.mockImplementation(() => {
        throw new Error('Invalid selector');
      });
      
      expect(() => filterManager.findElementsToHide(selectors, 'homeRecommendations')).not.toThrow();
    });

    test('should remove duplicate elements', () => {
      const selectors = ['.video-card', '.video-card']; // Same selector twice
      mockDocument.querySelectorAll.mockReturnValue([mockElement, mockElement]);
      
      const elements = filterManager.findElementsToHide(selectors, 'homeRecommendations');
      expect(elements.length).toBe(1); // Should deduplicate
    });
  });

  describe('getFilterStatus', () => {
    beforeEach(() => {
      filterManager.initialize();
    });

    test('should return correct status for all filter types', () => {
      filterManager.applyFilter('homeRecommendations');
      filterManager.applyFilter('comments');
      
      const status = filterManager.getFilterStatus();
      expect(status.homeRecommendations).toBe(true);
      expect(status.comments).toBe(true);
      expect(status.rankingTrending).toBe(false);
      expect(status.rightSidebar).toBe(false);
      expect(status.relatedVideos).toBe(false);
    });
  });

  describe('intelligent detection', () => {
    beforeEach(() => {
      filterManager.initialize();
    });

    test('should detect elements intelligently when selectors fail', () => {
      // Mock no elements found with regular selectors
      mockDocument.querySelectorAll.mockReturnValueOnce([]);
      // Mock elements found with intelligent detection
      mockDocument.querySelectorAll.mockReturnValueOnce([mockElement]);
      
      // Mock element that matches intelligent criteria
      mockElement.querySelectorAll.mockReturnValue([{}, {}, {}]); // 3 elements (meets minimum)
      
      filterManager.applyFilter('homeRecommendations');
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
    });
  });

  describe('cleanup', () => {
    beforeEach(() => {
      filterManager.initialize();
      filterManager.applyFilter('homeRecommendations');
    });

    test('should clean up resources on destroy', () => {
      filterManager.destroy();
      expect(filterManager.activeFilters.size).toBe(0);
      expect(filterManager.hiddenElements.size).toBe(0);
    });
  });
});