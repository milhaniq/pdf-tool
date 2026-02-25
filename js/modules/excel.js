/**
 * PDF to Excel Module
 * Handles converting PDF files to Excel spreadsheets
 */

import { showNotification, formatFileSize, toggleVisibility, toggleButtonDisabled, toggleLoader, updateProgress, createFileInfoHtml, toggleDragOver, validateFileType } from '../utils/uiUtils.js';
import { loadPdfDocument } from '../utils/pdfUtils.js';
import { CONFIG } from '../config.js';
import { extractTextItems, detectTables, reconstructCells, calculateColumnWidths } from '../utils/tableDetector.js';

/**
 * LocalStorage keys
 */
const STORAGE_KEY = 'pdf-tool-uploaded-file';
const STORAGE_META_KEY = 'pdf-tool-file-meta';
const STORAGE_MODE_KEY = 'pdf-tool-conversion-mode';

/**
 * Excel module state
 */
const state = {
    uploadedFile: null,
    blobUrl: null,
    conversionMode: 'ppt' // 'ppt' or 'excel'
};

/**
 * Save file to localStorage as base64
 * @param {File} file - File to save
 * @returns {Promise<boolean>} - True if saved successfully
 */
async function saveFileToStorage(file) {
    try {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = function(e) {
                try {
                    const base64 = e.target.result;
                    // Check if the data is too large for localStorage (~5MB limit)
                    const dataSize = new Blob([base64]).size;
                    if (dataSize > 4.5 * 1024 * 1024) { // 4.5MB to be safe
                        console.warn('[DEBUG] File too large for localStorage:', dataSize);
                        showNotification('File is too large to preserve after refresh. You will need to re-upload it.', 'warning');
                        resolve(false);
                        return;
                    }
                    
                    localStorage.setItem(STORAGE_KEY, base64);
                    localStorage.setItem(STORAGE_META_KEY, JSON.stringify({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified
                    }));
                    console.log('[DEBUG] File saved to localStorage');
                    resolve(true);
                } catch (error) {
                    console.error('[ERROR] Failed to save file to localStorage:', error);
                    resolve(false);
                }
            };
            reader.onerror = () => resolve(false);
            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('[ERROR] Error in saveFileToStorage:', error);
        return false;
    }
}

/**
 * Load file from localStorage
 * @returns {Promise<File|null>} - Restored file or null
 */
async function loadFileFromStorage() {
    try {
        const base64 = localStorage.getItem(STORAGE_KEY);
        const metaJson = localStorage.getItem(STORAGE_META_KEY);
        
        if (!base64 || !metaJson) {
            return null;
        }
        
        const meta = JSON.parse(metaJson);
        
        // Convert base64 back to Blob
        const response = await fetch(base64);
        const blob = await response.blob();
        
        // Create File object from Blob
        const file = new File([blob], meta.name, {
            type: meta.type,
            lastModified: meta.lastModified
        });
        
        console.log('[DEBUG] File loaded from localStorage:', file.name);
        return file;
    } catch (error) {
        console.error('[ERROR] Failed to load file from localStorage:', error);
        clearFileStorage();
        return null;
    }
}

/**
 * Clear file from localStorage
 */
function clearFileStorage() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
    localStorage.removeItem(STORAGE_MODE_KEY);
    console.log('[DEBUG] File storage cleared');
}

/**
 * Save conversion mode to localStorage
 */
function saveConversionMode() {
    localStorage.setItem(STORAGE_MODE_KEY, state.conversionMode);
    console.log('[DEBUG] Conversion mode saved:', state.conversionMode);
}

/**
 * Load conversion mode from localStorage
 */
function loadConversionMode() {
    const savedMode = localStorage.getItem(STORAGE_MODE_KEY);
    if (savedMode && (savedMode === 'ppt' || savedMode === 'excel')) {
        state.conversionMode = savedMode;
        console.log('[DEBUG] Conversion mode loaded:', state.conversionMode);
        
        // Update radio buttons to match saved mode
        const pptRadio = document.getElementById('convert-ppt-mode');
        const excelRadio = document.getElementById('convert-excel-mode');
        if (pptRadio && excelRadio) {
            if (state.conversionMode === 'ppt') {
                pptRadio.checked = true;
            } else {
                excelRadio.checked = true;
            }
        }
    }
}

