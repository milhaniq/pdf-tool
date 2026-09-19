/**
 * PDF Compress Module
 * Shrinks PDFs by re-rendering each page at a chosen DPI and re-encoding it
 * as a compressed image inside a new PDF.
 *
 * Note: output is rasterised, so text is no longer selectable or searchable.
 */

import { CONFIG } from '../config.js';
import { showNotification, formatFileSize, toggleVisibility, toggleButtonDisabled, toggleLoader, toggleDragOver, updateProgress, initLucideIcons } from '../utils/uiUtils.js';
import { loadPdfDocument, createPdfDocument, createPdfBlob, createObjectUrl, revokeObjectUrl } from '../utils/pdfUtils.js';

/**
 * Compress module state
 */
const compressState = {
    files: [],
    results: [],
    busy: false,
    zipUrl: null
};

/**
 * Initialize compress functionality
 */
export function initCompress() {
    const dropZone = document.getElementById('compress-drop-zone');
    const fileInput = document.getElementById('compress-file-input');
    const clearAllBtn = document.getElementById('compress-clear-all');
    const compressBtn = document.getElementById('compress-btn');
    const dpiInput = document.getElementById('compress-dpi');
    const qualityInput = document.getElementById('compress-quality');
    const colorInput = document.getElementById('compress-color');
    const downloadAll = document.getElementById('compress-download-all');

    if (!dropZone || !fileInput || !clearAllBtn || !compressBtn) {
        console.error('[ERROR] initCompress: Some DOM elements are missing!');
        return;
    }

    renderCompressPresets();

    dropZone.addEventListener('click', () => fileInput.click());

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
        handleCompressFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleCompressFiles(e.target.files);
        // Reset so picking the same file again still fires a change event
        e.target.value = '';
    });

    clearAllBtn.addEventListener('click', resetCompressState);
    compressBtn.addEventListener('click', runCompression);

    // Manual tweaks deselect the preset - the values no longer match it
    if (dpiInput) {
        dpiInput.addEventListener('input', () => {
            syncCompressLabels();
            clearCompressPresetSelection();
        });
    }

    if (qualityInput) {
        qualityInput.addEventListener('input', () => {
            syncCompressLabels();
            clearCompressPresetSelection();
        });
    }

    if (colorInput) {
        colorInput.addEventListener('change', clearCompressPresetSelection);
    }

    if (downloadAll) {
        downloadAll.addEventListener('click', (e) => {
            if (!compressState.zipUrl) {
                e.preventDefault();
            }
        });
    }

    // Start on the configured default preset
    const defaultPreset = CONFIG.compress.presets.find(p => p.id === CONFIG.compress.defaultPreset);
    if (defaultPreset) {
        applyCompressPreset(defaultPreset);
    }
}

/**
 * Render the preset cards
 */
function renderCompressPresets() {
    const container = document.getElementById('compress-presets');
    if (!container) return;

    container.innerHTML = '';

    CONFIG.compress.presets.forEach(preset => {
        const label = document.createElement('label');
        label.className = 'compress-preset flex items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition border-2 border-transparent has-[:checked]:border-indigo-500';
        label.dataset.presetId = preset.id;
        label.innerHTML = `
            <input type="radio" name="compress-preset" value="${preset.id}" class="mr-3">
            <div class="flex-1">
                <div class="font-semibold text-gray-800">${preset.name}</div>
                <div class="text-sm text-gray-500">${preset.desc}</div>
            </div>
        `;

        const radio = label.querySelector('input');
        radio.addEventListener('change', () => applyCompressPreset(preset));

        container.appendChild(label);
    });
}

/**
 * Apply a preset to the fine-tuning controls
 *
 * @param {Object} preset - Preset definition from CONFIG.compress.presets
 */
function applyCompressPreset(preset) {
    const dpiInput = document.getElementById('compress-dpi');
    const qualityInput = document.getElementById('compress-quality');
    const colorInput = document.getElementById('compress-color');

    if (dpiInput) dpiInput.value = preset.dpi;
    if (qualityInput) qualityInput.value = preset.quality;
    if (colorInput) colorInput.value = preset.color;

    const radio = document.querySelector(`input[name="compress-preset"][value="${preset.id}"]`);
    if (radio) radio.checked = true;

    syncCompressLabels();
}

/**
 * Clear the preset selection (values were adjusted manually)
 */
function clearCompressPresetSelection() {
    document.querySelectorAll('input[name="compress-preset"]').forEach(radio => {
        radio.checked = false;
    });
}

/**
 * Keep the slider value labels in sync
 */
