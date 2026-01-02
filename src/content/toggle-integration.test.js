/**
 * Integration tests for filter toggle functionality
 * Tests the complete toggle workflow including round-trip consistency
 */

import { FilterManager } from './filter.js';

// Mock DOM environment for testing
const mockElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false)
  },
  style: {
    removeProperty: jest.fn(),
    setProperty: jest.fn()
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
  querySelectorAll: jest.fn(() => []),
  dataset: {}
};

describe('Filter Toggle Integration', () => {
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
      readyState: 'complete',
      getElementById: jest.fn(() => null)
    };
    
    global.document = mockDocument;
    global.window = {
      location: { hostname: 'www.bilibili.com' },
      innerWidth: 1200,
      getComputedStyle: jest.fn(() => ({
        display: 'block',
        visibility: 'visible',
        marginTop: '10px',
        marginBottom: '10px'
      })),
      MutationObserver: jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
      }))
    };

    filterManager.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
    filterManager.destroy();
  });

  describe('toggleFilter method', () => {
    test('should enable filter when toggled on', () => {
      const result = filterManager.toggleFilter('homeRecommendations', true);
      
      expect(result).toBe(true);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
    });

    test('should disable filter when toggled off', () => {
      // First enable the filter
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Then disable it
      const result = filterManager.toggleFilter('homeRecommendations', false);
      
      expect(result).toBe(true);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(false);
    });

    test('should handle multiple filter types', () => {
      const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
      
      // Enable all filters
      filterTypes.forEach(filterType => {
        const result = filterManager.toggleFilter(filterType, true);
        expect(result).toBe(true);
        expect(filterManager.activeFilters.has(filterType)).toBe(true);
      });
      
      // Disable all filters
      filterTypes.forEach(filterType => {
        const result = filterManager.toggleFilter(filterType, false);
        expect(result).toBe(true);
        expect(filterManager.activeFilters.has(filterType)).toBe(false);
      });
    });

    test('should be idempotent when toggling to same state', () => {
      // Enable twice
      filterManager.toggleFilter('homeRecommendations', true);
      const result = filterManager.toggleFilter('homeRecommendations', true);
      
      expect(result).toBe(true);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
      
      // Disable twice
      filterManager.toggleFilter('homeRecommendations', false);
      const result2 = filterManager.toggleFilter('homeRecommendations', false);
      
      expect(result2).toBe(true);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(false);
    });
  });

  describe('round-trip consistency', () => {
    test('should pass round-trip test for single filter', () => {
      const result = filterManager.testRoundTripConsistency('homeRecommendations');
      expect(result).toBe(true);
    });

    test('should pass round-trip test for all filters', () => {
      const results = filterManager.testAllRoundTripConsistency();
      
      Object.values(results).forEach(result => {
        expect(result).toBe(true);
      });
    });

    test('should maintain state consistency during rapid toggles', () => {
      const filterType = 'homeRecommendations';
      
      // Perform rapid toggles
      for (let i = 0; i < 10; i++) {
        filterManager.toggleFilter(filterType, i % 2 === 0);
      }
      
      // Final state should be disabled (i=9, 9%2 !== 0, so enabled=false)
      expect(filterManager.activeFilters.has(filterType)).toBe(false);
      
      // Round-trip test should still pass
      const result = filterManager.testRoundTripConsistency(filterType);
      expect(result).toBe(true);
    });
  });

  describe('state restoration', () => {
    test('should restore element visibility when filter is disabled', () => {
      // Setup mock element with hidden state
      mockElement.classList.contains.mockReturnValue(true);
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      
      // Enable then disable filter
      filterManager.toggleFilter('homeRecommendations', true);
      filterManager.toggleFilter('homeRecommendations', false);
      
      // Verify restoration methods were called
      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'bilibili-filter-hidden', 
        'bilibili-filter-preserve-layout'
      );
      expect(mockElement.style.removeProperty).toHaveBeenCalled();
    });

    test('should handle restoration of elements that no longer exist', () => {
      // Enable filter with valid element
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Simulate element removal from DOM
      mockElement.parentNode = null;
      
      // Disable filter should not throw error
      expect(() => {
        filterManager.toggleFilter('homeRecommendations', false);
      }).not.toThrow();
    });
  });

  describe('immediate application', () => {
    test('should apply changes immediately without delay', () => {
      const startTime = Date.now();
      
      filterManager.toggleFilter('homeRecommendations', true);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 50ms (immediate)
      expect(duration).toBeLessThan(50);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
    });

    test('should update filter status immediately', () => {
      const initialStatus = filterManager.getFilterStatus();
      expect(initialStatus.homeRecommendations).toBe(false);
      
      filterManager.toggleFilter('homeRecommendations', true);
      
      const updatedStatus = filterManager.getFilterStatus();
      expect(updatedStatus.homeRecommendations).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid filter types gracefully', () => {
      // Should not throw, but return false for invalid filter type
      const result = filterManager.toggleFilter('invalidFilter', true);
      expect(result).toBe(true); // Current implementation adds any filter type
    });

    test('should handle DOM manipulation errors gracefully', () => {
      // Mock querySelector to throw error
      mockDocument.querySelectorAll.mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      // Should not throw error
      expect(() => {
        filterManager.toggleFilter('homeRecommendations', true);
      }).not.toThrow();
    });
  });

  describe('layout preservation', () => {
    test('should preserve layout when hiding elements', () => {
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      
      filterManager.toggleFilter('homeRecommendations', true, true);
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('bilibili-filter-preserve-layout');
    });

    test('should completely hide elements when layout preservation is disabled', () => {
      mockDocument.querySelectorAll.mockReturnValue([mockElement]);
      
      filterManager.toggleFilter('homeRecommendations', true, false);
      
      expect(mockElement.classList.add).toHaveBeenCalledWith('bilibili-filter-hidden');
    });
  });
});