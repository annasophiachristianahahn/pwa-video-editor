document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const fileInput = document.getElementById("videoFiles");
    const videoElement = document.getElementById("videoPlayer");

    if (!startButton || !fileInput || !videoElement) {
        console.error("Error: One or more required elements are missing.");
        return;
    }

    let videoFiles = [];
    let totalTimePlayed = 0;
    let finalVideoLength = 30; // Default video length in seconds
    let minClipLengthPercent = 25;
    let maxClipLengthPercent = 32;

    startButton.addEventListener("click", startEditing);

    function startEditing() {
        if (fileInput.files.length === 0) {
            console.error("No video files selected.");
            alert("Please select video files.");
            return;
        }

        videoFiles = Array.from(fileInput.files);
        finalVideoLength = parseFloat(document.getElementById("finalLength").value) || 30;
        minClipLengthPercent = parseFloat(document.getElementById("minClipLength").value) || 25;
        maxClipLengthPercent = parseFloat(document.getElementById("maxClipLength").value) || 32;

        console.log("Starting editing with:", {
            finalVideoLength,
            minClipLengthPercent,
            maxClipLengthPercent,
            videoFiles
        });

        totalTimePlayed = 0;
        videoElement.style.display = "block";
        playNextClip();
    }

    function playNextClip() {
        if (totalTimePlayed >= finalVideoLength) {
            console.log("✅ Final video length reached. Stopping.");
            return;
        }

        // Pick a random video from the list
        const randomIndex = Math.floor(Math.random() * videoFiles.length);
        const videoFile = videoFiles[randomIndex];
        const fileURL = URL.createObjectURL(videoFile);
        videoElement.src = fileURL;

        videoElement.addEventListener("loadedmetadata", () => {
            const videoDuration = videoElement.duration;

            if (!isFinite(videoDuration) || isNaN(videoDuration)) {
                console.error("Invalid video duration:", videoDuration);
                return;
            }

            // Calculate random clip length
            let minClipLength = (videoDuration * minClipLengthPercent) / 100;
            let maxClipLength = (videoDuration * maxClipLengthPercent) / 100;
            let clipLength = Math.random() * (maxClipLength - minClipLength) + minClipLength;

            // Ensure clip doesn't exceed available time
            if (totalTimePlayed + clipLength > finalVideoLength) {
                clipLength = finalVideoLength - totalTimePlayed;
            }

            // Select a random start time for the clip
            let clipStartTime = Math.random() * (videoDuration - clipLength);
            let clipEndTime = clipStartTime + clipLength;

            console.log(`🎬 Playing clip from ${clipStartTime.toFixed(2)}s to ${clipEndTime.toFixed(2)}s`);

            videoElement.currentTime = clipStartTime;
            videoElement.play();

            // Update total time played
            totalTimePlayed += clipLength;

            setTimeout(() => {
                videoElement.pause();
                playNextClip();
            }, clipLength * 1000);
        });

        videoElement.load();
    }
});
