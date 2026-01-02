/**
 * CSS Selector Mappings for Bilibili Content Filtering
 * 
 * This module defines CSS selectors for different types of content
 * that can be filtered on Bilibili.com and its subdomains.
 */

/**
 * Primary selectors for each filter type
 * These are the most common selectors found on Bilibili pages
 */
export const PRIMARY_SELECTORS = {
  homeRecommendations: [
    // Homepage feed and recommendations
    '.recommended-container_floor-aside',
    '.feed-card',
    '.bili-video-card',
    '.video-page-card-small',
    '.rcmd-box',
    '.recommend-list',
    '.feed-roll-btn',
    // Homepage sections
    '.home-container .feed-card',
    '.recommended-container',
    '.bili-feed4-layout',
    '.feed-roll-btn',
    // Mobile responsive selectors
    '.m-video-card',
    '.video-list .video-item'
  ],
  
  rankingTrending: [
    // Ranking sections
    '.ranking-container',
    '.rank-list',
    '.trending-box',
    '.hot-list',
    '.popular-list',
    '.rank-item',
    // Trending content
    '.trending-video',
    '.hot-video-card',
    '.popular-video-card',
    // Sidebar rankings
    '.right-container .rank-list',
    '.sidebar-rank',
    // Mobile rankings
    '.m-rank-list',
    '.mobile-trending'
  ],
  
  rightSidebar: [
    // Main right sidebar
    '.right-container',
    '.video-page-right',
    '.right-container-inner',
    '.playlist-container',
    // Sidebar components
    '.video-page-card-small',
    '.up-panel-container',
    '.video-page-operator-card',
    '.ad-report',
    // Related content in sidebar
    '.rec-list',
    '.rec-footer',
    // Mobile sidebar (when applicable)
    '.m-right-container'
  ],
  
  comments: [
    // Comment sections
    '.bb-comment',
    '.comment-container',
    '.reply-box',
    '.comment-list',
    '.comment-bilibili',
    // Comment components
    '.reply-item',
    '.comment-item',
    '.sub-reply-container',
    '.comment-header',
    '.comment-send',
    // Mobile comments
    '.m-comment',
    '.mobile-comment-container',
    // Comment loading and pagination
    '.comment-loading',
    '.comment-pagination'
  ],
  
  relatedVideos: [
    // Related video sections
    '.video-page-card-small',
    '.next-play',
    '.rec-list',
    '.related-video',
    '.recommend-video-card',
    // Autoplay and next video
    '.bpx-player-ending-related',
    '.ending-panel',
    '.next-button',
    // Playlist related
    '.playlist-container .video-item',
    '.video-episode-card',
    // Mobile related videos
    '.m-video-card.related',
    '.mobile-related-video'
  ]
};

/**
 * Fallback selectors for different page layouts or when primary selectors fail
 * These use more generic patterns and attribute-based selection
 */
export const FALLBACK_SELECTORS = {
  homeRecommendations: [
    // Generic video card patterns
    '[class*="video-card"]',
    '[class*="feed"]',
    '[class*="recommend"]',
    '[data-module-name="recommend"]',
    '[data-report*="recommend"]',
    // Content with specific attributes
    '[href*="/video/"]',
    '.card-box[href*="/video/"]'
  ],
  
  rankingTrending: [
    // Generic ranking patterns
    '[class*="rank"]',
    '[class*="trending"]',
    '[class*="hot"]',
    '[class*="popular"]',
    '[data-module-name="rank"]',
    '[data-report*="rank"]'
  ],
  
  rightSidebar: [
    // Generic sidebar patterns
    '[class*="right"]',
    '[class*="sidebar"]',
    '.aside',
    '[data-module-name="right"]',
    // Layout-based detection
    '.container > .right',
    '.main-container .right'
  ],
  
  comments: [
    // Generic comment patterns
    '[class*="comment"]',
    '[class*="reply"]',
    '[data-module-name="comment"]',
    '[data-report*="comment"]',
    // Text-based detection
    '[placeholder*="评论"]',
    '[placeholder*="回复"]'
  ],
  
  relatedVideos: [
    // Generic related content patterns
    '[class*="related"]',
    '[class*="next"]',
    '[class*="rec"]',
    '[data-module-name="related"]',
    '[data-report*="related"]',
    // Ending panel patterns
    '[class*="ending"]',
    '[class*="autoplay"]'
  ]
};

