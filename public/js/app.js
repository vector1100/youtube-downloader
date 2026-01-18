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

// API Base URL
const API_BASE = '';

// ===== Utility Functions =====

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function formatNumber(num) {
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

function formatDuration(seconds) {
    if (!seconds) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
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
        // Auto-fetch info when pasting
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
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)/;
    if (!youtubeRegex.test(url)) {
        showError('Iltimos, to\'g\'ri YouTube URL kiriting');
        return;
    }

    resetUI();
    setButtonLoading(getInfoBtn, true);

    try {
        const response = await fetch(`${API_BASE}/api/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Xatolik yuz berdi');
        }

        // Store video info
        currentVideoInfo = data;

        // Update UI
        videoThumbnail.src = data.thumbnail;
        videoTitle.textContent = data.title;
        videoDuration.textContent = formatDuration(data.duration);
        videoChannel.textContent = data.channel || 'Noma\'lum';
        videoViews.textContent = formatNumber(data.view_count) + ' ko\'rishlar';

        // Show preview
        videoPreview.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Video ma\'lumotlarini olishda xatolik');
    } finally {
        setButtonLoading(getInfoBtn, false);
    }
}

async function downloadVideo() {
    const url = urlInput.value.trim();
    const quality = getSelectedQuality();

    if (!url || !currentVideoInfo) {
        showError('Avval video ma\'lumotlarini oling');
        return;
    }

    setButtonLoading(downloadBtn, true);
    downloadProgress.classList.remove('hidden');
    successMessage.classList.add('hidden');

    // Simulate progress (since we can't track actual progress from backend)
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 10;
            progress = Math.min(progress, 90);
            progressFill.style.width = progress + '%';
            progressPercent.textContent = Math.round(progress) + '%';
        }
    }, 500);

    try {
        const response = await fetch(`${API_BASE}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url, quality })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Yuklab olishda xatolik');
        }

        // Complete progress
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressPercent.textContent = '100%';

        // Trigger download
        const videoTitle = currentVideoInfo.title || 'video';
        const downloadUrl = `${data.downloadUrl}?title=${encodeURIComponent(videoTitle)}`;

        // Create hidden link and click it
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${videoTitle}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show success
        setTimeout(() => {
            downloadProgress.classList.add('hidden');
            successMessage.classList.remove('hidden');

            // Hide success after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 5000);
        }, 500);

    } catch (error) {
        console.error('Error:', error);
        clearInterval(progressInterval);
        downloadProgress.classList.add('hidden');
        showError(error.message || 'Video yuklab olishda xatolik');
    } finally {
        setButtonLoading(downloadBtn, false);
    }
}

// ===== Initialize =====

// Focus input on load
window.addEventListener('load', () => {
    urlInput.focus();
});

// Handle visibility change (to pause animations when hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        document.body.style.animationPlayState = 'paused';
    } else {
        document.body.style.animationPlayState = 'running';
    }
});
