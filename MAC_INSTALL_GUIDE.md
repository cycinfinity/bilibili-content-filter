# 🍎 Mac Installation Guide - Super Simple!

## 🚀 Quick Install (2 minutes) - Chrome/Edge

### Step 1: Install Chrome or Edge (if you don't have them)
- **Chrome**: Download from https://www.google.com/chrome/
- **Edge**: Download from https://www.microsoft.com/edge/

### Step 2: Install Your Extension
1. **Open Chrome or Edge**
2. **Type in address bar**: `chrome://extensions/` (or `edge://extensions/`)
3. **Enable Developer Mode**: Toggle the switch in top-right corner
4. **Click "Load unpacked"**
5. **Navigate to your project folder** and select the `dist/chrome` folder
6. **Click "Select Folder"**

### Step 3: Test It!
1. **Go to**: https://www.bilibili.com
2. **Click the extension icon** in your browser toolbar (should appear as a puzzle piece or extension icon)
3. **Toggle the "Homepage Recommendations"** switch
4. **Watch the content disappear/reappear!** ✨

## 🧪 Quick Test Checklist
- [ ] Extension appears in extensions list
- [ ] Extension icon shows in toolbar
- [ ] Popup opens when clicking icon
- [ ] Toggling filters hides/shows content
- [ ] Settings persist after page refresh

## 🎯 If You Really Want Safari...

Safari extensions are much more complex and require:
1. Xcode (large download ~10GB)
2. Apple Developer account (for signing)
3. Complex conversion process

**Recommendation**: Start with Chrome/Edge first, then tackle Safari later if needed.

## 🔧 Running the Safari Script (Advanced)

If you really want to try Safari:

1. **Install Xcode** (this takes a while):
   ```bash
   # Install Xcode command line tools
   xcode-select --install
   ```

2. **Make the script executable**:
   ```bash
   chmod +x dist/safari/convert-safari.sh
   ```

3. **Run the conversion**:
   ```bash
   cd /path/to/your/project
   ./dist/safari/convert-safari.sh
   ```

4. **Open the generated Xcode project** and build it

But honestly, **Chrome/Edge is much easier and works identically!**

## ✅ Success!
Once installed, your extension will:
- Hide distracting content on Bilibili
- Remember your preferences
- Work across all Bilibili pages
- Sync settings between tabs

**Happy browsing! 🎉**