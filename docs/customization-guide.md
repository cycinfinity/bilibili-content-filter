# CSS Selector Customization Guide

This guide explains how to customize and maintain the CSS selectors used by the Bilibili Content Filter Extension to adapt to changes in Bilibili's website structure.

## Overview

The extension uses CSS selectors to identify and hide different types of content on Bilibili.com. When Bilibili updates their website layout, these selectors may need to be updated to maintain functionality.

## Selector Architecture

The extension uses a three-tier selector system:

1. **Primary Selectors**: Most specific and reliable selectors for current Bilibili layout
2. **Fallback Selectors**: Generic patterns that work across different layouts
3. **Intelligent Selectors**: Content-based detection when CSS selectors fail

## File Structure

```
src/content/
├── selectors.js          # Main selector definitions
├── filter.js            # Filter application logic
└── content.js           # Content script coordinator
```

## Understanding Selectors

### Primary Selectors

Located in `src/content/selectors.js`, these are the most specific selectors:

```javascript
export const PRIMARY_SELECTORS = {
  homeRecommendations: [
    '.recommended-container_floor-aside',
    '.feed-card',
    '.bili-video-card',
    // ... more selectors
  ],
  // ... other filter types
};
```

**When to update:** When Bilibili changes their CSS class names or HTML structure.

### Fallback Selectors

Generic patterns that work across different page layouts:

```javascript
export const FALLBACK_SELECTORS = {
  homeRecommendations: [
    '[class*="video-card"]',
    '[class*="feed"]',
    '[data-module-name="recommend"]',
    // ... more patterns
  ],
  // ... other filter types
};
```

**When to update:** When primary selectors fail and you need broader matching patterns.

### Intelligent Selectors

Content-based detection for unknown page structures:

```javascript
export const INTELLIGENT_SELECTORS = {
  homeRecommendations: {
    containerPattern: 'div, section, article',
    contentPattern: 'a[href*="/video/"]',
    minimumCount: 3,
    excludePatterns: ['[class*="comment"]']
  },
  // ... other configurations
};
```

**When to update:** When both primary and fallback selectors fail on new page layouts.

## Customization Process

### Step 1: Identify What Needs Updating

1. **Test the extension** on Bilibili.com
2. **Check browser console** for errors or warnings
3. **Identify which filters** are not working
4. **Inspect the page** to find new CSS selectors

### Step 2: Find New Selectors

#### Using Browser Developer Tools

1. **Open Developer Tools** (F12)
2. **Right-click** on content you want to hide
3. **Select "Inspect Element"**
4. **Find the appropriate container** element
5. **Note the CSS classes and attributes**

#### Example: Finding Recommendation Selectors

```html
<!-- Old structure (working) -->
<div class="recommended-container_floor-aside">
  <div class="feed-card">...</div>
</div>

<!-- New structure (needs update) -->
<div class="bili-feed-container">
  <div class="bili-video-card-v2">...</div>
</div>
```

**Action:** Add `.bili-feed-container` and `.bili-video-card-v2` to primary selectors.

### Step 3: Update Selector Files

#### Adding New Primary Selectors

```javascript
// In src/content/selectors.js
export const PRIMARY_SELECTORS = {
  homeRecommendations: [
    // Existing selectors
    '.recommended-container_floor-aside',
    '.feed-card',
    
    // New selectors (add these)
    '.bili-feed-container',
    '.bili-video-card-v2',
    '.new-recommendation-section'
  ],
  // ... other filter types
};
```

#### Adding Domain-Specific Selectors

For different Bilibili subdomains:

```javascript
export const DOMAIN_SELECTORS = {
  'www.bilibili.com': PRIMARY_SELECTORS,
  'space.bilibili.com': {
    ...PRIMARY_SELECTORS,
    homeRecommendations: [
      // Space-specific selectors
      '.space-video-list',
      '.user-video-container'
    ]
  },
  // Add new domain
  'new.bilibili.com': {
    ...PRIMARY_SELECTORS,
    homeRecommendations: [
      '.new-layout-feed',
      '.modern-video-card'
    ]
  }
};
```

### Step 4: Test Your Changes

#### Manual Testing

1. **Load the extension** with your changes
2. **Visit different Bilibili pages**:
   - Homepage (www.bilibili.com)
   - User spaces (space.bilibili.com)
   - Live streams (live.bilibili.com)
   - Search results (search.bilibili.com)
3. **Test each filter type**
4. **Verify content is hidden correctly**
5. **Check that page layout isn't broken**

#### Automated Testing

Run the selector tests:

```bash
npm test -- --testPathPattern=selectors.test.js
```

## Advanced Customization

### Creating Custom Filter Types

To add a new filter type (e.g., "advertisements"):

1. **Add to PRIMARY_SELECTORS:**
```javascript
export const PRIMARY_SELECTORS = {
  // ... existing filters
  advertisements: [
    '.ad-banner',
    '.sponsored-content',
    '.promotion-card'
  ]
};
```

2. **Add to FALLBACK_SELECTORS:**
```javascript
export const FALLBACK_SELECTORS = {
  // ... existing filters
  advertisements: [
    '[class*="ad"]',
    '[class*="sponsor"]',
    '[data-report*="ad"]'
  ]
};
```

3. **Add to INTELLIGENT_SELECTORS:**
```javascript
export const INTELLIGENT_SELECTORS = {
  // ... existing filters
  advertisements: {
    containerPattern: 'div, section',
    contentPattern: '[class*="ad"], [data-ad]',
    minimumCount: 1,
    textPatterns: ['广告', '推广', '赞助'] // Chinese ad indicators
  }
};
```

4. **Update the popup interface** to include the new toggle
5. **Update storage settings** to include the new filter

