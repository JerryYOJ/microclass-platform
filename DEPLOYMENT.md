# Docker Deployment Guide

This guide explains how to deploy the Microclass Platform using Docker with volume mounting for easy video management.

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Prepare your videos directory:**
   ```bash
   mkdir videos
   # Copy your video files and metadata JSON files to this directory
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Open your browser and go to `http://localhost:3000`

### Option 2: Using Docker Commands

1. **Build the Docker image:**
   ```bash
   docker build -t microclass-platform .
   ```

2. **Run the container with volume mounting:**
   ```bash
   docker run -d \
     --name microclass-platform \
     -p 3000:3000 \
     -v $(pwd)/videos:/app/src/public/video-showcase/videos \
     -v $(pwd)/.env:/app/.env:ro \
     microclass-platform
   ```

## Video Management

### Adding New Videos

1. **Copy video files** to your local `videos/` directory
2. **Add metadata JSON files** for each video (e.g., `video1.json` for `video1.mp4`)
3. **Restart the container** (if needed):
   ```bash
   docker-compose restart
   # or
   docker restart microclass-platform
   ```

### Video Metadata Format

Create a JSON file for each video with the same name:

```json
{
  "title": "Video Title",
  "description": "Video description",
  "prizeType": "first",
  "school": "School Name",
  "author": "Author Name"
}
```

**Prize Types:**
- `first` - First Prize
- `second` - Second Prize  
- `third` - Third Prize

## Directory Structure

```
microclass-platform/
├── videos/                    # Your video files (mounted as volume)
│   ├── video1.mp4
│   ├── video1.json
│   ├── video2.mp4
│   └── video2.json
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker image definition
└── src/                       # Application source code
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=production
```

## Updating Videos

### Method 1: Direct File Management
- Simply add/remove/modify files in the `videos/` directory
- Changes are reflected immediately (no container restart needed)

### Method 2: Using Docker Volume Commands
```bash
# Copy files to running container
docker cp new-video.mp4 microclass-platform:/app/src/public/video-showcase/videos/
docker cp new-video.json microclass-platform:/app/src/public/video-showcase/videos/
```

## Production Deployment

### Using Named Volumes

For production, consider using named volumes:

```yaml
version: '3.8'
services:
  microclass-platform:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - video_data:/app/src/public/video-showcase/videos
    environment:
      - NODE_ENV=production

volumes:
  video_data:
    driver: local
```

### Reverse Proxy Setup

For production with NGINX:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

1. **Videos not showing:**
   - Check if video files are in the correct directory
   - Verify JSON metadata files exist
   - Check container logs: `docker logs microclass-platform`

2. **Permission issues:**
   ```bash
   # Fix permissions on videos directory
   chmod -R 755 videos/
   ```

3. **Container won't start:**
   ```bash
   # Check container logs
   docker logs microclass-platform
   
   # Rebuild image
   docker-compose build --no-cache
   ```

### Useful Commands

```bash
# View container logs
docker-compose logs -f

# Access container shell
docker exec -it microclass-platform sh

# Stop and remove containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Security Considerations

- Keep your `.env` file secure and don't commit it to version control
- Use proper file permissions on the videos directory
- Consider using HTTPS in production
- Regularly update the base Docker image for security patches