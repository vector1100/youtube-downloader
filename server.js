const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Downloads folder
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Clean old files (older than 1 hour)
function cleanOldFiles() {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    files.forEach(file => {
        const filePath = path.join(DOWNLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > oneHour) {
            fs.unlinkSync(filePath);
        }
    });
}

// Run cleanup every 30 minutes
setInterval(cleanOldFiles, 30 * 60 * 1000);

// Get video info
app.post('/api/info', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL kiritilmagan' });
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
    if (!youtubeRegex.test(url)) {
        return res.status(400).json({ error: 'Noto\'g\'ri YouTube URL' });
    }

    try {
        const command = `yt-dlp --dump-json --no-playlist --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (HTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" --referer "https://www.youtube.com/" "${url}"`;

        exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                console.error('yt-dlp error:', stderr);
                // Check for specific YouTube errors
                if (stderr.includes('Sign in to confirm')) {
                    return res.status(403).json({ error: 'YouTube server blokladi (Bot detection). Iltimos keyinroq urining.' });
                }
                return res.status(500).json({ error: 'Video ma\'lumotlarini olishda xatolik' });
            }

            try {
                const info = JSON.parse(stdout);

                // Filter formats for video with audio or best quality
                const formats = info.formats
                    .filter(f => f.vcodec !== 'none' && f.height)
                    .map(f => ({
                        format_id: f.format_id,
                        ext: f.ext,
                        resolution: `${f.width}x${f.height}`,
                        height: f.height,
                        fps: f.fps,
                        filesize: f.filesize || f.filesize_approx,
                        vcodec: f.vcodec,
                        acodec: f.acodec,
                        has_audio: f.acodec !== 'none'
                    }))
                    .filter(f => f.height >= 720)
                    .sort((a, b) => b.height - a.height);

                // Remove duplicates by height
                const uniqueFormats = [];
                const seenHeights = new Set();
                formats.forEach(f => {
                    if (!seenHeights.has(f.height)) {
                        seenHeights.add(f.height);
                        uniqueFormats.push(f);
                    }
                });

                res.json({
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    duration_string: info.duration_string,
                    channel: info.channel,
                    view_count: info.view_count,
                    formats: uniqueFormats.slice(0, 5) // Top 5 quality options
                });
            } catch (parseError) {
                console.error('Parse error:', parseError);
                res.status(500).json({ error: 'Ma\'lumotlarni o\'qishda xatolik' });
            }
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server xatoligi' });
    }
});

// Download video
app.post('/api/download', async (req, res) => {
    const { url, quality } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL kiritilmagan' });
    }

    const filename = `${uuidv4()}.mp4`;
    const outputPath = path.join(DOWNLOADS_DIR, filename);

    // Quality format string - ensure video+audio are merged
    // Format: best video up to selected quality + best audio, fallback to best combined
    let formatString;
    switch (quality) {
        case '2160':
            formatString = 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=2160]+bestaudio/best[height<=2160]/best';
            break;
        case '1440':
            formatString = 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1440]+bestaudio/best[height<=1440]/best';
            break;
        case '1080':
        default:
            formatString = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
            break;
    }

    try {
        const args = [
            '-f', formatString,
            '--merge-output-format', 'mp4',
            '--audio-quality', '0',  // Best audio quality
            '--embed-thumbnail',     // Embed thumbnail if available
            '--add-metadata',        // Add metadata
            '--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k',  // Ensure audio codec
            '-o', outputPath,
            '--no-playlist',
            '--progress',
            '--verbose',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (HTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            '--referer', 'https://www.youtube.com/',
            '--no-check-certificates',
            url
        ];

        const ytdlp = spawn('yt-dlp', args);

        let progressData = '';
        let errorData = '';

        ytdlp.stdout.on('data', (data) => {
            progressData += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            errorData += data.toString();
            progressData += data.toString();
        });

        ytdlp.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputPath)) {
                res.json({
                    success: true,
                    filename: filename,
                    downloadUrl: `/api/download/${filename}`
                });
            } else {
                console.error('Download error:', errorData);
                res.status(500).json({ error: 'Video yuklab olishda xatolik' });
            }
        });

        ytdlp.on('error', (err) => {
            console.error('Spawn error:', err);
            res.status(500).json({ error: 'yt-dlp ishga tushmadi. yt-dlp o\'rnatilganligini tekshiring.' });
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Server xatoligi' });
    }
});

// Serve downloaded file
app.get('/api/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(DOWNLOADS_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fayl topilmadi' });
    }

    // Get original video title from query or use filename
    const videoTitle = req.query.title || 'video';
    const safeTitle = videoTitle.replace(/[^a-zA-Z0-9\s\-\_]/g, '').substring(0, 100);

    res.download(filePath, `${safeTitle}.mp4`, (err) => {
        if (err) {
            console.error('Download error:', err);
        }
        // Delete file after download
        setTimeout(() => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }, 5000);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🎬 YouTube Downloader Server ishga tushdi!                 ║
║                                                              ║
║   📍 Manzil: http://localhost:${PORT}                          ║
║                                                              ║
║   ✨ Browser'da yuqoridagi manzilni oching                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});
