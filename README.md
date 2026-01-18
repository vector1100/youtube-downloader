# 🎬 YouTube Video Downloader

A modern, beautiful YouTube video downloader web application with support for 1080p, 1440p, and 4K quality downloads.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-blue?logo=express)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- 🎥 **High Quality Downloads** - Support for 1080p, 1440p (2K), and 2160p (4K)
- 🎨 **Modern UI** - Beautiful dark theme with glassmorphism design
- 📱 **Responsive** - Works on desktop and mobile devices
- 🔊 **Audio Included** - Videos download with full audio
- 🚀 **Fast** - Optimized download process
- 🔒 **Secure** - Files are automatically deleted after download

## 📸 Preview

The application features:
- Clean URL input with paste detection
- Quality selection cards (1080p, 1440p, 4K)
- Video preview with thumbnail, title, and metadata
- Download progress indicator
- Success confirmation

## 🔧 Requirements

- **Node.js** 18 or higher
- **yt-dlp** - YouTube download tool
- **FFmpeg** - For merging video and audio streams

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/youtube-downloader.git
cd youtube-downloader
```

### 2. Install yt-dlp

**Windows:**
```powershell
winget install yt-dlp
# or
pip install yt-dlp
```

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo apt install yt-dlp
# or
pip install yt-dlp
```

### 3. Install FFmpeg

**Windows:**
```powershell
winget install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### 4. Install dependencies

```bash
npm install
```

### 5. Start the server

```bash
npm start
```

### 6. Open in browser

```
http://localhost:3000
```

## 🚀 Usage

1. Copy a YouTube video URL
2. Paste it into the input field
3. Select your preferred quality (1080p, 1440p, or 4K)
4. Click "Video Ma'lumotlarini Olish" (Get Video Info)
5. Review the video details
6. Click "Yuklab Olish" (Download)
7. Wait for the download to complete

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript
- **Video Processing:** yt-dlp, FFmpeg
- **Design:** Custom CSS with glassmorphism effects

## 📁 Project Structure

```
youtube-downloader/
├── package.json          # Project configuration
├── server.js             # Express server & API
├── .gitignore            # Git ignore rules
├── README.md             # This file
└── public/               # Frontend files
    ├── index.html        # Main page
    ├── css/
    │   └── style.css     # Styles
    └── js/
        └── app.js        # Frontend logic
```

## ⚠️ Disclaimer

This tool is intended for personal use only. Please respect copyright laws and YouTube's Terms of Service. Only download videos that you have the right to download, such as:
- Your own videos
- Videos with Creative Commons license
- Videos where the creator has given permission

## 📄 License

MIT License - feel free to use this project for personal purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ using Node.js and yt-dlp
