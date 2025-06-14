const express = require('express');
const path = require('path');
const videoService = require('../services/videoService');
const config = require('../config/config');

const router = express.Router();

// API endpoint to get all videos
router.get('/videos', async (req, res) => {
  try {
    const groupedVideos = await videoService.getAllVideos();
    res.json(groupedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// API endpoint to get videos by prize type
router.get('/videos/:prizeType', async (req, res) => {
  const { prizeType } = req.params;
  
  try {
    const filteredVideos = await videoService.getVideosByPrizeType(prizeType);
    res.json(filteredVideos);
  } catch (error) {
    if (error.message === 'Invalid prize type') {
      return res.status(400).json({ error: 'Invalid prize type' });
    }
    console.error(`Error fetching ${prizeType} prize videos:`, error);
    res.status(500).json({ error: `Failed to fetch ${prizeType} prize videos` });
  }
});

// API endpoint to get thumbnail for a video
router.get('/thumbnail/:videoId', async (req, res) => {
  const { videoId } = req.params;
  
  try {
    // Find the video file
    const videoPath = path.join(config.videosDir, `${videoId}.mp4`);
    
    // Check if video file exists
    const fs = require('fs').promises;
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Generate thumbnail buffer
    const thumbnailBuffer = await videoService.generateThumbnail(videoPath);
    
    // Set appropriate headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Length': thumbnailBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
    // Send the buffer
    res.send(thumbnailBuffer);
    
  } catch (error) {
    console.error(`Error generating thumbnail for ${videoId}:`, error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

module.exports = router;