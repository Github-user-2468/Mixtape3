/*
 * Mixtape Frontend Script
 * Handles theme toggling, form switching, and mixtape creation
*/

// Messages for radio display
const messages = [
    "CREATE YOUR MIXTAPE",
    "CUSTOMIZE YOUR SOUND",
    "YOUR PERSONAL PLAYLIST"
];

// Variables to track state
let currentMessage = 0;
let isProcessing = false;
let originalMessage = "";
let messageInterval;

//playback variables 
let playlists = [];
let currentPlaylistIndex = 0;
let currentTrack = 0;
let isPlaying = false;
let playerInterval;
let currentTime = 0;
let currentDuration = 0;
let isPaused = true;
let pauseTimeout = null;
//variable for yt api
let ytPlayer;

// Initialize theme from localStorage or default to light
function initTheme() {
    const savedTheme = localStorage.getItem('darkMode') === 'true';
    const isDarkMode = savedTheme || false;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        themeBtn.textContent = isDarkMode ? 'Light Mode' : ' Dark Mode';
    }
}

// Create and set up the theme toggle button
function setupThemeToggle() {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.textContent = ' Dark Mode';
    
    themeBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode.toString());
        themeBtn.textContent = isDarkMode ? ' Light Mode' : ' Dark Mode';
    });
    
    document.body.appendChild(themeBtn);
}

// Start cycling radio messages
function startMessageCycle() {
    messageInterval = setInterval(() => {
        if (!isProcessing) {
            currentMessage = (currentMessage + 1) % messages.length;
            const radioMessage = document.getElementById('radio-message');
            if (radioMessage) {
                radioMessage.textContent = messages[currentMessage];
            }
        }
    }, 3000);
}

// Switch between login and mixtape views
function switchToMixtapeView() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('mixtape-view').classList.remove('hidden');
    clearInterval(messageInterval);
}


// Switch back to login view
function switchToLoginView() {
    document.getElementById('mixtape-view').classList.add('hidden');
    document.getElementById('playback-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    
    // Reset login form
    document.getElementById('login-form').reset();
    
    // Show login container, hide signup container
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('signup-container').classList.add('hidden');
    
    // Restart message cycling
    startMessageCycle();
    
    // Show welcome back message
    isProcessing = true;
    document.getElementById('radio-message').textContent = "WELCOME BACK";
    setTimeout(() => { isProcessing = false; }, 2000);
}

// Update track numbers when tracks are added/removed
function updateTrackNumbers() {
    const tracksContainer = document.getElementById('tracks-container');
    if (!tracksContainer) return;
    
    const trackItems = tracksContainer.querySelectorAll('.track-item');
    trackItems.forEach((item, index) => {
        item.querySelector('.track-number').textContent = index + 1;
    });
}

// Callback
function onPlayerReady(event) {
    console.log("YouTube player ready");
}

// State Change
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        nextTrack();
    }
}

