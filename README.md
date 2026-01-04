# Bilibili Content Filter Extension

A cross-browser extension that helps users maintain focus while browsing Bilibili.com by selectively hiding distracting content elements.

## Features

- Hide homepage recommendations and feed content
- Filter ranking and trending sections
- Hide right sidebar content
- Remove comments sections
- Filter related videos
- Cross-browser compatibility (Chrome, Edge, Safari 14+)
- Persistent settings across browser sessions

## Project Structure

```
src/
├── manifest.json           # Chrome/Edge manifest
├── manifest-safari.json    # Safari-specific manifest
├── popup/                  # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/                # Content scripts
│   ├── content.js
│   └── content.css
├── background/             # Background service worker
│   └── background.js
└── icons/                  # Extension icons
    └── .gitkeep
```

## Build Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

### Building

Build for all browsers:
```bash
npm run build
```

Build for specific browsers:
```bash
npm run build:chrome    # Chrome/Chromium
npm run build:edge      # Microsoft Edge
npm run build:safari    # Safari 14+
```

Built extensions will be available in the `dist/` directory.

### Development

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Lint code:
```bash
npm run lint
npm run lint:fix
```

Clean build artifacts:
```bash
npm run clean
```

## Installation

### For Users
Download from your browser's extension store:
- [Chrome Web Store](https://chrome.google.com/webstore) (search for "Bilibili Content Filter")
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons) (search for "Bilibili Content Filter")
- [Safari App Store](https://apps.apple.com) (search for "Bilibili Content Filter")
/ -ALL the extensions are not uploaded yet. But you can downlowd the /dist file and use developer mode to have a look.

### For Developers
1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. Build for development: `npm run build:chrome`
4. Load unpacked extension in browser

## Documentation

📚 **Comprehensive documentation is available in the [`docs/`](docs/) directory:**

- **[Deployment Guide](docs/deployment-guide.md)** - Complete deployment instructions for all browsers
- **[Customization Guide](docs/customization-guide.md)** - CSS selector customization and maintenance
- **[Architecture Guide](docs/architecture-guide.md)** - Technical architecture and development guide
- **[Troubleshooting Guide](docs/troubleshooting-guide.md)** - Common issues and solutions
- **[Browser Compatibility](docs/browser-compatibility.md)** - Cross-browser compatibility details

## Quick Start

1. **Install** the extension from your browser store
2. **Click** the extension icon in your toolbar
3. **Toggle** the filters you want to enable
4. **Browse** Bilibili.com with reduced distractions

## Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Version 88+ (Manifest V3 support)  
- **Safari**: Version 14+ (Manifest V3 support)

## Contributing

We welcome contributions! Please see our documentation for:
- [Development setup](docs/architecture-guide.md#development-workflow)
- [Customization guidelines](docs/customization-guide.md)
- [Deployment procedures](docs/deployment-guide.md)

## Support

- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-username/bilibili-content-filter/issues)
- **Documentation**: Check the [troubleshooting guide](docs/troubleshooting-guide.md)
- **Questions**: Create a discussion on GitHub

## License

MIT License - see LICENSE file for details.
