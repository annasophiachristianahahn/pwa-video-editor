document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const downloadButton = document.getElementById("downloadButton");
    const fileInput = document.getElementById("videoFiles");
    const videoElement = document.getElementById("videoPlayer");
    const canvas = document.getElementById("videoCanvas");
    const ctx = canvas.getContext("2d");

    let videoFiles = [];
    let totalTimePlayed = 0;
    let finalVideoLength = 10;
    let minClipLengthPercent = 25;
    let maxClipLengthPercent = 90;
    let lastVideoIndex = -1;
    let mediaRecorder;
    let recordedChunks = [];
    let isRecording = false;

    startButton.addEventListener("click", startEditing);
    downloadButton.addEventListener("click", downloadVideo);

    // ✅ Prevent Safari from going fullscreen and showing controls
    videoElement.playsInline = true;
    videoElement.muted = true; // iOS requires muted videos for autoplay
    videoElement.style.display = "none"; // Keep video hidden

    function startEditing() {
        if (fileInput.files.length === 0) {
            alert("Please select video files.");
            return;
        }

        videoFiles = Array.from(fileInput.files);
        finalVideoLength = parseFloat(document.getElementById("finalLength").value) || 10;
        minClipLengthPercent = parseFloat(document.getElementById("minClipLength").value) || 25;
        maxClipLengthPercent = parseFloat(document.getElementById("maxClipLength").value) || 90;

        totalTimePlayed = 0;
        lastVideoIndex = -1;
        recordedChunks = [];
        isRecording = false;

        canvas.width = 1280;
        canvas.height = 720;

        startRecording();
        playNextClip();
    }

    function startRecording() {
        const stream = canvas.captureStream(30); // Capture at 30 FPS
        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            downloadButton.style.display = "block";
            downloadButton.onclick = () => {
                const a = document.createElement("a");
                a.href = url;
                a.download = "edited-video.webm";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        };

        mediaRecorder.start();
        isRecording = true;
    }

    async function playNextClip() {
        if (totalTimePlayed >= finalVideoLength) {
            console.log("✅ Final video length reached. Stopping.");
            stopRecording();
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * videoFiles.length);
        } while (randomIndex === lastVideoIndex && videoFiles.length > 1);

        lastVideoIndex = randomIndex;

        const videoFile = videoFiles[randomIndex];
        const fileURL = URL.createObjectURL(videoFile);

        videoElement.src = fileURL;
        videoElement.load();

        await new Promise(resolve => videoElement.addEventListener("loadedmetadata", resolve, { once: true }));

        const videoDuration = videoElement.duration;
        if (!isFinite(videoDuration) || isNaN(videoDuration) || videoDuration <= 0) {
            console.error("Invalid video duration:", videoDuration);
            return;
        }

        let minClipLength = (videoDuration * minClipLengthPercent) / 100;
        let maxClipLength = (videoDuration * maxClipLengthPercent) / 100;
        let clipLength = Math.random() * (maxClipLength - minClipLength) + minClipLength;

        if (totalTimePlayed + clipLength > finalVideoLength) {
            clipLength = finalVideoLength - totalTimePlayed;
        }

        let clipStartTime = Math.random() * (videoDuration - clipLength);
        let clipEndTime = clipStartTime + clipLength;

        console.log(`🎬 Playing clip from ${clipStartTime.toFixed(2)}s to ${clipEndTime.toFixed(2)}s`);

        videoElement.currentTime = clipStartTime;
        await videoElement.play();

        // ✅ Update canvas continuously while video plays
        const interval = setInterval(() => {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        }, 33); // Capture ~30 FPS

        await new Promise(resolve => setTimeout(resolve, clipLength * 1000));

        clearInterval(interval);
        videoElement.pause();
        totalTimePlayed += clipLength;

        playNextClip();
    }

    function stopRecording() {
        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
        }
    }

    function downloadVideo() {
        if (recordedChunks.length === 0) return;
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "edited-video.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
