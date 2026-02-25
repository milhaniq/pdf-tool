/**
 * PDF Split Module
 * Handles splitting PDF files into multiple files
 */

import { showNotification, formatFileSize, toggleVisibility, toggleButtonDisabled, toggleLoader, createFileInfoHtml, toggleDragOver, validateFileType } from '../utils/uiUtils.js';
import { loadPdfLibDocument, createPdfDocument, savePdfDocument, createPdfBlob, createObjectUrl, revokeObjectUrl, downloadBlob } from '../utils/pdfUtils.js';

/**
 * Split module state
 */
const state = {
    uploadedFile: null,
    pdfDoc: null,
    blobUrl: null,
    mergedBlobUrl: null,
    hasSplitFile: false
};

/**
 * Initialize split functionality
 */
export function initSplit() {
    const dropZone = document.getElementById('split-drop-zone');
    const fileInput = document.getElementById('split-file-input');
    const clearBtn = document.getElementById('split-clear');
    const splitBtn = document.getElementById('split-btn');

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

    // Split button
    splitBtn.addEventListener('click', splitPdf);

    // Split option change handlers
    document.querySelectorAll('input[name="split-option"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const rangeInput = document.getElementById('range-input');
            const mergeOptionContainer = document.getElementById('merge-option-container');
            const reuploadWarning = document.getElementById('reupload-warning');

            if (e.target.value === 'range') {
                toggleVisibility(rangeInput, true);
                toggleVisibility(mergeOptionContainer, true);
            } else {
                toggleVisibility(rangeInput, false);
                toggleVisibility(mergeOptionContainer, false);
            }

            toggleVisibility(reuploadWarning, false);
        });
    });

    // Merge split files checkbox
    document.getElementById('merge-split-files').addEventListener('change', (e) => {
        const reuploadWarning = document.getElementById('reupload-warning');

        if (state.hasSplitFile) {
            toggleVisibility(reuploadWarning, true);
            e.target.checked = !e.target.checked;
            showNotification('Please reupload the file to change the merge option', 'info');
        }
    });
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
        state.pdfDoc = await loadPdfLibDocument(arrayBuffer);

        const pageCount = state.pdfDoc.getPageCount();
        const fileInfo = document.getElementById('split-file-info');
        fileInfo.innerHTML = createFileInfoHtml(file, pageCount);

        updateUi(true);
        state.hasSplitFile = false;
        toggleVisibility(document.getElementById('reupload-warning'), false);

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
    const splitBtn = document.getElementById('split-btn');
    const fileSection = document.getElementById('split-file-section');
    const options = document.getElementById('split-options');

    toggleButtonDisabled(splitBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(options, hasFile);
    hideDownloadLinks();
}

/**
 * Hide download links
 */
function hideDownloadLinks() {
    const downloadLink = document.getElementById('split-download-link');
    const mergedDownloadLink = document.getElementById('split-merged-download-link');

    toggleVisibility(downloadLink, false);
    toggleVisibility(mergedDownloadLink, false);

    if (state.blobUrl) {
        revokeObjectUrl(state.blobUrl);
        state.blobUrl = null;
    }
    if (state.mergedBlobUrl) {
        revokeObjectUrl(state.mergedBlobUrl);
        state.mergedBlobUrl = null;
    }
}

/**
 * Split PDF
 */
