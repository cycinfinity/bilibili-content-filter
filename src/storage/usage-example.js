/**
 * Usage example for the Storage Management System
 * This demonstrates how other parts of the extension would interact with storage
 */

import { 
  initializeStorage, 
  getFilterSettings, 
  saveFilterSettings, 
  onSettingsChange,
  DEFAULT_SETTINGS 
} from './index.js';

/**
 * Example: Initialize storage when extension starts
 */
async function extensionStartup() {
  try {
    // Initialize storage with defaults
    await initializeStorage();
    console.log('Storage initialized successfully');
    
    // Get current settings
    const settings = await getFilterSettings();
    console.log('Current settings:', settings);
    
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    // Extension can still work with default settings
  }
}

/**
 * Example: Handle user toggling a filter in popup
 */
async function toggleFilter(filterType, enabled) {
  try {
    // Get current settings
    const currentSettings = await getFilterSettings();
    
    // Update the specific filter
    const updatedSettings = {
      ...currentSettings,
      [filterType]: enabled
    };
    
    // Save updated settings
    await saveFilterSettings(updatedSettings);
    
    console.log(`Filter ${filterType} ${enabled ? 'enabled' : 'disabled'}`);
    
  } catch (error) {
    console.error('Failed to toggle filter:', error);
    // Could show user notification about the error
  }
}

/**
 * Example: Content script listening for settings changes
 */
function setupContentScriptListener() {
  onSettingsChange((newSettings) => {
    console.log('Settings changed, applying new filters:', newSettings);
    
    // Apply filters based on new settings
    applyFiltersToPage(newSettings);
  });
}

/**
 * Example: Apply filters to the current page
 */
function applyFiltersToPage(settings) {
  // This would contain the actual DOM manipulation logic
  if (settings.homeRecommendations) {
    console.log('Hiding home recommendations');
    // hideHomeRecommendations();
  }
  
  if (settings.rankingTrending) {
    console.log('Hiding ranking and trending');
    // hideRankingTrending();
  }
  
  if (settings.rightSidebar) {
    console.log('Hiding right sidebar');
    // hideRightSidebar();
  }
  
  if (settings.comments) {
    console.log('Hiding comments');
    // hideComments();
  }
  
  if (settings.relatedVideos) {
    console.log('Hiding related videos');
    // hideRelatedVideos();
  }
}

/**
 * Example: Error handling with graceful degradation
 */
async function robustSettingsRetrieval() {
  try {
    return await getFilterSettings();
  } catch (error) {
    console.warn('Failed to get settings from storage, using defaults:', error);
    
    // Graceful degradation - use defaults
    return { ...DEFAULT_SETTINGS };
  }
}

// Export examples for testing/documentation
export {
  extensionStartup,
  toggleFilter,
  setupContentScriptListener,
  applyFiltersToPage,
  robustSettingsRetrieval
};