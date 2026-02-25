/**
 * UI utility functions
 */

import { CONFIG } from '../config.js';

/**
 * Show notification message
 *
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 */
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    const icon = type === 'success' ? 'check-circle' :
                 type === 'error' ? 'alert-circle' : 'info';

    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i data-lucide="${icon}" class="w-5 h-5"></i>
            <span>${message}</span>
        </div>
    `;

    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);

        // Re-initialize Lucide icons for the new element
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Remove notification after delay
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.ui.notificationDuration);
    }
}

/**
 * Format file size in human-readable format
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = CONFIG.fileSize.kilo;
    const sizes = CONFIG.fileSize.units;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Set active tab in tab navigation
 *
 * @param {HTMLElement} activeTab - The tab to activate
 * @param {HTMLElement[]} inactiveTabs - Array of tabs to deactivate
 * @param {HTMLElement} activeContent - The content to show
 * @param {HTMLElement[]} inactiveContents - Array of contents to hide
 */
export function setActiveTab(activeTab, inactiveTabs, activeContent, inactiveContents) {
    // Activate selected tab
    activeTab.classList.add('active');

    // Deactivate other tabs
    inactiveTabs.forEach(tab => tab.classList.remove('active'));

    // Show selected content
    activeContent.classList.remove('hidden');

    // Hide other contents
    inactiveContents.forEach(content => content.classList.add('hidden'));
}

/**
 * Get canvas coordinates from mouse/touch event
 *
 * @param {Event} e - Mouse or touch event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} { x, y } - Canvas coordinates
 */
export function getCanvasCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

/**
 * Create file info HTML
 *
 * @param {File} file - File object
 * @param {number} pageCount - Number of pages (for PDFs)
 * @returns {string} HTML string
 */
export function createFileInfoHtml(file, pageCount = null) {
    const pageInfo = pageCount !== null
        ? `${pageCount} page${pageCount !== 1 ? 's' : ''}`
        : '';

    return `
        <div class="flex items-center">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <i data-lucide="file-text" class="w-6 h-6 text-red-500"></i>
            </div>
            <div class="flex-1">
                <p class="font-medium text-gray-800">${file.name}</p>
                <p class="text-sm text-gray-500">${formatFileSize(file.size)}${pageInfo ? ' • ' + pageInfo : ''}</p>
            </div>
        </div>
    `;
}

/**
 * Initialize Lucide icons
 */
export function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Toggle element visibility
 *
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} visible - Whether to show or hide
 */
export function toggleVisibility(element, visible) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Disable/enable button
 *
 * @param {HTMLButtonElement} button - Button to toggle
 * @param {boolean} disabled - Whether to disable
 */
export function toggleButtonDisabled(button, disabled) {
    button.disabled = disabled;
}

/**
 * Show/hide loading spinner
 *
 * @param {HTMLElement} loader - Loader element
 * @param {boolean} show - Whether to show loader
 */
export function toggleLoader(loader, show) {
    toggleVisibility(loader, show);
}

/**
 * Update progress bar
 *
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {HTMLElement} progressText - Progress text element
 * @param {number} percent - Progress percentage (0-100)
 */
export function updateProgress(progressBar, progressText, percent) {
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(percent)}%`;
    }
}

/**
 * Add drag-over effect
 *
 * @param {HTMLElement} element - Drop zone element
 * @param {boolean} isOver - Whether drag is over
 */
export function toggleDragOver(element, isOver) {
    if (isOver) {
        element.classList.add('drag-over');
    } else {
        element.classList.remove('drag-over');
    }
}

/**
 * Validate file type
 *
 * @param {File} file - File to validate
 * @param {string} expectedType - Expected MIME type
 * @returns {boolean} Whether file is valid
 */
export function validateFileType(file, expectedType) {
    return file && file.type === expectedType;
}

/**
 * Handle file read error
 *
 * @param {Error} error - Error object
 * @param {string} fileName - Name of file that failed
 */
export function handleFileReadError(error, fileName) {
    console.error('Error reading file:', error);
    showNotification(`Could not read file "${fileName}"`, 'error');
}
