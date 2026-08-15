/* ============================================================
   WEB COMPRESSOR PRO - JAVASCRIPT
   ============================================================ */

// ===== DOM REFERENCES =====
const imgTab = document.getElementById("imgTab");
const zipTab = document.getElementById("zipTab");
const vidTab = document.getElementById("vidTab");

const imageSection = document.getElementById("imageSection");
const zipSection = document.getElementById("zipSection");
const videoSection = document.getElementById("videoSection");

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ===== FORMAT FILE SIZE =====
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ===== TAB SWITCHING =====
function switchTab(activeTab, showSection) {
  [imgTab, zipTab, vidTab].forEach(t => t.classList.remove("active"));
  activeTab.classList.add("active");
  [imageSection, zipSection, videoSection].forEach(s => s.classList.add("hidden"));
  showSection.classList.remove("hidden");
}

imgTab.addEventListener("click", () => switchTab(imgTab, imageSection));
zipTab.addEventListener("click", () => switchTab(zipTab, zipSection));
vidTab.addEventListener("click", () => switchTab(vidTab, videoSection));

// ===== CLEAR BUTTON HELPER =====
function addClearButton(sectionId, inputId, statusId, previewId, downloadId) {
  const section = document.getElementById(sectionId);
  const existingClear = section.querySelector('.btn-clear');
  if (existingClear) existingClear.remove();

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-clear';
  clearBtn.textContent = '🗑️ Clear';
  clearBtn.type = 'button';

  clearBtn.addEventListener('click', () => {
    document.getElementById(inputId).value = '';
    document.getElementById(statusId).textContent = '';

    if (previewId) {
      const preview = document.getElementById(previewId);
      preview.style.display = 'none';
      preview.src = '';
    }
    if (downloadId) {
      const download = document.getElementById(downloadId);
      download.style.display = 'none';
      download.href = '';
    }

    // Reset stats
    const section = document.getElementById(sectionId);
    const stats = section.querySelectorAll('.stat-badge span');
    stats.forEach(el => el.textContent = '-');

    // Reset video progress
    if (sectionId === 'videoSection') {
      document.getElementById('progress-container').style.display = 'none';
      document.getElementById('progress-bar').style.width = '0%';
    }

    showToast('Cleared!', 'info');
  });

  section.appendChild(clearBtn);
}

// ============================================================
// IMAGE COMPRESSION
// ============================================================
const imageInput = document.getElementById("imageInput");
const compressImageBtn = document.getElementById("compressImageBtn");
const preview = document.getElementById("preview");
const imgStatus = document.getElementById("imgStatus");
const downloadImage = document.getElementById("downloadImage");

// File info update
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    imgStatus.textContent = `📎 ${file.name} (${formatSize(file.size)})`;
    document.getElementById('imgOrigSize').textContent = formatSize(file.size);
    document.getElementById('imgCompSize').textContent = '-';
    document.getElementById('imgSaved').textContent = '-';
    preview.style.display = "none";
    downloadImage.style.display = "none";
  } else {
    imgStatus.textContent = '';
    document.getElementById('imgOrigSize').textContent = '-';
  }
});

// Clear button
addClearButton('imageSection', 'imageInput', 'imgStatus', 'preview', 'downloadImage');

compressImageBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    showToast("Please select an image first!", "error");
    return;
  }

  document.getElementById('imgCompSize').textContent = '...';
  document.getElementById('imgSaved').textContent = '...';
  imgStatus.innerHTML = `<span class="spinner"></span> Compressing...`;
  preview.style.display = "none";
  downloadImage.style.display = "none";

  try {
    const quality = parseFloat(document.getElementById('imgQuality').value);
    const maxWidth = parseInt(document.getElementById('imgMaxWidth').value);

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      fileType: file.type,
      initialQuality: quality,
    };

    const compressed = await imageCompression(file, options);
    const url = URL.createObjectURL(compressed);

    preview.src = url;
    preview.style.display = "block";

    downloadImage.href = url;
    downloadImage.download = "compressed_" + file.name;
    downloadImage.style.display = "inline-block";
    downloadImage.textContent = `📥 Download (${formatSize(compressed.size)})`;

    document.getElementById('imgCompSize').textContent = formatSize(compressed.size);
    const saved = ((1 - compressed.size / file.size) * 100).toFixed(0);
    document.getElementById('imgSaved').textContent = saved + '%';

    imgStatus.textContent = `✅ Compression complete!`;
    showToast(`✅ Saved ${saved}% — ${formatSize(file.size)} → ${formatSize(compressed.size)}`, 'success');

  } catch (err) {
    console.error(err);
    imgStatus.textContent = "❌ Error compressing image.";
    document.getElementById('imgCompSize').textContent = '❌';
    showToast("❌ Compression failed. Try a different image.", "error");
  }
});

