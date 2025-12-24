const SETTINGSKEYS = {
    AUDIOFOLDER: ""
};

document.addEventListener("DOMContentLoaded", () => {
    initSettings();
});

function initSettings() {
    const audioFolder = document.getElementById("audio-folder");
    const clearBtn = document.getElementById("clear-preferences");
    audioFolder.addEventListener("click", async (event) => {
        const folderPath = await window.electronAPI.selectAudioFolder();
        if (folderPath) {
            await setSetting("audioFolder", folderPath);
            loadSettings();
        }
    });
    if (clearBtn) {
        clearBtn.addEventListener("click", clearPreferences);
    }
    loadSettings();
}

async function loadSettings() {
    const audioFolder = await getSetting("audioFolder");
    if (audioFolder) {
        SETTINGSKEYS.AUDIOFOLDER = audioFolder;
        console.log("Loaded audio folder:", audioFolder);
        document.getElementById("audio-folder-path").textContent = audioFolder;
        initLibrary();
    }
}

async function setSetting(key, value) {
    await window.store.set(key, value);
}

async function getSetting(key) {
    return await window.store.get(key);
}

async function clearPreferences() {
    // Show confirmation dialog
    const confirmed = confirm("Are you sure you want to clear all preferences? This will reset your audio folder, volume, playback positions, and other settings.");
    
    if (confirmed) {
        try {
            // Clear all preferences by resetting key values
            if (window.store && window.store.set) {
                await window.store.set("audioFolder", "");
                await window.store.set("lastTrackPath", "");
                await window.store.set("trackPositions", {});
                await window.store.set("volume", 1);
                console.log("Preferences cleared successfully");
                
                // Stop playback and clear current song
                if (typeof audioPlayer !== 'undefined' && audioPlayer) {
                    audioPlayer.pause();
                    audioPlayer.src = "";
                    audioPlayer.currentTime = 0;
                    document.getElementById("now-playing-title").textContent = "No track playing";
                }
                
                // Clear the track list
                const trackList = document.getElementById("track-list");
                if (trackList) {
                    trackList.innerHTML = "";
                }
                
                // Reset UI
                SETTINGSKEYS.AUDIOFOLDER = "";
                document.getElementById("audio-folder-path").textContent = "No folder selected";
                loadSettings();
            }
        } catch (err) {
            console.error("Error clearing preferences:", err);
            alert("Failed to clear preferences");
        }
    }
}