/**
 * Unit tests for Storage Management System
 */

import { StorageManager, DEFAULT_SETTINGS, STORAGE_ERRORS } from './storage.js';

describe('StorageManager', () => {
  let storageManager;
  let mockStorageAPI;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock storage API
    mockStorageAPI = {
      sync: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn()
      },
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn()
      },
      onChanged: {
        addListener: jest.fn()
      }
    };

    // Mock chrome API
    global.chrome = {
      storage: mockStorageAPI,
      runtime: {}
    };

    storageManager = new StorageManager();
  });

  afterEach(() => {
    // Clean up
    delete global.chrome;
    delete global.browser;
  });

  describe('initialization', () => {
    test('should detect Chrome storage API', () => {
      expect(storageManager.storageAPI).toBe(mockStorageAPI);
    });

    test('should fallback to browser API when chrome is unavailable', () => {
      delete global.chrome;
      global.browser = { storage: mockStorageAPI };
      
      const manager = new StorageManager();
      expect(manager.storageAPI).toBe(mockStorageAPI);
    });

    test('should throw error when no storage API is available', () => {
      delete global.chrome;
      delete global.browser;
      
      expect(() => new StorageManager()).toThrow('No browser storage API available');
    });

    test('should setup change listener', () => {
      expect(mockStorageAPI.onChanged.addListener).toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    test('should return settings from sync storage when available', async () => {
      const mockSettings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false
      };

      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({ bilibiliFilterSettings: mockSettings });
      });

      const result = await storageManager.getSettings();
      
      expect(result).toEqual({ ...DEFAULT_SETTINGS, ...mockSettings });
      expect(mockStorageAPI.sync.get).toHaveBeenCalledWith(['bilibiliFilterSettings'], expect.any(Function));
    });

    test('should fallback to local storage when sync fails', async () => {
      const mockSettings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false
      };

      // Sync storage fails
      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      // Local storage succeeds
      mockStorageAPI.local.get.mockImplementation((keys, callback) => {
        callback({ bilibiliFilterSettings: mockSettings });
      });

      const result = await storageManager.getSettings();
      
      expect(result).toEqual({ ...DEFAULT_SETTINGS, ...mockSettings });
      expect(mockStorageAPI.local.get).toHaveBeenCalled();
    });

    test('should return defaults when no settings found', async () => {
      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      mockStorageAPI.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const result = await storageManager.getSettings();
      
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    test('should return defaults when settings are corrupted', async () => {
      const corruptedSettings = {
        homeRecommendations: 'invalid', // Should be boolean
        rankingTrending: true
      };

      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({ bilibiliFilterSettings: corruptedSettings });
      });

      mockStorageAPI.local.get.mockImplementation((keys, callback) => {
        callback({});
      });

      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      const result = await storageManager.getSettings();
      
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    test('should save valid settings to sync storage', async () => {
      const settings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false,
        version: '1.0.0'
      };

      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await storageManager.saveSettings(settings);
      
      expect(mockStorageAPI.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          bilibiliFilterSettings: expect.objectContaining({
            ...settings,
            lastUpdated: expect.any(Number)
          })
        }),
        expect.any(Function)
      );
    });

    test('should fallback to local storage when sync fails', async () => {
      const settings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false,
        version: '1.0.0'
      };

      // Sync storage fails
      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        global.chrome.runtime.lastError = { message: 'QUOTA_EXCEEDED_PER_ITEM' };
        callback();
      });

      // Local storage succeeds
      mockStorageAPI.local.set.mockImplementation((data, callback) => {
        delete global.chrome.runtime.lastError;
        callback();
      });

      await storageManager.saveSettings(settings);
      
      expect(mockStorageAPI.local.set).toHaveBeenCalled();
    });

    test('should throw error for invalid settings', async () => {
      const invalidSettings = {
        homeRecommendations: 'invalid', // Should be boolean
        rankingTrending: true
      };

      await expect(storageManager.saveSettings(invalidSettings)).rejects.toThrow('Invalid settings object');
    });

    test('should throw error when both sync and local storage fail', async () => {
      const settings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false,
        version: '1.0.0'
      };

      // Both storages fail
      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        global.chrome.runtime.lastError = { message: 'QUOTA_EXCEEDED_PER_ITEM' };
        callback();
      });

      mockStorageAPI.local.set.mockImplementation((data, callback) => {
        global.chrome.runtime.lastError = { message: 'Storage error' };
        callback();
      });

      await expect(storageManager.saveSettings(settings)).rejects.toThrow('Storage operation failed');
    });
  });

  describe('initializeDefaults', () => {
    test('should initialize defaults when no settings exist', async () => {
      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      mockStorageAPI.sync.set.mockImplementation((data, callback) => {
        callback();
      });

      await storageManager.initializeDefaults();
      
      expect(mockStorageAPI.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({
          bilibiliFilterSettings: expect.objectContaining(DEFAULT_SETTINGS)
        }),
        expect.any(Function)
      );
    });

    test('should not overwrite existing valid settings', async () => {
      const existingSettings = {
        homeRecommendations: false,
        rankingTrending: true,
        rightSidebar: false,
        comments: true,
        relatedVideos: false
      };

      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        callback({ bilibiliFilterSettings: existingSettings });
      });

      await storageManager.initializeDefaults();
      
      expect(mockStorageAPI.sync.set).not.toHaveBeenCalled();
    });

    test('should handle initialization errors gracefully', async () => {
      mockStorageAPI.sync.get.mockImplementation((keys, callback) => {
        global.chrome.runtime.lastError = { message: 'Storage error' };
        callback({});
      });

      // Should not throw
      await expect(storageManager.initializeDefaults()).resolves.toBeUndefined();
    });
  });

  describe('change listeners', () => {
    test('should register change listeners', () => {
      const callback = jest.fn();
      
      storageManager.onSettingsChange(callback);
      
      expect(storageManager.changeListeners.has(callback)).toBe(true);
    });

    test('should unregister change listeners', () => {
      const callback = jest.fn();
      
      storageManager.onSettingsChange(callback);
      storageManager.offSettingsChange(callback);
      
      expect(storageManager.changeListeners.has(callback)).toBe(false);
    });

    test('should notify listeners on settings change', () => {
      const callback = jest.fn();
      const newSettings = { homeRecommendations: false };
      
      storageManager.onSettingsChange(callback);
      
      // Simulate storage change
      const changeListener = mockStorageAPI.onChanged.addListener.mock.calls[0][0];
      changeListener({
        bilibiliFilterSettings: {
          newValue: newSettings
        }
      }, 'sync');
      
      expect(callback).toHaveBeenCalledWith(newSettings);
    });

    test('should handle listener errors gracefully', () => {
      const faultyCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodCallback = jest.fn();
      
      storageManager.onSettingsChange(faultyCallback);
      storageManager.onSettingsChange(goodCallback);
      
      // Simulate storage change
      const changeListener = mockStorageAPI.onChanged.addListener.mock.calls[0][0];
      changeListener({
        bilibiliFilterSettings: {
          newValue: { homeRecommendations: false }
        }
      }, 'sync');
      
      // Good callback should still be called despite faulty one
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should categorize quota exceeded errors', () => {
      const error = new Error('QUOTA_EXCEEDED_PER_ITEM');
      const category = storageManager._categorizeStorageError(error);
      
      expect(category).toBe(STORAGE_ERRORS.QUOTA_EXCEEDED);
    });

    test('should categorize sync unavailable errors', () => {
      const error = new Error('Sync service unavailable');
      const category = storageManager._categorizeStorageError(error);
      
      expect(category).toBe(STORAGE_ERRORS.SYNC_UNAVAILABLE);
    });

    test('should categorize permission denied errors', () => {
      const error = new Error('Permission denied');
      const category = storageManager._categorizeStorageError(error);
      
      expect(category).toBe(STORAGE_ERRORS.PERMISSION_DENIED);
    });

    test('should categorize corrupted data errors', () => {
      const error = new Error('Data is corrupt');
      const category = storageManager._categorizeStorageError(error);
      
      expect(category).toBe(STORAGE_ERRORS.CORRUPTED_DATA);
    });

    test('should categorize unknown errors', () => {
      const error = new Error('Some random error');
      const category = storageManager._categorizeStorageError(error);
      
      expect(category).toBe(STORAGE_ERRORS.UNKNOWN_ERROR);
    });
  });

  describe('clearSettings', () => {
    test('should clear settings from sync storage', async () => {
      mockStorageAPI.sync.remove.mockImplementation((keys, callback) => {
        callback();
      });

      await storageManager.clearSettings();
      
      expect(mockStorageAPI.sync.remove).toHaveBeenCalledWith(['bilibiliFilterSettings'], expect.any(Function));
    });

    test('should fallback to local storage when sync fails', async () => {
      mockStorageAPI.sync.remove.mockImplementation((keys, callback) => {
        global.chrome.runtime.lastError = { message: 'Sync error' };
        callback();
      });

      mockStorageAPI.local.remove.mockImplementation((keys, callback) => {
        delete global.chrome.runtime.lastError;
        callback();
      });

      await storageManager.clearSettings();
      
      expect(mockStorageAPI.local.remove).toHaveBeenCalled();
    });
  });
});