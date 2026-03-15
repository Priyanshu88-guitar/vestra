/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Camera Module (camera.js)
 * Manages device camera access via MediaDevices API,
 * photo capture, and file upload preview.
 * ═══════════════════════════════════════════════════════
 */

// ─── STATE ───
let mediaStream       = null;  // Active MediaStream
let capturedImageBlob = null;  // Blob from camera capture
let capturedImageFile = null;  // File object for upload
let usingFrontCamera  = false; // Track which camera facing mode

/* ═══════════════════════════════════════════════════════
   OPEN CAMERA
   ═══════════════════════════════════════════════════════ */
async function openCamera() {
  const video          = document.getElementById('cameraVideo');
  const preview        = document.getElementById('imagePreview');
  const placeholder    = document.getElementById('previewPlaceholder');
  const openBtn        = document.getElementById('openCameraBtn');
  const captureBtn     = document.getElementById('captureBtn');
  const stopBtn        = document.getElementById('stopCameraBtn');
  const switchRow      = document.getElementById('cameraSwitchRow');
  const uploadLabel    = document.querySelector('.btn-upload');

  // Check browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera not supported in this browser.', 'error');
    return;
  }

  try {
    // Request camera access
    const constraints = {
      video: {
        facingMode: usingFrontCamera ? 'user' : 'environment',
        width:  { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Attach stream to video element
    video.srcObject = mediaStream;
    video.play();

    // Update UI: show video, hide placeholder/preview, show capture/stop
    placeholder.classList.add('hidden');
    preview.classList.add('hidden');
    video.classList.remove('hidden');

    openBtn.classList.add('hidden');
    uploadLabel.classList.add('hidden');
    captureBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    switchRow.classList.remove('hidden');

    document.getElementById('imagePreviewArea').classList.remove('has-image');

    showToast('Camera ready! Position your clothing item and capture.', 'success');

  } catch (err) {
    handleCameraError(err);
  }
}

/* ═══════════════════════════════════════════════════════
   CAPTURE PHOTO
   ═══════════════════════════════════════════════════════ */
function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  if (!video || video.classList.contains('hidden')) return;

  // Draw video frame to a canvas
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  // Mirror if using front camera
  if (usingFrontCamera) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Flash animation
  const flash = document.getElementById('captureFlash');
  flash.classList.remove('hidden');
  setTimeout(() => flash.classList.add('hidden'), 350);

  // Convert canvas to Blob
  canvas.toBlob((blob) => {
    capturedImageBlob = blob;
    capturedImageFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

    // Show preview
    const preview = document.getElementById('imagePreview');
    preview.src = URL.createObjectURL(blob);

    // Stop camera and switch to preview
    stopCameraStream();
    showPreviewState(preview);
    showToast('Photo captured! ✓', 'success');

  }, 'image/jpeg', 0.92);
}

/* ═══════════════════════════════════════════════════════
   STOP CAMERA
   ═══════════════════════════════════════════════════════ */
function stopCamera() {
  stopCameraStream();

  const preview     = document.getElementById('imagePreview');
  const placeholder = document.getElementById('previewPlaceholder');
  const video       = document.getElementById('cameraVideo');

  if (!capturedImageFile && !document.getElementById('fileInput').files.length) {
    // Nothing captured – reset to placeholder
    video.classList.add('hidden');
    placeholder.classList.remove('hidden');
    document.getElementById('imagePreviewArea').classList.remove('has-image');
  } else {
    // Keep showing the captured preview
    showPreviewState(preview);
  }

  resetCameraButtons();
}

/** Internal: halts all camera tracks */
function stopCameraStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  const video = document.getElementById('cameraVideo');
  if (video) {
    video.srcObject = null;
    video.classList.add('hidden');
  }
}

/* ═══════════════════════════════════════════════════════
   SWITCH CAMERA (front / back)
   ═══════════════════════════════════════════════════════ */
async function switchCamera() {
  usingFrontCamera = !usingFrontCamera;
  stopCameraStream();
  await openCamera();
}

