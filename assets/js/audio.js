let audioPlayer;
let pausePlayButton;
let skipBackButton;
let skipForwardButton;
let progressSlider;
let volumeSlider;
let lastSavedSecond = null;
let pendingPositionSave = null;
let nowPlayingDisc;

document.addEventListener("DOMContentLoaded", () => {
    init();
    resumeFromStore();
    restoreVolume();
    handleKeybinds();
});

function handleKeybinds(){
    document.addEventListener("keydown", (e) => {
        if(e.code === "Space"){
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === "ArrowLeft") {
            e.preventDefault();
            skipBack();
        } else if (e.code === "ArrowRight") {
            e.preventDefault();
            skipForward();
        }
    });
}

function init(){
    audioPlayer = document.getElementById("audio-player");
    pausePlayButton = document.getElementById("play-pause-button");
    skipBackButton = document.getElementById("skip-back");
    skipForwardButton = document.getElementById("skip-forward");
    progressSlider = document.getElementById("progress-bar");
    volumeSlider = document.getElementById("volume-slider");
    nowPlayingDisc = document.getElementById("now-playing-disc");

    progressSlider.min = 0;
    progressSlider.max = 100;
    if (volumeSlider) {
        volumeSlider.min = 0;
        volumeSlider.max = 100;
        volumeSlider.value = audioPlayer.volume * 100;
        updateVolumeFill();
    }
    updateSliderFill();
    pausePlayButton.addEventListener("click", togglePlayPause);
    skipBackButton.addEventListener("click", skipBack);
    skipForwardButton.addEventListener("click", skipForward);
    audioPlayer.addEventListener("timeupdate", updateProgress);
    progressSlider.addEventListener("input", seekAudio);
    if (volumeSlider) {
        volumeSlider.addEventListener("input", updateVolume);
    }
}

function togglePlayPause(){
    if(audioPlayer.paused){
        audioPlayer.play();
        pausePlayButton.textContent = "Pause";
        nowPlayingDisc.classList.add("playing");
    } else {
        audioPlayer.pause();
        pausePlayButton.textContent = "Play";
        nowPlayingDisc.classList.remove("playing");
    }
}

function skipBack(){
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
}

function skipForward(){
    audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
}

function updateProgress(){
    if (!progressSlider || !isFinite(audioPlayer.duration) || audioPlayer.duration === 0) return;
    progressSlider.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    updateSliderFill();
    document.getElementById("time-elapsed").textContent = formatTime(audioPlayer.currentTime) + "/" + formatTime(audioPlayer.duration);
    const currentSec = Math.floor(audioPlayer.currentTime || 0);
    if (currentSec !== lastSavedSecond && window.store && window.store.set && audioPlayer.src) {
        lastSavedSecond = currentSec;
        saveTrackPosition(audioPlayer.src, audioPlayer.currentTime);
    }
}

async function saveTrackPosition(filePath, time) {
    try {
        const positions = await window.store.get('trackPositions') || {};
        positions[filePath] = time;
        await window.store.set('trackPositions', positions);
    } catch {}
}

function seekAudio(){
    if (!progressSlider || !isFinite(audioPlayer.duration) || audioPlayer.duration === 0) return;
    audioPlayer.currentTime = (progressSlider.value / 100) * audioPlayer.duration;
    updateSliderFill();
    document.getElementById("time-elapsed").textContent = formatTime(audioPlayer.currentTime) + "/" + formatTime(audioPlayer.duration);
}

function setAudioSource(src){
    if (audioPlayer.src && audioPlayer.src !== src) {
        saveTrackPosition(audioPlayer.src, audioPlayer.currentTime);
    }
    audioPlayer.src = src;
    audioPlayer.load();
    if (progressSlider) {
        progressSlider.value = 0;
        updateSliderFill();
    }
}

async function playAudio(src){
    setAudioSource(src);
    audioPlayer.play();
    document.getElementById("now-playing-title").textContent = extractFileName(src);
    // Store this as the last played file
    if (window.store && window.store.set) {
        try { window.store.set('lastTrackPath', src); } catch {}
    }
}

function updateSliderFill(){
    if (!progressSlider) return;
    const min = Number(progressSlider.min ?? 0);
    const max = Number(progressSlider.max ?? 100);
    const val = Number(progressSlider.value ?? 0);
    const pct = ((val - min) / (max - min)) * 100;
    const fill = '#8D86C9';
    const track = '#F7ECE1';
    progressSlider.style.background = `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`;
}

async function resumeFromStore(){
    try {
        if (!(window.store && window.store.get)) return;
        const lastPath = await window.store.get('lastTrackPath');
        if (lastPath) {
            setAudioSource(lastPath);
            const positions = await window.store.get('trackPositions') || {};
            const savedTime = positions[lastPath];
            if (typeof savedTime === 'number' && isFinite(savedTime)) {
                audioPlayer.currentTime = savedTime;
            }
            document.getElementById("now-playing-title").textContent = extractFileName(lastPath);
        }
    } catch {}
}

function extractFileName(path){
    const parts = path.split(/[/\\]/);
    let fileName = parts[parts.length - 1];
    fileName = decodeURIComponent(fileName);
    fileName = fileName.replace(/\.[^/.]+$/, '');
    return fileName;
}

function formatTime(seconds){
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateVolume(){
    if (!volumeSlider) return;
    const vol = volumeSlider.value / 100;
    audioPlayer.volume = vol;
    updateVolumeFill();
    if (window.store && window.store.set) {
        try { window.store.set('volume', vol); } catch {}
    }
}

function updateVolumeFill(){
    if (!volumeSlider) return;
    const min = Number(volumeSlider.min ?? 0);
    const max = Number(volumeSlider.max ?? 100);
    const val = Number(volumeSlider.value ?? 0);
    const pct = ((val - min) / (max - min)) * 100;
    const fill = '#8D86C9';
    const track = '#F7ECE1';
    volumeSlider.style.background = `linear-gradient(to right, ${fill} ${pct}%, ${track} ${pct}%)`;
}

async function restoreVolume(){
    try {
        if (!(window.store && window.store.get)) return;
        const savedVol = await window.store.get('volume');
        if (typeof savedVol === 'number' && savedVol >= 0 && savedVol <= 1) {
            audioPlayer.volume = savedVol;
            if (volumeSlider) {
                volumeSlider.value = savedVol * 100;
                updateVolumeFill();
            }
        }
    } catch {}
}