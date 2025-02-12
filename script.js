document.addEventListener("DOMContentLoaded", async () => {
    const startButton = document.getElementById("startButton");
    const downloadButton = document.getElementById("downloadButton");
    const fileInput = document.getElementById("videoFiles");
    const videoElement = document.createElement("video");
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
    downloadButton.addEventListener("click", convertAndDownloadMP4);

    // ✅ Fix iOS fullscreen & autoplay issues
    videoElement.playsInline = true;
    videoElement.muted = true; // iOS requires muted video for autoplay
    videoElement.style.display = "none"; // Hide video element

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
            downloadButton.style.display = "block";
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

        // ✅ Draw frames onto canvas for a live preview
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

    async function convertAndDownloadMP4() {
        const ffmpeg = await createFFmpeg({ log: true });
        await ffmpeg.load();

        const webmBlob = new Blob(recordedChunks, { type: "video/webm" });
        const webmUrl = URL.createObjectURL(webmBlob);

        ffmpeg.FS("writeFile", "input.webm", await fetchFile(webmUrl));
        await ffmpeg.run("-i", "input.webm", "-c:v", "libx264", "-preset", "fast", "output.mp4");

        const mp4Data = ffmpeg.FS("readFile", "output.mp4");
        const mp4Blob = new Blob([mp4Data.buffer], { type: "video/mp4" });
        const mp4Url = URL.createObjectURL(mp4Blob);

        const a = document.createElement("a");
        a.href = mp4Url;
        a.download = "edited-video.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
