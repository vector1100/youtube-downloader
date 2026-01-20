// DOM Elements
const urlInput = document.getElementById('url-input');
const clearBtn = document.getElementById('clear-btn');
const getInfoBtn = document.getElementById('get-info-btn');
const downloadBtn = document.getElementById('download-btn');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const videoPreview = document.getElementById('video-preview');
const downloadProgress = document.getElementById('download-progress');
const successMessage = document.getElementById('success-message');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');

// Video info elements
const videoThumbnail = document.getElementById('video-thumbnail');
const videoTitle = document.getElementById('video-title');
const videoDuration = document.getElementById('video-duration');
const videoChannel = document.getElementById('video-channel');
const videoViews = document.getElementById('video-views');

// State
let currentVideoInfo = null;
let currentVideoUrl = null;

// Multiple Cobalt API instances to try (fallback system)
// These are public instances that allow CORS
const COBALT_INSTANCES = [
    'https://cobalt.clxxped.lol',
    'https://cobalt.meowing.de',
    'https://qwkuns.me',
    'https://cobalt.canine.tools',
    'https://dl.woof.monster',
    'https://api.cobalt.tools', // Official (often rate limited but good to have)
    'https://cobalt-api.hyper.lol'
];

// ===== Utility Functions =====

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 8000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getSelectedQuality() {
    const selected = document.querySelector('input[name="quality"]:checked');
    return selected ? selected.value : '1080';
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function resetUI() {
    videoPreview.classList.add('hidden');
    downloadProgress.classList.add('hidden');
    successMessage.classList.add('hidden');
    hideError();
    currentVideoInfo = null;
    currentVideoUrl = null;
}

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// ===== Event Listeners =====

// Clear button
clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
    resetUI();
});

// URL input - handle paste
urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.trim()) {
            getVideoInfo();
        }
    }, 100);
});

// Enter key
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        getVideoInfo();
    }
});

// Get info button
getInfoBtn.addEventListener('click', getVideoInfo);

// Download button
downloadBtn.addEventListener('click', downloadVideo);

// ===== API Functions =====

async function getVideoInfo() {
    const url = urlInput.value.trim();

    if (!url) {
        showError('Iltimos, YouTube video URL kiriting');
        return;
    }

    // Basic YouTube URL validation
    const videoId = extractVideoId(url);
    if (!videoId) {
        showError('Iltimos, to\'g\'ri YouTube URL kiriting');
        return;
    }

    resetUI();
    setButtonLoading(getInfoBtn, true);
    currentVideoUrl = url;

    try {
        // Use YouTube's oEmbed API for basic info (no API key needed)
        // This is safe and reliable for metadata
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;

        const response = await fetch(oembedUrl);

        if (!response.ok) {
            throw new Error('Video topilmadi');
        }

        const data = await response.json();

        // Store video info
        currentVideoInfo = {
            title: data.title,
            channel: data.author_name,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            videoId: videoId
        };

        // Update UI
        videoThumbnail.src = currentVideoInfo.thumbnail;
        videoThumbnail.onerror = () => {
            videoThumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        };
        videoTitle.textContent = currentVideoInfo.title;
        videoDuration.textContent = '--:--';
        videoChannel.textContent = currentVideoInfo.channel;
        videoViews.textContent = '';

        // Show preview
        videoPreview.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Video ma\'lumotlarini olishda xatolik');
    } finally {
        setButtonLoading(getInfoBtn, false);
    }
}

// Try to download using Cobalt API with fallback instances
async function tryDownloadWithCobalt(url, quality) {
    let videoQuality;
    switch (quality) {
        case '2160': videoQuality = '2160'; break;
        case '1440': videoQuality = '1440'; break;
        case '1080':
        default: videoQuality = '1080'; break;
    }

    // Try each instance
    for (const apiBase of COBALT_INSTANCES) {
        try {
            console.log(`Trying Cobalt instance: ${apiBase}`);

            const response = await fetch(`${apiBase}/api/json`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    vCodec: 'h264',
                    vQuality: videoQuality,
                    aFormat: 'mp3',
                    filenamePattern: 'basic',
                    isAudioOnly: false,
                    disableMetadata: false
                })
            });

            if (!response.ok) {
                console.log(`Instance ${apiBase} returned ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (data.status === 'error') {
                console.log(`Instance ${apiBase} returned error: ${data.text}`);
                continue;
            }

            // Get download URL
            let downloadUrl = null;

            if (data.status === 'redirect' || data.status === 'stream') {
                downloadUrl = data.url;
            } else if (data.status === 'picker' && data.picker) {
                downloadUrl = data.picker[0]?.url;
            }

            if (downloadUrl) {
                return { success: true, url: downloadUrl, instance: apiBase };
            }
        } catch (error) {
            console.log(`Instance ${apiBase} failed:`, error.message);
            continue;
        }
    }

    return { success: false };
}

async function downloadVideo() {
    if (!currentVideoUrl || !currentVideoInfo) {
        showError('Avval video ma\'lumotlarini oling');
        return;
    }

    const quality = getSelectedQuality();

    setButtonLoading(downloadBtn, true);
    downloadProgress.classList.remove('hidden');
    successMessage.classList.add('hidden');

    // Start progress animation
    let progress = 0;
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';

    // Fake progress to show activity
    const progressInterval = setInterval(() => {
        if (progress < 85) {
            progress += Math.random() * 8;
            progress = Math.min(progress, 85);
            progressFill.style.width = progress + '%';
            progressPercent.textContent = Math.round(progress) + '%';
        }
    }, 500);

    try {
        // Try Cobalt API instances
        const result = await tryDownloadWithCobalt(currentVideoUrl, quality);

        // Stop progress animation
        clearInterval(progressInterval);

        if (result.success) {
            // Complete progress
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';

            // Trigger download seamlessly using hidden link
            // This avoids new tabs and popup blockers mostly
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = result.url;
            a.setAttribute('download', '');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log(`Downloaded using: ${result.instance}`);

            // Show success
            setTimeout(() => {
                downloadProgress.classList.add('hidden');
                successMessage.classList.remove('hidden');

                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 5000);
            }, 500);
        } else {
            throw new Error('Hozirda barcha serverlar band (Rate Limit). Iltimos 1 daqiqadan so\'ng qayta urining.');
        }

    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        downloadProgress.classList.add('hidden');
        showError(error.message || 'Yuklab olishda xatolik yuz berdi');

    } finally {
        setButtonLoading(downloadBtn, false);
    }
}

// ===== Initialize =====

// Focus input on load
window.addEventListener('load', () => {
    urlInput.focus();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.body.style.animationPlayState = 'paused';
    } else {
        document.body.style.animationPlayState = 'running';
    }
});
