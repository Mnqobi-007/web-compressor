// ===== DOM REFERENCES =====
const imgTab = document.getElementById("imgTab");
const zipTab = document.getElementById("zipTab");
const vidTab = document.getElementById("vidTab");

const imageSection = document.getElementById("imageSection");
const zipSection = document.getElementById("zipSection");
const videoSection = document.getElementById("videoSection");

// ===== TAB SWITCHING =====
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

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    imgStatus.textContent = `📎 ${file.name} (${(file.size/1024).toFixed(1)} KB)`;
    preview.style.display = "none";
    downloadImage.style.display = "none";
  }
});

compressImageBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    imgStatus.textContent = "⚠️ Please select an image first.";
    return;
  }

  imgStatus.textContent = "⏳ Compressing...";
  preview.style.display = "none";
  downloadImage.style.display = "none";

  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: file.type,
    };
    const compressed = await imageCompression(file, options);
    const url = URL.createObjectURL(compressed);

    preview.src = url;
    preview.style.display = "block";

    downloadImage.href = url;
    downloadImage.download = "compressed_" + file.name;
    downloadImage.style.display = "inline-block";
    downloadImage.textContent = "📥 Download Compressed Image";

    const origSize = (file.size / 1024).toFixed(1);
    const compSize = (compressed.size / 1024).toFixed(1);
    const saved = ((1 - compressed.size / file.size) * 100).toFixed(0);
    imgStatus.textContent = `✅ ${origSize} KB → ${compSize} KB (saved ${saved}%)`;
  } catch (err) {
    console.error(err);
    imgStatus.textContent = "❌ Error compressing image.";
  }
});

// ===== ZIP CREATION =====
const zipInput = document.getElementById("zipFiles");
const createZipBtn = document.getElementById("createZipBtn");
const zipStatus = document.getElementById("zipStatus");
const downloadZip = document.getElementById("downloadZip");

zipInput.addEventListener("change", () => {
  const count = zipInput.files.length;
  zipStatus.textContent = count ? `📎 ${count} file(s) selected` : "";
  downloadZip.style.display = "none";
});

createZipBtn.addEventListener("click", async () => {
  const files = zipInput.files;
  if (!files.length) {
    zipStatus.textContent = "⚠️ Please select files first.";
    return;
  }

  zipStatus.textContent = "⏳ Creating ZIP...";
  downloadZip.style.display = "none";

  const zip = new JSZip();
  for (let f of files) {
    zip.file(f.name, await f.arrayBuffer());
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  downloadZip.href = url;
  downloadZip.download = "archive.zip";
  downloadZip.style.display = "inline-block";
  downloadZip.textContent = `📥 Download ZIP (${(blob.size/1024).toFixed(1)} KB)`;
  zipStatus.textContent = `✅ ZIP created with ${files.length} file(s)`;
});

// ===== VIDEO COMPRESSION =====
const videoInput = document.getElementById("videoInput");
const compressVideoBtn = document.getElementById("compressVideoBtn");
const vidStatus = document.getElementById("vidStatus");
const downloadVideo = document.getElementById("downloadVideo");
const videoPreview = document.getElementById("videoPreview");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

let ffmpeg = null;
let ffmpegLoaded = false;

videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (file) {
    vidStatus.textContent = `📎 ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`;
    videoPreview.style.display = "none";
    downloadVideo.style.display = "none";
    // Show preview of original video
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    videoPreview.style.display = "block";
  }
});

async function loadFFmpeg() {
  if (ffmpegLoaded) return;
  
  vidStatus.textContent = "⏳ Loading FFmpeg (may take a moment)...";
  
  try {
    // Check if FFmpeg is available
    if (typeof FFmpeg === 'undefined') {
      throw new Error("FFmpeg library not loaded. Please check your internet connection.");
    }
    
    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpeg = createFFmpeg({
      log: true,
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    });
    
    ffmpeg.setProgress(({ ratio }) => {
      progressContainer.style.display = 'block';
      const percent = Math.min(ratio * 100, 100).toFixed(1);
      progressBar.style.width = percent + '%';
      vidStatus.textContent = `⏳ Compressing... ${percent}%`;
    });
    
    await ffmpeg.load();
    ffmpegLoaded = true;
    vidStatus.textContent = "✅ FFmpeg loaded. Ready to compress.";
  } catch (err) {
    console.error(err);
    vidStatus.textContent = "❌ Failed to load FFmpeg. Please try again.";
    throw err;
  }
}

compressVideoBtn.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) {
    vidStatus.textContent = "⚠️ Please select a video first.";
    return;
  }

  try {
    // Load FFmpeg if not loaded
    await loadFFmpeg();
    
    // Check if file is MP4
    if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
      vidStatus.textContent = "⚠️ Please select an MP4 video.";
      return;
    }

    // Check file size (warn if > 50MB)
    if (file.size > 50 * 1024 * 1024) {
      vidStatus.textContent = "⚠️ Large file detected. Compression may take a while.";
    }

    vidStatus.textContent = "⏳ Starting compression...";
    downloadVideo.style.display = "none";
    progressBar.style.width = '0%';
    progressContainer.style.display = 'block';

    const { fetchFile } = FFmpeg;
    
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

    // Clean up
    ffmpeg.FS('unlink', 'input.mp4');
    ffmpeg.FS('unlink', 'output.mp4');

    videoPreview.src = url;
    videoPreview.style.display = 'block';

    downloadVideo.href = url;
    downloadVideo.download = 'compressed_' + file.name;
    downloadVideo.style.display = 'inline-block';
    downloadVideo.textContent = `📥 Download Video (${(blob.size/1024/1024).toFixed(1)} MB)`;

    const saved = ((1 - blob.size / file.size) * 100).toFixed(0);
    vidStatus.textContent = `✅ Compression complete! Saved ${saved}%`;
    progressBar.style.width = '100%';
    
  } catch (err) {
    console.error(err);
    vidStatus.textContent = "❌ Compression failed. The video may be too large or incompatible.";
    progressContainer.style.display = 'none';
  }
});
