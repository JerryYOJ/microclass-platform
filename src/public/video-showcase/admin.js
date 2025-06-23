// Admin Page JavaScript

class VideoAdmin {
    constructor() {
        this.videos = [];
        this.currentEditingVideo = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadVideos();
    }

    bindEvents() {
        // Upload form submission
        const uploadForm = document.getElementById('upload-form');
        uploadForm.addEventListener('submit', (e) => this.handleUpload(e));

        // Edit form submission
        const editForm = document.getElementById('edit-form');
        editForm.addEventListener('submit', (e) => this.handleEdit(e));

        // Modal controls
        const modal = document.getElementById('edit-modal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-edit');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadVideos() {
        try {
            this.showLoading();
            const response = await fetch('/api/videos');
            if (!response.ok) {
                throw new Error('Failed to fetch videos');
            }
            
            const data = await response.json();
            this.videos = [];
            
            // Flatten the grouped videos
            Object.values(data).forEach(prizeVideos => {
                this.videos.push(...prizeVideos);
            });
            
            this.renderVideoList();
        } catch (error) {
            console.error('Error loading videos:', error);
            this.showMessage('加载视频列表失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderVideoList() {
        const videoList = document.getElementById('video-list');
        
        if (this.videos.length === 0) {
            videoList.innerHTML = '<p class="no-videos">暂无视频</p>';
            return;
        }

        videoList.innerHTML = this.videos.map(video => `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnailUrl}" alt="${video.title}缩略图" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMwMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xMzUgNzBMMTY1IDkwTDEzNSAxMTBWNzBaIiBmaWxsPSIjQ0NDIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiPuinhumikee8qeWkseWbvueJhzwvdGV4dD4KPC9zdmc+'">
                </div>
                <div class="video-info">
                    <h4>${video.title}</h4>
                    <div class="video-details">
                        <p><strong>作者:</strong> ${video.author}</p>
                        <p><strong>学校:</strong> ${video.school || '未知'}</p>
                        <span class="prize-badge prize-${video.prizeType}">${this.getPrizeLabel(video.prizeType)}</span>
                    </div>
                    <div class="video-actions">
                        <button class="btn-small btn-edit" onclick="videoAdmin.editVideo('${video.id}')">编辑</button>
                        <button class="btn-small btn-delete" onclick="videoAdmin.deleteVideo('${video.id}')">删除</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleUpload(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const videoFile = formData.get('video');
        
        if (!videoFile || videoFile.size === 0) {
            this.showMessage('请选择视频文件', 'error');
            return;
        }

        try {
            this.showLoading();
            
            // Create JSON metadata
            const metadata = {
                title: formData.get('title'),
                prizeType: formData.get('prizeType'),
                school: formData.get('school'),
                author: formData.get('author')
            };

            // Upload video file
            const uploadResponse = await fetch('/api/admin/upload-video', {
                method: 'POST',
                body: formData
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.message || '上传失败');
            }

            const result = await uploadResponse.json();
            
            // Upload metadata
            const metadataResponse = await fetch('/api/admin/upload-metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoId: result.videoId,
                    metadata: metadata
                })
            });

            if (!metadataResponse.ok) {
                throw new Error('元数据保存失败');
            }

            this.showMessage('视频上传成功！', 'success');
            e.target.reset();
            this.loadVideos();
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(error.message || '上传失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    editVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) {
            this.showMessage('视频不存在', 'error');
            return;
        }

        this.currentEditingVideo = video;
        
        // Populate edit form
        document.getElementById('edit-video-id').value = video.id;
        document.getElementById('edit-title').value = video.title;
        document.getElementById('edit-prize').value = video.prizeType;
        document.getElementById('edit-school').value = video.school || '';
        document.getElementById('edit-author').value = video.author;
        
        // Show modal
        document.getElementById('edit-modal').style.display = 'block';
    }

    async handleEdit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const videoId = formData.get('videoId');
        
        const metadata = {
            title: formData.get('title'),
            prizeType: formData.get('prizeType'),
            school: formData.get('school'),
            author: formData.get('author')
        };

        try {
            this.showLoading();
            
            const response = await fetch('/api/admin/update-metadata', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoId: videoId,
                    metadata: metadata
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '更新失败');
            }

            this.showMessage('视频信息更新成功！', 'success');
            this.closeModal();
            this.loadVideos();
            
        } catch (error) {
            console.error('Edit error:', error);
            this.showMessage(error.message || '更新失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) {
            this.showMessage('视频不存在', 'error');
            return;
        }

        if (!confirm(`确定要删除视频 "${video.title}" 吗？此操作不可撤销。`)) {
            return;
        }

        try {
            this.showLoading();
            
            const response = await fetch(`/api/admin/delete-video/${videoId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '删除失败');
            }

            this.showMessage('视频删除成功！', 'success');
            this.loadVideos();
            
        } catch (error) {
            console.error('Delete error:', error);
            this.showMessage(error.message || '删除失败', 'error');
        } finally {
            this.hideLoading();
        }
    }

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditingVideo = null;
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;

        // Insert at the top of the main content
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    formatDuration(seconds) {
        if (!seconds) return '未知';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}分${remainingSeconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    getPrizeLabel(prizeType) {
        const labels = {
            'first': '一等奖',
            'second': '二等奖',
            'third': '三等奖'
        };
        return labels[prizeType] || prizeType;
    }
}

// Initialize admin when page loads
let videoAdmin;
document.addEventListener('DOMContentLoaded', () => {
    videoAdmin = new VideoAdmin();
});

// Handle file input change to show file name
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('video-file');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const helpText = fileInput.parentNode.querySelector('.help-text');
                helpText.textContent = `已选择: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            }
        });
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('edit-modal');
        if (modal.style.display === 'block') {
            videoAdmin.closeModal();
        }
    }
});