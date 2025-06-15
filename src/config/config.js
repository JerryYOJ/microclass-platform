const path = require('path');

module.exports = {
  port: process.env.PORT || 3000,
  videosDir: path.join(__dirname, '..', 'public', 'video-showcase', 'videos'),
  publicDir: path.join(__dirname, '..', 'public'),
  thumbnailSettings: {
    size: '300x180'
  },
  supportedVideoFormats: ['.mp4', '.webm', '.ogg', '.avi', '.mov'],
  prizeTypes: ['first', 'second', 'third']
};