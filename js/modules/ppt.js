/**
 * PDF to PPT Module
 * Handles converting PDF files to PowerPoint presentations
 */

import { showNotification, formatFileSize, toggleVisibility, toggleButtonDisabled, toggleLoader, updateProgress, createFileInfoHtml, toggleDragOver, validateFileType } from '../utils/uiUtils.js';
import { loadPdfDocument } from '../utils/pdfUtils.js';
import { CONFIG } from '../config.js';

/**
 * PPT module state
 */
const state = {
    uploadedFile: null,
    blobUrl: null
};

/**
 * Initialize PPT conversion functionality
 */
export function initPpt() {
    const dropZone = document.getElementById('ppt-drop-zone');
    const fileInput = document.getElementById('ppt-file-input');
    const clearBtn = document.getElementById('ppt-clear');
    const pptBtn = document.getElementById('ppt-btn');

    // Drop zone click
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        toggleDragOver(dropZone, true);
    });

    dropZone.addEventListener('dragleave', () => {
        toggleDragOver(dropZone, false);
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        toggleDragOver(dropZone, false);
        handleFile(e.dataTransfer.files[0]);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Clear button
    clearBtn.addEventListener('click', resetState);

    // Convert button
    pptBtn.addEventListener('click', convertToPpt);
}

/**
 * Handle uploaded file
 *
 * @param {File} file - Uploaded file
 */
async function handleFile(file) {
    if (!validateFileType(file, 'application/pdf')) {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    try {
        state.uploadedFile = file;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);

        const pageCount = pdf.numPages;
        const fileInfo = document.getElementById('ppt-file-info');
        fileInfo.innerHTML = createFileInfoHtml(file, pageCount);

        updateUi(true);

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error reading PDF:', error);
        showNotification('Failed to read the PDF file', 'error');
    }
}

/**
 * Update UI state
 *
 * @param {boolean} hasFile - Whether file is loaded
 */
function updateUi(hasFile) {
    const pptBtn = document.getElementById('ppt-btn');
    const fileSection = document.getElementById('ppt-file-section');
    const options = document.getElementById('ppt-options');

    toggleButtonDisabled(pptBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(options, hasFile);
    hideDownloadLink();
}

/**
 * Hide download link
 */
function hideDownloadLink() {
    const downloadLink = document.getElementById('ppt-download-link');
    toggleVisibility(downloadLink, false);

    if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
        state.blobUrl = null;
    }
}

/**
 * Convert PDF to PowerPoint
 */
async function convertToPpt() {
    if (!state.uploadedFile) return;

    const pptBtn = document.getElementById('ppt-btn');
    const loader = document.getElementById('ppt-loader');
    const downloadLink = document.getElementById('ppt-download-link');
    const progressContainer = document.getElementById('ppt-progress-container');
    const progressBar = document.getElementById('ppt-progress-bar');
    const progressText = document.getElementById('ppt-progress-text');

    toggleButtonDisabled(pptBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);
    toggleVisibility(progressContainer, true);

    try {
        const arrayBuffer = await state.uploadedFile.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        const numPages = pdf.numPages;

        const preserveAspect = document.getElementById('preserve-aspect').checked;
        const highQuality = document.getElementById('high-quality').checked;
        const scale = highQuality ? CONFIG.pdf.highQualityScale : CONFIG.pdf.normalQualityScale;

        if (typeof PptxGenJS === 'undefined') {
            throw new Error('PptxGenJS library not loaded');
        }

        const pptx = new PptxGenJS();
        pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 });
        pptx.layout = 'A4';

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const progress = (pageNum / numPages) * 100;
            updateProgress(progressBar, progressText, progress);

            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            const imgData = canvas.toDataURL('image/png');

            const slide = pptx.addSlide();

            if (preserveAspect) {
                slide.addImage({
                    data: imgData,
                    x: 0, y: 0,
                    w: '100%', h: '100%',
                    sizing: { type: 'contain', w: 10, h: 7.5 }
                });
            } else {
                slide.addImage({
                    data: imgData,
                    x: 0, y: 0,
                    w: 10, h: 7.5
                });
            }
        }

        updateProgress(progressBar, progressText, 100);

        const fileName = `${state.uploadedFile.name.replace('.pdf', '')}.pptx`;
        await pptx.writeFile({ fileName });

        toggleLoader(loader, false);
        showNotification('PDF converted to PowerPoint successfully!');
    } catch (error) {
        console.error('Error converting to PPT:', error);
        showNotification(error.message || 'Failed to convert PDF to PowerPoint', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(pptBtn, false);
    }
}

/**
 * Reset PPT state
 */
function resetState() {
    state.uploadedFile = null;

    const fileInfo = document.getElementById('ppt-file-info');
    fileInfo.innerHTML = '';

    updateUi(false);
    document.getElementById('ppt-file-input').value = '';
}

/**
 * Reset PPT module (exported for cleanup)
 */
export function resetPpt() {
    resetState();
    if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
        state.blobUrl = null;
    }
}
