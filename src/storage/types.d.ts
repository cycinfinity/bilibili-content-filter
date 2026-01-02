/**
 * TypeScript definitions for Storage Management System
 */

/**
 * Filter settings interface
 */
export interface FilterSettings {
  /** Hide homepage recommendations (default: true) */
  homeRecommendations: boolean;
  
  /** Hide ranking and trending sections (default: false) */
  rankingTrending: boolean;
  
  /** Hide right sidebar content (default: false) */
  rightSidebar: boolean;
  
  /** Hide comments sections (default: false) */
  comments: boolean;
  
  /** Hide related videos (default: false) */
  relatedVideos: boolean;
  
  /** Settings schema version */
  version: string;
  
  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Filter type enumeration
 */
export enum FilterType {
  HOME_RECOMMENDATIONS = 'homeRecommendations',
  RANKING_TRENDING = 'rankingTrending',
  RIGHT_SIDEBAR = 'rightSidebar',
  COMMENTS = 'comments',
  RELATED_VIDEOS = 'relatedVideos'
}

/**
 * Storage error types
 */
export enum StorageErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SYNC_UNAVAILABLE = 'SYNC_UNAVAILABLE',
  CORRUPTED_DATA = 'CORRUPTED_DATA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Browser storage API interface
 */
export interface BrowserStorageAPI {
  sync: {
    get(keys: string[], callback: (result: any) => void): void;
    set(items: Record<string, any>, callback: () => void): void;
    remove(keys: string[], callback: () => void): void;
  };
  local: {
    get(keys: string[], callback: (result: any) => void): void;
    set(items: Record<string, any>, callback: () => void): void;
    remove(keys: string[], callback: () => void): void;
  };
  onChanged?: {
    addListener(callback: (changes: any, areaName: string) => void): void;
  };
}

/**
 * Storage change callback function
 */
export type SettingsChangeCallback = (settings: FilterSettings) => void;

/**
 * Storage Manager class interface
 */
export interface IStorageManager {
  /**
   * Get current filter settings
   */
  getSettings(): Promise<FilterSettings>;
  
  /**
   * Save filter settings
   */
  saveSettings(settings: FilterSettings): Promise<void>;
  
  /**
   * Initialize default settings
   */
  initializeDefaults(): Promise<void>;
  
  /**
   * Register settings change listener
   */
  onSettingsChange(callback: SettingsChangeCallback): void;
  
  /**
   * Unregister settings change listener
   */
  offSettingsChange(callback: SettingsChangeCallback): void;
  
  /**
   * Clear all settings (for testing)
   */
  clearSettings(): Promise<void>;
}