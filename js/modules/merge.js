/**
 * PDF Merge Module
 * Handles merging multiple PDF files into one
 */

import { showNotification, formatFileSize, toggleVisibility, toggleButtonDisabled, toggleLoader, initLucideIcons } from '../utils/uiUtils.js';
import { loadPdfLibDocument, createPdfDocument, savePdfDocument, createPdfBlob, createObjectUrl, revokeObjectUrl } from '../utils/pdfUtils.js';

/**
 * Merge module state
 */
const state = {
    uploadedFiles: [],
    sortable: null,
    blobUrl: null
};

/**
 * Initialize merge functionality
 */
export function initMerge() {
    console.log('[DEBUG] initMerge: Starting initialization...');
    
    const dropZone = document.getElementById('merge-drop-zone');
    const fileInput = document.getElementById('merge-file-input');
    const clearAllBtn = document.getElementById('merge-clear-all');
    const mergeBtn = document.getElementById('merge-btn');
    
    console.log('[DEBUG] initMerge: DOM elements found:', {
        dropZone: !!dropZone,
        fileInput: !!fileInput,
        clearAllBtn: !!clearAllBtn,
        mergeBtn: !!mergeBtn
    });
    
    if (!dropZone || !fileInput || !clearAllBtn || !mergeBtn) {
        console.error('[ERROR] initMerge: Some DOM elements are missing!');
        return;
    }

    // Drop zone click
    console.log('[DEBUG] initMerge: Setting up event listeners...');
    dropZone.addEventListener('click', () => {
        console.log('[DEBUG] initMerge: Drop zone clicked');
        fileInput.click();
    });

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Clear all button
    clearAllBtn.addEventListener('click', clearAllFiles);

    // Merge button
    mergeBtn.addEventListener('click', mergePdfs);
}

/**
 * Handle uploaded files
 *
 * @param {FileList} files - Files to handle
 */
async function handleFiles(files) {
    console.log('[DEBUG] handleFiles: Called with', files.length, 'files');
    
    for (let i = 0; i < files.length; i++) {
        console.log('[DEBUG] handleFiles: Processing file', i, files[i].name, files[i].type);
        
        if (files[i].type === 'application/pdf') {
            try {
                const arrayBuffer = await files[i].arrayBuffer();
                state.uploadedFiles.push({
                    file: files[i],
                    content: arrayBuffer,
                    name: files[i].name,
                    size: files[i].size
                });
                console.log('[DEBUG] handleFiles: Successfully loaded file', files[i].name);
            } catch (error) {
                console.error('Error reading file:', error);
                showNotification(`Could not read file "${files[i].name}"`, 'error');
            }
        } else {
            console.log('[DEBUG] handleFiles: File is not a PDF:', files[i].type);
            showNotification(`"${files[i].name}" is not a PDF file`, 'error');
        }
    }

    console.log('[DEBUG] handleFiles: Total files loaded:', state.uploadedFiles.length);
    renderFileList();
    updateUi();
}

/**
 * Render file list
 */
function renderFileList() {
    const fileList = document.getElementById('merge-file-list');
    fileList.innerHTML = '';

    if (state.uploadedFiles.length === 0) {
        return;
    }

    state.uploadedFiles.forEach((fileObj, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="drag-handle mr-3 text-gray-400 hover:text-gray-600">
                <i data-lucide="grip-vertical" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 flex items-center">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <i data-lucide="file-text" class="w-5 h-5 text-red-500"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800">${fileObj.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(fileObj.size)}</p>
                </div>
            </div>
            <div class="flex items-center">
                <span class="text-sm text-gray-500 mr-2">${index + 1}</span>
                <button class="remove-file text-red-500 hover:text-red-700" data-index="${index}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        fileList.appendChild(fileItem);
    });

    // Add remove button listeners
    document.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            removeFile(index);
        });
    });

    initSortable();
    initLucideIcons();
}

/**
 * Initialize sortable
 */
