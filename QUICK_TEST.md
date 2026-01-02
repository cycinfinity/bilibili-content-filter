# 🧪 Quick Extension Test Guide

## 5-Minute Test to Verify Everything Works

### Step 1: Install the Extension (2 minutes)
1. Open Chrome or Edge
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist/chrome` folder from your project
6. Verify the extension appears in your extensions list

### Step 2: Test Basic Functionality (2 minutes)
1. **Go to Bilibili**: Navigate to https://www.bilibili.com
2. **Open Extension Popup**: Click the extension icon in your toolbar
3. **Test Toggle**: Click the "Homepage Recommendations" toggle
4. **Verify Effect**: The recommendation feed should disappear/reappear
5. **Test Persistence**: Refresh the page - settings should be remembered

### Step 3: Test Multiple Filters (1 minute)
1. Try toggling different filters:
   - Right Sidebar
   - Comments (on a video page)
   - Related Videos (on a video page)
2. Each should hide/show the corresponding content

## ✅ Success Checklist
- [ ] Extension loads without errors
- [ ] Popup opens when clicking icon
- [ ] Toggles change content visibility
- [ ] Settings persist after page refresh
- [ ] No console errors in developer tools

## 🚨 If Something Doesn't Work
1. **Check browser console** (F12) for error messages
2. **Verify you're on a Bilibili domain** (*.bilibili.com)
3. **Try refreshing the page** after changing settings
4. **Disable/enable the extension** to reset it

## 🎯 Expected Behavior
- **Homepage Recommendations**: Hides the main feed on bilibili.com homepage
- **Right Sidebar**: Hides sidebar content on video pages
- **Comments**: Hides comment sections on video pages
- **Related Videos**: Hides "related videos" sections
- **Ranking/Trending**: Hides trending content areas

The extension is working correctly if content disappears when filters are enabled and reappears when disabled!