// ============================================================
// ZIP CREATION
// ============================================================
const zipInput = document.getElementById("zipFiles");
const createZipBtn = document.getElementById("createZipBtn");
const zipStatus = document.getElementById("zipStatus");
const downloadZip = document.getElementById("downloadZip");

// File info update
zipInput.addEventListener("change", () => {
  const files = zipInput.files;
  const count = files.length;
  document.getElementById('zipFileCount').textContent = count;

  if (count > 0) {
    let totalSize = 0;
    for (let f of files) totalSize += f.size;
    zipStatus.textContent = `📎 ${count} file(s) selected (${formatSize(totalSize)})`;
    document.getElementById('zipTotalSize').textContent = formatSize(totalSize);
    document.getElementById('zipSize').textContent = '-';
  } else {
    zipStatus.textContent = '';
    document.getElementById('zipTotalSize').textContent = '-';
    document.getElementById('zipSize').textContent = '-';
  }
  downloadZip.style.display = "none";
});

// Clear button
addClearButton('zipSection', 'zipFiles', 'zipStatus', null, 'downloadZip');

createZipBtn.addEventListener("click", async () => {
  const files = zipInput.files;
  if (!files.length) {
    showToast("Please select files first!", "error");
    return;
  }

  zipStatus.innerHTML = `<span class="spinner"></span> Creating ZIP...`;
  downloadZip.style.display = "none";
  document.getElementById('zipSize').textContent = '...';

  try {
    const zip = new JSZip();
    for (let f of files) {
      zip.file(f.name, await f.arrayBuffer());
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    downloadZip.href = url;
    downloadZip.download = "archive.zip";
    downloadZip.style.display = "inline-block";
    downloadZip.textContent = `📥 Download ZIP (${formatSize(blob.size)})`;

    document.getElementById('zipSize').textContent = formatSize(blob.size);
    zipStatus.textContent = `✅ ZIP created with ${files.length} file(s)`;
    showToast(`✅ ZIP created! ${formatSize(blob.size)}`, 'success');

  } catch (err) {
    console.error(err);
    zipStatus.textContent = "❌ Error creating ZIP.";
    document.getElementById('zipSize').textContent = '❌';
    showToast("❌ ZIP creation failed.", "error");
  }
});

// ============================================================
// VIDEO COMPRESSION
// ============================================================
const videoInput = document.getElementById("videoInput");
const compressVideoBtn = document.getElementById("compressVideoBtn");
const vidStatus = document.getElementById("vidStatus");
const downloadVideo = document.getElementById("downloadVideo");
const videoPreview = document.getElementById("videoPreview");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

let ffmpeg = null;
let ffmpegLoaded = false;

// File info update
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (file) {
    vidStatus.textContent = `📎 ${file.name} (${formatSize(file.size)})`;
    document.getElementById('vidOrigSize').textContent = formatSize(file.size);
    document.getElementById('vidCompSize').textContent = '-';
    document.getElementById('vidSaved').textContent = '-';
    videoPreview.style.display = "none";
    downloadVideo.style.display = "none";

    // Show preview of original video
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    videoPreview.style.display = "block";
  } else {
    vidStatus.textContent = '';
    document.getElementById('vidOrigSize').textContent = '-';
  }
});

// Clear button
addClearButton('videoSection', 'videoInput', 'vidStatus', 'videoPreview', 'downloadVideo');

