# Tracka Build Instructions

This document provides comprehensive instructions for building Tracka across different platforms.

## Quick Start

### Basic Commands

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows only
npm run build:mac    # macOS only
npm run build:all    # All platforms

# Advanced build script with options
npm run build -- --win     # Windows with custom script
npm run build -- --mac     # macOS with custom script
npm run build -- --all     # All platforms with custom script
```

### Output

Built applications will be placed in the `dist/` directory:
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` installer and `.zip` archive
- **Linux**: `.AppImage` and `.deb` packages

## Prerequisites

### General Requirements

1. **Node.js** (v16 or later)
2. **npm** or **yarn**
3. **electron-builder** (included as dev dependency)

### Platform-Specific Requirements

#### Building for Windows
- Can be built from any platform
- For code signing: Windows certificate (.p12 file)

#### Building for macOS
- **macOS required** for code signing and notarization
- Xcode Command Line Tools: `xcode-select --install`
- For code signing: Apple Developer Certificate

#### Building for Linux
- Can be built from any platform
- Docker recommended for consistent builds

## Build Configuration

The build configuration is defined in `package.json` under the `build` section:

### Key Configuration Options

```json
{
  "build": {
    "appId": "com.tracka.app",
    "productName": "Tracka",
    "directories": {
      "output": "dist",
      "buildResources": "build"
    }
  }
}
```

### Platform-Specific Settings

#### Windows Configuration
- **NSIS Installer**: User-friendly installer with options
- **Portable**: Standalone executable
- **Architecture**: x64 and ia32 (32-bit)

#### macOS Configuration
- **DMG**: Disk image with drag-and-drop installation
- **ZIP**: Archive for direct distribution
- **Architecture**: x64 (Intel) and arm64 (Apple Silicon)
- **Hardened Runtime**: Enabled for security

#### Linux Configuration
- **AppImage**: Universal Linux package
- **DEB**: Debian/Ubuntu package
- **Architecture**: x64

## Code Signing Setup

### Environment Variables

Set these environment variables for automatic code signing:

```bash
# Certificate file path
export CSC_LINK="/path/to/certificate.p12"

# Certificate password
export CSC_KEY_PASSWORD="your-certificate-password"

# For macOS notarization (optional)
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

### Windows Code Signing

1. **Obtain Certificate**:
   - Purchase from CA (Sectigo, DigiCert, etc.)
   - Or use self-signed for testing

2. **Setup**:
   ```bash
   export CSC_LINK="path/to/certificate.p12"
   export CSC_KEY_PASSWORD="certificate-password"
   ```

3. **Build**:
   ```bash
   npm run build:win
   ```

### macOS Code Signing

1. **Requirements**:
   - Apple Developer Account
   - Developer ID Application Certificate
   - Developer ID Installer Certificate (for pkg)

2. **Setup**:
   ```bash
   # Import certificates to Keychain
   security import certificate.p12 -k ~/Library/Keychains/login.keychain
   
   # Set environment variables
   export CSC_LINK="Developer ID Application: Your Name (XXXXXXXXXX)"
   export CSC_KEY_PASSWORD="keychain-password"
   ```

3. **Build**:
   ```bash
   npm run build:mac
   ```

### Notarization (macOS)

For distribution outside the Mac App Store:

```bash
export APPLE_ID="your-apple-id"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="team-id"
```

## Build Assets

### Required Files

Create a `build/` directory with these assets:

```
build/
├── icon.icns          # macOS icon (512x512)
├── icon.ico           # Windows icon (256x256)
├── icon.png           # Linux icon (512x512)
├── background.png     # DMG background (optional)
└── entitlements.mac.plist  # macOS entitlements (auto-generated)
```

### Icon Requirements

- **Windows (.ico)**: 256x256, 128x128, 64x64, 48x48, 32x32, 16x16
- **macOS (.icns)**: 512x512, 256x256, 128x128, 64x64, 32x32, 16x16
- **Linux (.png)**: 512x512

### Creating Icons

Use tools to convert from PNG:
- **electron-icon-builder**: `npm install -g electron-icon-builder`
- **Online converters**: convertio.co, icoconvert.com
- **macOS**: `iconutil` (built-in)

## Troubleshooting

### Common Issues

#### Build Fails on macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Update certificates
security find-identity -v -p codesigning
```

#### Windows Antivirus False Positives
- Add build directory to antivirus exclusions
- Use reputable code signing certificate
- Consider Windows Defender SmartScreen submission

#### Linux Dependencies
```bash
# Ubuntu/Debian
sudo apt-get install build-essential libnss3-dev libatk-bridge2.0-dev libdrm2-dev libxcomposite-dev libxdamage-dev libxrandr-dev libgbm-dev libxss-dev libasound2-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install nss-devel atk-devel at-spi2-atk-devel
```

### Performance Optimization

#### Faster Builds
```bash
# Build only for current architecture
npm run build -- --x64

# Skip code signing during development
export CSC_IDENTITY_AUTO_DISCOVERY=false
```

#### Smaller Bundle Size
- Use `"asar": true` in build config
- Exclude unnecessary files via `"files"` configuration
- Use `"extraResources"` for assets

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    
    - run: npm ci
    - run: npm run build
      env:
        CSC_LINK: ${{ secrets.CSC_LINK }}
        CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
```

## Security Considerations

1. **Never commit certificates** to version control
2. **Use environment variables** for sensitive data
3. **Validate dependencies** regularly with `npm audit`
4. **Enable hardened runtime** for macOS builds
5. **Use official certificates** for production releases

## Support

For build issues:
1. Check electron-builder documentation
2. Verify all prerequisites are installed
3. Review build logs for specific errors
4. Test with minimal configuration first

---

**Last Updated**: $(date)
**Electron Builder Version**: ^24.0.0
**Node.js Version**: v16+