/**
 * Initialize Excel conversion functionality
 */
export function initExcel() {
    console.log('[DEBUG] Initializing Excel module...');
    console.log('[DEBUG] Checking for conversion mode elements...');
    console.log('[DEBUG] convert-ppt-mode:', document.getElementById('convert-ppt-mode'));
    console.log('[DEBUG] convert-excel-mode:', document.getElementById('convert-excel-mode'));
    console.log('[DEBUG] conversion-mode-selection:', document.getElementById('conversion-mode-selection'));
    console.log('[DEBUG] excel-options:', document.getElementById('excel-options'));
    console.log('[DEBUG] excel-disclaimer:', document.getElementById('excel-disclaimer'));
    
    setupConversionModeToggle();
    setupEventListeners();
    // Don't restore file - page should start fresh
    console.log('[DEBUG] Excel module initialized');
}

/**
 * Restore file from localStorage on page load
 */
async function restoreFileFromStorage() {
    // Load conversion mode first
    loadConversionMode();
    
    const savedFile = await loadFileFromStorage();
    if (savedFile) {
        console.log('[DEBUG] Restoring file from storage:', savedFile.name);
        state.uploadedFile = savedFile;
        try {
            const arrayBuffer = await savedFile.arrayBuffer();
            const pdf = await loadPdfDocument(arrayBuffer);
            const pageCount = pdf.numPages;
            const fileInfo = document.getElementById('ppt-file-info');
            fileInfo.innerHTML = createFileInfoHtml(savedFile, pageCount);
            updateUi(true);
            showNotification('Previous file restored from storage');
            
            // Re-initialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('[ERROR] Error restoring file:', error);
            clearFileStorage();
        }
    }
}

/**
 * Setup conversion mode toggle (PPT vs Excel)
 */