/**
 * Intelligent selectors that use content analysis
 * These are used when both primary and fallback selectors fail
 */
export const INTELLIGENT_SELECTORS = {
  homeRecommendations: {
    // Look for containers with multiple video links
    containerPattern: 'div, section, article',
    contentPattern: 'a[href*="/video/"]',
    minimumCount: 3, // Must contain at least 3 video links to be considered a recommendation section
    excludePatterns: ['[class*="comment"]', '[class*="reply"]'] // Exclude comment sections
  },
  
  rankingTrending: {
    // Look for numbered lists or ranking indicators
    containerPattern: 'div, section, ul, ol',
    contentPattern: '.rank, .number, [class*="index"]',
    minimumCount: 5, // Must contain at least 5 ranked items
    textPatterns: ['排行', '热门', '榜单', '趋势'] // Chinese text indicators
  },
  
  rightSidebar: {
    // Look for right-positioned containers
    containerPattern: 'div, aside, section',
    positionCheck: true, // Check CSS positioning
    widthThreshold: 300, // Typical sidebar width
    locationCheck: 'right' // Must be positioned on the right side
  },
  
  comments: {
    // Look for comment-like structures
    containerPattern: 'div, section',
    contentPattern: '.avatar, .user, [class*="time"]',
    textPatterns: ['评论', '回复', '点赞', '举报'], // Chinese comment indicators
    minimumCount: 1
  },
  
  relatedVideos: {
    // Look for video grids or lists near video player
    containerPattern: 'div, section',
    contentPattern: 'a[href*="/video/"]',
    proximityCheck: '.video-player, .player-container', // Must be near video player
    minimumCount: 2
  }
};

/**
 * Domain-specific selector variations
 * Different Bilibili subdomains may have different layouts
 */
export const DOMAIN_SELECTORS = {
  'www.bilibili.com': PRIMARY_SELECTORS,
  'space.bilibili.com': {
    ...PRIMARY_SELECTORS,
    homeRecommendations: [
      '.space-video-list',
      '.fav-video-list',
      '.channel-video-list'
    ]
  },
  'live.bilibili.com': {
    ...PRIMARY_SELECTORS,
    rightSidebar: [
      '.live-room-right',
      '.chat-container',
      '.gift-panel'
    ],
    comments: [
      '.chat-list',
      '.danmaku-list',
      '.live-comment'
    ]
  },
  'search.bilibili.com': {
    ...PRIMARY_SELECTORS,
    homeRecommendations: [
      '.video-list .video-item',
      '.search-result-item'
    ]
  }
};

/**
 * Get selectors for a specific filter type and domain
 * @param {string} filterType - The type of filter
 * @param {string} domain - The current domain
 * @returns {string[]} Array of CSS selectors
 */
export function getSelectorsForFilter(filterType, domain = 'www.bilibili.com') {
  const domainSelectors = DOMAIN_SELECTORS[domain] || PRIMARY_SELECTORS;
  const primary = domainSelectors[filterType] || [];
  const fallback = FALLBACK_SELECTORS[filterType] || [];
  
  return [...primary, ...fallback];
}

/**
 * Get intelligent selector configuration for a filter type
 * @param {string} filterType - The type of filter
 * @returns {Object} Intelligent selector configuration
 */
export function getIntelligentSelector(filterType) {
  return INTELLIGENT_SELECTORS[filterType] || null;
}

/**
 * Validate if a selector is safe to use (prevents breaking the page)
 * @param {string} selector - CSS selector to validate
 * @returns {boolean} True if selector is safe
 */
export function isSelectorSafe(selector) {
  // Avoid selectors that might break core page functionality
  const dangerousPatterns = [
    'html', 'body', 'head',
    '.header', '.nav', '.navigation',
    '.player', '.video-player',
    '[class*="login"]', '[class*="auth"]'
  ];
  
  return !dangerousPatterns.some(pattern => 
    selector.toLowerCase().includes(pattern.toLowerCase())
  );
}