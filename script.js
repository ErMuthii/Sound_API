document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const audio = document.getElementById("main-audio");
    const playPauseBtn = document.getElementById("play-pause-btn");
    const playIcon = document.getElementById("play-icon");
    const pauseIcon = document.getElementById("pause-icon");

    const progressContainer = document.getElementById("progress-bar");
    const progressFilled = document.getElementById("progress-filled");
    const currentTimeEl = document.getElementById("current-time");
    const durationEl = document.getElementById("duration");

    const skipBackBtn = document.getElementById("skip-back-btn");
    const skipForwardBtn = document.getElementById("skip-forward-btn");

    const loopBtn = document.getElementById("loop-btn");
    const speedBtn = document.getElementById("speed-btn");

    const muteBtn = document.getElementById("mute-btn");
    const volumeIcon = document.getElementById("volume-icon");
    const mutedIcon = document.getElementById("muted-icon");
    const volumeSlider = document.getElementById("volume-slider");

    const audioUpload = document.getElementById("audio-upload");
    const trackTitle = document.getElementById("track-title");
    const trackArtist = document.getElementById("track-artist");
    const canvas = document.getElementById("audio-visualizer");
    const canvasCtx = canvas.getContext("2d");

    let isPlaying = false;
    const playbackSpeeds = [1, 1.25, 1.5, 2, 0.5, 0.75];
    let speedIndex = 0;


    let audioCtx;
    let analyser;
    let source;
    let dataArray;
    let bufferLength;

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Added a visualizer so you can see the audio waves
    function initVisualizer() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();

            source = audioCtx.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            analyser.fftSize = 256;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);

            drawVisualizer();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function drawVisualizer() {
        requestAnimationFrame(drawVisualizer);

        analyser.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;


            canvasCtx.fillStyle = `rgb(56, 189, 248)`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }


    function togglePlayPause() {
        initVisualizer();
        if (audio.paused) {
            audio.play();
            isPlaying = true;
            playIcon.classList.add("hidden");
            pauseIcon.classList.remove("hidden");
        } else {
            audio.pause();
            isPlaying = false;
            playIcon.classList.remove("hidden");
            pauseIcon.classList.add("hidden");
        }
    }

    playPauseBtn.addEventListener("click", togglePlayPause);


    audio.addEventListener("loadedmetadata", () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
        currentTimeEl.textContent = formatTime(audio.currentTime);
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progressFilled.style.width = `${progressPercent}%`;
    });


    audio.addEventListener("ended", () => {
        if (!audio.loop) {
            isPlaying = false;
            playIcon.classList.remove("hidden");
            pauseIcon.classList.add("hidden");
            progressFilled.style.width = "0%";
            currentTimeEl.textContent = "0:00";
        }
    });


    progressContainer.addEventListener("click", (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    });

    function skip(seconds) {
        audio.currentTime += seconds;
    }

    skipForwardBtn.addEventListener("click", () => skip(10));
    skipBackBtn.addEventListener("click", () => skip(-10));

    loopBtn.addEventListener("click", () => {
        audio.loop = !audio.loop;
        loopBtn.classList.toggle("active", audio.loop);
    });

    speedBtn.addEventListener("click", () => {
        speedIndex = (speedIndex + 1) % playbackSpeeds.length;
        const nextSpeed = playbackSpeeds[speedIndex];
        audio.playbackRate = nextSpeed;
        speedBtn.textContent = `${nextSpeed}x`;
        speedBtn.classList.add("active");
        if (nextSpeed === 1) {
            speedBtn.classList.remove("active");
        }
    });


    function setVolume(value) {
        audio.volume = value;
        volumeSlider.value = value;
        if (value === 0 || audio.muted) {
            volumeIcon.classList.add("hidden");
            mutedIcon.classList.remove("hidden");
        } else {
            volumeIcon.classList.remove("hidden");
            mutedIcon.classList.add("hidden");
        }
    }

    volumeSlider.addEventListener("input", (e) => {
        audio.muted = false;
        setVolume(e.target.value);
    });

    muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        if (audio.muted) {
            volumeIcon.classList.add("hidden");
            mutedIcon.classList.remove("hidden");
            volumeSlider.value = 0;
        } else {
            volumeIcon.classList.remove("hidden");
            mutedIcon.classList.add("hidden");
            volumeSlider.value = audio.volume;
        }
    });


    audioUpload.addEventListener("change", function (e) {
        const file = this.files[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            audio.src = objectUrl;


            let fileName = file.name;

            fileName = fileName.replace(/\.[^/.]+$/, "");
            trackTitle.textContent = fileName.substring(0, 25) + (fileName.length > 25 ? "..." : "");
            trackArtist.textContent = "Local Audio File";


            initVisualizer();
            audio.play();
            isPlaying = true;
            playIcon.classList.add("hidden");
            pauseIcon.classList.remove("hidden");
        }
    });


    document.addEventListener("keydown", (e) => {

        if (e.target.tagName.toLowerCase() !== 'input' && e.code === "Space") {
            e.preventDefault();
            togglePlayPause();
        } else if (e.code === "ArrowRight") {
            skip(10);
        } else if (e.code === "ArrowLeft") {
            skip(-10);
        } else if (e.code === "ArrowUp") {
            e.preventDefault();
            const newVol = Math.min(1, audio.volume + 0.1);
            setVolume(newVol);
        } else if (e.code === "ArrowDown") {
            e.preventDefault();
            const newVol = Math.max(0, audio.volume - 0.1);
            setVolume(newVol);
        }
    });
});