async function splitPdf() {
    if (!state.pdfDoc) return;

    const splitBtn = document.getElementById('split-btn');
    const loader = document.getElementById('split-loader');
    const downloadLink = document.getElementById('split-download-link');
    const mergedDownloadLink = document.getElementById('split-merged-download-link');

    toggleButtonDisabled(splitBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);
    toggleVisibility(mergedDownloadLink, false);

    try {
        const pageCount = state.pdfDoc.getPageCount();
        const splitOption = document.querySelector('input[name="split-option"]:checked').value;
        const mergeSplitFiles = document.getElementById('merge-split-files').checked;

        const splitPdfs = [];

        if (splitOption === 'pages') {
            // Split into individual pages
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await createPdfDocument();
                const [page] = await newPdf.copyPages(state.pdfDoc, [i]);
                newPdf.addPage(page);

                const pdfBytes = await savePdfDocument(newPdf);
                splitPdfs.push({
                    bytes: pdfBytes,
                    name: `${state.uploadedFile.name.replace('.pdf', '')}_page_${i + 1}.pdf`
                });
            }
        } else if (splitOption === 'range') {
            // Split by page ranges
            const pageRanges = document.getElementById('page-ranges').value;
            const ranges = parsePageRanges(pageRanges, pageCount);

            for (let i = 0; i < ranges.length; i++) {
                const [start, end] = ranges[i];
                const newPdf = await createPdfDocument();
                const pages = await newPdf.copyPages(
                    state.pdfDoc,
                    Array.from({ length: end - start + 1 }, (_, j) => start + j - 1)
                );
                pages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await savePdfDocument(newPdf);
                splitPdfs.push({
                    bytes: pdfBytes,
                    name: `${state.uploadedFile.name.replace('.pdf', '')}_pages_${start}-${end}.pdf`
                });
            }
        }

        // Handle merge option
        if (splitOption === 'range' && mergeSplitFiles) {
            // Create merged PDF
            const mergedPdf = await createPdfDocument();

            for (const splitPdf of splitPdfs) {
                const pdf = await loadPdfLibDocument(splitPdf.bytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await savePdfDocument(mergedPdf);
            const blob = createPdfBlob(mergedPdfBytes);

            if (state.mergedBlobUrl) {
                revokeObjectUrl(state.mergedBlobUrl);
            }

            state.mergedBlobUrl = createObjectUrl(blob);
            mergedDownloadLink.href = state.mergedBlobUrl;
            mergedDownloadLink.download = `${state.uploadedFile.name.replace('.pdf', '')}_merged.pdf`;
            toggleVisibility(mergedDownloadLink, true);

            showNotification('PDF split and merged successfully!');
        } else {
            // Create ZIP file
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();

                for (const splitPdf of splitPdfs) {
                    zip.file(splitPdf.name, splitPdf.bytes);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });

                if (state.blobUrl) {
                    revokeObjectUrl(state.blobUrl);
                }

                state.blobUrl = createObjectUrl(zipBlob);
                downloadLink.href = state.blobUrl;
                downloadLink.download = `${state.uploadedFile.name.replace('.pdf', '')}_split.zip`;
                toggleVisibility(downloadLink, true);

                showNotification('PDF split successfully!');
            }
        }

        state.hasSplitFile = true;

        // Show reupload warning if using split by range
        if (splitOption === 'range') {
            toggleVisibility(document.getElementById('reupload-warning'), true);
        }

        toggleLoader(loader, false);
    } catch (error) {
        console.error('Error splitting PDF:', error);
        showNotification(error.message || 'Failed to split PDF', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(splitBtn, false);
    }
}

/**
 * Parse page ranges
 *
 * @param {string} input - Input string (e.g., "1-5, 6-10")
 * @param {number} maxPage - Maximum page number
 * @returns {Array} Array of [start, end] pairs
 */
function parsePageRanges(input, maxPage) {
    const ranges = [];
    const parts = input.split(',');

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
            if (isNaN(start) || isNaN(end) || start < 1 || end > maxPage || start > end) {
                throw new Error(`Invalid page range: ${trimmed}`);
            }
            ranges.push([start, end]);
        } else {
            const page = parseInt(trimmed);
            if (isNaN(page) || page < 1 || page > maxPage) {
                throw new Error(`Invalid page number: ${trimmed}`);
            }
            ranges.push([page, page]);
        }
    }

    return ranges;
}

/**
 * Reset split state
 */
function resetState() {
    state.uploadedFile = null;
    state.pdfDoc = null;
    state.hasSplitFile = false;

    const fileInfo = document.getElementById('split-file-info');
    fileInfo.innerHTML = '';

    updateUi(false);
    toggleVisibility(document.getElementById('reupload-warning'), false);
    document.getElementById('split-file-input').value = '';
}

/**
 * Reset split module (exported for cleanup)
 */
export function resetSplit() {
    resetState();
    if (state.blobUrl) {
        revokeObjectUrl(state.blobUrl);
        state.blobUrl = null;
    }
    if (state.mergedBlobUrl) {
        revokeObjectUrl(state.mergedBlobUrl);
        state.mergedBlobUrl = null;
    }
}