// Initializing youtube player
function initYouTubePlayer() {
    ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Called by YouTube API when it's ready
function onYouTubeIframeAPIReady() {
    initYouTubePlayer(); 
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up theme
    initTheme();
    setupThemeToggle();
    
    // Start radio message cycle
    startMessageCycle();
    
    // Set up logout button functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('../backend/auth/logout.php')
                .then(res => res.json())
                .then(data => {
                    console.log(data.message); // Debug
                    switchToLoginView(); // Go back to login screen
                });
        });        
    }
    // Logout button for playback view
    const logoutBtnPlayback = document.getElementById('logout-btn-playback');
    if (logoutBtnPlayback) {
        logoutBtnPlayback.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('../backend/auth/logout.php')
                .then(res => res.json())
                .then(data => {
                    console.log(data.message);
                    switchToLoginView();
                })
                .catch(error => {
                    console.error("Logout error:", error);
                    switchToLoginView();
                });
        });
    }

    // Form toggling functionality - Switch to signup form
    document.getElementById('show-signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('signup-container').classList.remove('hidden');
        
        // Pause message cycling and show specific message
        isProcessing = true;
        originalMessage = document.getElementById('radio-message').textContent;
        document.getElementById('radio-message').textContent = "CREATE NEW ACCOUNT";
        
        // Resume message cycling after delay
        setTimeout(() => { isProcessing = false; }, 2000);
    });
    
    // Form toggling functionality - Switch to login form
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signup-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
        
        // Pause message cycling and show specific message
        isProcessing = true;
        originalMessage = document.getElementById('radio-message').textContent;
        document.getElementById('radio-message').textContent = "WELCOME BACK";
        
        // Resume message cycling after delay
        setTimeout(() => { isProcessing = false; }, 2000);
    });

    // Handle login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        isProcessing = true;
        document.getElementById('radio-message').textContent = "LOGGING IN...";
    
        const formData = new FormData(document.getElementById('login-form'));
    
        fetch('../backend/auth/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('radio-message').textContent = "Login successful!";
                switchToMixtapeView();
            } else {
                document.getElementById('radio-message').textContent = data.message || "Login failed.";
            }
        })
        .catch(error => {
            console.error("Login error:", error);
            document.getElementById('radio-message').textContent = "Server error.";
        })
        .finally(() => {
            isProcessing = false;
        });
    });
    
    // Handle signup form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        isProcessing = true;
        document.getElementById('radio-message').textContent = "CREATING ACCOUNT...";
        
        const formData = new FormData(document.getElementById('signup-form'));

        fetch('../backend/auth/register.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text()) // use .text() to debug first
        .then(text => {
            console.log('Raw response:', text); // Log raw response for debugging
            try {
                const data = JSON.parse(text);
                if (data.status === 'success') {
                    document.getElementById('radio-message').textContent = "Registered successfully!";
                    switchToMixtapeView();
                } else {
                    document.getElementById('radio-message').textContent = data.message || "Registration failed.";
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                console.error("Raw response:", text);
                document.getElementById('radio-message').textContent = "Server error.";
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            document.getElementById('radio-message').textContent = "Network error.";
        })
        .finally(() => {
            isProcessing = false;
        });        
    });

    // Get references to mixtape view elements
    const mixtapeTitle = document.getElementById('mixtape-title');
    const tapeTitle = document.getElementById('tape-title');
    const addTrackBtn = document.getElementById('add-track');
    const tracksContainer = document.getElementById('tracks-container');
    const createMixtapeBtn = document.getElementById('create-mixtape');
    
    // Update title when user types in title field
    if (mixtapeTitle && tapeTitle) {
        mixtapeTitle.addEventListener('input', function() {
            tapeTitle.textContent = this.value || "Your Mixtape Title";
        });
    }
    
    // Add new track when add button is clicked
    if (addTrackBtn && tracksContainer) {
        addTrackBtn.addEventListener('click', () => {
            // Check if max tracks limit is reached
            const currentTracks = tracksContainer.querySelectorAll('.track-item').length;
            if (currentTracks >= 10) {
                alert("Maximum 10 tracks allowed!");
                return;
            }
            
            // Create and append new track item
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <div class="track-number">${currentTracks + 1}</div>
                <div class="track-input-container">
                    <input type="text" class="youtube-link" placeholder="Paste YouTube link here...">
                </div>
                <button class="remove-track" title="Remove this track">✕</button>
            `;
            tracksContainer.appendChild(trackItem);
            updateTrackNumbers();
        });
    }
    
    // Handle track removal using event delegation
    if (tracksContainer) {
        tracksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-track')) {
                // If it's the last track, just clear the input instead of removing
                if (tracksContainer.querySelectorAll('.track-item').length <= 1) {
                    const input = e.target.closest('.track-item').querySelector('.youtube-link');
                    if (input) input.value = '';
                    return;
                }
                // Otherwise remove the track item completely
                e.target.closest('.track-item').remove();
                updateTrackNumbers();
            }
        });
    }

    // Load and play a track
    function playTrack(videoId) {
        if (!ytPlayer) return;
        
        ytPlayer.loadVideoById(videoId);
        ytPlayer.playVideo();
        isPaused = false;
        document.getElementById('play-pause-icon').src = 'assets/pause.png';
        
        //Update duration from api
        updateTrackDuration();
        
        startProgress();
    }
    
    // Function to handle track duration
    function updateTrackDuration() {
        if (!ytPlayer) return;
        
        setTimeout(() => {
            currentDuration = ytPlayer.getDuration();
            const formattedDuration = formatDuration(currentDuration);
            document.getElementById('duration').textContent = formattedDuration;
            
            const trackItems = document.querySelectorAll('#playlist .track-item');
            if (trackItems[currentTrack]) {
                trackItems[currentTrack].querySelector('.track-duration').textContent = formattedDuration;
            }
        }, 1000);
    }
    
    // Get different types of youtube urls
    function extractYouTubeId(url) {
        
         // Standard url
        let match = url.match(/(?:\?|\&)v=([^&#\s]{11})/);
        if (match && match[1]) return match[1];

        // youtu.be links
        match = url.match(/youtu\.be\/([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // Embedded player URLs
        match = url.match(/\/embed\/([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // URL with v= parameter
        match = url.match(/[?&]v=([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // URL with vi= parameter
        match = url.match(/[?&]vi=([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // No match found
        return null;
    }
    // Async function for fetching data
    async function fetchVideoData(url) {
        const videoId = extractYouTubeId(url);
        if (!videoId) {
            console.error('Invalid YouTube URL:', url);
            return {
                title: `[Invalid YouTube URL]`,
                duration: '0:00',
                durationSeconds: 0,
                videoId: videoId
            };
        }
    
        try {
            const response = await fetch(`../backend/mixtape/video_info.php?video_id=${videoId}`);
            const text = await response.text();
    
            console.log("Raw response:", text);
    
            const data = JSON.parse(text);
    
            if (!data || !data.duration) {
                throw new Error('Invalid response structure');
            }
    
            return {
                title: data.title || `Track ${newPlaylist.tracks.length + 1}`,
                duration: formatDuration(data.duration),
                durationSeconds: data.duration,
                videoId: videoId
            };            
        } catch (error) {
            console.error('Error fetching video metadata:', error);
            return {
                title: `[Error Loading] ${videoId}`,
                duration: '0:00',
                durationSeconds: 0,
                videoId: videoId
            };
        }
    }
    

    // Convert seconds to minutes and seconds format
    function formatDuration(seconds) {
        const secs = Number(seconds) || 0;
        const mins = Math.floor(secs / 60);
        const remainingSecs = Math.floor(secs % 60);
        return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    
    // Handle mixtape creation when button is clicked
    if (createMixtapeBtn && tracksContainer) {
        createMixtapeBtn.addEventListener('click', async () => {
            // Validate title
            const title = mixtapeTitle.value.trim();
            if (!title) {
                alert("Please provide a title for your mixtape!");
                return;
            }
            
            // Collect and validate tracks
            const trackInputs = tracksContainer.querySelectorAll('.youtube-link');
            const tracks = [];
            
            trackInputs.forEach(input => {
                const value = input.value.trim();
                if (value) tracks.push(value);
            });
            
            // Ensure at least one track is added
            if (tracks.length === 0) {
                alert("Please add at least one track to your mixtape!");
                return;
            }
            
            // Show creating...
            isProcessing = true;
            document.getElementById('tape-title').textContent = "CREATING...";
            
            try {
                // Create playlist object
                const newPlaylist = {
                    title: title,
                    date: new Date().toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    }),
                    tracks: [],
                    description: generateDescription(title)
                };
                
                for (let i = 0; i < trackInputs.length; i++) {
                    const input = trackInputs[i];
                    const url = input.value.trim();
                    const videoId = extractYouTubeId(url);
                    if (videoId) {
                        const data = await fetchVideoData(url);
                
                        newPlaylist.tracks.push({
                            id: videoId,
                            title: data.title || `Track ${i + 1}`,
                            artist: "YouTube",
                            duration: data.duration,
                            durationSeconds: data.durationSeconds,
                            videoId: videoId
                        });
                    }
                }
    
                // Add to playlists and switch view
                playlists.unshift(newPlaylist);
                currentPlaylistIndex = 0;
                renderPlaylist(currentPlaylistIndex);
                switchToPlaybackView();
                const firstVideoId = playlists[0].tracks[0].videoId;
                playTrack(firstVideoId);

            } catch (error) {
                console.error('Error creating mixtape:', error);
                alert('Error creating mixtape. Please try again.');
            } finally {
                isProcessing = false;
            }
        });
    }
    // Switch to playback screen after creating mixtape
    function switchToPlaybackView() {
        document.getElementById('mixtape-view').classList.add('hidden');
        document.getElementById('playback-view').classList.remove('hidden');
        
        // Reset variables
        currentTrack = 0;
        isPaused = false;
        currentTime = 0;
        
        // Update controls
        setupPlayerControls();
        
        // Render playlist
        renderPlaylist(currentPlaylistIndex);
        
        // Show first track as active
        updateNowPlayingDisplay();
    }

    // Button handling for playback
    function setupPlayerControls() {
        const playBtn = document.getElementById('play-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', togglePlay);
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!ytPlayer) return;
        
                const time = ytPlayer.getCurrentTime();
        
                if (time > 5) {
                    // Restart current track
                    ytPlayer.seekTo(0);
                    currentTime = 0;
                    document.getElementById('song-progress').style.width = '0%';
                    document.getElementById('current-time').textContent = '0:00';
        
                    if (!isPaused) {
                        startProgress();
                    }
                } else {
                    // Skip to previous track
                    prevTrack();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', nextTrack);
        }
        
        // Setup create new button
        const createNewBtn = document.getElementById('create-new-btn');
        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => {
                document.getElementById('playback-view').classList.add('hidden');
                document.getElementById('mixtape-view').classList.remove('hidden');
                
                // Reset form
                document.getElementById('mixtape-title').value = '';
                const tracksContainer = document.getElementById('tracks-container');
                tracksContainer.innerHTML = `
                    <div class="track-item">
                        <div class="track-number">1</div>
                        <div class="track-input-container">
                            <input type="text" class="youtube-link" placeholder="Paste YouTube link here...">
                        </div>
                        <button class="remove-track" title="Remove this track">✕</button>
                    </div>
                `;
                document.getElementById('tape-title').textContent = "Your Mixtape Title";
            });
        }
    }

    function togglePlay() {
        if (!ytPlayer) return;
    
        if (isPaused) {
            ytPlayer.playVideo();
            document.getElementById('play-pause-icon').src = 'assets/pause.png';
        } else {
            ytPlayer.pauseVideo();
            document.getElementById('play-pause-icon').src = 'assets/play.png';
        }
        isPaused = !isPaused;
    }

    function startProgress() {
        clearInterval(playerInterval);
        
        const activeTrack = document.querySelector('#playlist .track-item.active');
        if (!activeTrack) return;
        
        const progress = document.getElementById('song-progress');
        const currentTimeDisplay = document.getElementById('current-time');
        
        playerInterval = setInterval(() => {
            if (isPaused || !ytPlayer) return;
            
            // Current time from yt player, fallback set to 3:45
            currentTime = ytPlayer.getCurrentTime() || 0;
            currentDuration = ytPlayer.getDuration() || 225;
            
            const percent = (currentTime / currentDuration) * 100;
            progress.style.width = `${Math.min(percent, 100)}%`;
            
            // Update time display
            const displayMinutes = Math.floor(currentTime / 60);
            const displaySeconds = Math.floor(currentTime % 60);
            currentTimeDisplay.textContent = 
                `${displayMinutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;
            
        }, 100);
    }

    // Function ot move to next track
    function nextTrack() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        if (trackItems.length === 0) return;
        
        currentTrack = (currentTrack + 1) % trackItems.length;
        currentTime = 0;
        
        const currentPlaylist = playlists[currentPlaylistIndex];
        const videoId = currentPlaylist.tracks[currentTrack].videoId;
        playTrack(videoId);
        
        updateNowPlayingDisplay();
    }
    // Function to move to prev track
    function prevTrack() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        if (trackItems.length === 0) return;

        currentTrack = (currentTrack - 1 + trackItems.length) % trackItems.length;
        currentTime = 0;

        const currentPlaylist = playlists[currentPlaylistIndex];
        const videoId = currentPlaylist.tracks[currentTrack].videoId;

        playTrack(videoId);
        updateNowPlayingDisplay();
    }

    function renderPlaylist(index) {
        const playlist = playlists[index];
        if (!playlist) return;
    
        document.getElementById('now-playing-title').textContent = playlist.title;
        document.getElementById('creation-date').textContent = `Created on ${playlist.date}`;
        
        const descElement = document.querySelector('.mixtape-description p');
        if (descElement) {
            descElement.textContent = playlist.description;
        }
    
        const playlistElement = document.getElementById('playlist');
        playlistElement.innerHTML = '';
    
        playlist.tracks.forEach((track, i) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.innerHTML = `
                <div class="track-number">${i + 1}</div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-duration">${track.duration || '0:00'}</div>
            `;
            
            // Play track
            trackItem.addEventListener('click', () => {
                currentTrack = i;
                currentTime = 0;
                playTrack(track.videoId);
                updateNowPlayingDisplay();
            });
            
            playlistElement.appendChild(trackItem);
        });
        
        updateNowPlayingDisplay();
    }

    function updateNowPlayingDisplay() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        
        trackItems.forEach(item => item.classList.remove('active'));
        
        if (trackItems[currentTrack]) {
            trackItems[currentTrack].classList.add('active');
            
            // Update "now playing"
            document.querySelector('.section-header span').textContent = 
                `Now Playing Track ${currentTrack + 1}`;
                
            // Update time duration display
            const durationText = trackItems[currentTrack].querySelector('.track-duration').textContent;
            document.getElementById('duration').textContent = durationText;
        }
    }
    // Descriptions for playback view
    function generateDescription(title) {
        const descriptors = [
            "A collection of songs that capture the essence of",
            "The perfect soundtrack for",
            "A musical journey through",
            "Timeless melodies that define",
            "Songs that embody the spirit of"
        ];
        
        const endings = [
            "moments that last a lifetime.",
            "memories you'll cherish forever.",
            "times you'll never forget.",
            "experiences that shape who you are.",
            "the soundtrack of your life."
        ];
        
        const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
        const randomEnding = endings[Math.floor(Math.random() * endings.length)];
        
        return `${randomDescriptor} ${title.toLowerCase()}, ${randomEnding}`;
    }
    
});