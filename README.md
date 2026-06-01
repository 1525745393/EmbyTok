<div align="center">
  <h1>EmbyTok</h1>
  <div style="display: flex; gap: 10px; justify-content: center; margin: 10px 0;">
    <a href="README_CN.md" style="padding: 5px 10px; background-color: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333;">中文</a>
    <a href="#embytoku" style="padding: 5px 10px; background-color: #f0f0f0; border-radius: 4px; text-decoration: none; color: #333;">English</a>
  </div>
</div>

## EmbyTok

EmbyTok is a vertical video browsing client designed for both Emby and Plex media servers, providing a TikTok-like experience that allows users to browse their personal media library in a more modern and convenient way.

<div style="display:flex; flex-direction:row;">
<img src="tmp/1.jpg" width="19%" />
<img src="tmp/2.jpg" width="19%" />
<img src="tmp/3.jpg" width="19%" />
<img src="tmp/4.jpg" width="19%" />
<img src="tmp/5.jpg" width="19%" />
</div>
~
<div style="display:flex; flex-direction:row;">
<img src="tmp/6.jpg" width="32%" />
<img src="tmp/7.jpg" width="32%" />
<img src="tmp/8.jpg" width="32%" />
</div>

## Features

- 📱 **TikTok-like browsing experience**: Full-screen vertical video browsing, swipe up/down to switch videos
- 🎵 **Audio control**: One-click mute/unmute, intuitive volume icon feedback
- ❤️ **Favorite feature**: Like and save favorite videos, support browsing in favorites
- 🔍 **Multiple browsing modes**:
  - Latest videos
  - Random recommendations
  - Favorites
- 📁 **Media library management**: Support browsing, selecting and hiding multiple media libraries
- 🌐 **Responsive design**: Adapt to mobile and desktop, automatically adjust layout
- ⏩ **Swipe control progress**: Swipe left/right to adjust video playback progress
- 📦 **Android app**: Can be built as a native Android app through Capacitor
- 📱 **View switching**: Support one-click switching between video stream view and grid view
- 📐 **Orientation filtering**: Can choose to show only vertical, horizontal or both videos
- 🖥️ **Full screen mode**: Support entering/exiting full screen playback
- 🎯 **Auto layout**: Automatically adjust optimal display based on screen orientation and video content orientation
- 📱 **Vertical screen optimization**: Interface design optimized for mobile phone vertical screen experience
- ♾️ **Infinite playback mode**: Infinite playback + pure mode, automatically play videos continuously
- 📱 **Tablet mode**: Support tablet mode
- ⚡ **2x speed playback**: Long press video to enable 2x speed playback, long press again to restore normal speed
- 🎨 **Pure mode**: Hide all UI elements in playback mode, providing an immersive viewing experience
- 📺 **TV library adaptation**: Support TV library browsing, perfect for short drama binge-watching experience
- 📑 **Multi-level navigation**: Support deep browsing of TV series, seasons, episodes and step-by-step return
- 📍 **Resume playback**: Sync playback progress, highlight last viewing position in grid view
- ✋ **Enhanced gesture control**:
  - Tap to play/pause
  - Double tap to like with heart animation
  - Swipe left/right to adjust playback progress
  - Long press to enable 2x speed playback
- 📢 **Auto play notification**: Display intuitive notification when enabling playback mode
- 📐 **Smart adaptation**: Automatically adjust display mode based on video content orientation (vertical/horizontal)
- 🎯 **Precise progress control**: Only display progress bar for long videos, optimize interface simplicity
- 📺 **TV mode**: Interface optimized for smart TVs and large screen devices
  - New UI, designed for large screen TVs
  - Remote control friendly navigation system
  - Support TV APK download (Gitee release)
  - Support computer HTPC mode, keyboard control in full screen

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Capacitor (for building Android apps)
- Lucide React (icons)
- Multi-architecture Docker support (AMD64/ARM64)
- Nginx production deployment
- PWA support
- Emby and Plex API integration

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation Steps

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd embytok
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Build the production version:
   ```bash
   npm run build
   ```

## Usage

1. After starting the application, select your media server type (Emby or Plex) on the login screen, then enter the server information:

   **For Emby server:**
   - Server address (e.g.: http://192.168.1.100:8096)
   - Username
   - Password (if required)

   **For Plex server:**
   - Server address (e.g.: http://192.168.1.100:32400)
   - X-Plex-Token

2. After successful login, you can:
   - Swipe up/down to browse videos
   - Tap video to play/pause
   - Use the right control bar to like, view information, control audio
   - Switch media libraries and browsing modes through the top left menu
   - Swipe left/right to control video playback progress
   - Tap the grid icon to switch to grid view

## Building Android App

1. Make sure you have Android Studio and Android SDK installed

2. Add Android platform:

   ```bash
   npm run cap:add
   ```

3. Sync project:

   ```bash
   npm run cap:sync
   ```

4. Build APK:
   ```bash
   ./build-apk.sh
   ```

## Docker Deployment

The project includes Docker support and can be easily deployed as a web application. Supports multiple architectures (AMD64/ARM64) and can run on different hardware platforms.

### Image Information

#### DockerHub Image

- **Image name**: aidedaijiayang/embytok
- **Supported architectures**: AMD64 (x86_64), ARM64 (aarch64)
- **Tags**: latest

#### Alibaba Cloud Image (Updates may be delayed)

- **Image name**: crpi-90mw3693mrc3nsxp.cn-shanghai.personal.cr.aliyuncs.com/migumigu/embytok
- **Supported architectures**: AMD64 (x86_64) only
- **Tags**: latest

### Using Docker Command Directly

```bash
# Pull and run the image (Docker will automatically select the version suitable for your hardware architecture)
docker run -d \
  --name embytok-web \
  --restart unless-stopped \
  -p 8080:80 \
  aidedaijiayang/embytok:latest
```

### Using Docker Compose

#### Simple Deployment

Use `docker-compose.simple.yml` for quick deployment:

```yaml
version: '3.8'

services:
  # EmbyTok front-end application - simple configuration
  embytok:
    image: aidedaijiayang/embytok:latest
    container_name: embytok-web
    restart: unless-stopped
    ports:
      - '5175:80' # Web interface port
    environment:
      - NODE_ENV=production
    network_mode: bridge
networks: {}
```

Run simple configuration:

```bash
docker-compose -f docker-compose.simple.yml up -d
```

By default, the application will be available on port 5175.

## Changelog

### v1.2.4 (2026-05-30)

- 🚀 Optimization: Standard mode now fetches up to 200 videos at once in random mode, with orientation filtering applied
- 🔧 Improvement: Removed pagination for random mode to provide a more seamless browsing experience

## Configuration

The application uses localStorage to store the following user configurations:

- Server configuration (URL, user ID, access token)
- Hidden media library list

## Contribution

Welcome to submit Issues and Pull Requests to improve this project.

## License

[MIT License](LICENSE)

## Disclaimer

EmbyTok is an unofficial Emby client and is not affiliated with Emby official. Please ensure compliance with relevant laws and regulations in your region when using it.

## Sponsorship Support

If you like this project, you can support it through the following methods:

</div>
<div style="display:flex; flex-direction:row;">
<img src="tmp/alipay.jpg" width="45%" />
<img src="tmp/wechat.jpg" width="45%" />
</div>

Your support will help me continue to improve and maintain this project, thank you for your attention and support!
