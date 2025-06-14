const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const config = require('../config/config');

class VideoService {
  generateThumbnail(videoPath) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(__dirname, `temp.jpg`);
      
      ffmpeg(videoPath)
        .screenshots({
          timestamps: config.thumbnailSettings.timestamps,
          size: config.thumbnailSettings.size,
          filename: path.basename(tempPath),
          folder: path.dirname(tempPath)
        })
        .on('end', async () => {
          try {
            const buffer = await fs.readFile(tempPath);
            await fs.unlink(tempPath); // Clean up temp file
            console.log(`Thumbnail buffer generated for: ${videoPath}`);
            resolve(buffer);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          console.error(`Error generating thumbnail buffer for ${videoPath}:`, err.message);
          reject(err);
        });
    });
  }

  async getVideosFromDirectory() {
    try {
      const files = await fs.readdir(config.videosDir);
      const videoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return config.supportedVideoFormats.includes(ext);
      });
      
      const videos = [];
      
      for (const file of videoFiles) {
        const fileName = path.parse(file).name;
        const jsonPath = path.join(config.videosDir, `${fileName}.json`);
        const thumbnailUrl = `/api/thumbnail/${fileName}`;
        
        try {
          // Read corresponding JSON file
          const jsonData = await fs.readFile(jsonPath, 'utf8');
          const metadata = JSON.parse(jsonData);
          
          videos.push({
            id: fileName,
            title: metadata.title || fileName.replace(/[-_]/g, ' '),
            videoUrl: `/video-showcase/videos/${file}`,
            thumbnailUrl: thumbnailUrl,
            prizeType: metadata.prizeType || 'third',
            school: metadata.school || '未知学校',
            author: metadata.author || '未知作者'
          });
        } catch (jsonError) {
          console.warn(`No JSON metadata found for ${file}, using defaults:`, jsonError.message);
          // Fallback if JSON file doesn't exist
          videos.push({
            id: fileName,
            title: fileName.replace(/[-_]/g, ' '),
            videoUrl: `/video-showcase/videos/${file}`,
            thumbnailUrl: thumbnailUrl,
            prizeType: 'third',
            school: '未知学校',
            author: '未知作者'
          });
        }
      }
      
      return videos;
    } catch (error) {
      console.error(`Error reading videos directory:`, error);
      return [];
    }
  }

  async getAllVideos() {
    const allVideos = await this.getVideosFromDirectory();
    
    // Group videos by prize type
    return {
      first: allVideos.filter(video => video.prizeType === 'first'),
      second: allVideos.filter(video => video.prizeType === 'second'),
      third: allVideos.filter(video => video.prizeType === 'third')
    };
  }

  async getVideosByPrizeType(prizeType) {
    if (!config.prizeTypes.includes(prizeType)) {
      throw new Error('Invalid prize type');
    }
    
    const allVideos = await this.getVideosFromDirectory();
    return allVideos.filter(video => video.prizeType === prizeType);
  }
}

module.exports = new VideoService();