### Selector Best Practices

#### DO:
- **Use specific class names** when available
- **Combine multiple selectors** for reliability
- **Test across different page types**
- **Include fallback patterns**
- **Document your changes**

#### DON'T:
- **Use overly broad selectors** (e.g., `div`, `span`)
- **Target core page elements** (e.g., `.header`, `.player`)
- **Break page functionality**
- **Use position-dependent selectors** (e.g., `:nth-child(3)`)

#### Safe Selector Patterns

```javascript
// Good: Specific and safe
'.bili-video-card'
'.recommendation-container'
'[data-module-name="recommend"]'

// Better: Multiple specific selectors
'.feed-card, .bili-video-card, .video-card-small'

// Best: Hierarchical with context
'.home-container .feed-card'
'.recommended-container .video-item'

// Avoid: Too broad
'div'
'.card'
'[class*="container"]'

// Avoid: Core functionality
'.header'
'.player'
'.navigation'
```

### Handling Dynamic Content

For content that loads dynamically:

```javascript
// In src/content/filter.js
class FilterManager {
  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for new content matching our selectors
          this.applyFiltersToNewContent(mutation.addedNodes);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}
```

### Debugging Selectors

#### Enable Debug Mode

Add debug logging to see which selectors are working:

```javascript
// In src/content/selectors.js
export function debugSelectors(filterType) {
  const selectors = getSelectorsForFilter(filterType);
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`Selector "${selector}": ${elements.length} elements found`);
    
    if (elements.length > 0) {
      console.log('Sample element:', elements[0]);
    }
  });
}

// Usage in browser console:
// debugSelectors('homeRecommendations');
```

#### Selector Validation

Check if selectors are safe and effective:

```javascript
// In src/content/selectors.js
export function validateSelector(selector) {
  // Check if selector is safe
  if (!isSelectorSafe(selector)) {
    console.warn(`Unsafe selector: ${selector}`);
    return false;
  }
  
  // Check if selector finds elements
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) {
    console.warn(`Selector finds no elements: ${selector}`);
    return false;
  }
  
  console.log(`Valid selector: ${selector} (${elements.length} elements)`);
  return true;
}
```

## Maintenance Workflow

### Regular Maintenance

1. **Monthly Check**: Test extension on Bilibili.com
2. **Monitor Issues**: Check user reports and GitHub issues
3. **Update Selectors**: Add new selectors as needed
4. **Test Changes**: Verify functionality across different pages
5. **Deploy Updates**: Release updated extension

### Emergency Updates

When Bilibili makes breaking changes:

1. **Identify the Problem**: Which filters stopped working?
2. **Find New Selectors**: Use developer tools to find replacements
3. **Update Quickly**: Focus on primary selectors first
4. **Test Minimally**: Ensure basic functionality works
5. **Deploy Fast**: Push emergency update
6. **Follow Up**: Add fallback selectors and improve robustness

### Version Control

Track selector changes in git:

```bash
# Create feature branch for selector updates
git checkout -b update-selectors-2024-01

# Make changes to selectors.js
# Test changes
# Commit with descriptive message
git commit -m "Update selectors for new Bilibili homepage layout

- Add .bili-feed-container for recommendations
- Add .new-video-card-v2 for video cards  
- Update fallback patterns for better coverage
- Fixes issue with homepage recommendations not hiding"

# Push and create pull request
git push origin update-selectors-2024-01
```

## Troubleshooting

### Common Issues

#### "Selectors not working after Bilibili update"

**Symptoms:** Filters don't hide content anymore
**Solution:** 
1. Inspect page elements to find new CSS classes
2. Update PRIMARY_SELECTORS with new classes
3. Test and deploy update

#### "Extension breaks page layout"

**Symptoms:** Page looks broken, missing content, layout issues
**Solution:**
1. Check if selectors are too broad
2. Verify selectors don't target core page elements
3. Use more specific selectors
4. Test with `isSelectorSafe()` function

#### "Some content still shows"

**Symptoms:** Partial filtering, some content not hidden
**Solution:**
1. Add more comprehensive selectors
2. Check for dynamic content loading
3. Improve DOM observation
4. Add fallback selectors

#### "Extension too slow"

**Symptoms:** Page loading slowly, browser lag
**Solution:**
1. Optimize selector performance
2. Reduce number of selectors
3. Use more efficient CSS patterns
4. Implement throttling for DOM observation

### Getting Help

1. **Check existing issues** on GitHub
2. **Search documentation** for similar problems
3. **Test with debug mode** enabled
4. **Create detailed bug report** with:
   - Browser version
   - Extension version
   - Specific page URL
   - Console errors
   - Steps to reproduce

## Contributing Selector Updates

### For Developers

1. **Fork the repository**
2. **Create feature branch** for selector updates
3. **Update selectors** following best practices
4. **Add tests** for new selectors
5. **Submit pull request** with detailed description

### For Users

1. **Report issues** with specific details
2. **Provide page URLs** where filters don't work
3. **Include screenshots** showing the problem
4. **Test proposed fixes** when available

## Tools and Resources

### Browser Extensions for Development

- **Selector Gadget**: Chrome extension for finding CSS selectors
- **ChroPath**: XPath and CSS selector finder
- **Web Developer**: Comprehensive web development tools

### Online Tools

- **CSS Selector Tester**: Test selectors against live pages
- **Regex101**: For pattern matching in fallback selectors
- **Can I Use**: Check CSS selector browser support

### Documentation

- **MDN CSS Selectors**: Complete CSS selector reference
- **Chrome DevTools**: Official documentation for element inspection
- **Bilibili Developer**: Official API and structure documentation (if available)

This customization guide provides everything needed to maintain and extend the extension's selector system as Bilibili's website evolves.