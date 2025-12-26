let tracks = [];

async function initLibrary() {
    tracks = await fetchTracksFromFolder(SETTINGSKEYS.AUDIOFOLDER);
    console.log("Fetched tracks:", tracks);

    const trackList = document.getElementById("track-list");
    trackList.innerHTML = "";
    
    const grouped = {};
    
    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const folder = track.folder || 'Root';
        
        if (!grouped[folder]) {
            grouped[folder] = [];
        }
        grouped[folder].push({ track, index: i });
    }
    
    for (const folder of Object.keys(grouped).sort()) {
        trackList.insertAdjacentHTML("beforeend", `<h3 class="folder-header">${folder}</h3>`);
        
        for (const { track, index } of grouped[folder]) {
            trackList.insertAdjacentHTML("beforeend", `
                <div class="track-item" data-track-index="${index}">
                <p>${track.name || track.path || track}</p>
                <p>${track.duration || ''}</p>
                </div>
            `);
        }
    }
    
    initTracks(trackList);
    initLibraryControls();
    await resumeLastTrack();
}

function initLibraryControls() {
    const searchBar = document.getElementById("search-bar");
    const refreshButton = document.getElementById("refresh-button");

    if (searchBar) {
        searchBar.addEventListener("input", () => {
            const filter = searchBar.value.toLowerCase();
            const trackItems = document.querySelectorAll("#track-list .track-item");
            trackItems.forEach((item) => {
                const text = item.textContent.toLowerCase();
                if (text.includes(filter)) {
                    item.style.display = "";
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", async () => {
            await initLibrary();
            showSection("library");
        });
    }
}

function initTracks(trackList) {
    const trackItems = trackList.querySelectorAll('.track-item');
    trackItems.forEach((item) => {
        item.addEventListener('click', async () => {
            const trackIndex = parseInt(item.dataset.trackIndex, 10);
            const track = tracks[trackIndex];
            let trackPath = track.path || track;
            
            if (trackPath && !trackPath.startsWith('file://') && !trackPath.startsWith('http')) {
                trackPath = 'file://' + encodeURI(trackPath.replace(/\\/g, '/'));
            }
            
            if (typeof setAudioSource === 'function') {
                setAudioSource(trackPath);
                document.getElementById("now-playing-title").textContent = track.name || track.path || 'Unknown';
                if (window.store && window.store.get) {
                    try {
                        const positions = await window.store.get('trackPositions') || {};
                        let savedTime = positions[trackPath];
                        if (typeof savedTime === 'number' && isFinite(savedTime)) {
                            // Wait for metadata to load to check duration
                            audioPlayer.addEventListener('loadedmetadata', function checkAndRestore() {
                                const duration = audioPlayer.duration;
                                // If saved time is within 2 seconds of the end, reset to beginning
                                if (duration - savedTime < 2) {
                                    savedTime = 0;
                                }
                                audioPlayer.currentTime = savedTime;
                                audioPlayer.removeEventListener('loadedmetadata', checkAndRestore);
                            }, { once: true });
                        }
                    } catch {}
                }
                pausePlayButton.innerHTML = `<img src="./assets/images/pause.svg" alt="play/pause">`;
                nowPlayingDisc.classList.add("playing");
            }
            
            if (typeof playAudio === 'function') {
                audioPlayer.play();
                if (window.store && window.store.set) {
                    try { window.store.set('lastTrackPath', trackPath); } catch {}
                }
                showSection("home");
            } else {
                console.error('playAudio function not found');
            }
        });
    });
}

async function resumeLastTrack() {
    try {
        if (!(window.store && window.store.get)) return;
        const idx = await window.store.get('lastTrackIndex');
        const lastPath = await window.store.get('lastTrackPath');
        const lastTime = await window.store.get('lastTrackTime');
        if (lastPath) {
            if (typeof setAudioSource === 'function') {
                setAudioSource(lastPath);
                const positions = await window.store.get('trackPositions') || {};
                const savedTime = positions[lastPath];
                if (typeof savedTime === 'number' && isFinite(savedTime)) {
                    audioPlayer.currentTime = savedTime;
                }
                }
                showSection("home");
            }

    } catch {}
}

function fetchTracksFromFolder(folderPath) {
    return window.electronAPI.getTracks(folderPath)
}