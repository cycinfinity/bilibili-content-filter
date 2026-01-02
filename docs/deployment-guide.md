# Deployment Guide

This guide provides step-by-step instructions for deploying the Bilibili Content Filter Extension to different browser stores.

## Prerequisites

Before deploying to any browser store, ensure you have:

- Node.js (v14 or higher) installed
- npm or yarn package manager
- Git for version control
- A valid developer account for each target browser store

## Quick Deployment

To build and package for all browsers at once:

```bash
# Install dependencies
npm install

# Build and deploy all browsers
npm run deploy
```

This will create packages for Chrome, Edge, and Safari in the `packages/` directory.

## Browser-Specific Deployment

### Chrome Web Store

#### Prerequisites
- Google Developer account ($5 one-time registration fee)
- Chrome Web Store Developer Dashboard access

#### Step-by-Step Instructions

1. **Build the Chrome extension:**
   ```bash
   npm run build:chrome
   ```

2. **Create deployment package:**
   ```bash
   npm run deploy:chrome
   ```
   This creates `packages/bilibili-content-filter-chrome.zip`

3. **Upload to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Click "Add new item"
   - Upload the ZIP file: `packages/bilibili-content-filter-chrome.zip`
   - Fill in the store listing details (see Store Listing section below)
   - Submit for review

4. **Review Process:**
   - Initial review: 1-3 business days
   - Updates: Usually within 24 hours
   - Rejections will include specific feedback

#### Chrome Store Listing Requirements

**Required Information:**
- Extension name: "Bilibili Content Filter"
- Short description: "Focus tool for Bilibili.com - hide distracting content"
- Detailed description: (see template below)
- Category: "Productivity"
- Language: English (add Chinese if targeting Chinese users)
- Screenshots: At least 1, recommended 3-5
- Icon: 128x128px PNG

**Description Template:**
```
Focus on what matters while browsing Bilibili.com

The Bilibili Content Filter Extension helps you maintain focus by selectively hiding distracting content elements:

✅ Hide homepage recommendations and feed content
✅ Filter ranking and trending sections  
✅ Remove right sidebar distractions
✅ Hide comments sections
✅ Filter related videos
✅ Works across all Bilibili subdomains
✅ Settings sync across devices

Perfect for students, professionals, and anyone who wants to use Bilibili without getting distracted by endless recommendations.

Privacy-focused: All filtering happens locally in your browser. No data is collected or transmitted.

Open source and customizable for advanced users.
```

### Microsoft Edge Add-ons

#### Prerequisites
- Microsoft Partner Center account (free)
- Edge Add-ons Developer Dashboard access

#### Step-by-Step Instructions

1. **Build the Edge extension:**
   ```bash
   npm run build:edge
   ```

2. **Create deployment package:**
   ```bash
   npm run deploy:edge
   ```
   This creates `packages/bilibili-content-filter-edge.zip`

3. **Upload to Edge Add-ons:**
   - Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/)
   - Click "Create new extension"
   - Upload the ZIP file: `packages/bilibili-content-filter-edge.zip`
   - Fill in the store listing details (similar to Chrome)
   - Submit for review

4. **Review Process:**
   - Initial review: 3-7 business days
   - Updates: 1-3 business days
   - Generally more thorough than Chrome review

#### Edge-Specific Considerations

- Edge uses the same Chromium base as Chrome, so the same package works
- Edge has stricter content policies
- Better support for enterprise deployment
- Automatic updates through Microsoft Update

### Safari App Store

#### Prerequisites
- Apple Developer account ($99/year)
- macOS with Xcode installed
- Xcode command line tools
- Valid signing certificates

#### Step-by-Step Instructions

1. **Build the Safari extension:**
   ```bash
   npm run build:safari
   ```

2. **Convert to Safari project:**
   ```bash
   npm run deploy:safari
   ```
   This creates a complete Xcode project in `packages/safari-project/`

3. **Configure Xcode project:**
   - Open the `.xcodeproj` file in Xcode
   - Select your development team
   - Configure bundle identifier (must be unique)
   - Set up signing certificates
   - Configure app icon and metadata

4. **Build and test:**
   - Build the project in Xcode
   - Test the extension in Safari
   - Ensure all functionality works correctly

5. **Archive and submit:**
   - Archive the project (Product → Archive)
   - Upload to App Store Connect
   - Fill in App Store listing details
   - Submit for review

#### Safari-Specific Requirements

**Technical Requirements:**
- macOS 10.14+ (Mojave)
- Safari 14+
- Native app wrapper required
- App Store distribution certificate

**App Store Listing:**
- App name: "Bilibili Content Filter"
- Category: "Productivity"
- Age rating: 4+ (no objectionable content)
- Privacy policy (required)
- App description and screenshots

**Privacy Policy Template:**
```
Privacy Policy for Bilibili Content Filter

Data Collection:
This extension does not collect, store, or transmit any personal data. All content filtering happens locally in your browser.

Permissions:
- Storage: Used to save your filter preferences locally
- Website Access: Required to filter content on Bilibili.com domains only

Contact:
[Your contact information]

Last updated: [Date]
```

