document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const fileInput = document.getElementById("videoFiles");
    const videoElement = document.getElementById("videoPlayer");

    if (!startButton || !fileInput || !videoElement) {
        console.error("Error: One or more required elements are missing.");
        return;
    }

    let videoFiles = [];
    let currentVideoIndex = 0;
    let finalVideoLength = 10;
    let minClipLengthPercent = 25;
    let maxClipLengthPercent = 90;

    startButton.addEventListener("click", startEditing);

    function startEditing() {
        if (fileInput.files.length === 0) {
            console.error("No video files selected.");
            alert("Please select video files.");
            return;
        }

        videoFiles = Array.from(fileInput.files);
        finalVideoLength = parseFloat(document.getElementById("finalLength").value) || 10;
        minClipLengthPercent = parseFloat(document.getElementById("minClipLength").value) || 25;
        maxClipLengthPercent = parseFloat(document.getElementById("maxClipLength").value) || 90;

        console.log("Starting editing with:", {
            finalVideoLength,
            minClipLengthPercent,
            maxClipLengthPercent,
            videoFiles
        });

        currentVideoIndex = 0;
        videoElement.style.display = "block";
        playNextClip();
    }

    function playNextClip() {
        if (currentVideoIndex >= videoFiles.length) {
            console.log("All clips played.");
            return;
        }

        const videoFile = videoFiles[currentVideoIndex];
        const fileURL = URL.createObjectURL(videoFile);
        videoElement.src = fileURL;

        videoElement.addEventListener("loadedmetadata", () => {
            const videoDuration = videoElement.duration;

            if (!isFinite(videoDuration) || isNaN(videoDuration)) {
                console.error("Invalid video duration:", videoDuration);
                return;
            }

            const minClipLength = (videoDuration * minClipLengthPercent) / 100;
            const maxClipLength = (videoDuration * maxClipLengthPercent) / 100;

            if (!isFinite(minClipLength) || !isFinite(maxClipLength)) {
                console.error("Invalid clip length range:", minClipLength, maxClipLength);
                return;
            }

            const clipStartTime = Math.random() * (videoDuration - maxClipLength);
            const clipEndTime = Math.min(clipStartTime + maxClipLength, videoDuration);

            console.log(`Playing clip from ${clipStartTime.toFixed(2)}s to ${clipEndTime.toFixed(2)}s`);

            videoElement.currentTime = clipStartTime;
            videoElement.play();

            setTimeout(() => {
                videoElement.pause();
                currentVideoIndex++;
                playNextClip();
            }, (clipEndTime - clipStartTime) * 1000);
        });

        videoElement.load();
    }
});