function syncCompressLabels() {
    const dpiInput = document.getElementById('compress-dpi');
    const qualityInput = document.getElementById('compress-quality');
    const dpiValue = document.getElementById('compress-dpi-value');
    const qualityValue = document.getElementById('compress-quality-value');

    if (dpiInput && dpiValue) dpiValue.textContent = dpiInput.value;
    if (qualityInput && qualityValue) qualityValue.textContent = `${qualityInput.value}%`;
}

/**
 * Handle uploaded files
 *
 * @param {FileList} files - Files to add to the batch
 */
function handleCompressFiles(files) {
    if (compressState.busy) return;

    const incoming = Array.from(files || []);
    const accepted = incoming.filter(file =>
        file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
    );

    incoming
        .filter(file => !accepted.includes(file))
        .forEach(file => showNotification(`"${file.name}" is not a PDF file`, 'error'));

    if (accepted.length === 0) {
        if (incoming.length === 0) {
            showNotification('Please select a valid PDF file', 'error');
        }
        return;
    }

    compressState.files = compressState.files.concat(accepted);
    clearCompressResults();
    renderCompressFileList();
    updateCompressUi();
}

/**
 * Render the list of files queued for compression
 */
function renderCompressFileList() {
    const fileList = document.getElementById('compress-file-list');
    if (!fileList) return;

    fileList.innerHTML = '';

    compressState.files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const icon = document.createElement('div');
        icon.className = 'w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3';
        icon.innerHTML = '<i data-lucide="file-text" class="w-5 h-5 text-red-500"></i>';

        const details = document.createElement('div');
        details.className = 'flex-1';

        const name = document.createElement('p');
        name.className = 'font-medium text-gray-800 truncate';
        name.textContent = file.name;

        const size = document.createElement('p');
        size.className = 'text-xs text-gray-500';
        size.textContent = formatFileSize(file.size);

        details.appendChild(name);
        details.appendChild(size);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'compress-remove-file text-red-500 hover:text-red-700 ml-3';
        removeBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
        removeBtn.addEventListener('click', () => removeCompressFile(index));

        fileItem.appendChild(icon);
        fileItem.appendChild(details);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
    });

    initLucideIcons();
}

/**
 * Remove a single file from the batch
 *
 * @param {number} index - File index
 */
function removeCompressFile(index) {
    if (compressState.busy) return;

    compressState.files.splice(index, 1);
    clearCompressResults();
    renderCompressFileList();
    updateCompressUi();
}

/**
 * Update UI state based on the current batch
 */
function updateCompressUi() {
    const hasFiles = compressState.files.length > 0;
    const compressBtn = document.getElementById('compress-btn');
    const fileSection = document.getElementById('compress-file-section');
    const options = document.getElementById('compress-options');
    const notice = document.getElementById('compress-notice');

    toggleButtonDisabled(compressBtn, !hasFiles || compressState.busy);
    toggleVisibility(fileSection, hasFiles);
    toggleVisibility(options, hasFiles);
    toggleVisibility(notice, hasFiles);
}

/**
 * Clear previous results and release their object URLs
 */
function clearCompressResults() {
    compressState.results.forEach(result => revokeObjectUrl(result.url));
    compressState.results = [];

    if (compressState.zipUrl) {
        revokeObjectUrl(compressState.zipUrl);
        compressState.zipUrl = null;
    }

    const rows = document.getElementById('compress-results-rows');
    const totals = document.getElementById('compress-totals');
    const resultsSection = document.getElementById('compress-results-section');
    const downloadAll = document.getElementById('compress-download-all');
    const progressContainer = document.getElementById('compress-progress-container');

    if (rows) rows.innerHTML = '';
    if (totals) totals.textContent = '';
    if (resultsSection) toggleVisibility(resultsSection, false);
    if (downloadAll) {
        toggleVisibility(downloadAll, false);
        downloadAll.removeAttribute('href');
    }
    if (progressContainer) toggleVisibility(progressContainer, false);
}

/**
 * Reset the compress tab back to its empty state
 */
function resetCompressState() {
    if (compressState.busy) return;

    compressState.files = [];
    clearCompressResults();
    renderCompressFileList();
    updateCompressUi();

    const fileInput = document.getElementById('compress-file-input');
    if (fileInput) fileInput.value = '';
}

/**
 * Compress every queued file
 */