#### Safari Conversion Process

The `deploy:safari` script automatically:
1. Converts the web extension to Safari format
2. Creates a native macOS app wrapper
3. Sets up the Xcode project structure
4. Configures basic app metadata

**Manual steps after conversion:**
1. Configure signing in Xcode
2. Set unique bundle identifier
3. Add app icon (required sizes: 16x16, 32x32, 48x48, 64x64, 96x96, 128x128, 256x256, 512x512)
4. Test thoroughly in Safari
5. Archive and upload to App Store Connect

## Store Assets

### Icons Required

Create icons in the following sizes:

**Chrome/Edge:**
- 16x16px (toolbar icon)
- 32x32px (Windows)
- 48x48px (extension management)
- 128x128px (Chrome Web Store)

**Safari:**
- 16x16px, 32x32px, 48x48px, 64x64px, 96x96px, 128x128px, 256x256px, 512x512px

### Screenshots

Take screenshots showing:
1. Extension popup interface
2. Before/after filtering on Bilibili homepage
3. Settings in action
4. Different filter types working

**Recommended sizes:**
- Chrome: 1280x800px or 640x400px
- Edge: 1366x768px recommended
- Safari: Various sizes supported, 1280x800px recommended

## Automated Deployment

### CI/CD Pipeline

Create a GitHub Actions workflow for automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy Extensions

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build all extensions
        run: npm run build
      
      - name: Create deployment packages
        run: npm run deploy
      
      - name: Upload Chrome package
        uses: actions/upload-artifact@v3
        with:
          name: chrome-extension
          path: packages/bilibili-content-filter-chrome.zip
      
      - name: Upload Edge package
        uses: actions/upload-artifact@v3
        with:
          name: edge-extension
          path: packages/bilibili-content-filter-edge.zip
      
      - name: Upload Safari project
        uses: actions/upload-artifact@v3
        with:
          name: safari-project
          path: packages/safari-project/
```

### Version Management

Update version numbers in:
- `package.json`
- `src/manifest.json`
- `src/manifest-safari.json`

Use semantic versioning (e.g., 1.0.0, 1.0.1, 1.1.0).

## Post-Deployment

### Monitoring

After deployment, monitor:
- Store reviews and ratings
- User feedback and bug reports
- Extension usage statistics
- Performance metrics

### Updates

For updates:
1. Increment version number
2. Update changelog
3. Test thoroughly
4. Deploy using same process
5. Monitor for issues

### Support

Provide user support through:
- Store listing Q&A sections
- GitHub issues (if open source)
- Email support
- Documentation updates

## Troubleshooting Deployment Issues

### Common Chrome Issues

**"Manifest file is invalid":**
- Check JSON syntax in manifest.json
- Ensure all required fields are present
- Validate permissions format

**"Package is invalid":**
- Check file structure matches expected layout
- Ensure no prohibited files (e.g., .DS_Store)
- Verify ZIP file is not corrupted

### Common Edge Issues

**"Extension violates content policy":**
- Review Microsoft Edge Add-ons policies
- Ensure no prohibited content or functionality
- Check for compliance with privacy requirements

### Common Safari Issues

**"Xcode conversion failed":**
- Ensure Xcode command line tools are installed
- Check that build directory exists and is valid
- Verify Safari converter is available

**"Signing failed":**
- Check Apple Developer account status
- Ensure valid certificates are installed
- Verify bundle identifier is unique

**"App Store rejection":**
- Review Apple's App Store Review Guidelines
- Ensure privacy policy is complete and accurate
- Check that app functionality is clear and valuable

## Security Considerations

### Code Signing

- Chrome/Edge: Automatic signing by store
- Safari: Requires Apple Developer certificates

### Content Security Policy

Ensure CSP headers are properly configured:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### Permissions

Request minimal permissions:
- `storage`: For saving user preferences
- `activeTab`: For accessing current tab (Chrome/Edge)
- Host permissions: Only for `*://*.bilibili.com/*`

## Legal Considerations

### Terms of Service

Ensure compliance with:
- Browser store terms of service
- Bilibili.com terms of service
- Local privacy laws (GDPR, CCPA, etc.)

### Intellectual Property

- Don't use Bilibili trademarks in extension name
- Ensure all code is original or properly licensed
- Include proper attribution for third-party libraries

### Privacy Compliance

- Create privacy policy
- Implement data minimization
- Provide user control over data
- Document data handling practices

## Support and Maintenance

### Regular Maintenance

- Monitor Bilibili.com for layout changes
- Update selectors as needed
- Test with browser updates
- Respond to user feedback

### Emergency Updates

For critical issues:
1. Identify and fix the problem
2. Test the fix thoroughly
3. Deploy emergency update
4. Monitor for resolution
5. Communicate with users if needed

This deployment guide ensures successful distribution across all major browser platforms while maintaining compliance and user satisfaction.