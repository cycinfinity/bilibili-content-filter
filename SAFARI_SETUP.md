# 🦁 Safari Extension Setup (Advanced)

## ⚠️ Important Note
Safari extensions are significantly more complex than Chrome/Edge extensions. **I strongly recommend starting with Chrome/Edge first** to test your extension, then coming back to Safari later if needed.

## 📋 Safari Requirements
1. **Full Xcode** (not just command line tools) - ~10GB download
2. **macOS 10.14+**
3. **Apple Developer Account** (for distribution)
4. **Time and patience** - this process is complex

## 🛠 Safari Setup Steps

### Step 1: Install Full Xcode
1. **Open App Store**
2. **Search for "Xcode"**
3. **Install Xcode** (this will take a while - it's ~10GB)
4. **Open Xcode** and accept the license agreements

### Step 2: Install Safari Web Extension Converter
```bash
# After Xcode is fully installed, this should work:
xcrun safari-web-extension-converter --help
```

### Step 3: Convert Your Extension
```bash
# Navigate to your project directory
cd /path/to/your/bilibili-content-filter

# Run the conversion
xcrun safari-web-extension-converter dist/safari --app-name "Bilibili Content Filter" --bundle-identifier "com.bilibilifilter.extension"
```

### Step 4: Build in Xcode
1. **Open the generated `.xcodeproj` file**
2. **Select your development team** (requires Apple Developer account)
3. **Build the project** (Cmd+B)
4. **Run the project** (Cmd+R)

### Step 5: Enable in Safari
1. **Open Safari**
2. **Go to Safari > Preferences > Extensions**
3. **Enable your extension**

## 🚨 Common Issues

### "safari-web-extension-converter not found"
- You need the **full Xcode**, not just command line tools
- Install Xcode from the App Store

### "No development team selected"
- You need an Apple Developer account
- Or use a personal team (limited functionality)

### "Extension not appearing in Safari"
- Check Safari > Preferences > Extensions
- Make sure the extension is enabled
- Try restarting Safari

## 🎯 Recommended Approach

1. **Start with Chrome/Edge** - get your extension working in 2 minutes
2. **Test all functionality** thoroughly
3. **Then tackle Safari** when you have time for the complex setup

Chrome and Edge work identically to Safari for web extensions, so you're not missing anything by starting there!

## 🔄 Alternative: Use Chrome on Mac

Chrome works perfectly on Mac and is much easier:
1. Download Chrome for Mac
2. Install your extension in 2 minutes
3. Use it immediately

**The extension functionality is identical across all browsers!**