function initSortable() {
    if (state.sortable) {
        state.sortable.destroy();
    }

    if (typeof Sortable !== 'undefined') {
        const fileList = document.getElementById('merge-file-list');
        state.sortable = new Sortable(fileList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.drag-handle',
            onEnd: function(evt) {
                const item = state.uploadedFiles.splice(evt.oldIndex, 1)[0];
                state.uploadedFiles.splice(evt.newIndex, 0, item);
            }
        });
    }
}

/**
 * Remove file from list
 *
 * @param {number} index - File index
 */
function removeFile(index) {
    state.uploadedFiles.splice(index, 1);
    renderFileList();
    updateUi();
    hideDownloadLink();
}

/**
 * Clear all files
 */
function clearAllFiles() {
    state.uploadedFiles = [];
    renderFileList();
    updateUi();
    hideDownloadLink();
    document.getElementById('merge-file-input').value = '';
}

/**
 * Update UI state
 */
function updateUi() {
    const hasFiles = state.uploadedFiles.length > 0;
    const mergeBtn = document.getElementById('merge-btn');
    const fileSection = document.getElementById('merge-file-section');

    toggleButtonDisabled(mergeBtn, !hasFiles);
    toggleVisibility(fileSection, hasFiles);
}

/**
 * Hide download link
 */
function hideDownloadLink() {
    const downloadLink = document.getElementById('merge-download-link');
    toggleVisibility(downloadLink, false);

    if (state.blobUrl) {
        revokeObjectUrl(state.blobUrl);
        state.blobUrl = null;
    }
}

/**
 * Merge PDFs
 */
async function mergePdfs() {
    console.log('[DEBUG] mergePdfs: Called with', state.uploadedFiles.length, 'files');
    
    if (state.uploadedFiles.length === 0) {
        console.log('[DEBUG] mergePdfs: No files to merge');
        return;
    }

    const mergeBtn = document.getElementById('merge-btn');
    const loader = document.getElementById('merge-loader');
    const downloadLink = document.getElementById('merge-download-link');

    console.log('[DEBUG] mergePdfs: Starting merge process...');
    toggleButtonDisabled(mergeBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);

    try {
        console.log('[DEBUG] mergePdfs: Creating new PDF document...');
        const mergedPdf = await createPdfDocument();

        for (const fileObj of state.uploadedFiles) {
            console.log('[DEBUG] mergePdfs: Processing file:', fileObj.name);
            try {
                const pdf = await loadPdfLibDocument(fileObj.content);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
                console.log('[DEBUG] mergePdfs: Successfully merged file:', fileObj.name);
            } catch (error) {
                console.error('Error processing PDF:', error);
                throw new Error(`Failed to process "${fileObj.name}"`);
            }
        }

        console.log('[DEBUG] mergePdfs: Saving merged PDF...');
        const mergedPdfBytes = await savePdfDocument(mergedPdf);
        const blob = createPdfBlob(mergedPdfBytes);

        if (state.blobUrl) {
            revokeObjectUrl(state.blobUrl);
        }

        state.blobUrl = createObjectUrl(blob);
        downloadLink.href = state.blobUrl;
        downloadLink.download = 'merged.pdf';
        toggleVisibility(downloadLink, true);
        toggleLoader(loader, false);
        showNotification('PDFs merged successfully!');
        console.log('[DEBUG] mergePdfs: Merge complete!');
    } catch (error) {
        console.error('[ERROR] mergePdfs: Error merging PDFs:', error);
        showNotification(error.message || 'Failed to merge PDFs', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(mergeBtn, false);
    }
}

/**
 * Reset merge state
 */
export function resetMerge() {
    state.uploadedFiles = [];
    if (state.sortable) {
        state.sortable.destroy();
        state.sortable = null;
    }
    if (state.blobUrl) {
        revokeObjectUrl(state.blobUrl);
        state.blobUrl = null;
    }
}