async function runCompression() {
    if (compressState.busy || compressState.files.length === 0) return;

    const compressBtn = document.getElementById('compress-btn');
    const loader = document.getElementById('compress-loader');
    const downloadAll = document.getElementById('compress-download-all');
    const progressContainer = document.getElementById('compress-progress-container');
    const progressBar = document.getElementById('compress-progress-bar');
    const progressText = document.getElementById('compress-progress-text');
    const resultsSection = document.getElementById('compress-results-section');
    const rows = document.getElementById('compress-results-rows');

    clearCompressResults();

    compressState.busy = true;
    toggleButtonDisabled(compressBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(progressContainer, true);
    toggleVisibility(resultsSection, true);
    updateProgress(progressBar, progressText, 0);

    const dpi = Number(document.getElementById('compress-dpi').value);
    const quality = Number(document.getElementById('compress-quality').value) / 100;
    const mode = document.getElementById('compress-color').value;
    const safeMode = document.getElementById('compress-safe').checked;

    try {
        // Pre-count pages so the progress bar advances smoothly across the batch
        const documents = [];
        let totalPages = 0;

        for (const file of compressState.files) {
            try {
                const buffer = await file.arrayBuffer();
                // PDF.js takes ownership of the buffer it is given, so hand it a
                // copy and keep the original bytes for the safe-mode fallback
                const pdf = await loadPdfDocument({ data: buffer.slice(0) });
                documents.push({ file, buffer, pdf });
                totalPages += pdf.numPages;
            } catch (error) {
                console.error('Error reading PDF:', error);
                documents.push({ file, error });
            }
        }

        let pagesDone = 0;

        for (const item of documents) {
            const row = createCompressRow(item.file);
            rows.appendChild(row);

            if (item.error) {
                fillCompressRowError(row, 'Could not read file');
                continue;
            }

            try {
                const compressedBytes = await compressPdfDocument(item.pdf, dpi, quality, mode, () => {
                    pagesDone++;
                    updateProgress(progressBar, progressText, (pagesDone / Math.max(totalPages, 1)) * 100);
                });

                let bytes = compressedBytes;
                let note = '';

                if (safeMode && compressedBytes.length >= item.file.size) {
                    bytes = new Uint8Array(item.buffer);
                    note = 'original kept (already small)';
                }

                const blob = createPdfBlob(bytes);
                const url = createObjectUrl(blob);
                const name = `${item.file.name.replace(/\.pdf$/i, '')}-compressed.pdf`;

                compressState.results.push({
                    name,
                    url,
                    blob,
                    originalSize: item.file.size,
                    size: blob.size
                });

                fillCompressRow(row, {
                    url,
                    name,
                    size: blob.size,
                    originalSize: item.file.size,
                    note
                });
            } catch (error) {
                console.error('Error compressing PDF:', error);
                fillCompressRowError(row, error.message || 'Compression failed');
            }
        }

        updateProgress(progressBar, progressText, 100);
        renderCompressTotals();

        if (compressState.results.length > 1) {
            await buildCompressZip(downloadAll);
        }

        if (compressState.results.length === 0) {
            showNotification('No files could be compressed', 'error');
        } else if (compressState.results.length < documents.length) {
            showNotification(`Compressed ${compressState.results.length} of ${documents.length} files`, 'info');
        } else {
            showNotification('PDFs compressed successfully!');
        }
    } catch (error) {
        console.error('Error compressing PDFs:', error);
        showNotification(error.message || 'Failed to compress PDFs', 'error');
    } finally {
        compressState.busy = false;
        toggleLoader(loader, false);
        updateCompressUi();
    }
}

/**
 * Create a results row for a file
 *
 * @param {File} file - Source file
 * @returns {HTMLTableRowElement} Row element with placeholder cells
 */
function createCompressRow(file) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.className = 'compress-name';
    nameCell.title = file.name;
    nameCell.textContent = file.name;

    const originalCell = document.createElement('td');
    originalCell.className = 'text-gray-600';
    originalCell.textContent = formatFileSize(file.size);

    const compressedCell = document.createElement('td');
    compressedCell.className = 'text-gray-600';
    compressedCell.textContent = '…';

    const savedCell = document.createElement('td');
    savedCell.textContent = '…';

    const actionCell = document.createElement('td');

    row.appendChild(nameCell);
    row.appendChild(originalCell);
    row.appendChild(compressedCell);
    row.appendChild(savedCell);
    row.appendChild(actionCell);

    return row;
}

/**
 * Fill in a successful results row
 *
 * @param {HTMLTableRowElement} row - Row to fill
 * @param {Object} result - { url, name, size, originalSize, note }
 */
