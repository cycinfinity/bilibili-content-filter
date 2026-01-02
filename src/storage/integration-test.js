/**
 * Integration test demonstrating storage system functionality
 * This would normally be run in a browser extension environment
 */

import { 
  initializeStorage, 
  getFilterSettings, 
  saveFilterSettings, 
  onSettingsChange,
  DEFAULT_SETTINGS 
} from './index.js';

/**
 * Mock browser environment for testing
 */
function setupMockBrowser() {
  const mockStorage = {
    data: {},
    listeners: []
  };

  global.chrome = {
    storage: {
      sync: {
        get: (keys, callback) => {
          const result = {};
          keys.forEach(key => {
            if (mockStorage.data[key]) {
              result[key] = mockStorage.data[key];
            }
          });
          callback(result);
        },
        set: (items, callback) => {
          Object.assign(mockStorage.data, items);
          // Simulate change event
          mockStorage.listeners.forEach(listener => {
            const changes = {};
            Object.keys(items).forEach(key => {
              changes[key] = { newValue: items[key] };
            });
            listener(changes, 'sync');
          });
          callback();
        }
      },
      onChanged: {
        addListener: (callback) => {
          mockStorage.listeners.push(callback);
        }
      }
    },
    runtime: {}
  };

  return mockStorage;
}

/**
 * Run integration test
 */
async function runIntegrationTest() {
  console.log('🧪 Starting Storage System Integration Test');
  
  // Setup mock environment
  const mockStorage = setupMockBrowser();
  
  try {
    // Test 1: Initialize storage
    console.log('\n📝 Test 1: Initialize storage');
    await initializeStorage();
    console.log('✅ Storage initialized successfully');
    
    // Test 2: Get default settings
    console.log('\n📝 Test 2: Get default settings');
    const defaultSettings = await getFilterSettings();
    console.log('✅ Default settings retrieved:', defaultSettings);
    
    // Verify defaults match expected values
    if (defaultSettings.homeRecommendations === true) {
      console.log('✅ Home recommendations enabled by default (as required)');
    } else {
      console.log('❌ Home recommendations should be enabled by default');
    }
    
    // Test 3: Save modified settings
    console.log('\n📝 Test 3: Save modified settings');
    const modifiedSettings = {
      ...defaultSettings,
      rankingTrending: true,
      comments: true
    };
    
    await saveFilterSettings(modifiedSettings);
    console.log('✅ Modified settings saved successfully');
    
    // Test 4: Retrieve modified settings
    console.log('\n📝 Test 4: Retrieve modified settings');
    const retrievedSettings = await getFilterSettings();
    
    if (retrievedSettings.rankingTrending === true && retrievedSettings.comments === true) {
      console.log('✅ Modified settings retrieved correctly');
    } else {
      console.log('❌ Settings not persisted correctly');
    }
    
    // Test 5: Settings change listener
    console.log('\n📝 Test 5: Settings change listener');
    let changeDetected = false;
    
    onSettingsChange((newSettings) => {
      console.log('✅ Settings change detected:', newSettings);
      changeDetected = true;
    });
    
    // Trigger a change
    const finalSettings = {
      ...retrievedSettings,
      rightSidebar: true
    };
    
    await saveFilterSettings(finalSettings);
    
    // Give listener time to fire
    setTimeout(() => {
      if (changeDetected) {
        console.log('✅ Change listener working correctly');
      } else {
        console.log('❌ Change listener not triggered');
      }
      
      console.log('\n🎉 Integration test completed');
      console.log('📊 Final storage state:', mockStorage.data);
      
    }, 100);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Export for manual testing
export { runIntegrationTest, setupMockBrowser };