const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const videoService = require('../services/videoService');
const config = require('../config/config');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.videosDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(file.originalname);
    const filename = `video_${timestamp}_${randomString}${extension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.supportedVideoFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported video format'));
    }
  }
});

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

// --- Admin API Routes ---

// Upload video file
router.post('/admin/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = path.parse(req.file.filename).name;
    
    res.json({
      success: true,
      videoId: videoId,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Upload/update video metadata
router.post('/admin/upload-metadata', async (req, res) => {
  try {
    const { videoId, metadata } = req.body;
    
    if (!videoId || !metadata) {
      return res.status(400).json({ error: 'Video ID and metadata are required' });
    }

    // Validate prize type
    if (!config.prizeTypes.includes(metadata.prizeType)) {
      return res.status(400).json({ error: 'Invalid prize type' });
    }

    const jsonPath = path.join(config.videosDir, `${videoId}.json`);
    
    // Save metadata without adding ID field
    await fs.writeFile(jsonPath, JSON.stringify(metadata, null, 2));
    
    res.json({ success: true, message: 'Metadata saved successfully' });
  } catch (error) {
    console.error('Error saving metadata:', error);
    res.status(500).json({ error: 'Failed to save metadata' });
  }
});

// Update video metadata
router.put('/admin/update-metadata', async (req, res) => {
  try {
    const { videoId, metadata } = req.body;
    
    if (!videoId || !metadata) {
      return res.status(400).json({ error: 'Video ID and metadata are required' });
    }

    // Validate prize type
    if (!config.prizeTypes.includes(metadata.prizeType)) {
      return res.status(400).json({ error: 'Invalid prize type' });
    }

    const jsonPath = path.join(config.videosDir, `${videoId}.json`);
    
    // Check if metadata file exists
    try {
      await fs.access(jsonPath);
    } catch {
      return res.status(404).json({ error: 'Video metadata not found' });
    }
    
    // Read existing metadata to preserve ID and other fields
    const existingData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    
    // Update metadata without adding ID field
    const updatedMetadata = {
      ...metadata
    };
    
    await fs.writeFile(jsonPath, JSON.stringify(updatedMetadata, null, 2));
    
    res.json({ success: true, message: 'Metadata updated successfully' });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

// Delete video and its metadata
router.delete('/admin/delete-video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    const videosDir = config.videosDir;
    const files = await fs.readdir(videosDir);
    
    // Find video file with this ID
    const videoFile = files.find(file => {
      const name = path.parse(file).name;
      const ext = path.extname(file).toLowerCase();
      return name === videoId && config.supportedVideoFormats.includes(ext);
    });
    
    if (!videoFile) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const videoPath = path.join(videosDir, videoFile);
    const jsonPath = path.join(videosDir, `${videoId}.json`);
    
    // Delete video file
    await fs.unlink(videoPath);
    
    // Delete metadata file if it exists
    try {
      await fs.unlink(jsonPath);
    } catch (error) {
      // Metadata file might not exist, that's okay
      console.warn(`Metadata file not found for ${videoId}:`, error.message);
    }
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get all videos for admin (includes more details)
router.get('/admin/videos', async (req, res) => {
  try {
    const groupedVideos = await videoService.getAllVideos();
    
    // Flatten and add additional admin info
    const allVideos = [];
    Object.values(groupedVideos).forEach(prizeVideos => {
      allVideos.push(...prizeVideos);
    });
    
    res.json(allVideos);
  } catch (error) {
    console.error('Error fetching admin videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

module.exports = router;