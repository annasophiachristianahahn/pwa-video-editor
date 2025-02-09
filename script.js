const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const videoInput = document.getElementById("videoInput");
const startEditingButton = document.getElementById("startEditing");
const downloadButton = document.getElementById("downloadVideo");
const finalEditSecondsInput = document.getElementById("finalEditSeconds");
const minClipInput = document.getElementById("minClipLength");
const maxClipInput = document.getElementById("maxClipLength");

let mediaRecorder;
let recordedChunks = [];

startEditingButton.addEventListener("click", startEditing);
downloadButton.addEventListener("click", downloadFinalVideo);

function startEditing() {
    const files = videoInput.files;
    if (files.length === 0) {
        alert("Please select video files first.");
        return;
    }

    const finalDuration = parseInt(finalEditSecondsInput.value);
    const minClipPercentage = parseInt(minClipInput.value) / 100;
    const maxClipPercentage = parseInt(maxClipInput.value) / 100;

    const selectedVideos = [...files].map(file => {
        const video = document.createElement("video");
        video.src = URL.createObjectURL(file);
        video.muted = true;
        return video;
    });

    recordedChunks = [];
    const stream = canvas.captureStream(30);
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorder.ondataavailable = (event) => recordedChunks.push(event.data);
    mediaRecorder.onstop = () => downloadButton.style.display = "block";
    mediaRecorder.start();

    let totalTime = 0;
    let currentVideoIndex = 0;

    function playNextClip() {
        if (totalTime >= finalDuration) {
            mediaRecorder.stop();
            return;
        }

        const video = selectedVideos[currentVideoIndex];
        const duration = video.duration;
        const minClipLength = duration * minClipPercentage;
        const maxClipLength = duration * maxClipPercentage;

        const clipLength = Math.random() * (maxClipLength - minClipLength) + minClipLength;
        const startTime = Math.random() * (duration - clipLength);

        video.currentTime = startTime;
        video.play();

        video.onplay = () => {
            const drawFrame = () => {
                if (!video.paused && !video.ended) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawFrame);
                }
            };
            drawFrame();
        };

        setTimeout(() => {
            video.pause();
            totalTime += clipLength;
            currentVideoIndex = Math.floor(Math.random() * selectedVideos.length);
            playNextClip();
        }, clipLength * 1000);
    }

    playNextClip();
}

function downloadFinalVideo() {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "final_video.webm";
    a.click();
}