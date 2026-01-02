# Bilibili Content Filter Extension - Documentation

Complete documentation for the Bilibili Content Filter Extension, covering deployment, customization, architecture, and troubleshooting.

## Documentation Overview

This documentation provides comprehensive guidance for users, developers, and maintainers of the Bilibili Content Filter Extension.

### 📚 Documentation Structure

| Document | Audience | Purpose |
|----------|----------|---------|
| [Deployment Guide](deployment-guide.md) | Developers, Publishers | Step-by-step deployment to browser stores |
| [Customization Guide](customization-guide.md) | Developers, Advanced Users | CSS selector customization and maintenance |
| [Architecture Guide](architecture-guide.md) | Developers, Maintainers | Technical architecture and design patterns |
| [Troubleshooting Guide](troubleshooting-guide.md) | Users, Developers | Common issues and solutions |
| [Browser Compatibility](browser-compatibility.md) | Developers | Cross-browser compatibility details |

## Quick Start

### For Users
1. **Installation**: Get the extension from your browser's store
2. **Basic Usage**: Click the extension icon and toggle filters
3. **Issues**: Check the [Troubleshooting Guide](troubleshooting-guide.md)

### For Developers
1. **Setup**: Clone repository and run `npm install`
2. **Development**: Read [Architecture Guide](architecture-guide.md)
3. **Deployment**: Follow [Deployment Guide](deployment-guide.md)
4. **Customization**: See [Customization Guide](customization-guide.md)

## Key Features

### Content Filtering
- **Homepage Recommendations**: Hide distracting feed content
- **Ranking & Trending**: Remove trending sections
- **Right Sidebar**: Hide sidebar distractions
- **Comments**: Remove comment sections
- **Related Videos**: Hide related video suggestions

### Cross-Browser Support
- **Chrome**: Full Manifest V3 support with sync storage
- **Edge**: Chromium-based compatibility
- **Safari**: Native app wrapper with local storage

### Technical Highlights
- **Intelligent Selectors**: Adaptive CSS selector system
- **Error Recovery**: Comprehensive error handling and graceful degradation
- **Performance Optimized**: Minimal impact on page load times
- **Privacy Focused**: All filtering happens locally

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser Extension                            │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Popup UI      │  Background      │      Content Scripts        │
│                 │  Service Worker  │                             │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ • User Interface│ • Lifecycle Mgmt │ • DOM Manipulation          │
│ • Settings UI   │ • Cross-tab Sync │ • Filter Application        │
│ • Toggle Controls│ • Message Routing│ • Dynamic Content Detection │
└─────────────────┴──────────────────┴─────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Components                            │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Storage       │   Utilities      │      Error Handling         │
│   Management    │                  │                             │
├─────────────────┼──────────────────┼─────────────────────────────┤
│ • Cross-browser │ • Browser Compat │ • Error Recovery            │
│ • Settings Sync │ • Graceful Degrad│ • Logging System            │
│ • Data Validation│ • Performance   │ • User Notifications        │
└─────────────────┴──────────────────┴─────────────────────────────┘
```

## Development Workflow

### 1. Environment Setup
```bash
# Clone and setup
git clone <repository-url>
cd bilibili-content-filter
npm install

# Development build
npm run build:chrome
```

### 2. Making Changes
```bash
# Create feature branch
git checkout -b feature/new-functionality

# Make changes and test
npm test
npm run build

# Manual testing in browser
# Load unpacked extension from dist/chrome
```

### 3. Deployment
```bash
# Build all browser versions
npm run build

# Create deployment packages
npm run deploy

# Upload to browser stores
# Follow deployment guide for each browser
```

## Maintenance

### Regular Tasks
- **Weekly**: Monitor user feedback and test on Bilibili.com
- **Monthly**: Update selectors for layout changes
- **Quarterly**: Comprehensive testing and performance review

### Emergency Response
When Bilibili makes breaking changes:
1. **Immediate**: Identify affected functionality
2. **Short-term**: Update selectors and deploy fix
3. **Long-term**: Improve robustness and add fallbacks

## Contributing

### For Developers
1. **Fork** the repository
2. **Create feature branch** for your changes
3. **Follow coding standards** and add tests
4. **Submit pull request** with detailed description

### For Users
1. **Report bugs** with detailed information
2. **Suggest features** through GitHub issues
3. **Test beta versions** and provide feedback
4. **Share usage patterns** to help improve the extension

## Support

### Getting Help
1. **Check Documentation**: Start with relevant guide above
2. **Search Issues**: Look for existing solutions on GitHub
3. **Create Issue**: Provide detailed bug report or feature request
4. **Community**: Engage with other users and developers

### Reporting Issues
Include this information in bug reports:
- Browser name and version
- Extension version
- Specific page URL
- Steps to reproduce
- Console errors (if any)
- Screenshots or recordings

## License and Legal

### Open Source License
This extension is released under the MIT License, allowing:
- ✅ Commercial use
- ✅ Modification and distribution
- ✅ Private use
- ✅ Patent use

### Privacy Policy
- **No Data Collection**: Extension doesn't collect personal data
- **Local Processing**: All filtering happens in your browser
- **Settings Storage**: Only filter preferences stored locally
- **No Network Requests**: No external communication required

### Compliance
- **Browser Store Policies**: Compliant with Chrome, Edge, and Safari policies
- **Content Security**: Follows security best practices
- **Accessibility**: Supports screen readers and keyboard navigation
- **Performance**: Minimal impact on page load and browser performance

## Roadmap

### Current Version (1.0.x)
- ✅ Core filtering functionality
- ✅ Cross-browser compatibility
- ✅ Settings persistence
- ✅ Error handling and recovery

### Upcoming Features (1.1.x)
- 🔄 Advanced selector customization UI
- 🔄 Import/export settings
- 🔄 Performance monitoring dashboard
- 🔄 Enhanced mobile support

### Future Considerations (2.0.x)
- 💭 Machine learning for content detection
- 💭 Community-driven selector updates
- 💭 Integration with other focus tools
- 💭 Advanced scheduling and automation

## Resources

### Technical Documentation
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/)
- [Safari Web Extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Edge Add-ons Documentation](https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/)

### Development Tools
- [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) - Chrome extension for development
- [Web-ext](https://github.com/mozilla/web-ext) - Command line tool for extension development
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools) - Browser debugging tools

### Community
- [GitHub Repository](https://github.com/your-username/bilibili-content-filter) - Source code and issues
- [Chrome Web Store](https://chrome.google.com/webstore/detail/bilibili-content-filter) - Chrome extension listing
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/bilibili-content-filter) - Edge extension listing

---

**Last Updated**: January 2024  
**Documentation Version**: 1.0.0  
**Extension Version**: 1.0.0

For questions about this documentation or the extension, please create an issue on GitHub or contact the development team.