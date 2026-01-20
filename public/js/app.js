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

    resetUI();
    setButtonLoading(getInfoBtn, true);

    try {
        const response = await fetch('/api/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Video ma\'lumotlarini olishda xatolik');
        }

        // Store info
        currentVideoInfo = data;

        // Update UI
        videoThumbnail.src = data.thumbnail;
        videoTitle.textContent = data.title;
        videoDuration.textContent = data.duration_string || data.duration;
        videoChannel.textContent = data.channel;
        videoViews.textContent = formatNumber(data.view_count) + ' ko\'rishlar';

        // Show preview
        videoPreview.classList.remove('hidden');

    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        setButtonLoading(getInfoBtn, false);
    }
}

async function downloadVideo() {
    if (!currentVideoInfo) return;

    const url = urlInput.value.trim();
    const quality = getSelectedQuality();

    setButtonLoading(downloadBtn, true);
    downloadProgress.classList.remove('hidden');

    // Reset progress
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';

    // Simulate initial progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.random() * 5;
            if (progress > 90) progress = 90;
            progressFill.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
    }, 500);

    try {
        const response = await fetch('/api/download', {
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

        if (data.success) {
            // Complete progress
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressPercent.textContent = '100%';

            // Download file
            window.location.href = `${data.downloadUrl}?title=${encodeURIComponent(currentVideoInfo.title)}`;

            // Show success
            setTimeout(() => {
                downloadProgress.classList.add('hidden');
                successMessage.classList.remove('hidden');
                setTimeout(() => {
                    successMessage.classList.add('hidden');
                }, 3000);
            }, 1000);
        }

    } catch (error) {
        clearInterval(progressInterval);
        console.error('Error:', error);
        downloadProgress.classList.add('hidden');
        showError(error.message);
    } finally {
        setButtonLoading(downloadBtn, false);
    }
}

// ===== Initialize =====

// Focus input on load
window.addEventListener('load', () => {
    urlInput.focus();
});
