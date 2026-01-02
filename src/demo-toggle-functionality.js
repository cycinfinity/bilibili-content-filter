/**
 * Demonstration of Task 7: Filter Toggle and Round-trip Functionality
 * 
 * This script demonstrates that all requirements are implemented:
 * - Enable/disable logic for each filter type
 * - State restoration when filters are toggled off
 * - Immediate application of filter changes
 * - Round-trip consistency testing
 */

import { FilterManager } from './content/filter.js';

// Mock minimal DOM environment for demonstration
const setupDemoEnvironment = () => {
  const mockElement = {
    classList: {
      add: () => console.log('  → Element class added'),
      remove: () => console.log('  → Element class removed'),
      contains: () => false
    },
    style: {
      removeProperty: () => console.log('  → Element style restored'),
      setProperty: () => console.log('  → Element style applied')
    },
    parentNode: true,
    getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 100 }),
    textContent: 'demo content',
    matches: () => false,
    querySelectorAll: () => [],
    dataset: {}
  };

  global.document = {
    querySelectorAll: () => [mockElement],
    querySelector: () => mockElement,
    createElement: () => ({
      id: '',
      textContent: '',
      remove: () => console.log('  → Style element removed')
    }),
    head: {
      insertBefore: () => console.log('  → Style element injected'),
      firstChild: null
    },
    getElementsByTagName: () => [{ insertBefore: () => {}, firstChild: null }],
    body: mockElement,
    readyState: 'complete',
    getElementById: () => null
  };

  global.window = {
    location: { hostname: 'www.bilibili.com' },
    innerWidth: 1200,
    getComputedStyle: () => ({
      display: 'block',
      visibility: 'visible',
      marginTop: '10px',
      marginBottom: '10px'
    }),
    MutationObserver: function() {
      return {
        observe: () => console.log('  → DOM observer started'),
        disconnect: () => console.log('  → DOM observer stopped')
      };
    }
  };

  // Mock performance for timing tests
  global.performance = {
    now: () => Date.now()
  };
};

const demonstrateToggleFunctionality = () => {
  console.log('='.repeat(60));
  console.log('BILIBILI CONTENT FILTER - TOGGLE FUNCTIONALITY DEMO');
  console.log('='.repeat(60));
  
  setupDemoEnvironment();
  
  const filterManager = new FilterManager();
  console.log('\n1. Initializing FilterManager...');
  filterManager.initialize();
  
  const filterTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
  
  console.log('\n2. DEMONSTRATING ENABLE/DISABLE LOGIC');
  console.log('-'.repeat(40));
  
  filterTypes.forEach(filterType => {
    console.log(`\nTesting ${filterType}:`);
    
    // Enable filter
    console.log('  Enabling filter...');
    const enableResult = filterManager.toggleFilter(filterType, true);
    const isEnabled = filterManager.activeFilters.has(filterType);
    console.log(`  ✓ Enable result: ${enableResult}, Active: ${isEnabled}`);
    
    // Disable filter
    console.log('  Disabling filter...');
    const disableResult = filterManager.toggleFilter(filterType, false);
    const isDisabled = !filterManager.activeFilters.has(filterType);
    console.log(`  ✓ Disable result: ${disableResult}, Inactive: ${isDisabled}`);
  });
  
  console.log('\n3. DEMONSTRATING STATE RESTORATION');
  console.log('-'.repeat(40));
  
  console.log('\nEnabling homeRecommendations filter...');
  filterManager.toggleFilter('homeRecommendations', true);
  console.log(`Hidden elements tracked: ${filterManager.hiddenElements.has('homeRecommendations')}`);
  
  console.log('\nDisabling homeRecommendations filter...');
  filterManager.toggleFilter('homeRecommendations', false);
  console.log(`Hidden elements cleared: ${!filterManager.hiddenElements.has('homeRecommendations')}`);
  
  console.log('\n4. DEMONSTRATING IMMEDIATE APPLICATION');
  console.log('-'.repeat(40));
  
  const startTime = performance.now();
  filterManager.toggleFilter('comments', true);
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`Toggle operation completed in ${duration.toFixed(2)}ms`);
  console.log(`Filter immediately active: ${filterManager.activeFilters.has('comments')}`);
  
  // Clean up
  filterManager.toggleFilter('comments', false);
  
  console.log('\n5. DEMONSTRATING ROUND-TRIP CONSISTENCY');
  console.log('-'.repeat(40));
  
  console.log('\nTesting individual filter round-trip...');
  const singleResult = filterManager.testRoundTripConsistency('rightSidebar');
  console.log(`Right sidebar round-trip test: ${singleResult ? 'PASSED' : 'FAILED'}`);
  
  console.log('\nTesting all filters round-trip...');
  const allResults = filterManager.testAllRoundTripConsistency();
  Object.entries(allResults).forEach(([filterType, result]) => {
    console.log(`  ${filterType}: ${result ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n6. COMPREHENSIVE VERIFICATION');
  console.log('-'.repeat(40));
  
  const verification = filterManager.verifyToggleFunctionality();
  console.log(`\nOverall verification: ${verification.overallSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`Tests passed: ${verification.summary.passedTests}/${verification.summary.totalTests}`);
  
  console.log('\nTest category results:');
  Object.entries(verification.summary.testCategories).forEach(([category, passed]) => {
    console.log(`  ${category}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log('\n7. REQUIREMENTS COVERAGE VERIFICATION');
  console.log('-'.repeat(40));
  
  const requirements = [
    { id: '1.3', desc: 'homeRecommendations toggle functionality' },
    { id: '2.3', desc: 'rankingTrending toggle functionality' },
    { id: '3.3', desc: 'rightSidebar toggle functionality' },
    { id: '4.3', desc: 'comments toggle functionality' },
    { id: '5.3', desc: 'relatedVideos toggle functionality' }
  ];
  
  requirements.forEach(req => {
    const filterType = req.desc.split(' ')[0];
    const hasLogic = verification.enableDisableLogic[filterType]?.success;
    const hasRestoration = verification.stateRestoration[filterType]?.success;
    const hasImmediate = verification.immediateApplication[filterType]?.success;
    const hasRoundTrip = verification.roundTripConsistency[filterType]?.success;
    
    const allPassed = hasLogic && hasRestoration && hasImmediate && hasRoundTrip;
    console.log(`  Requirement ${req.id}: ${allPassed ? 'SATISFIED' : 'NOT SATISFIED'}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('DEMO COMPLETED');
  console.log(`TASK 7 IMPLEMENTATION: ${verification.overallSuccess ? 'SUCCESSFUL' : 'NEEDS WORK'}`);
  console.log('='.repeat(60));
  
  // Clean up
  filterManager.destroy();
  
  return verification.overallSuccess;
};

// Export for use in tests or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { demonstrateToggleFunctionality };
} else {
  // Run demo if executed directly
  demonstrateToggleFunctionality();
}