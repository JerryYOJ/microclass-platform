# Stage 1: Use a lightweight Node.js image as the base
# We choose a specific Node.js version (e.g., 20) and Alpine Linux for smaller image size.
FROM node:22-alpine

# Set the working directory inside the container
# All subsequent commands will be executed relative to this directory.
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the working directory.
# This step is optimized for Docker's build cache:
# If only your application code changes, but dependencies don't,
# Docker won't re-run 'npm install' on subsequent builds, speeding them up.
COPY package*.json ./

# Install ffmpeg for video thumbnail generation
RUN apk add --no-cache ffmpeg

# Install Node.js dependencies
# The --production flag ensures only production dependencies are installed,
# keeping the image smaller.
RUN npm install --production

# Copy the rest of your application code to the working directory.
# Exclude the videos folder as it will be mounted as a volume
COPY src/ ./src/
COPY .env* ./

# Create the videos directory structure for volume mounting
RUN mkdir -p /app/src/public/video-showcase/videos

# Declare volume for videos directory
VOLUME ["/app/src/public/video-showcase/videos"]

# Expose the port your Express app listens on.
# This informs Docker that the container will listen on this port at runtime.
# It does NOT publish the port; it's documentation for the image.
EXPOSE 3000

# Define the command to run your application when the container starts.
# This uses the "npm start" script defined in your package.json.
CMD ["npm", "start"]

# Optional: Add metadata (labels) to your image for better organization
LABEL maintainer="JerryYOJ"
LABEL version="1.0.0"
LABEL description="Award-winning microclass video showcase Node.js app"