/* ═══════════════════════════════════════════════════════
   HANDLE FILE UPLOAD
   ═══════════════════════════════════════════════════════ */
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file.', 'warning');
    return;
  }

  // Max size 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('Image too large. Maximum size is 10MB.', 'warning');
    return;
  }

  // Clear any camera capture
  capturedImageFile = null;
  capturedImageBlob = null;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('imagePreview');
    preview.src   = e.target.result;
    showPreviewState(preview);
    stopCameraStream();
    resetCameraButtons();
  };
  reader.readAsDataURL(file);
}

/* ═══════════════════════════════════════════════════════
   CLEAR IMAGE
   ═══════════════════════════════════════════════════════ */
function clearImage() {
  capturedImageBlob = null;
  capturedImageFile = null;

  // Reset file input
  const fileInput = document.getElementById('fileInput');
  fileInput.value = '';

  // Stop camera if running
  stopCameraStream();

  // Reset preview area
  const preview     = document.getElementById('imagePreview');
  const placeholder = document.getElementById('previewPlaceholder');

  preview.src = '';
  preview.classList.add('hidden');
  placeholder.classList.remove('hidden');
  document.getElementById('imagePreviewArea').classList.remove('has-image');

  resetCameraButtons();
  document.getElementById('clearImageBtn').classList.add('hidden');
}

/* ─── UI HELPERS ─── */

function showPreviewState(previewEl) {
  document.getElementById('previewPlaceholder').classList.add('hidden');
  document.getElementById('cameraVideo').classList.add('hidden');
  previewEl.classList.remove('hidden');
  document.getElementById('imagePreviewArea').classList.add('has-image');
  document.getElementById('clearImageBtn').classList.remove('hidden');
  resetCameraButtons();
}

function resetCameraButtons() {
  const openBtn    = document.getElementById('openCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const stopBtn    = document.getElementById('stopCameraBtn');
  const switchRow  = document.getElementById('cameraSwitchRow');
  const uploadLabel = document.querySelector('.btn-upload');

  openBtn.classList.remove('hidden');
  uploadLabel.classList.remove('hidden');
  captureBtn.classList.add('hidden');
  stopBtn.classList.add('hidden');
  switchRow.classList.add('hidden');
}

/**
 * Returns the current image file to submit:
 * Prefers captured blob over file input selection.
 */
function getCurrentImageFile() {
  if (capturedImageFile) return capturedImageFile;
  const fileInput = document.getElementById('fileInput');
  if (fileInput.files && fileInput.files[0]) return fileInput.files[0];
  return null;
}

/* ─── CAMERA ERROR HANDLER ─── */
function handleCameraError(err) {
  console.error('Camera error:', err);
  let msg = 'Could not access camera.';
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    msg = 'Camera access denied. Please allow camera permissions in your browser settings.';
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    msg = 'No camera found on this device.';
  } else if (err.name === 'NotSupportedError') {
    msg = 'Camera not supported. Try using HTTPS.';
  } else if (err.name === 'OverconstrainedError') {
    msg = 'Camera constraints not supported. Trying default settings…';
    // Retry with minimal constraints
    openCameraFallback();
    return;
  }
  showToast(msg, 'error');
}

async function openCameraFallback() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const video = document.getElementById('cameraVideo');
    video.srcObject = mediaStream;
    video.play();
    document.getElementById('previewPlaceholder').classList.add('hidden');
    video.classList.remove('hidden');
    document.getElementById('openCameraBtn').classList.add('hidden');
    document.getElementById('captureBtn').classList.remove('hidden');
    document.getElementById('stopCameraBtn').classList.remove('hidden');
  } catch (e) {
    showToast('Unable to access camera device.', 'error');
  }
}

/* ─── COLOR DOT UPDATER ─── */
function updateColorDot() {
  const select   = document.getElementById('itemColor');
  const dot      = document.getElementById('colorDot');
  const colorVal = getColorValue(select.value);
  if (colorVal.startsWith('linear-gradient')) {
    dot.style.background = colorVal;
  } else {
    dot.style.background = colorVal;
  }
  dot.style.borderColor = colorVal === '#f5f5f5' ? '#ccc' : colorVal;
}