async function loadFFmpeg() {
  if (ffmpegLoaded) return;

  vidStatus.innerHTML = `<span class="spinner"></span> Loading FFmpeg (may take a moment)...`;

  try {
    if (typeof FFmpeg === 'undefined') {
      throw new Error("FFmpeg library not loaded.");
    }

    const { createFFmpeg, fetchFile } = FFmpeg;
    ffmpeg = createFFmpeg({
      log: false,
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
    showToast("✅ FFmpeg loaded successfully!", "success");

  } catch (err) {
    console.error(err);
    vidStatus.textContent = "❌ Failed to load FFmpeg. Please refresh and try again.";
    showToast("❌ Failed to load FFmpeg.", "error");
    throw err;
  }
}

compressVideoBtn.addEventListener("click", async () => {
  const file = videoInput.files[0];
  if (!file) {
    showToast("Please select a video first!", "error");
    return;
  }

  // Check if MP4
  if (!file.type.includes('mp4') && !file.name.toLowerCase().endsWith('.mp4')) {
    showToast("Please select an MP4 video.", "error");
    return;
  }

  document.getElementById('vidCompSize').textContent = '...';
  document.getElementById('vidSaved').textContent = '...';

  try {
    await loadFFmpeg();

    if (file.size > 50 * 1024 * 1024) {
      vidStatus.textContent = "⏳ Large file detected. This may take a while...";
    }

    downloadVideo.style.display = "none";
    progressBar.style.width = '0%';
    progressContainer.style.display = 'block';

    const { fetchFile } = FFmpeg;

    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

    // Build command
    const cmd = ['-i', 'input.mp4'];

    // Half size option
    if (document.getElementById('vidHalfSize').checked) {
      cmd.push('-vf', 'scale=iw/2:ih/2');
    }

    // Quality
    const quality = parseFloat(document.getElementById('vidQuality').value);
    cmd.push('-b:v', quality + 'M');
    cmd.push('-preset', 'veryfast');

    // Audio
    if (document.getElementById('vidAudio').checked) {
      cmd.push('-c:a', 'copy');
    } else {
      cmd.push('-an');
    }

    cmd.push('output.mp4');

    await ffmpeg.run(...cmd);

    const data = ffmpeg.FS('readFile', 'output.mp4');
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    // Clean up
    try {
      ffmpeg.FS('unlink', 'input.mp4');
      ffmpeg.FS('unlink', 'output.mp4');
    } catch (e) { /* ignore */ }

    videoPreview.src = url;
    videoPreview.style.display = 'block';

    downloadVideo.href = url;
    downloadVideo.download = 'compressed_' + file.name;
    downloadVideo.style.display = 'inline-block';
    downloadVideo.textContent = `📥 Download (${formatSize(blob.size)})`;

    document.getElementById('vidCompSize').textContent = formatSize(blob.size);
    const saved = ((1 - blob.size / file.size) * 100).toFixed(0);
    document.getElementById('vidSaved').textContent = saved + '%';

    vidStatus.textContent = `✅ Compression complete!`;
    progressBar.style.width = '100%';
    showToast(`✅ Video compressed! Saved ${saved}%`, 'success');

  } catch (err) {
    console.error(err);
    vidStatus.textContent = "❌ Compression failed. Video may be too large or incompatible.";
    document.getElementById('vidCompSize').textContent = '❌';
    progressContainer.style.display = 'none';
    showToast("❌ Video compression failed.", "error");
  }
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', (e) => {
  // Ctrl+Enter to compress
  if (e.ctrlKey && e.key === 'Enter') {
    const activeTab = document.querySelector('.tabs .active');
    if (activeTab === imgTab) compressImageBtn.click();
    else if (activeTab === zipTab) createZipBtn.click();
    else if (activeTab === vidTab) compressVideoBtn.click();
  }

  // Escape to clear
  if (e.key === 'Escape') {
    const clearBtn = document.querySelector('.btn-clear');
    if (clearBtn) clearBtn.click();
  }
});

// ============================================================
// DRAG AND DROP SUPPORT
// ============================================================
document.querySelectorAll('.section').forEach(section => {
  const input = section.querySelector('input[type="file"]');
  if (!input) return;

  section.addEventListener('dragover', (e) => {
    e.preventDefault();
    section.style.borderColor = '#6366f1';
    section.style.background = '#eef2ff';
  });

  section.addEventListener('dragleave', () => {
    section.style.borderColor = '#e5e7eb';
    section.style.background = '#f8f9fa';
  });

  section.addEventListener('drop', (e) => {
    e.preventDefault();
    section.style.borderColor = '#e5e7eb';
    section.style.background = '#f8f9fa';

    const files = e.dataTransfer.files;
    if (files.length) {
      // Check if input accepts multiple files
      if (input.hasAttribute('multiple')) {
        const dt = new DataTransfer();
        for (let f of files) dt.items.add(f);
        input.files = dt.files;
      } else {
        input.files = files;
      }
      // Trigger change event
      input.dispatchEvent(new Event('change'));
      showToast(`📎 ${files.length} file(s) dropped!`, 'info');
    }
  });
});

// ============================================================
// CONSOLE TIP
// ============================================================
console.log('💡 Web Compressor Pro Tips:');
console.log('  • Ctrl+Enter → Compress');
console.log('  • Escape → Clear');
console.log('  • Drag & drop files onto sections');
console.log('  • All processing happens in your browser — nothing is uploaded!');