function setupConversionModeToggle() {
    const pptRadio = document.getElementById('convert-ppt-mode');
    const excelRadio = document.getElementById('convert-excel-mode');
    const pptOptions = document.getElementById('ppt-options');
    const excelOptions = document.getElementById('excel-options');
    const excelDisclaimer = document.getElementById('excel-disclaimer');
    const pptBtn = document.getElementById('ppt-btn');
    
    if (pptRadio && excelRadio) {
        pptRadio.addEventListener('change', () => {
            state.conversionMode = 'ppt';
            saveConversionMode();
            toggleVisibility(pptOptions, true);
            toggleVisibility(excelOptions, false);
            toggleVisibility(excelDisclaimer, false);
            if (pptBtn) {
                pptBtn.innerHTML = `
                    <span class="flex items-center gap-2">
                        <i data-lucide="presentation" class="w-5 h-5"></i>
                        Convert to PowerPoint
                    </span>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
        
        excelRadio.addEventListener('change', () => {
            state.conversionMode = 'excel';
            saveConversionMode();
            toggleVisibility(pptOptions, false);
            toggleVisibility(excelOptions, true);
            toggleVisibility(excelDisclaimer, true);
            if (pptBtn) {
                pptBtn.innerHTML = `
                    <span class="flex items-center gap-2">
                        <i data-lucide="table" class="w-5 h-5"></i>
                        Convert to Excel
                    </span>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const dropZone = document.getElementById('ppt-drop-zone');
    const fileInput = document.getElementById('ppt-file-input');
    const clearBtn = document.getElementById('ppt-clear');
    const convertBtn = document.getElementById('ppt-btn');

    // Drop zone click
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
    }

    // Drag and drop events
    if (dropZone) {
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
    }

    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', resetState);
    }

    // Convert button
    if (convertBtn) {
        convertBtn.addEventListener('click', handleConvert);
    }
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

        // Save file to localStorage for persistence
        await saveFileToStorage(file);

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
    console.log('[DEBUG] updateUi called with hasFile:', hasFile);
    console.log('[DEBUG] conversionMode:', state.conversionMode);
    
    const convertBtn = document.getElementById('ppt-btn');
    const fileSection = document.getElementById('ppt-file-section');
    const pptOptions = document.getElementById('ppt-options');
    const excelOptions = document.getElementById('excel-options');
    const conversionModeSelection = document.getElementById('conversion-mode-selection');
    const excelDisclaimer = document.getElementById('excel-disclaimer');

    console.log('[DEBUG] Elements found:', {
        convertBtn: !!convertBtn,
        fileSection: !!fileSection,
        pptOptions: !!pptOptions,
        excelOptions: !!excelOptions,
        conversionModeSelection: !!conversionModeSelection,
        excelDisclaimer: !!excelDisclaimer
    });

    toggleButtonDisabled(convertBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(conversionModeSelection, hasFile);
    
    console.log('[DEBUG] Showing conversion mode selection:', hasFile);
    
    // Show appropriate options based on current mode
    if (state.conversionMode === 'excel') {
        toggleVisibility(pptOptions, false);
        toggleVisibility(excelOptions, hasFile);
        toggleVisibility(excelDisclaimer, hasFile);
        console.log('[DEBUG] Excel mode - showing Excel options');
    } else {
        toggleVisibility(pptOptions, hasFile);
        toggleVisibility(excelOptions, false);
        toggleVisibility(excelDisclaimer, false);
        console.log('[DEBUG] PPT mode - showing PPT options');
    }
    
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
 * Handle convert button click
 */
async function handleConvert() {
    if (!state.uploadedFile) return;

    console.log('[DEBUG] handleConvert called, conversionMode:', state.conversionMode);

    if (state.conversionMode === 'excel') {
        await convertToExcel();
    } else {
        await convertToPpt();
    }
}

/**
 * Convert PDF to Excel
 */
async function convertToExcel() {
    if (!state.uploadedFile) return;

    const convertBtn = document.getElementById('ppt-btn');
    const loader = document.getElementById('ppt-loader');
    const downloadLink = document.getElementById('ppt-download-link');
    const progressContainer = document.getElementById('ppt-progress-container');
    const progressBar = document.getElementById('ppt-progress-bar');
    const progressText = document.getElementById('ppt-progress-text');

    toggleButtonDisabled(convertBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);
    toggleVisibility(progressContainer, true);

    try {
        // Check if SheetJS is available
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS library not loaded. Please refresh the page.');
        }

        const arrayBuffer = await state.uploadedFile.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        const numPages = pdf.numPages;

        // Get conversion options
        const detectMultipleTables = document.getElementById('excel-detect-multiple')?.checked ?? true;
        const includePageNumbers = document.getElementById('excel-page-numbers')?.checked ?? true;
        const autoDetectHeaders = document.getElementById('excel-auto-headers')?.checked ?? true;

        const allTables = [];
        let totalPagesProcessed = 0;

        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const progress = (pageNum / numPages) * 90; // Leave 10% for Excel generation
            updateProgress(progressBar, progressText, progress);
            progressText.textContent = `Processing page ${pageNum} of ${numPages}...`;

            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Extract text items
            const textItems = extractTextItems(textContent);
            
            if (textItems.length === 0) {
                console.log(`No text found on page ${pageNum}`);
                continue;
            }

            // Detect tables
            const tables = detectTables(textItems);
            
            if (tables.length === 0) {
                console.log(`No tables detected on page ${pageNum}`);
                // Create a simple row from all text items
                const simpleRow = textItems.map(item => item.text).join(' ');
                allTables.push({
                    data: [[simpleRow]],
                    sheetName: includePageNumbers ? `Page ${pageNum}` : `Sheet ${allTables.length + 1}`,
                    page: pageNum
                });
                continue;
            }

            // Process detected tables
            for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
                const table = tables[tableIndex];
                const cells = reconstructCells(table.rows, table.columns);
                
                // Skip empty tables
                if (cells.length === 0 || cells.every(row => row.every(cell => !cell))) {
                    continue;
                }

                let sheetName;
                if (detectMultipleTables && tables.length > 1) {
                    sheetName = includePageNumbers 
                        ? `P${pageNum}-T${tableIndex + 1}` 
                        : `Table ${allTables.length + 1}`;
                } else {
                    sheetName = includePageNumbers 
                        ? `Page ${pageNum}` 
                        : `Sheet ${allTables.length + 1}`;
                }

                // Truncate sheet name if too long (Excel limit: 31 chars)
                sheetName = sheetName.substring(0, CONFIG.excel.maxSheetNameLength);

                allTables.push({
                    data: cells,
                    sheetName,
                    page: pageNum,
                    confidence: table.confidence,
                    gridDensity: table.gridDensity,
                    consistency: table.consistency
                });
            }

            totalPagesProcessed++;
        }

        if (allTables.length === 0) {
            throw new Error('No tables or text could be extracted from the PDF');
        }

        updateProgress(progressBar, progressText, 95);
        progressText.textContent = 'Generating Excel file...';

        // Create Excel workbook
        const workbook = XLSX.utils.book_new();

        for (const table of allTables) {
            const worksheet = XLSX.utils.aoa_to_sheet(table.data);

            // Apply formatting
            if (CONFIG.excel.autoFitColumns) {
                const colWidths = calculateColumnWidths(table.data);
                worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
            }

            // Add auto-filter for headers
            if (CONFIG.excel.autoFilter && table.data.length > 0) {
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            // Make first row bold
            if (CONFIG.excel.boldHeaders && table.data.length > 0) {
                for (let col = 0; col < table.data[0].length; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!worksheet[cellAddress]) continue;
                    worksheet[cellAddress].s = {
                        font: { bold: true }
                    };
                }
            }

            // Add sheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, table.sheetName);
        }

        updateProgress(progressBar, progressText, 100);
        progressText.textContent = 'Complete!';

        // Generate and download
        const fileName = `${state.uploadedFile.name.replace('.pdf', '')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toggleLoader(loader, false);
        toggleButtonDisabled(convertBtn, false);
        
        // Show success message with details
        const tableCount = allTables.length;
        const avgConfidence = (allTables.reduce((sum, t) => sum + (t.confidence || 0), 0) / tableCount * 100).toFixed(0);
        
        showNotification(
            `Successfully converted ${tableCount} table(s) to Excel! Average confidence: ${avgConfidence}%`
        );

        // Clear file from storage before refresh
        clearFileStorage();

        // Refresh page after a short delay to allow user to see the notification
        setTimeout(() => {
            console.log('[DEBUG] Refreshing page after conversion...');
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error converting to Excel:', error);
        showNotification(error.message || 'Failed to convert PDF to Excel', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(convertBtn, false);
    }
}

/**
 * Convert PDF to PowerPoint (existing functionality)
 */
async function convertToPpt() {
    if (!state.uploadedFile) return;

    const convertBtn = document.getElementById('ppt-btn');
    const loader = document.getElementById('ppt-loader');
    const downloadLink = document.getElementById('ppt-download-link');
    const progressContainer = document.getElementById('ppt-progress-container');
    const progressBar = document.getElementById('ppt-progress-bar');
    const progressText = document.getElementById('ppt-progress-text');

    toggleButtonDisabled(convertBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);
    toggleVisibility(progressContainer, true);

    try {
        const arrayBuffer = await state.uploadedFile.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        const numPages = pdf.numPages;

        const preserveAspect = document.getElementById('preserve-aspect')?.checked ?? true;
        const highQuality = document.getElementById('high-quality')?.checked ?? false;
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
        toggleButtonDisabled(convertBtn, false);
        showNotification('PDF converted to PowerPoint successfully!');

        // Clear file from storage before refresh
        clearFileStorage();

        // Refresh page after a short delay to allow user to see the notification
        setTimeout(() => {
            console.log('[DEBUG] Refreshing page after conversion...');
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error converting to PPT:', error);
        showNotification(error.message || 'Failed to convert PDF to PowerPoint', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(convertBtn, false);
    }
}

/**
 * Reset state
 */
function resetState() {
    state.uploadedFile = null;

    const fileInfo = document.getElementById('ppt-file-info');
    if (fileInfo) fileInfo.innerHTML = '';

    updateUi(false);
    
    const fileInput = document.getElementById('ppt-file-input');
    if (fileInput) fileInput.value = '';
    
    // Clear file from localStorage
    clearFileStorage();
}

/**
 * Reset Excel module (exported for cleanup)
 */
export function resetExcel() {
    resetState();
    if (state.blobUrl) {
        URL.revokeObjectURL(state.blobUrl);
        state.blobUrl = null;
    }
}
