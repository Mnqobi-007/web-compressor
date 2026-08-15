// ===== Tab Switching =====
const imgTab = document.getElementById("imgTab");
const zipTab = document.getElementById("zipTab");
const vidTab = document.getElementById("vidTab");

const imageSection = document.getElementById("imageSection");
const zipSection = document.getElementById("zipSection");
const videoSection = document.getElementById("videoSection");

function switchTab(activeTab, showSection) {
  [imgTab, zipTab, vidTab].forEach(t => t.classList.remove("active"));
  activeTab.classList.add("active");
  [imageSection, zipSection, videoSection].forEach(s => s.classList.add("hidden"));
  showSection.classList.remove("hidden");
}

imgTab.onclick = () => switchTab(imgTab, imageSection);
zipTab.onclick = () => switchTab(zipTab, zipSection);
vidTab.onclick = () => switchTab(vidTab, videoSection);

// ===== IMAGE COMPRESSION =====
const imageInput = document.getElementById("imageInput");
const compressImageBtn = document.getElementById("compressImageBtn");
const preview = document.getElementById("preview");
const imgStatus = document.getElementById("imgStatus");
const downloadImage = document.getElementById("downloadImage");

compressImageBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) return alert("Select an image!");

  imgStatus.textContent = "Compressing...";
  preview.style.display = "none";
  downloadImage.style.display = "none";

  try {
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
    const compressed = await imageCompression(file, options);
    const url = URL.createObjectURL(compressed);

    preview.src = url;
    preview.style.display = "block";

    downloadImage.href = url;
    downloadImage.download = "compressed_" + file.name;
    downloadImage.style.display = "inline";

    imgStatus.textContent = `Original: ${(file.size/1024).toFixed(1)} KB → Compressed: ${(compressed.size/1024).toFixed(1)} KB`;
  } catch(err) {
    console.error(err);
    imgStatus.textContent = "Error compressing image.";
  }
});

// ===== ZIP CREATION =====
const zipInput = document.getElementById("zipFiles");
const createZipBtn = document.getElementById("createZipBtn");
const zipStatus = document.getElementById("zipStatus");
const downloadZip = document.getElementById("downloadZip");

createZipBtn.addEventListener("click", async () => {
  const files = zipInput.files;
  if (!files.length) return alert("Select files!");

  zipStatus.textContent = "Creating ZIP...";
  downloadZip.style.display = "none";

  const zip = new JSZip();
  for (let f of files) {
    zip.file(f.name, await f.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  downloadZip.href = url;
  downloadZip.download = "files.zip";
  downloadZip.style.display = "inline";
  zipStatus.textContent = `ZIP created (${(blob.size/1024).toFixed(1)} KB)`;
});

// ===== VIDEO COMPRESSION =====
const videoInput = document.getElementById("videoInput");
const compressVideoBtn = document.getElementById("compressVideoBtn");
const vidStatus = document.getElementById("vidStatus");
const downloadVideo = document.getElementById("downloadVideo");
const videoPreview = document.getElementById("videoPreview");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  console.log("FFmpeg loaded");
})();

ffmpeg.setProgress(({ ratio }) => {
  progressContainer.style.display = 'block';
  const percent = Math.min(ratio*100, 100).toFixed(1);
  progressBar.style.width = percent + '%';
  vidStatus.textContent = `Compressing... ${percent}%`;
});

compressVideoBtn.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) return alert("Select a video!");

  vidStatus.textContent = "Starting compression...";
  downloadVideo.style.display = "none";
  videoPreview.style.display = "none";
  progressBar.style.width = '0%';

  try {
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));
    await ffmpeg.run(
      '-i', 'input.mp4',
      '-vf', 'scale=iw/2:ih/2',
      '-b:v', '1M',
      '-preset', 'veryfast',
      '-c:a', 'copy',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    videoPreview.src = url;
    videoPreview.style.display = 'block';

    downloadVideo.href = url;
    downloadVideo.download = 'compressed_' + file.name;
    downloadVideo.style.display = 'inline';
    downloadVideo.textContent = 'Download Compressed Video';

    vidStatus.textContent = `Compression complete!`;
  } catch(err) {
    console.error(err);
    vidStatus.textContent = 'Compression failed.';
  }
});
