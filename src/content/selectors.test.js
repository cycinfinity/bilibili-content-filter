/**
 * Tests for CSS selector mappings and filtering logic
 */

import { 
  getSelectorsForFilter, 
  getIntelligentSelector, 
  isSelectorSafe,
  PRIMARY_SELECTORS,
  FALLBACK_SELECTORS,
  DOMAIN_SELECTORS
} from './selectors.js';

describe('CSS Selector Mappings', () => {
  describe('getSelectorsForFilter', () => {
    test('should return selectors for valid filter types', () => {
      const homeSelectors = getSelectorsForFilter('homeRecommendations');
      expect(homeSelectors).toBeInstanceOf(Array);
      expect(homeSelectors.length).toBeGreaterThan(0);
      expect(homeSelectors).toContain('.recommended-container_floor-aside');
    });

    test('should return empty array for invalid filter types', () => {
      const invalidSelectors = getSelectorsForFilter('invalidFilter');
      expect(invalidSelectors).toBeInstanceOf(Array);
      expect(invalidSelectors.length).toBeGreaterThan(0); // Should still return fallback selectors
    });

    test('should return domain-specific selectors when available', () => {
      const spaceSelectors = getSelectorsForFilter('homeRecommendations', 'space.bilibili.com');
      expect(spaceSelectors).toContain('.space-video-list');
    });

    test('should fallback to primary selectors for unknown domains', () => {
      const unknownDomainSelectors = getSelectorsForFilter('homeRecommendations', 'unknown.bilibili.com');
      expect(unknownDomainSelectors).toContain('.recommended-container_floor-aside');
    });
  });

  describe('getIntelligentSelector', () => {
    test('should return configuration for valid filter types', () => {
      const config = getIntelligentSelector('homeRecommendations');
      expect(config).toBeDefined();
      expect(config.containerPattern).toBeDefined();
      expect(config.contentPattern).toBeDefined();
      expect(config.minimumCount).toBeGreaterThan(0);
    });

    test('should return null for invalid filter types', () => {
      const config = getIntelligentSelector('invalidFilter');
      expect(config).toBeNull();
    });
  });

  describe('isSelectorSafe', () => {
    test('should allow safe selectors', () => {
      expect(isSelectorSafe('.video-card')).toBe(true);
      expect(isSelectorSafe('.recommended-container')).toBe(true);
      expect(isSelectorSafe('[class*="feed"]')).toBe(true);
    });

    test('should reject dangerous selectors', () => {
      expect(isSelectorSafe('html')).toBe(false);
      expect(isSelectorSafe('body')).toBe(false);
      expect(isSelectorSafe('.header')).toBe(false);
      expect(isSelectorSafe('.player')).toBe(false);
      expect(isSelectorSafe('[class*="login"]')).toBe(false);
    });
  });

  describe('PRIMARY_SELECTORS', () => {
    test('should have selectors for all filter types', () => {
      const expectedTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
      expectedTypes.forEach(type => {
        expect(PRIMARY_SELECTORS[type]).toBeDefined();
        expect(PRIMARY_SELECTORS[type]).toBeInstanceOf(Array);
        expect(PRIMARY_SELECTORS[type].length).toBeGreaterThan(0);
      });
    });

    test('should contain valid CSS selectors', () => {
      Object.values(PRIMARY_SELECTORS).forEach(selectors => {
        selectors.forEach(selector => {
          expect(typeof selector).toBe('string');
          expect(selector.length).toBeGreaterThan(0);
          // Basic CSS selector format check
          expect(selector).toMatch(/^[.#\[\]a-zA-Z0-9_-]+/);
        });
      });
    });
  });

  describe('FALLBACK_SELECTORS', () => {
    test('should have fallback selectors for all filter types', () => {
      const expectedTypes = ['homeRecommendations', 'rankingTrending', 'rightSidebar', 'comments', 'relatedVideos'];
      expectedTypes.forEach(type => {
        expect(FALLBACK_SELECTORS[type]).toBeDefined();
        expect(FALLBACK_SELECTORS[type]).toBeInstanceOf(Array);
        expect(FALLBACK_SELECTORS[type].length).toBeGreaterThan(0);
      });
    });
  });

  describe('DOMAIN_SELECTORS', () => {
    test('should have configurations for known Bilibili domains', () => {
      const expectedDomains = ['www.bilibili.com', 'space.bilibili.com', 'live.bilibili.com', 'search.bilibili.com'];
      expectedDomains.forEach(domain => {
        expect(DOMAIN_SELECTORS[domain]).toBeDefined();
      });
    });

    test('should maintain primary selector structure for domain-specific configs', () => {
      Object.values(DOMAIN_SELECTORS).forEach(domainConfig => {
        expect(domainConfig.homeRecommendations).toBeDefined();
        expect(domainConfig.homeRecommendations).toBeInstanceOf(Array);
      });
    });
  });
});