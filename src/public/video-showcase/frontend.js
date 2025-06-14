// script.js - Dynamic video loading functionality

// Award badge configurations
const AWARD_CONFIG = {
  first: {
    badge: '一等奖',
    badgeClass: 'award-badge-first'
  },
  second: {
    badge: '二等奖',
    badgeClass: 'award-badge-second'
  },
  third: {
    badge: '三等奖',
    badgeClass: 'award-badge-third'
  }
};

// Function to create a video card HTML
function createVideoCard(video) {
  const awardConfig = AWARD_CONFIG[video.prizeType];
  
  return `
    <div class="video-card" data-video-id="${video.id}">
      <div class="video-thumbnail">
        <img src="${video.thumbnailUrl}" alt="${video.title}缩略图">
        <div class="overlay">
          <span class="play-icon"></span>
        </div>
      </div>
      <div class="video-info">
        <h4 class="video-title">${video.title}</h4>
        <div class="video-details">
          <p class="video-school">学校：${video.school}</p>
          <p class="video-author">作者：${video.author}</p>
          <span class="award-badge ${awardConfig.badgeClass}">${awardConfig.badge}</span>
        </div>
      </div>
    </div>
  `;
}

// Function to load videos for a specific prize section
async function loadVideosForSection(prizeType) {
  try {
    const response = await fetch(`/api/videos/${prizeType}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const videos = await response.json();
    const sectionId = `${prizeType}-prize`;
    const videoGrid = document.querySelector(`#${sectionId} .video-grid`);
    
    if (!videoGrid) {
      console.error(`Video grid not found for section: ${sectionId}`);
      return;
    }
    
    // Clear existing static content
    videoGrid.innerHTML = '';
    
    if (videos.length === 0) {
      videoGrid.innerHTML = '<p class="no-videos">暂无视频内容</p>';
      return;
    }
    
    // Add video cards
    videos.forEach(video => {
      videoGrid.innerHTML += createVideoCard(video);
    });
    
    // Add click event listeners for video playback
    addVideoClickListeners(videoGrid);
    
  } catch (error) {
    console.error(`Error loading videos for ${prizeType}:`, error);
    const videoGrid = document.querySelector(`#${prizeType}-prize .video-grid`);
    if (videoGrid) {
      videoGrid.innerHTML = '<p class="error-message">加载视频时出错，请稍后重试</p>';
    }
  }
}

// Function to add click event listeners for video cards
function addVideoClickListeners(container) {
  const videoCards = container.querySelectorAll('.video-card');
  
  videoCards.forEach(card => {
    const overlay = card.querySelector('.overlay');
    const videoId = card.dataset.videoId;
    
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      openVideoModal(videoId, card);
    });
  });
}

// Function to open video modal
function openVideoModal(videoId, cardElement) {
  const modal = document.getElementById('video-modal');
  const video = document.getElementById('modal-video');
  const videoSource = video.querySelector('source');
  const title = document.getElementById('modal-video-title');
  const school = document.getElementById('modal-video-school');
  const author = document.getElementById('modal-video-author');
  const badge = document.getElementById('modal-video-badge');
  
  // Get video information from the card
  const videoTitle = cardElement.querySelector('.video-title').textContent;
  const videoSchool = cardElement.querySelector('.video-school').textContent;
  const videoAuthor = cardElement.querySelector('.video-author').textContent;
  const videoBadge = cardElement.querySelector('.award-badge');
  
  // Set video source with proper file extension
  videoSource.src = `videos/${videoId}.mp4`;
  video.load();
  
  // Set video information
  title.textContent = videoTitle;
  school.textContent = videoSchool;
  author.textContent = videoAuthor;
  
  // Set badge if exists
  if (videoBadge) {
    badge.textContent = videoBadge.textContent;
    badge.className = videoBadge.className;
  } else {
    badge.textContent = '';
    badge.className = '';
  }
  
  // Show modal
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to close video modal
function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  const video = document.getElementById('modal-video');
  
  // Hide modal
  modal.classList.remove('show');
  document.body.style.overflow = ''; // Restore scrolling
  
  // Pause and reset video
  video.pause();
  video.currentTime = 0;
}

// Initialize modal event listeners
function initializeModalListeners() {
  const modal = document.getElementById('video-modal');
  const closeBtn = document.querySelector('.video-modal-close');
  
  // Close modal when clicking close button
  closeBtn.addEventListener('click', closeVideoModal);
  
  // Close modal when clicking outside the content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeVideoModal();
    }
  });
  
  // Close modal when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeVideoModal();
    }
  });
}

// Function to load all videos
async function loadAllVideos() {
  try {
    // Show loading state
    showLoadingState();
    
    // Load videos for each prize category
    await Promise.all([
      loadVideosForSection('first'),
      loadVideosForSection('second'),
      loadVideosForSection('third')
    ]);
    
    // Hide loading state
    hideLoadingState();
    
  } catch (error) {
    console.error('Error loading videos:', error);
    hideLoadingState();
  }
}

// Function to show loading state
function showLoadingState() {
  const videoGrids = document.querySelectorAll('.video-grid');
  videoGrids.forEach(grid => {
    grid.innerHTML = '<div class="loading">正在加载视频...</div>';
  });
}

// Function to hide loading state
function hideLoadingState() {
  // Loading state will be replaced by actual content or error messages
  // This function is called when loading is complete
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing dynamic video loading...');
  loadAllVideos();
  initializeModalListeners();
});

// Export functions for potential external use
window.VideoLoader = {
  loadAllVideos,
  loadVideosForSection,
  createVideoCard
};