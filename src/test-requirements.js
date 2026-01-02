/**
 * Requirements Verification Test
 * Tests that Task 7 requirements are fully implemented:
 * - Implement enable/disable logic for each filter type
 * - Add state restoration when filters are toggled off  
 * - Ensure immediate application of filter changes
 * - Test round-trip consistency for all filter types
 * Requirements: 1.3, 2.3, 3.3, 4.3, 5.3
 */

import { FilterManager } from './content/filter.js';

// Mock DOM environment
const createMockElement = () => ({
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
});

const setupMockDOM = () => {
  const mockElement = createMockElement();
  
  global.document = {
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
  
  return mockElement;
};

describe('Task 7: Filter Toggle and Round-trip Functionality Requirements', () => {
  let filterManager;
  let mockElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockElement = setupMockDOM();
    filterManager = new FilterManager();
    filterManager.initialize();
  });

  afterEach(() => {
    filterManager.destroy();
  });

  describe('Requirement: Implement enable/disable logic for each filter type', () => {
    const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];

    test('should enable each filter type individually', () => {
      filterTypes.forEach(filterType => {
        const result = filterManager.toggleFilter(filterType, true);
        expect(result).toBe(true);
        expect(filterManager.activeFilters.has(filterType)).toBe(true);
        
        // Reset for next test
        filterManager.toggleFilter(filterType, false);
      });
    });

    test('should disable each filter type individually', () => {
      filterTypes.forEach(filterType => {
        // First enable
        filterManager.toggleFilter(filterType, true);
        
        // Then disable
        const result = filterManager.toggleFilter(filterType, false);
        expect(result).toBe(true);
        expect(filterManager.activeFilters.has(filterType)).toBe(false);
      });
    });

    test('should handle multiple filters simultaneously', () => {
      // Enable all filters
      filterTypes.forEach(filterType => {
        filterManager.toggleFilter(filterType, true);
      });
      
      // Verify all are enabled
      filterTypes.forEach(filterType => {
        expect(filterManager.activeFilters.has(filterType)).toBe(true);
      });
      
      // Disable all filters
      filterTypes.forEach(filterType => {
        filterManager.toggleFilter(filterType, false);
      });
      
      // Verify all are disabled
      filterTypes.forEach(filterType => {
        expect(filterManager.activeFilters.has(filterType)).toBe(false);
      });
    });

    test('should provide correct filter status for all types', () => {
      // Enable some filters
      filterManager.toggleFilter('homeRecommendations', true);
      filterManager.toggleFilter('comments', true);
      
      const status = filterManager.getFilterStatus();
      
      expect(status.homeRecommendations).toBe(true);
      expect(status.rankingTrending).toBe(false);
      expect(status.rightSidebar).toBe(false);
      expect(status.comments).toBe(true);
      expect(status.relatedVideos).toBe(false);
    });
  });

  describe('Requirement: Add state restoration when filters are toggled off', () => {
    test('should restore element visibility classes when filter is disabled', () => {
      // Enable filter
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Disable filter
      filterManager.toggleFilter('homeRecommendations', false);
      
      // Verify restoration methods were called
      expect(mockElement.classList.remove).toHaveBeenCalledWith(
        'bilibili-filter-hidden', 
        'bilibili-filter-preserve-layout'
      );
    });

    test('should restore element styles when filter is disabled', () => {
      // Enable filter
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Disable filter
      filterManager.toggleFilter('homeRecommendations', false);
      
      // Verify style restoration
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith('display');
      expect(mockElement.style.removeProperty).toHaveBeenCalledWith('visibility');
    });

    test('should clear hidden elements tracking when filter is disabled', () => {
      // Enable filter
      filterManager.toggleFilter('homeRecommendations', true);
      expect(filterManager.hiddenElements.has('homeRecommendations')).toBe(true);
      
      // Disable filter
      filterManager.toggleFilter('homeRecommendations', false);
      expect(filterManager.hiddenElements.has('homeRecommendations')).toBe(false);
    });

    test('should handle restoration of non-existent elements gracefully', () => {
      // Enable filter
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Simulate element removal
      mockElement.parentNode = null;
      
      // Disable filter should not throw
      expect(() => {
        filterManager.toggleFilter('homeRecommendations', false);
      }).not.toThrow();
    });

    test('should restore original display and visibility values', () => {
      // Mock element with original values
      mockElement.dataset.originalDisplay = 'flex';
      mockElement.dataset.originalVisibility = 'visible';
      
      // Enable then disable filter
      filterManager.toggleFilter('homeRecommendations', true);
      filterManager.toggleFilter('homeRecommendations', false);
      
      // Verify original values are cleared from dataset
      expect(mockElement.dataset.originalDisplay).toBeUndefined();
      expect(mockElement.dataset.originalVisibility).toBeUndefined();
    });
  });

  describe('Requirement: Ensure immediate application of filter changes', () => {
    test('should apply filter changes within acceptable time threshold', () => {
      const startTime = performance.now();
      
      filterManager.toggleFilter('homeRecommendations', true);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 10ms (immediate)
      expect(duration).toBeLessThan(10);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
    });

    test('should update filter status immediately after toggle', () => {
      const initialStatus = filterManager.getFilterStatus();
      expect(initialStatus.homeRecommendations).toBe(false);
      
      filterManager.toggleFilter('homeRecommendations', true);
      
      // Status should be updated immediately
      const updatedStatus = filterManager.getFilterStatus();
      expect(updatedStatus.homeRecommendations).toBe(true);
    });

    test('should apply DOM changes immediately', () => {
      filterManager.toggleFilter('homeRecommendations', true);
      
      // DOM manipulation should have been called immediately
      expect(mockElement.classList.add).toHaveBeenCalledWith('bilibili-filter-transition');
    });

    test('should create dynamic CSS rules immediately', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      
      filterManager.toggleFilter('homeRecommendations', true);
      
      // CSS injection should happen immediately
      expect(createElementSpy).toHaveBeenCalledWith('style');
    });
  });

  describe('Requirement: Test round-trip consistency for all filter types', () => {
    const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];

    test('should pass round-trip test for each individual filter type', () => {
      filterTypes.forEach(filterType => {
        const result = filterManager.testRoundTripConsistency(filterType);
        expect(result).toBe(true);
      });
    });

    test('should pass comprehensive round-trip test for all filters', () => {
      const results = filterManager.testAllRoundTripConsistency();
      
      // All filter types should be tested
      expect(Object.keys(results)).toEqual(expect.arrayContaining(filterTypes));
      
      // All tests should pass
      Object.entries(results).forEach(([filterType, result]) => {
        expect(result).toBe(true);
      });
    });

    test('should maintain consistency during enable-disable-enable cycle', () => {
      const filterType = 'homeRecommendations';
      
      // Initial state
      expect(filterManager.activeFilters.has(filterType)).toBe(false);
      
      // Enable
      filterManager.toggleFilter(filterType, true);
      expect(filterManager.activeFilters.has(filterType)).toBe(true);
      
      // Disable
      filterManager.toggleFilter(filterType, false);
      expect(filterManager.activeFilters.has(filterType)).toBe(false);
      
      // Enable again
      filterManager.toggleFilter(filterType, true);
      expect(filterManager.activeFilters.has(filterType)).toBe(true);
    });

    test('should handle round-trip testing with multiple filters active', () => {
      // Enable multiple filters
      filterManager.toggleFilter('homeRecommendations', true);
      filterManager.toggleFilter('comments', true);
      
      // Test round-trip for a different filter
      const result = filterManager.testRoundTripConsistency('rightSidebar');
      expect(result).toBe(true);
      
      // Other filters should remain unchanged
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
      expect(filterManager.activeFilters.has('comments')).toBe(true);
    });

    test('should detect round-trip failures if they occur', () => {
      // Mock a scenario where toggle fails
      const originalToggle = filterManager.toggleFilter;
      let callCount = 0;
      
      filterManager.toggleFilter = jest.fn((filterType, enabled) => {
        callCount++;
        // Fail on the second call (disable attempt)
        if (callCount === 2) {
          return false;
        }
        return originalToggle.call(filterManager, filterType, enabled);
      });
      
      const result = filterManager.testRoundTripConsistency('homeRecommendations');
      expect(result).toBe(false);
      
      // Restore original method
      filterManager.toggleFilter = originalToggle;
    });
  });

  describe('Requirements Coverage: 1.3, 2.3, 3.3, 4.3, 5.3', () => {
    test('Requirement 1.3: homeRecommendations filter toggle functionality', () => {
      // Test enable
      filterManager.toggleFilter('homeRecommendations', true);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(true);
      
      // Test disable with restoration
      filterManager.toggleFilter('homeRecommendations', false);
      expect(filterManager.activeFilters.has('homeRecommendations')).toBe(false);
      expect(mockElement.classList.remove).toHaveBeenCalled();
    });

    test('Requirement 2.3: rankingTrending filter toggle functionality', () => {
      // Test enable
      filterManager.toggleFilter('rankingTrending', true);
      expect(filterManager.activeFilters.has('rankingTrending')).toBe(true);
      
      // Test disable with restoration
      filterManager.toggleFilter('rankingTrending', false);
      expect(filterManager.activeFilters.has('rankingTrending')).toBe(false);
    });

    test('Requirement 3.3: rightSidebar filter toggle functionality', () => {
      // Test enable
      filterManager.toggleFilter('rightSidebar', true);
      expect(filterManager.activeFilters.has('rightSidebar')).toBe(true);
      
      // Test disable with restoration
      filterManager.toggleFilter('rightSidebar', false);
      expect(filterManager.activeFilters.has('rightSidebar')).toBe(false);
    });

    test('Requirement 4.3: comments filter toggle functionality', () => {
      // Test enable
      filterManager.toggleFilter('comments', true);
      expect(filterManager.activeFilters.has('comments')).toBe(true);
      
      // Test disable with restoration
      filterManager.toggleFilter('comments', false);
      expect(filterManager.activeFilters.has('comments')).toBe(false);
    });

    test('Requirement 5.3: relatedVideos filter toggle functionality', () => {
      // Test enable
      filterManager.toggleFilter('relatedVideos', true);
      expect(filterManager.activeFilters.has('relatedVideos')).toBe(true);
      
      // Test disable with restoration
      filterManager.toggleFilter('relatedVideos', false);
      expect(filterManager.activeFilters.has('relatedVideos')).toBe(false);
    });
  });
});