/**
 * OPERATOR AUTO-CAPTURE PAGE
 * Automatically detects and captures pallet tickets
 */

// Global state
let video = null;
let canvas = null;
let stream = null;
let isProcessing = false;
let lastSubmissionHash = null;
let lastSubmissionTime = 0;
let frameCount = 0;

// Configuration
const FRAME_SAMPLE_INTERVAL = 800; // ms between frame samples
const COOLDOWN_PERIOD = 30000; // 30 seconds between submissions
const SHARPNESS_THRESHOLD = 50; // Minimum sharpness for capture
const TEXT_DENSITY_THRESHOLD = 0.1; // Minimum text density

/**
 * Initialize camera on page load
 */
window.onload = function() {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  
  updateStatus('scanning', 'Scanning for pallet ticket...');
  startCamera();
};

/**
 * Start camera stream
 */
async function startCamera() {
  try {
    const constraints = {
      video: {
        facingMode: 'environment', // Use back camera on mobile
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };
    
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      video.play();
      // Start frame sampling after video starts
      setTimeout(startFrameSampling, 1000);
    };
  } catch (error) {
    console.error('Camera error:', error);
    updateStatus('error', 'Camera access denied. Please allow camera permissions.');
  }
}

/**
 * Start automatic frame sampling
 */
function startFrameSampling() {
  setInterval(() => {
    if (!isProcessing) {
      sampleFrame();
    }
  }, FRAME_SAMPLE_INTERVAL);
}

/**
 * Sample current frame and analyze
 */
function sampleFrame() {
  if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
    return;
  }
  
  frameCount++;
  
  // Set canvas dimensions
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // Draw current frame to canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Analyze frame
  analyzeFrame(canvas);
}

/**
 * Analyze frame for ticket detection
 */
function analyzeFrame(canvas) {
  const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  
  // Calculate sharpness (Laplacian variance)
  const sharpness = calculateSharpness(imageData);
  
  // Calculate text density (edge density)
  const textDensity = calculateTextDensity(imageData);
  
  // Check cooldown
  const now = Date.now();
  const timeSinceLastSubmission = now - lastSubmissionTime;
  
  if (timeSinceLastSubmission < COOLDOWN_PERIOD) {
    return; // Still in cooldown
  }
  
  // Check thresholds
  if (sharpness < SHARPNESS_THRESHOLD) {
    return; // Image not sharp enough
  }
  
  if (textDensity < TEXT_DENSITY_THRESHOLD) {
    return; // Not enough text detected
  }
  
  // Calculate frame hash for duplicate detection
  const frameHash = calculateFrameHash(imageData);
  if (frameHash === lastSubmissionHash) {
    return; // Duplicate frame
  }
  
  // All conditions met - capture and process
  captureAndProcess(canvas, frameHash);
}

/**
 * Calculate image sharpness using Laplacian variance
 */
function calculateSharpness(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let variance = 0;
  let mean = 0;
  let samples = 0;
  
  // Sample every 10th pixel for performance
  for (let y = 1; y < height - 1; y += 10) {
    for (let x = 1; x < width - 1; x += 10) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Calculate Laplacian (second derivative approximation)
      const nextIdx = (y * width + (x + 1)) * 4;
      const prevIdx = (y * width + (x - 1)) * 4;
      const nextGray = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
      const prevGray = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
      
      const laplacian = Math.abs(nextGray + prevGray - 2 * gray);
      mean += laplacian;
      samples++;
    }
  }
  
  if (samples === 0) return 0;
  
  mean /= samples;
  
  // Calculate variance
  for (let y = 1; y < height - 1; y += 10) {
    for (let x = 1; x < width - 1; x += 10) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      const nextIdx = (y * width + (x + 1)) * 4;
      const prevIdx = (y * width + (x - 1)) * 4;
      const nextGray = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
      const prevGray = (data[prevIdx] + data[prevIdx + 1] + data[prevIdx + 2]) / 3;
      
      const laplacian = Math.abs(nextGray + prevGray - 2 * gray);
      variance += Math.pow(laplacian - mean, 2);
    }
  }
  
  return variance / samples;
}

/**
 * Calculate text density (edge density)
 */
function calculateTextDensity(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  let edges = 0;
  let total = 0;
  
  // Sample for performance
  for (let y = 2; y < height - 2; y += 5) {
    for (let x = 2; x < width - 2; x += 5) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      // Check horizontal gradient
      const nextIdx = (y * width + (x + 1)) * 4;
      const nextGray = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
      
      if (Math.abs(gray - nextGray) > 30) {
        edges++;
      }
      
      total++;
    }
  }
  
  return total > 0 ? edges / total : 0;
}

/**
 * Calculate simple hash of frame for duplicate detection
 */
function calculateFrameHash(imageData) {
  const data = imageData.data;
  let hash = 0;
  
  // Sample pixels for hash
  for (let i = 0; i < data.length; i += 40) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
}

/**
 * Capture frame and process
 */
function captureAndProcess(canvas, frameHash) {
  if (isProcessing) {
    return;
  }
  
  isProcessing = true;
  lastSubmissionHash = frameHash;
  lastSubmissionTime = Date.now();
  
  // Show detection overlay
  const overlay = document.getElementById('detection-overlay');
  overlay.classList.add('active');
  
  updateStatus('detecting', 'Ticket detected — processing...');
  
  // Convert canvas to base64
  const imageData = canvas.toDataURL('image/png');
  
  // Submit to backend
  submitTicket(imageData);
}

/**
 * Submit ticket to backend
 */
function submitTicket(imageData) {
  updateStatus('processing', 'Running OCR and parsing data...');
  
  google.script.run
    .withSuccessHandler(onSubmitSuccess)
    .withFailureHandler(onSubmitError)
    .submitCapturedTicket(imageData, {
      timestamp: new Date().toISOString(),
      frameHash: lastSubmissionHash
    });
}

/**
 * Handle successful submission
 */
function onSubmitSuccess(response) {
  if (response.success) {
    updateStatus('success', 'Submitted for supervisor review ✓');
    
    // Hide detection overlay
    const overlay = document.getElementById('detection-overlay');
    overlay.classList.remove('active');
    
    // Reset after 3 seconds
    setTimeout(() => {
      updateStatus('scanning', 'Ready for next pallet');
      isProcessing = false;
      
      setTimeout(() => {
        updateStatus('scanning', 'Scanning for pallet ticket...');
      }, 2000);
    }, 3000);
  } else {
    onSubmitError(response.error || 'Submission failed');
  }
}

/**
 * Handle submission error
 */
function onSubmitError(error) {
  console.error('Submission error:', error);
  updateStatus('error', 'Error: ' + error);
  
  const overlay = document.getElementById('detection-overlay');
  overlay.classList.remove('active');
  
  // Reset after 5 seconds
  setTimeout(() => {
    updateStatus('scanning', 'Scanning for pallet ticket...');
    isProcessing = false;
  }, 5000);
}

/**
 * Update status banner
 */
function updateStatus(type, message) {
  const banner = document.getElementById('status-banner');
  banner.className = type;
  banner.textContent = message;
}

/**
 * Cleanup on page unload
 */
window.onbeforeunload = function() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};