function fillCompressRow(row, result) {
    const percentSaved = result.originalSize
        ? 100 - (result.size / result.originalSize) * 100
        : 0;

    row.children[2].textContent = formatFileSize(result.size);

    const savedCell = row.children[3];
    savedCell.textContent = '';

    const pill = document.createElement('span');
    pill.className = `compress-pill ${percentSaved > 0 ? 'good' : 'neutral'}`;
    pill.textContent = `${percentSaved > 0 ? '-' : '+'}${Math.abs(percentSaved).toFixed(1)}%`;
    savedCell.appendChild(pill);

    if (result.note) {
        const note = document.createElement('span');
        note.className = 'text-xs text-gray-500 ml-2';
        note.textContent = result.note;
        savedCell.appendChild(note);
    }

    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.name;
    link.className = 'text-green-600 hover:text-green-700 font-semibold';
    link.textContent = 'Download';
    row.children[4].appendChild(link);
}

/**
 * Fill in a failed results row
 *
 * @param {HTMLTableRowElement} row - Row to fill
 * @param {string} message - Error message
 */
function fillCompressRowError(row, message) {
    const savedCell = row.children[3];

    row.children[2].textContent = '';
    const pill = document.createElement('span');
    pill.className = 'compress-pill failed';
    pill.textContent = 'error';
    row.children[2].appendChild(pill);

    savedCell.textContent = '—';

    const note = document.createElement('span');
    note.className = 'text-xs text-gray-500';
    note.textContent = message;
    row.children[4].appendChild(note);
}

/**
 * Render the batch totals line
 */
function renderCompressTotals() {
    const totals = document.getElementById('compress-totals');
    if (!totals) return;

    if (compressState.results.length === 0) {
        totals.textContent = '';
        return;
    }

    const originalTotal = compressState.results.reduce((sum, r) => sum + r.originalSize, 0);
    const compressedTotal = compressState.results.reduce((sum, r) => sum + r.size, 0);
    const percentSaved = originalTotal ? 100 - (compressedTotal / originalTotal) * 100 : 0;

    totals.textContent = `Total: ${formatFileSize(originalTotal)} → ${formatFileSize(compressedTotal)} (${percentSaved.toFixed(1)}% smaller)`;
}

/**
 * Package every compressed file into a ZIP for a single download
 *
 * @param {HTMLAnchorElement} downloadAll - The "Download all" link
 */
async function buildCompressZip(downloadAll) {
    if (typeof JSZip === 'undefined' || !downloadAll) return;

    try {
        const zip = new JSZip();

        for (const result of compressState.results) {
            zip.file(result.name, result.blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });

        if (compressState.zipUrl) {
            revokeObjectUrl(compressState.zipUrl);
        }

        compressState.zipUrl = createObjectUrl(zipBlob);
        downloadAll.href = compressState.zipUrl;
        downloadAll.download = 'compressed-pdfs.zip';
        toggleVisibility(downloadAll, true);
    } catch (error) {
        console.error('Error creating ZIP:', error);
        showNotification('Could not package the compressed files', 'error');
    }
}

/**
 * Compress a single PDF document
 *
 * @param {Object} pdf - PDF.js document proxy
 * @param {number} dpi - Target resolution
 * @param {number} quality - JPEG quality (0-1)
 * @param {string} mode - 'colour' | 'gray' | 'bw'
 * @param {Function} onPage - Called once per rendered page
 * @returns {Promise<Uint8Array>} Compressed PDF bytes
 */
async function compressPdfDocument(pdf, dpi, quality, mode, onPage) {
    const outputDoc = await createPdfDocument();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Page size stays in points; only the raster resolution changes
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(dpi / 72, CONFIG.compress.maxScale);
        const viewport = page.getViewport({ scale });

        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, background: '#ffffff' }).promise;

        if (mode !== 'colour') {
            applyCompressColorFilter(ctx, canvas, mode);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const image = await outputDoc.embedJpg(dataUrl);
        const outputPage = outputDoc.addPage([baseViewport.width, baseViewport.height]);
        outputPage.drawImage(image, {
            x: 0,
            y: 0,
            width: baseViewport.width,
            height: baseViewport.height
        });

        page.cleanup();

        if (onPage) onPage();
    }

    return await outputDoc.save({ useObjectStreams: true });
}

/**
 * Convert the rendered canvas to greyscale or black & white
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} mode - 'gray' | 'bw'
 */
function applyCompressColorFilter(ctx, canvas, mode) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    if (mode === 'gray') {
        for (let i = 0; i < pixels.length; i += 4) {
            const luminance = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) | 0;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = luminance;
        }
    } else {
        const threshold = CONFIG.compress.bwThreshold;
        for (let i = 0; i < pixels.length; i += 4) {
            const luminance = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
            const value = luminance > threshold ? 255 : 0;
            pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}
