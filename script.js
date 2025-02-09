document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.createElement("video");
    videoElement.controls = true;
    videoElement.style.width = "100%";
    document.body.appendChild(videoElement);

    let videoFiles = [];
    let currentVideoIndex = 0;
    let finalVideoLength = 10; // Default final length in seconds
    let minClipLengthPercent = 25;
    let maxClipLengthPercent = 90;

    document.getElementById("startButton").addEventListener("click", startEditing);

    function startEditing() {
        const fileInput = document.querySelector("input[type='file']");
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
