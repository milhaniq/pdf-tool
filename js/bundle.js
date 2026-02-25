/**
 * PDF Tools Suite - Bundled Version
 * All modules combined into a single file for direct file:// protocol access
 * This file is auto-generated from the modular structure
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // CDN URLs
    cdn: {
        pdfJsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
        pdfLib: 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js',
        sortableJs: 'https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js',
        jsZip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        pdfJs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
        pptxGenJs: 'https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
        tailwind: 'https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp',
        lucide: 'https://unpkg.com/lucide@latest'
    },

    // PDF rendering settings
    pdf: {
        defaultScale: 1.5,
        highQualityScale: 2,
        normalQualityScale: 1.5
    },

    // Annotation settings
    annotation: {
        minAnnotationSize: 5,
        clickThreshold: 5,
        blurDelay: 200,
        defaultLineWidth: 3,
        minLineWidth: 1,
        maxLineWidth: 20
    },

    // Text editor settings
    textEditor: {
        fontSizeMultiplier: 4,
        fontSizeOffset: 12,
        minFontSize: 8,
        maxFontSize: 72
    },

    // UI settings
    ui: {
        notificationDuration: 3000,
        dragOverScale: 1.02
    },

    // File size formatting
    fileSize: {
        units: ['Bytes', 'KB', 'MB', 'GB'],
        kilo: 1024
    },

    // Excel conversion settings
    excel: {
        // Table detection thresholds
        rowThreshold: 5,        // Y-coordinate tolerance for row grouping (pixels)
        columnThreshold: 10,    // X-coordinate tolerance for column clustering (pixels)
        minGridDensity: 0.6,    // Minimum grid density to consider as table
        minColumnConsistency: 0.7, // Minimum column consistency
        
        // Table requirements
        minRows: 2,             // Minimum rows to qualify as table
        minCols: 2,             // Minimum columns to qualify as table
        maxEmptyCells: 0.3,     // Max percentage of empty cells allowed
        
        // Merged cell detection
        mergedCellThreshold: 0.9, // Width ratio to detect potential merge
        
        // Formatting
        autoFilter: true,       // Add auto-filter to headers
        autoFitColumns: true,   // Auto-fit column widths
        boldHeaders: true,      // Make first row bold
        
        // Sheet settings
        maxSheetNameLength: 31, // Excel sheet name limit
        defaultSheetName: 'Sheet',
        maxTablesPerSheet: 50   // Maximum tables to process
    }
};

// ============================================================================
// PDF UTILITIES
// ============================================================================

function initPdfJsWorker() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.cdn.pdfJsWorker;
    }
}

function canvasToPdfCoords(canvasX, canvasY, pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight) {
    const scaleX = pdfPageWidth / viewportWidth;
    const scaleY = pdfPageHeight / viewportHeight;

    return {
        x: canvasX * scaleX,
        y: pdfPageHeight - (canvasY * scaleY)
    };
}

function calculateScaleFactors(viewport, pdfPageWidth, pdfPageHeight) {
    return {
        scaleX: pdfPageWidth / viewport.width,
        scaleY: pdfPageHeight / viewport.height
    };
}

async function getViewport(pdfPage, scale = CONFIG.pdf.defaultScale) {
    return await pdfPage.getViewport({ scale });
}

function sanitizeTextForPdf(text) {
    if (!text) return '';
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u0100-\uFFFF]/g, '?');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

async function loadPdfDocument(arrayBuffer) {
    return await pdfjsLib.getDocument(arrayBuffer).promise;
}

async function loadPdfLibDocument(arrayBuffer) {
    return await PDFLib.PDFDocument.load(arrayBuffer);
}

async function createPdfDocument() {
    return await PDFLib.PDFDocument.create();
}

async function savePdfDocument(pdfDoc) {
    return await pdfDoc.save();
}

function createPdfBlob(pdfBytes) {
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

function createObjectUrl(blob) {
    return URL.createObjectURL(blob);
}

function revokeObjectUrl(url) {
    if (url) {
        URL.revokeObjectURL(url);
    }
}

function downloadBlob(blob, filename) {
    const url = createObjectUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    revokeObjectUrl(url);
}

// ============================================================================
// ANNOTATION UTILITIES
// ============================================================================

function calculateFontSize(sliderValue) {
    return sliderValue * CONFIG.textEditor.fontSizeMultiplier + CONFIG.textEditor.fontSizeOffset;
}

function createAnnotation(type, x, y, color, lineWidth, pageNumber) {
    return {
        id: Date.now(),
        type,
        x,
        y,
        endX: x,
        endY: y,
        color,
        lineWidth,
        pageNumber
    };
}

function createTextAnnotation(x, y, text, color, fontSize, pageNumber) {
    return {
        id: Date.now(),
        type: 'text',
        x,
        y,
        text,
        color,
        fontSize,
        pageNumber
    };
}

function isAnnotationAt(annotation, x, y) {
    if (annotation.type === 'text') {
        return Math.abs(x - annotation.x) < 50 && Math.abs(y - annotation.y) < 20;
    } else {
        const minX = Math.min(annotation.x, annotation.endX);
        const maxX = Math.max(annotation.x, annotation.endX);
        const minY = Math.min(annotation.y, annotation.endY);
        const maxY = Math.max(annotation.y, annotation.endY);

        return x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10;
    }
}

function findAnnotationAt(annotations, pageNumber, x, y) {
    for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (ann.pageNumber !== pageNumber) continue;

        if (isAnnotationAt(ann, x, y)) {
            return ann;
        }
    }
    return null;
}

function validateAnnotationSize(annotation) {
    const dx = Math.abs(annotation.endX - annotation.x);
    const dy = Math.abs(annotation.endY - annotation.y);

    return dx > CONFIG.annotation.minAnnotationSize ||
           dy > CONFIG.annotation.minAnnotationSize;
}

function moveAnnotation(annotation, dx, dy) {
    annotation.x += dx;
    annotation.y += dy;
    if (annotation.endX !== undefined) {
        annotation.endX += dx;
        annotation.endY += dy;
    }
}

function drawArrowOnCanvas(ctx, fromX, fromY, toX, toY, lineWidth) {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawAnnotationOnCanvas(ctx, ann, isSelected = false) {
    ctx.save();
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.lineWidth || CONFIG.annotation.defaultLineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isSelected) {
        ctx.shadowColor = '#667eea';
        ctx.shadowBlur = 10;
    }

    switch (ann.type) {
        case 'text':
            ctx.font = `${ann.fontSize || 16}px Inter, sans-serif`;
            ctx.fillText(ann.text, ann.x, ann.y);
            break;

        case 'highlight':
            ctx.globalAlpha = 0.3;
            const width = ann.endX - ann.x;
            const height = ann.endY - ann.y;
            ctx.fillRect(ann.x, ann.y, width, height);
            break;

        case 'arrow':
            drawArrowOnCanvas(ctx, ann.x, ann.y, ann.endX, ann.endY, ann.lineWidth);
            break;

        case 'rect':
            ctx.strokeRect(ann.x, ann.y, ann.endX - ann.x, ann.endY - ann.y);
            break;

        case 'circle':
            const radiusX = Math.abs(ann.endX - ann.x) / 2;
            const radiusY = Math.abs(ann.endY - ann.y) / 2;
            const centerX = ann.x + (ann.endX - ann.x) / 2;
            const centerY = ann.y + (ann.endY - ann.y) / 2;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;

        case 'line':
            ctx.beginPath();
            ctx.moveTo(ann.x, ann.y);
            ctx.lineTo(ann.endX, ann.endY);
            ctx.stroke();
            break;
    }

    ctx.restore();
}

function drawArrowOnPdf(page, fromX, fromY, toX, toY, thickness, rgbColor) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    page.drawLine({
        start: { x: toX, y: toY },
        end: {
            x: toX - headLength * Math.cos(angle - Math.PI / 6),
            y: toY - headLength * Math.sin(angle - Math.PI / 6)
        },
        thickness,
        color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b)
    });

    page.drawLine({
        start: { x: toX, y: toY },
        end: {
            x: toX - headLength * Math.cos(angle + Math.PI / 6),
            y: toY - headLength * Math.sin(angle + Math.PI / 6)
        },
        thickness,
        color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b)
    });
}

async function burnAnnotationToPdf(page, ann, pdfPageWidth, pdfPageHeight, viewport, pdfDoc) {
    const coords = canvasToPdfCoords(
        ann.x,
        ann.y,
        pdfPageWidth,
        pdfPageHeight,
        viewport.width,
        viewport.height
    );

    const rgbColor = hexToRgb(ann.color);
    const scaleX = pdfPageWidth / viewport.width;
    const scaleY = pdfPageHeight / viewport.height;

    switch (ann.type) {
        case 'text':
            const fontSize = (ann.fontSize || 16) * scaleX;
            const sanitizedText = sanitizeTextForPdf(ann.text);
            page.drawText(sanitizedText, {
                x: coords.x,
                y: coords.y - fontSize,
                size: fontSize,
                font: await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica),
                color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b)
            });
            break;

        case 'highlight':
            const highlightWidth = (ann.endX - ann.x) * scaleX;
            const highlightHeight = (ann.endY - ann.y) * scaleY;
            page.drawRectangle({
                x: coords.x,
                y: pdfPageHeight - (ann.endY * scaleY),
                width: highlightWidth,
                height: highlightHeight,
                color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                opacity: 0.3
            });
            break;

        case 'arrow':
            const arrowEndX = ann.endX * scaleX;
            const arrowEndY = pdfPageHeight - (ann.endY * scaleY);
            page.drawLine({
                start: { x: coords.x, y: coords.y },
                end: { x: arrowEndX, y: arrowEndY },
                thickness: (ann.lineWidth || 3) * scaleX,
                color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b)
            });
            drawArrowOnPdf(page, coords.x, coords.y, arrowEndX, arrowEndY, (ann.lineWidth || 3) * scaleX, rgbColor);
            break;

        case 'rect':
            const rectWidth = (ann.endX - ann.x) * scaleX;
            const rectHeight = (ann.endY - ann.y) * scaleY;
            page.drawRectangle({
                x: coords.x,
                y: pdfPageHeight - (ann.endY * scaleY),
                width: rectWidth,
                height: rectHeight,
                borderColor: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                borderWidth: (ann.lineWidth || 3) * scaleX
            });
            break;

        case 'circle':
            const circleRadiusX = Math.abs(ann.endX - ann.x) * scaleX / 2;
            const circleRadiusY = Math.abs(ann.endY - ann.y) * scaleY / 2;
            const circleCenterX = coords.x + circleRadiusX;
            const circleCenterY = pdfPageHeight - (ann.y * scaleY) - circleRadiusY;
            page.drawEllipse({
                x: circleCenterX,
                y: circleCenterY,
                xScale: circleRadiusX,
                yScale: circleRadiusY,
                borderColor: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                borderWidth: (ann.lineWidth || 3) * scaleX
            });
            break;

        case 'line':
            const lineEndX = ann.endX * scaleX;
            const lineEndY = pdfPageHeight - (ann.endY * scaleY);
            page.drawLine({
                start: { x: coords.x, y: coords.y },
                end: { x: lineEndX, y: lineEndY },
                thickness: (ann.lineWidth || 3) * scaleX,
                color: PDFLib.rgb(rgbColor.r, rgbColor.g, rgbColor.b)
            });
            break;
    }
}

function filterAnnotationsByPage(annotations, pageNumber) {
    return annotations.filter(ann => ann.pageNumber === pageNumber);
}

// ============================================================================
// UI UTILITIES
// ============================================================================

function showNotification(message, type = 'success') {
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

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, CONFIG.ui.notificationDuration);
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = CONFIG.fileSize.kilo;
    const sizes = CONFIG.fileSize.units;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function setActiveTab(activeTab, inactiveTabs, activeContent, inactiveContents) {
    activeTab.classList.add('active');
    inactiveTabs.forEach(tab => tab.classList.remove('active'));
    activeContent.classList.remove('hidden');
    inactiveContents.forEach(content => content.classList.add('hidden'));
}

function getCanvasCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function createFileInfoHtml(file, pageCount = null) {
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

function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function toggleVisibility(element, visible) {
    if (visible) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

function toggleButtonDisabled(button, disabled) {
    button.disabled = disabled;
}

function toggleLoader(loader, show) {
    toggleVisibility(loader, show);
}

function updateProgress(progressBar, progressText, percent) {
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(percent)}%`;
    }
}

function toggleDragOver(element, isOver) {
    if (isOver) {
        element.classList.add('drag-over');
    } else {
        element.classList.remove('drag-over');
    }
}

function validateFileType(file, expectedType) {
    return file && file.type === expectedType;
}

function handleFileReadError(error, fileName) {
    console.error('Error reading file:', error);
    showNotification(`Could not read file "${fileName}"`, 'error');
}

// ============================================================================
// MERGE MODULE
// ============================================================================

const mergeState = {
    uploadedFiles: [],
    sortable: null,
    blobUrl: null
};

function initMerge() {
    const dropZone = document.getElementById('merge-drop-zone');
    const fileInput = document.getElementById('merge-file-input');
    const clearAllBtn = document.getElementById('merge-clear-all');
    const mergeBtn = document.getElementById('merge-btn');

    dropZone.addEventListener('click', () => fileInput.click());

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
        handleMergeFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleMergeFiles(e.target.files);
    });

    clearAllBtn.addEventListener('click', clearAllMergeFiles);
    mergeBtn.addEventListener('click', mergePdfs);
}

async function handleMergeFiles(files) {
    for (let i = 0; i < files.length; i++) {
        if (files[i].type === 'application/pdf') {
            try {
                const arrayBuffer = await files[i].arrayBuffer();
                mergeState.uploadedFiles.push({
                    file: files[i],
                    content: arrayBuffer,
                    name: files[i].name,
                    size: files[i].size
                });
            } catch (error) {
                console.error('Error reading file:', error);
                showNotification(`Could not read file "${files[i].name}"`, 'error');
            }
        } else {
            showNotification(`"${files[i].name}" is not a PDF file`, 'error');
        }
    }

    renderMergeFileList();
    updateMergeUi();
}

function renderMergeFileList() {
    const fileList = document.getElementById('merge-file-list');
    fileList.innerHTML = '';

    if (mergeState.uploadedFiles.length === 0) {
        return;
    }

    mergeState.uploadedFiles.forEach((fileObj, index) => {
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

    document.querySelectorAll('.remove-file').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            removeMergeFile(index);
        });
    });

    initMergeSortable();
    initLucideIcons();
}

function initMergeSortable() {
    if (mergeState.sortable) {
        mergeState.sortable.destroy();
    }

    if (typeof Sortable !== 'undefined') {
        const fileList = document.getElementById('merge-file-list');
        mergeState.sortable = new Sortable(fileList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.drag-handle',
            onEnd: function(evt) {
                const item = mergeState.uploadedFiles.splice(evt.oldIndex, 1)[0];
                mergeState.uploadedFiles.splice(evt.newIndex, 0, item);
            }
        });
    }
}

function removeMergeFile(index) {
    mergeState.uploadedFiles.splice(index, 1);
    renderMergeFileList();
    updateMergeUi();
    hideMergeDownloadLink();
}

function clearAllMergeFiles() {
    mergeState.uploadedFiles = [];
    renderMergeFileList();
    updateMergeUi();
    hideMergeDownloadLink();
    document.getElementById('merge-file-input').value = '';
}

function updateMergeUi() {
    const hasFiles = mergeState.uploadedFiles.length > 0;
    const mergeBtn = document.getElementById('merge-btn');
    const fileSection = document.getElementById('merge-file-section');

    toggleButtonDisabled(mergeBtn, !hasFiles);
    toggleVisibility(fileSection, hasFiles);
}

function hideMergeDownloadLink() {
    const downloadLink = document.getElementById('merge-download-link');
    toggleVisibility(downloadLink, false);

    if (mergeState.blobUrl) {
        revokeObjectUrl(mergeState.blobUrl);
        mergeState.blobUrl = null;
    }
}

async function mergePdfs() {
    if (mergeState.uploadedFiles.length === 0) return;

    const mergeBtn = document.getElementById('merge-btn');
    const loader = document.getElementById('merge-loader');
    const downloadLink = document.getElementById('merge-download-link');

    toggleButtonDisabled(mergeBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);

    try {
        const mergedPdf = await createPdfDocument();

        for (const fileObj of mergeState.uploadedFiles) {
            try {
                const pdf = await loadPdfLibDocument(fileObj.content);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            } catch (error) {
                console.error('Error processing PDF:', error);
                throw new Error(`Failed to process "${fileObj.name}"`);
            }
        }

        const mergedPdfBytes = await savePdfDocument(mergedPdf);
        const blob = createPdfBlob(mergedPdfBytes);

        if (mergeState.blobUrl) {
            revokeObjectUrl(mergeState.blobUrl);
        }

        mergeState.blobUrl = createObjectUrl(blob);
        downloadLink.href = mergeState.blobUrl;
        downloadLink.download = 'merged.pdf';
        toggleVisibility(downloadLink, true);
        toggleLoader(loader, false);
        showNotification('PDFs merged successfully!');
    } catch (error) {
        console.error('Error merging PDFs:', error);
        showNotification(error.message || 'Failed to merge PDFs', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(mergeBtn, false);
    }
}

// ============================================================================
// SPLIT MODULE
// ============================================================================

const splitState = {
    uploadedFile: null,
    pdfDoc: null,
    blobUrl: null,
    mergedBlobUrl: null,
    hasSplitFile: false
};

function initSplit() {
    const dropZone = document.getElementById('split-drop-zone');
    const fileInput = document.getElementById('split-file-input');
    const clearBtn = document.getElementById('split-clear');
    const splitBtn = document.getElementById('split-btn');

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
        handleSplitFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        handleSplitFile(e.target.files[0]);
    });

    clearBtn.addEventListener('click', resetSplitState);
    splitBtn.addEventListener('click', splitPdf);

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

    document.getElementById('merge-split-files').addEventListener('change', (e) => {
        const reuploadWarning = document.getElementById('reupload-warning');

        if (splitState.hasSplitFile) {
            toggleVisibility(reuploadWarning, true);
            e.target.checked = !e.target.checked;
            showNotification('Please reupload the file to change the merge option', 'info');
        }
    });
}

async function handleSplitFile(file) {
    if (!validateFileType(file, 'application/pdf')) {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    try {
        splitState.uploadedFile = file;
        const arrayBuffer = await file.arrayBuffer();
        splitState.pdfDoc = await loadPdfLibDocument(arrayBuffer);

        const pageCount = splitState.pdfDoc.getPageCount();
        const fileInfo = document.getElementById('split-file-info');
        fileInfo.innerHTML = createFileInfoHtml(file, pageCount);

        updateSplitUi(true);
        splitState.hasSplitFile = false;
        toggleVisibility(document.getElementById('reupload-warning'), false);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error reading PDF:', error);
        showNotification('Failed to read the PDF file', 'error');
    }
}

function updateSplitUi(hasFile) {
    const splitBtn = document.getElementById('split-btn');
    const fileSection = document.getElementById('split-file-section');
    const options = document.getElementById('split-options');

    toggleButtonDisabled(splitBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(options, hasFile);
    hideSplitDownloadLinks();
}

function hideSplitDownloadLinks() {
    const downloadLink = document.getElementById('split-download-link');
    const mergedDownloadLink = document.getElementById('split-merged-download-link');

    toggleVisibility(downloadLink, false);
    toggleVisibility(mergedDownloadLink, false);

    if (splitState.blobUrl) {
        revokeObjectUrl(splitState.blobUrl);
        splitState.blobUrl = null;
    }
    if (splitState.mergedBlobUrl) {
        revokeObjectUrl(splitState.mergedBlobUrl);
        splitState.mergedBlobUrl = null;
    }
}

async function splitPdf() {
    if (!splitState.pdfDoc) return;

    const splitBtn = document.getElementById('split-btn');
    const loader = document.getElementById('split-loader');
    const downloadLink = document.getElementById('split-download-link');
    const mergedDownloadLink = document.getElementById('split-merged-download-link');

    toggleButtonDisabled(splitBtn, true);
    toggleLoader(loader, true);
    toggleVisibility(downloadLink, false);
    toggleVisibility(mergedDownloadLink, false);

    try {
        const pageCount = splitState.pdfDoc.getPageCount();
        const splitOption = document.querySelector('input[name="split-option"]:checked').value;
        const mergeSplitFiles = document.getElementById('merge-split-files').checked;

        const splitPdfs = [];

        if (splitOption === 'pages') {
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await createPdfDocument();
                const [page] = await newPdf.copyPages(splitState.pdfDoc, [i]);
                newPdf.addPage(page);

                const pdfBytes = await savePdfDocument(newPdf);
                splitPdfs.push({
                    bytes: pdfBytes,
                    name: `${splitState.uploadedFile.name.replace('.pdf', '')}_page_${i + 1}.pdf`
                });
            }
        } else if (splitOption === 'range') {
            const pageRanges = document.getElementById('page-ranges').value;
            const ranges = parsePageRanges(pageRanges, pageCount);

            for (let i = 0; i < ranges.length; i++) {
                const [start, end] = ranges[i];
                const newPdf = await createPdfDocument();
                const pages = await newPdf.copyPages(
                    splitState.pdfDoc,
                    Array.from({ length: end - start + 1 }, (_, j) => start + j - 1)
                );
                pages.forEach(page => newPdf.addPage(page));

                const pdfBytes = await savePdfDocument(newPdf);
                splitPdfs.push({
                    bytes: pdfBytes,
                    name: `${splitState.uploadedFile.name.replace('.pdf', '')}_pages_${start}-${end}.pdf`
                });
            }
        }

        if (splitOption === 'range' && mergeSplitFiles) {
            const mergedPdf = await createPdfDocument();

            for (const splitPdf of splitPdfs) {
                const pdf = await loadPdfLibDocument(splitPdf.bytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await savePdfDocument(mergedPdf);
            const blob = createPdfBlob(mergedPdfBytes);

            if (splitState.mergedBlobUrl) {
                revokeObjectUrl(splitState.mergedBlobUrl);
            }

            splitState.mergedBlobUrl = createObjectUrl(blob);
            mergedDownloadLink.href = splitState.mergedBlobUrl;
            mergedDownloadLink.download = `${splitState.uploadedFile.name.replace('.pdf', '')}_merged.pdf`;
            toggleVisibility(mergedDownloadLink, true);

            showNotification('PDF split and merged successfully!');
        } else {
            if (typeof JSZip !== 'undefined') {
                const zip = new JSZip();

                for (const splitPdf of splitPdfs) {
                    zip.file(splitPdf.name, splitPdf.bytes);
                }

                const zipBlob = await zip.generateAsync({ type: 'blob' });

                if (splitState.blobUrl) {
                    revokeObjectUrl(splitState.blobUrl);
                }

                splitState.blobUrl = createObjectUrl(zipBlob);
                downloadLink.href = splitState.blobUrl;
                downloadLink.download = `${splitState.uploadedFile.name.replace('.pdf', '')}_split.zip`;
                toggleVisibility(downloadLink, true);

                showNotification('PDF split successfully!');
            }
        }

        splitState.hasSplitFile = true;

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

function resetSplitState() {
    splitState.uploadedFile = null;
    splitState.pdfDoc = null;
    splitState.hasSplitFile = false;

    const fileInfo = document.getElementById('split-file-info');
    fileInfo.innerHTML = '';

    updateSplitUi(false);
    toggleVisibility(document.getElementById('reupload-warning'), false);
    document.getElementById('split-file-input').value = '';
}

// ============================================================================
// PPT MODULE
// ============================================================================

const pptState = {
    uploadedFile: null,
    blobUrl: null
};

function initPpt() {
    const dropZone = document.getElementById('ppt-drop-zone');
    const fileInput = document.getElementById('ppt-file-input');
    const clearBtn = document.getElementById('ppt-clear');
    const pptBtn = document.getElementById('ppt-btn');

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
        handlePptFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        handlePptFile(e.target.files[0]);
    });

    clearBtn.addEventListener('click', resetPptState);
    pptBtn.addEventListener('click', convertToPpt);
}

async function handlePptFile(file) {
    if (!validateFileType(file, 'application/pdf')) {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    try {
        pptState.uploadedFile = file;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);

        const pageCount = pdf.numPages;
        const fileInfo = document.getElementById('ppt-file-info');
        fileInfo.innerHTML = createFileInfoHtml(file, pageCount);

        updatePptUi(true);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error reading PDF:', error);
        showNotification('Failed to read the PDF file', 'error');
    }
}

function updatePptUi(hasFile) {
    const pptBtn = document.getElementById('ppt-btn');
    const fileSection = document.getElementById('ppt-file-section');
    const options = document.getElementById('ppt-options');

    toggleButtonDisabled(pptBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(options, hasFile);
    hidePptDownloadLink();
}

function hidePptDownloadLink() {
    const downloadLink = document.getElementById('ppt-download-link');
    toggleVisibility(downloadLink, false);

    if (pptState.blobUrl) {
        URL.revokeObjectURL(pptState.blobUrl);
        pptState.blobUrl = null;
    }
}

async function convertToPpt() {
    if (!pptState.uploadedFile) return;

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
        const arrayBuffer = await pptState.uploadedFile.arrayBuffer();
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

        const fileName = `${pptState.uploadedFile.name.replace('.pdf', '')}.pptx`;
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

function resetPptState() {
    pptState.uploadedFile = null;

    const fileInfo = document.getElementById('ppt-file-info');
    fileInfo.innerHTML = '';

    updatePptUi(false);
    document.getElementById('ppt-file-input').value = '';
}

// ============================================================================
// TABLE DETECTION UTILITIES
// ============================================================================

function groupTextItemsByY(textItems, threshold = CONFIG.excel.rowThreshold) {
    if (!textItems || textItems.length === 0) return [];
    
    const sorted = [...textItems].sort((a, b) => b.y - a.y);
    const rows = [];
    let currentRow = [sorted[0]];
    let currentY = sorted[0].y;
    
    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        
        if (Math.abs(item.y - currentY) <= threshold) {
            currentRow.push(item);
        } else {
            rows.push(currentRow);
            currentRow = [item];
            currentY = item.y;
        }
    }
    
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
    
    return rows;
}

function extractXPositionsFromRows(rows) {
    const xPositions = new Set();
    
    for (const row of rows) {
        for (const item of row) {
            xPositions.add(Math.round(item.x));
        }
    }
    
    return Array.from(xPositions).sort((a, b) => a - b);
}

function clusterXPositions(xPositions, threshold = CONFIG.excel.columnThreshold) {
    if (!xPositions || xPositions.length === 0) return [];
    
    const sorted = [...xPositions].sort((a, b) => a - b);
    const clusters = [];
    let currentCluster = [sorted[0]];
    let currentX = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
        const x = sorted[i];
        
        if (Math.abs(x - currentX) <= threshold) {
            currentCluster.push(x);
        } else {
            const avgX = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
            clusters.push(Math.round(avgX));
            
            currentCluster = [x];
            currentX = x;
        }
    }
    
    if (currentCluster.length > 0) {
        const avgX = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
        clusters.push(Math.round(avgX));
    }
    
    return clusters;
}

function calculateTableGridDensity(rows, columns) {
    if (!rows.length || !columns.length) return 0;
    
    let totalCells = 0;
    let filledCells = 0;
    
    for (const row of rows) {
        for (let i = 0; i < columns.length; i++) {
            totalCells++;
            
            const colStart = columns[i];
            const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
            
            const hasText = row.some(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            if (hasText) filledCells++;
        }
    }
    
    return totalCells > 0 ? filledCells / totalCells : 0;
}

function measureColumnConsistencyForTable(rows, columns) {
    if (!rows.length || !columns.length) return 0;
    
    let consistentColumns = 0;
    
    for (let i = 0; i < columns.length; i++) {
        const colStart = columns[i];
        const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
        
        let rowsWithText = 0;
        
        for (const row of rows) {
            const hasText = row.some(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            if (hasText) rowsWithText++;
        }
        
        if (rowsWithText >= rows.length * 0.5) {
            consistentColumns++;
        }
    }
    
    return columns.length > 0 ? consistentColumns / columns.length : 0;
}

function validateTableGridStructure(rows, columns) {
    const minRows = CONFIG.excel.minRows;
    const minCols = CONFIG.excel.minCols;
    
    if (rows.length < minRows || columns.length < minCols) {
        return {
            isValid: false,
            confidence: 0,
            reason: `Need at least ${minRows} rows and ${minCols} columns`
        };
    }
    
    const gridDensity = calculateTableGridDensity(rows, columns);
    const consistency = measureColumnConsistencyForTable(rows, columns);
    const confidence = (gridDensity + consistency) / 2;
    
    const isValid = gridDensity >= CONFIG.excel.minGridDensity && 
                   consistency >= CONFIG.excel.minColumnConsistency;
    
    return {
        isValid,
        confidence,
        gridDensity,
        consistency,
        reason: isValid ? 'Valid table structure detected' : 'Grid structure too irregular'
    };
}

function detectTablesInPage(textItems) {
    if (!textItems || textItems.length === 0) return [];
    
    const rows = groupTextItemsByY(textItems);
    const xPositions = extractXPositionsFromRows(rows);
    const columns = clusterXPositions(xPositions);
    const validation = validateTableGridStructure(rows, columns);
    
    if (validation.isValid) {
        return [{
            rows,
            columns,
            confidence: validation.confidence,
            gridDensity: validation.gridDensity,
            consistency: validation.consistency
        }];
    }
    
    return detectMultipleTablesInPage(textItems, rows);
}

function detectMultipleTablesInPage(textItems, rows) {
    const tables = [];
    let currentTableRows = [];
    
    for (const row of rows) {
        currentTableRows.push(row);
        
        const xPositions = extractXPositionsFromRows(currentTableRows);
        const columns = clusterXPositions(xPositions);
        const validation = validateTableGridStructure(currentTableRows, columns);
        
        if (validation.isValid && currentTableRows.length >= CONFIG.excel.minRows) {
            tables.push({
                rows: [...currentTableRows],
                columns,
                confidence: validation.confidence,
                gridDensity: validation.gridDensity,
                consistency: validation.consistency
            });
            currentTableRows = [];
        }
    }
    
    return tables;
}

function reconstructTableCells(rows, columns) {
    const table = [];
    
    for (const row of rows) {
        const tableRow = [];
        
        for (let i = 0; i < columns.length; i++) {
            const colStart = columns[i];
            const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
            
            const cellItems = row.filter(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            cellItems.sort((a, b) => a.x - b.x);
            const cellText = cellItems.map(item => item.text).join(' ').trim();
            
            tableRow.push(cellText);
        }
        
        table.push(tableRow);
    }
    
    return table;
}

function extractTextItemsFromPDF(textContent) {
    if (!textContent || !textContent.items) return [];
    
    const textItems = [];
    
    for (const item of textContent.items) {
        if (item.str.trim() === '') continue;
        
        textItems.push({
            text: item.str.trim(),
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            width: Math.round(item.width),
            height: Math.round(item.height || 12),
            font: item.fontName || 'unknown'
        });
    }
    
    return textItems;
}

function calculateColumnWidthsForExcel(table) {
    if (!table || table.length === 0) return [];
    
    const colCount = Math.max(...table.map(row => row.length));
    const widths = [];
    
    for (let col = 0; col < colCount; col++) {
        let maxWidth = 10;
        
        for (const row of table) {
            const cellText = row[col] || '';
            const width = Math.min(Math.max(cellText.length, 10), 50);
            maxWidth = Math.max(maxWidth, width);
        }
        
        widths.push(maxWidth);
    }
    
    return widths;
}

// ============================================================================
// EXCEL MODULE (Enhanced PPT with Excel conversion)
// ============================================================================

// LocalStorage keys for Excel/PPT conversion
const EXCEL_STORAGE_KEY = 'pdf-tool-uploaded-file';
const EXCEL_STORAGE_META_KEY = 'pdf-tool-file-meta';
const EXCEL_STORAGE_MODE_KEY = 'pdf-tool-conversion-mode';

const excelState = {
    uploadedFile: null,
    blobUrl: null,
    conversionMode: 'ppt'
};

// Save file to localStorage as base64
async function saveExcelFileToStorage(file) {
    try {
        const reader = new FileReader();
        return new Promise((resolve) => {
            reader.onload = function(e) {
                try {
                    const base64 = e.target.result;
                    const dataSize = new Blob([base64]).size;
                    if (dataSize > 4.5 * 1024 * 1024) {
                        console.warn('[DEBUG] File too large for localStorage:', dataSize);
                        showNotification('File is too large to preserve after refresh. You will need to re-upload it.', 'warning');
                        resolve(false);
                        return;
                    }
                    
                    localStorage.setItem(EXCEL_STORAGE_KEY, base64);
                    localStorage.setItem(EXCEL_STORAGE_META_KEY, JSON.stringify({
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
        console.error('[ERROR] Error in saveExcelFileToStorage:', error);
        return false;
    }
}

// Load file from localStorage
async function loadExcelFileFromStorage() {
    try {
        const base64 = localStorage.getItem(EXCEL_STORAGE_KEY);
        const metaJson = localStorage.getItem(EXCEL_STORAGE_META_KEY);
        
        if (!base64 || !metaJson) {
            return null;
        }
        
        const meta = JSON.parse(metaJson);
        
        const response = await fetch(base64);
        const blob = await response.blob();
        
        const file = new File([blob], meta.name, {
            type: meta.type,
            lastModified: meta.lastModified
        });
        
        console.log('[DEBUG] File loaded from localStorage:', file.name);
        return file;
    } catch (error) {
        console.error('[ERROR] Failed to load file from localStorage:', error);
        clearExcelFileStorage();
        return null;
    }
}

// Clear file from localStorage
function clearExcelFileStorage() {
    localStorage.removeItem(EXCEL_STORAGE_KEY);
    localStorage.removeItem(EXCEL_STORAGE_META_KEY);
    localStorage.removeItem(EXCEL_STORAGE_MODE_KEY);
    console.log('[DEBUG] File storage cleared');
}

// Save conversion mode to localStorage
function saveExcelConversionMode() {
    localStorage.setItem(EXCEL_STORAGE_MODE_KEY, excelState.conversionMode);
    console.log('[DEBUG] Conversion mode saved:', excelState.conversionMode);
}

// Load conversion mode from localStorage
function loadExcelConversionMode() {
    const savedMode = localStorage.getItem(EXCEL_STORAGE_MODE_KEY);
    if (savedMode && (savedMode === 'ppt' || savedMode === 'excel')) {
        excelState.conversionMode = savedMode;
        console.log('[DEBUG] Conversion mode loaded:', excelState.conversionMode);
        
        const pptRadio = document.getElementById('convert-ppt-mode');
        const excelRadio = document.getElementById('convert-excel-mode');
        if (pptRadio && excelRadio) {
            if (excelState.conversionMode === 'ppt') {
                pptRadio.checked = true;
            } else {
                excelRadio.checked = true;
            }
        }
    }
}

// Restore file from localStorage on page load
async function restoreExcelFileFromStorage() {
    loadExcelConversionMode();
    
    const savedFile = await loadExcelFileFromStorage();
    if (savedFile) {
        console.log('[DEBUG] Restoring file from storage:', savedFile.name);
        excelState.uploadedFile = savedFile;
        try {
            const arrayBuffer = await savedFile.arrayBuffer();
            const pdf = await loadPdfDocument(arrayBuffer);
            const pageCount = pdf.numPages;
            const fileInfo = document.getElementById('ppt-file-info');
            fileInfo.innerHTML = createFileInfoHtml(savedFile, pageCount);
            updateExcelUi(true);
            showNotification('Previous file restored from storage');
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        } catch (error) {
            console.error('[ERROR] Error restoring file:', error);
            clearExcelFileStorage();
        }
    }
}

function initExcel() {
    console.log('[DEBUG] initExcel called');
    setupConversionModeToggle();
    setupExcelEventListeners();
    // Don't restore file - page should start fresh
    console.log('[DEBUG] initExcel completed');
}

function setupConversionModeToggle() {
    console.log('[DEBUG] setupConversionModeToggle called');
    const pptRadio = document.getElementById('convert-ppt-mode');
    const excelRadio = document.getElementById('convert-excel-mode');
    const pptOptions = document.getElementById('ppt-options');
    const excelOptions = document.getElementById('excel-options');
    const excelDisclaimer = document.getElementById('excel-disclaimer');
    const pptBtn = document.getElementById('ppt-btn');
    
    console.log('[DEBUG] Conversion mode elements found:', {
        pptRadio: !!pptRadio,
        excelRadio: !!excelRadio,
        pptOptions: !!pptOptions,
        excelOptions: !!excelOptions,
        excelDisclaimer: !!excelDisclaimer,
        pptBtn: !!pptBtn
    });
    
    if (pptRadio && excelRadio) {
        console.log('[DEBUG] Setting up conversion mode event listeners');
        pptRadio.addEventListener('change', () => {
            excelState.conversionMode = 'ppt';
            saveExcelConversionMode();
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
            excelState.conversionMode = 'excel';
            saveExcelConversionMode();
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

function setupExcelEventListeners() {
    const dropZone = document.getElementById('ppt-drop-zone');
    const fileInput = document.getElementById('ppt-file-input');
    const clearBtn = document.getElementById('ppt-clear');
    const pptBtn = document.getElementById('ppt-btn');

    if (dropZone) {
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
            handleExcelFile(e.dataTransfer.files[0]);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleExcelFile(e.target.files[0]);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', resetExcelState);
    }

    if (pptBtn) {
        pptBtn.addEventListener('click', handleExcelConvert);
    }
}

async function handleExcelFile(file) {
    console.log('[DEBUG] handleExcelFile called with file:', file.name);
    if (!validateFileType(file, 'application/pdf')) {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    try {
        excelState.uploadedFile = file;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);

        const pageCount = pdf.numPages;
        const fileInfo = document.getElementById('ppt-file-info');
        fileInfo.innerHTML = createFileInfoHtml(file, pageCount);

        console.log('[DEBUG] Calling updateExcelUi(true)');
        updateExcelUi(true);
        console.log('[DEBUG] updateExcelUi completed');

        await saveExcelFileToStorage(file);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error reading PDF:', error);
        showNotification('Failed to read the PDF file', 'error');
    }
}

function updateExcelUi(hasFile) {
    console.log('[DEBUG] updateExcelUi called with hasFile:', hasFile);
    const pptBtn = document.getElementById('ppt-btn');
    const fileSection = document.getElementById('ppt-file-section');
    const pptOptions = document.getElementById('ppt-options');
    const excelOptions = document.getElementById('excel-options');
    const conversionModeSelection = document.getElementById('conversion-mode-selection');
    const excelDisclaimer = document.getElementById('excel-disclaimer');
    
    console.log('[DEBUG] Elements found:', {
        pptBtn: !!pptBtn,
        fileSection: !!fileSection,
        pptOptions: !!pptOptions,
        excelOptions: !!excelOptions,
        conversionModeSelection: !!conversionModeSelection,
        excelDisclaimer: !!excelDisclaimer
    });

    toggleButtonDisabled(pptBtn, !hasFile);
    toggleVisibility(fileSection, hasFile);
    toggleVisibility(conversionModeSelection, hasFile);
    console.log('[DEBUG] Toggled conversionModeSelection visibility to:', hasFile);
    
    if (excelState.conversionMode === 'excel') {
        toggleVisibility(pptOptions, false);
        toggleVisibility(excelOptions, hasFile);
        toggleVisibility(excelDisclaimer, hasFile);
    } else {
        toggleVisibility(pptOptions, hasFile);
        toggleVisibility(excelOptions, false);
        toggleVisibility(excelDisclaimer, false);
    }
    
    hideExcelDownloadLink();
}

function hideExcelDownloadLink() {
    const downloadLink = document.getElementById('ppt-download-link');
    toggleVisibility(downloadLink, false);

    if (excelState.blobUrl) {
        URL.revokeObjectURL(excelState.blobUrl);
        excelState.blobUrl = null;
    }
}

async function handleExcelConvert() {
    if (!excelState.uploadedFile) return;

    if (excelState.conversionMode === 'excel') {
        await convertToExcel();
    } else {
        await convertToPpt();
    }
}

async function convertToExcel() {
    if (!excelState.uploadedFile) return;

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
        if (typeof XLSX === 'undefined') {
            throw new Error('SheetJS library not loaded. Please refresh the page.');
        }

        const arrayBuffer = await excelState.uploadedFile.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        const numPages = pdf.numPages;

        const detectMultipleTables = document.getElementById('excel-detect-multiple')?.checked ?? true;
        const includePageNumbers = document.getElementById('excel-page-numbers')?.checked ?? true;
        const autoDetectHeaders = document.getElementById('excel-auto-headers')?.checked ?? true;

        const allTables = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const progress = (pageNum / numPages) * 90;
            updateProgress(progressBar, progressText, progress);
            progressText.textContent = `Processing page ${pageNum} of ${numPages}...`;

            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const textItems = extractTextItemsFromPDF(textContent);
            
            if (textItems.length === 0) {
                continue;
            }

            const tables = detectTablesInPage(textItems);
            
            if (tables.length === 0) {
                const simpleRow = textItems.map(item => item.text).join(' ');
                allTables.push({
                    data: [[simpleRow]],
                    sheetName: includePageNumbers ? `Page ${pageNum}` : `Sheet ${allTables.length + 1}`,
                    page: pageNum
                });
                continue;
            }

            for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
                const table = tables[tableIndex];
                const cells = reconstructTableCells(table.rows, table.columns);
                
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
        }

        if (allTables.length === 0) {
            throw new Error('No tables or text could be extracted from the PDF');
        }

        updateProgress(progressBar, progressText, 95);
        progressText.textContent = 'Generating Excel file...';

        const workbook = XLSX.utils.book_new();

        for (const table of allTables) {
            const worksheet = XLSX.utils.aoa_to_sheet(table.data);

            if (CONFIG.excel.autoFitColumns) {
                const colWidths = calculateColumnWidthsForExcel(table.data);
                worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
            }

            if (CONFIG.excel.autoFilter && table.data.length > 0) {
                const range = XLSX.utils.decode_range(worksheet['!ref']);
                worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
            }

            if (CONFIG.excel.boldHeaders && table.data.length > 0) {
                for (let col = 0; col < table.data[0].length; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                    if (!worksheet[cellAddress]) continue;
                    worksheet[cellAddress].s = {
                        font: { bold: true }
                    };
                }
            }

            XLSX.utils.book_append_sheet(workbook, worksheet, table.sheetName);
        }

        updateProgress(progressBar, progressText, 100);
        progressText.textContent = 'Complete!';

        const fileName = `${excelState.uploadedFile.name.replace('.pdf', '')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        toggleLoader(loader, false);
        toggleButtonDisabled(pptBtn, false);
        
        const tableCount = allTables.length;
        const avgConfidence = (allTables.reduce((sum, t) => sum + (t.confidence || 0), 0) / tableCount * 100).toFixed(0);
        
        showNotification(
            `Successfully converted ${tableCount} table(s) to Excel! Average confidence: ${avgConfidence}%`
        );

        // Clear file from storage before refresh
        clearExcelFileStorage();

        setTimeout(() => {
            console.log('[DEBUG] Refreshing page after conversion...');
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error converting to Excel:', error);
        showNotification(error.message || 'Failed to convert PDF to Excel', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(pptBtn, false);
    }
}

async function convertToPpt() {
    if (!excelState.uploadedFile) return;

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
        const arrayBuffer = await excelState.uploadedFile.arrayBuffer();
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

        const fileName = `${excelState.uploadedFile.name.replace('.pdf', '')}.pptx`;
        await pptx.writeFile({ fileName });

        toggleLoader(loader, false);
        toggleButtonDisabled(pptBtn, false);
        showNotification('PDF converted to PowerPoint successfully!');

        // Clear file from storage before refresh
        clearExcelFileStorage();

        setTimeout(() => {
            console.log('[DEBUG] Refreshing page after conversion...');
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Error converting to PPT:', error);
        showNotification(error.message || 'Failed to convert PDF to PowerPoint', 'error');
        toggleLoader(loader, false);
        toggleButtonDisabled(pptBtn, false);
    }
}

function resetExcelState() {
    excelState.uploadedFile = null;

    const fileInfo = document.getElementById('ppt-file-info');
    if (fileInfo) fileInfo.innerHTML = '';

    updateExcelUi(false);
    
    const fileInput = document.getElementById('ppt-file-input');
    if (fileInput) fileInput.value = '';
    
    clearExcelFileStorage();
}

// ============================================================================
// ANNOTATE MODULE
// ============================================================================

const annotateState = {
    pdfDoc: null,
    uploadedFile: null,
    currentPageNum: 1,
    totalPages: 0,
    pdfScale: CONFIG.pdf.defaultScale,
    zoomLevel: 1.0,
    currentTool: 'select',
    isDrawing: false,
    startX: 0,
    startY: 0,
    annotations: [],
    selectedAnnotation: null,
    tempAnnotation: null,
    inlineEditor: null,
    textSizeControls: null,
    hasMovedSignificantly: false
};

function initAnnotate() {
    initPdfJsWorker();

    setupAnnotateFileUpload();
    setupAnnotateToolButtons();
    setupAnnotateCanvasEvents();
    setupAnnotatePageNavigation();
    setupAnnotateActionButtons();
    setupAnnotateControls();
    updateAnnotateCursor();
}

function setupAnnotateFileUpload() {
    const dropZone = document.getElementById('annotate-drop-zone');
    const fileInput = document.getElementById('annotate-file-input');

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
        handleAnnotateFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        handleAnnotateFile(e.target.files[0]);
    });

    document.getElementById('annotate-clear-file').addEventListener('click', resetAnnotateState);
}

async function handleAnnotateFile(file) {
    if (!validateFileType(file, 'application/pdf')) {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }

    try {
        annotateState.uploadedFile = file;
        const arrayBuffer = await file.arrayBuffer();
        annotateState.pdfDoc = await loadPdfDocument(arrayBuffer);
        annotateState.totalPages = annotateState.pdfDoc.numPages;

        toggleVisibility(document.getElementById('annotate-drop-zone'), false);
        toggleVisibility(document.getElementById('annotate-viewer-section'), true);

        annotateState.annotations = [];
        annotateState.currentPageNum = 1;
        annotateState.zoomLevel = 1.0;

        await renderAnnotatePdfPage(annotateState.currentPageNum);

        document.getElementById('current-page').textContent = annotateState.currentPageNum;
        document.getElementById('total-pages').textContent = annotateState.totalPages;

        showNotification('PDF loaded successfully! Start annotating.');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showNotification('Failed to load the PDF file', 'error');
    }
}

async function renderAnnotatePdfPage(pageNum) {
    if (!annotateState.pdfDoc) return;

    try {
        const page = await annotateState.pdfDoc.getPage(pageNum);
        const baseScale = annotateState.pdfScale * annotateState.zoomLevel;
        const viewport = await getViewport(page, baseScale);

        const pdfCanvas = document.getElementById('pdf-canvas');
        const annotationCanvas = document.getElementById('annotation-canvas');
        const pdfCtx = pdfCanvas.getContext('2d');
        const annotationCtx = annotationCanvas.getContext('2d');
        const container = document.getElementById('pdf-viewer-container');

        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;

        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;

        await page.render({ canvasContext: pdfCtx, viewport: viewport }).promise;

        renderAnnotateAnnotations();

        document.getElementById('prev-page').disabled = pageNum <= 1;
        document.getElementById('next-page').disabled = pageNum >= annotateState.totalPages;
        document.getElementById('current-page').textContent = pageNum;
        
        updateZoomDisplay();
    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

function renderAnnotateAnnotations() {
    const annotationCanvas = document.getElementById('annotation-canvas');
    const ctx = annotationCanvas.getContext('2d');

    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    const pageAnnotations = filterAnnotationsByPage(annotateState.annotations, annotateState.currentPageNum);
    pageAnnotations.forEach(ann => {
        drawAnnotationOnCanvas(ctx, ann, ann === annotateState.selectedAnnotation);
    });
}

function setupAnnotateToolButtons() {
    const tools = ['select', 'text', 'highlight', 'arrow', 'rect', 'circle', 'line'];

    tools.forEach(tool => {
        const btn = document.getElementById(`tool-${tool}`);
        if (btn) {
            btn.addEventListener('click', () => {
                annotateState.currentTool = tool;
                annotateState.selectedAnnotation = null;
                removeInlineEditor();

                tools.forEach(t => {
                    const b = document.getElementById(`tool-${t}`);
                    if (b) b.classList.remove('active');
                });
                btn.classList.add('active');

                updateAnnotateCursor();
                renderAnnotateAnnotations();
            });
        }
    });
}

function updateAnnotateCursor() {
    const annotationCanvas = document.getElementById('annotation-canvas');
    annotationCanvas.classList.remove('cursor-move', 'cursor-pointer', 'cursor-crosshair');

    if (annotateState.currentTool === 'select') {
        annotationCanvas.classList.add('cursor-move');
    } else if (annotateState.currentTool === 'text') {
        annotationCanvas.classList.add('cursor-pointer');
    } else {
        annotationCanvas.classList.add('cursor-crosshair');
    }
}

function setupAnnotateCanvasEvents() {
    const annotationCanvas = document.getElementById('annotation-canvas');

    annotationCanvas.addEventListener('mousedown', handleAnnotateMouseDown);
    annotationCanvas.addEventListener('mousemove', handleAnnotateMouseMove);
    annotationCanvas.addEventListener('mouseup', handleAnnotateMouseUp);
    annotationCanvas.addEventListener('mouseleave', handleAnnotateMouseUp);

    annotationCanvas.addEventListener('touchstart', handleAnnotateTouchStart);
    annotationCanvas.addEventListener('touchmove', handleAnnotateTouchMove);
    annotationCanvas.addEventListener('touchend', handleAnnotateTouchEnd);
}

function handleAnnotateMouseDown(e) {
    const annotationCanvas = document.getElementById('annotation-canvas');
    const coords = getCanvasCoordinates(e, annotationCanvas);
    annotateState.startX = coords.x;
    annotateState.startY = coords.y;
    annotateState.isDrawing = true;
    annotateState.hasMovedSignificantly = false;

    if (annotateState.currentTool === 'select') {
        annotateState.selectedAnnotation = findAnnotationAt(annotateState.annotations, annotateState.currentPageNum, coords.x, coords.y);
        if (annotateState.selectedAnnotation && annotateState.selectedAnnotation.type !== 'text') {
            renderAnnotateAnnotations();
        }
    } else if (annotateState.currentTool === 'text') {
        const rect = annotationCanvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        showTextInput(coords.x, coords.y, clientX, clientY);
        annotateState.isDrawing = false;
    } else {
        const colorPicker = document.getElementById('annotation-color');
        const sizeSlider = document.getElementById('annotation-size');
        annotateState.tempAnnotation = createAnnotation(
            annotateState.currentTool,
            coords.x,
            coords.y,
            colorPicker.value,
            parseInt(sizeSlider.value),
            annotateState.currentPageNum
        );
    }
}

function handleAnnotateMouseMove(e) {
    if (!annotateState.isDrawing) return;

    const annotationCanvas = document.getElementById('annotation-canvas');
    const coords = getCanvasCoordinates(e, annotationCanvas);

    if (!annotateState.hasMovedSignificantly) {
        const dx = Math.abs(coords.x - annotateState.startX);
        const dy = Math.abs(coords.y - annotateState.startY);
        if (dx > CONFIG.annotation.clickThreshold || dy > CONFIG.annotation.clickThreshold) {
            annotateState.hasMovedSignificantly = true;
        }
    }

    if (annotateState.currentTool === 'select' && annotateState.selectedAnnotation) {
        const dx = coords.x - annotateState.startX;
        const dy = coords.y - annotateState.startY;
        moveAnnotation(annotateState.selectedAnnotation, dx, dy);
        annotateState.startX = coords.x;
        annotateState.startY = coords.y;
        renderAnnotateAnnotations();
    } else if (annotateState.tempAnnotation) {
        annotateState.tempAnnotation.endX = coords.x;
        annotateState.tempAnnotation.endY = coords.y;
        renderAnnotateAnnotations();
        drawAnnotationOnCanvas(
            annotationCanvas.getContext('2d'),
            annotateState.tempAnnotation,
            false
        );
    }
}

function handleAnnotateMouseUp(e) {
    if (!annotateState.isDrawing) return;

    if (annotateState.currentTool === 'select' && annotateState.selectedAnnotation && annotateState.selectedAnnotation.type === 'text') {
        if (!annotateState.hasMovedSignificantly) {
            showInlineEditorForText(annotateState.selectedAnnotation);
        }
        annotateState.hasMovedSignificantly = false;
    }

    if (annotateState.tempAnnotation && annotateState.currentTool !== 'select' && annotateState.currentTool !== 'text') {
        if (validateAnnotationSize(annotateState.tempAnnotation)) {
            annotateState.annotations.push({ ...annotateState.tempAnnotation, id: Date.now() });
            showNotification('Annotation added');
        }
        annotateState.tempAnnotation = null;
        renderAnnotateAnnotations();
    }

    annotateState.isDrawing = false;
    annotateState.hasMovedSignificantly = false;
}

function handleAnnotateTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleAnnotateMouseDown(mouseEvent);
}

function handleAnnotateTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleAnnotateMouseMove(mouseEvent);
}

function handleAnnotateTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleAnnotateMouseUp(mouseEvent);
}

function showTextInput(canvasX, canvasY, clientX, clientY) {
    removeInlineEditor();

    const editorCreationTime = Date.now();
    const colorPicker = document.getElementById('annotation-color');
    const sizeSlider = document.getElementById('annotation-size');
    const container = document.getElementById('pdf-viewer-container');

    const inlineEditor = document.createElement('div');
    inlineEditor.contentEditable = true;

    inlineEditor.style.position = 'absolute';
    inlineEditor.style.left = `${clientX}px`;
    inlineEditor.style.top = `${clientY}px`;
    inlineEditor.style.fontSize = `${calculateFontSize(parseInt(sizeSlider.value))}px`;
    inlineEditor.style.color = colorPicker.value;
    inlineEditor.style.background = 'transparent';
    inlineEditor.style.border = '2px dashed #667eea';
    inlineEditor.style.borderRadius = '4px';
    inlineEditor.style.padding = '4px';
    inlineEditor.style.fontFamily = 'Inter, sans-serif';
    inlineEditor.style.minWidth = '100px';
    inlineEditor.style.minHeight = '24px';
    inlineEditor.style.zIndex = '1000';
    inlineEditor.style.outline = 'none';
    inlineEditor.style.overflow = 'visible';
    inlineEditor.style.whiteSpace = 'pre-wrap';
    inlineEditor.style.wordWrap = 'break-word';
    inlineEditor.textContent = '\u200B';

    container.appendChild(inlineEditor);
    inlineEditor.focus();

    annotateState.inlineEditor = inlineEditor;

    setTimeout(() => {
        if (!annotateState.inlineEditor) return;

        const finishEditing = () => {
            const timeSinceCreation = Date.now() - editorCreationTime;
            if (timeSinceCreation < CONFIG.annotation.blurDelay) return;

            const text = annotateState.inlineEditor?.textContent.trim() || '';
            if (text && text !== '\u200B') {
                const annotation = createTextAnnotation(
                    canvasX,
                    canvasY,
                    text,
                    colorPicker.value,
                    calculateFontSize(parseInt(sizeSlider.value)),
                    annotateState.currentPageNum
                );
                annotateState.annotations.push(annotation);
                renderAnnotateAnnotations();
                showNotification('Text annotation added');
            }
            removeInlineEditor();
        };

        annotateState.inlineEditor.addEventListener('blur', finishEditing);
        annotateState.inlineEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                removeInlineEditor();
            }
        });
    }, 100);
}

function showInlineEditorForText(annotation) {
    removeInlineEditor();

    const originalText = annotation.text;
    annotation.text = '';
    renderAnnotateAnnotations();

    const annotationCanvas = document.getElementById('annotation-canvas');
    const rect = annotationCanvas.getBoundingClientRect();
    const scaleX = rect.width / annotationCanvas.width;
    const scaleY = rect.height / annotationCanvas.height;
    const clientX = annotation.x * scaleX;
    const clientY = annotation.y * scaleY;

    const editorCreationTime = Date.now();
    const container = document.getElementById('pdf-viewer-container');

    const inlineEditor = document.createElement('div');
    inlineEditor.contentEditable = true;

    inlineEditor.style.position = 'absolute';
    inlineEditor.style.left = `${clientX}px`;
    inlineEditor.style.top = `${clientY}px`;
    inlineEditor.style.fontSize = `${annotation.fontSize}px`;
    inlineEditor.style.color = annotation.color;
    inlineEditor.style.background = 'transparent';
    inlineEditor.style.border = '2px dashed #667eea';
    inlineEditor.style.borderRadius = '4px';
    inlineEditor.style.padding = '4px';
    inlineEditor.style.fontFamily = 'Inter, sans-serif';
    inlineEditor.style.minWidth = '100px';
    inlineEditor.style.minHeight = '24px';
    inlineEditor.style.zIndex = '1000';
    inlineEditor.style.outline = 'none';
    inlineEditor.style.overflow = 'visible';
    inlineEditor.style.whiteSpace = 'pre-wrap';
    inlineEditor.style.wordWrap = 'break-word';
    inlineEditor.textContent = originalText;

    container.appendChild(inlineEditor);
    inlineEditor.focus();

    annotateState.inlineEditor = inlineEditor;

    setTimeout(() => {
        if (!annotateState.inlineEditor) return;

        const finishEditing = () => {
            const timeSinceCreation = Date.now() - editorCreationTime;
            if (timeSinceCreation < CONFIG.annotation.blurDelay) return;

            const text = annotateState.inlineEditor?.textContent.trim() || '';
            if (text) {
                annotation.text = text;
                renderAnnotateAnnotations();
                showNotification('Text annotation updated');
            } else {
                const index = annotateState.annotations.indexOf(annotation);
                if (index > -1) {
                    annotateState.annotations.splice(index, 1);
                    renderAnnotateAnnotations();
                    showNotification('Text annotation deleted');
                }
            }
            removeInlineEditor();
        };

        annotateState.inlineEditor.addEventListener('blur', finishEditing);
        annotateState.inlineEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                annotation.text = originalText;
                renderAnnotateAnnotations();
                removeInlineEditor();
            }
        });
    }, 100);
}

function removeInlineEditor() {
    if (annotateState.inlineEditor) {
        annotateState.inlineEditor.remove();
        annotateState.inlineEditor = null;
    }
}

function setupAnnotatePageNavigation() {
    document.getElementById('prev-page').addEventListener('click', async () => {
        if (annotateState.currentPageNum > 1) {
            annotateState.currentPageNum--;
            await renderAnnotatePdfPage(annotateState.currentPageNum);
        }
    });

    document.getElementById('next-page').addEventListener('click', async () => {
        if (annotateState.currentPageNum < annotateState.totalPages) {
            annotateState.currentPageNum++;
            await renderAnnotatePdfPage(annotateState.currentPageNum);
        }
    });
}

function setupAnnotateActionButtons() {
    document.getElementById('tool-delete').addEventListener('click', () => {
        if (annotateState.selectedAnnotation) {
            const index = annotateState.annotations.indexOf(annotateState.selectedAnnotation);
            if (index > -1) {
                annotateState.annotations.splice(index, 1);
                annotateState.selectedAnnotation = null;
                renderAnnotateAnnotations();
                showNotification('Annotation deleted');
            }
        }
    });

    document.getElementById('tool-clear').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all annotations?')) {
            annotateState.annotations = [];
            annotateState.selectedAnnotation = null;
            renderAnnotateAnnotations();
            showNotification('All annotations cleared');
        }
    });

    document.getElementById('annotate-download-btn').addEventListener('click', async () => {
        const loader = document.getElementById('annotate-loader');
        toggleLoader(loader, true);

        try {
            const arrayBuffer = await annotateState.uploadedFile.arrayBuffer();
            const pdfDoc = await loadPdfLibDocument(arrayBuffer);

            for (let pageNum = 1; pageNum <= annotateState.totalPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const pdfPage = await annotateState.pdfDoc.getPage(pageNum);
                const viewport = await getViewport(pdfPage, annotateState.pdfScale);
                const pdfPageWidth = page.getWidth();
                const pdfPageHeight = page.getHeight();

                const pageAnnotations = filterAnnotationsByPage(annotateState.annotations, pageNum);
                for (const ann of pageAnnotations) {
                    await burnAnnotationToPdf(page, ann, pdfPageWidth, pdfPageHeight, viewport, pdfDoc);
                }
            }

            const pdfBytes = await savePdfDocument(pdfDoc);
            const blob = createPdfBlob(pdfBytes);
            downloadBlob(blob, `annotated_${annotateState.uploadedFile.name}`);

            toggleLoader(loader, false);
            showNotification('Annotated PDF downloaded successfully!');
        } catch (error) {
            console.error('Error downloading annotated PDF:', error);
            showNotification('Failed to download annotated PDF', 'error');
            toggleLoader(loader, false);
        }
    });
}

function setupAnnotateControls() {
    const colorPicker = document.getElementById('annotation-color');
    const sizeSlider = document.getElementById('annotation-size');
    const sizeValue = document.getElementById('annotation-size-value');

    sizeSlider.addEventListener('input', () => {
        sizeValue.textContent = sizeSlider.value;
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        zoomIn();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        zoomOut();
    });

    document.getElementById('zoom-fit').addEventListener('click', () => {
        zoomFit();
    });
}

function updateZoomDisplay() {
    const zoomLevelSpan = document.getElementById('zoom-level');
    if (zoomLevelSpan) {
        const percentage = Math.round(annotateState.zoomLevel * 100);
        zoomLevelSpan.textContent = `${percentage}%`;
    }
}

function zoomIn() {
    if (annotateState.zoomLevel < 3.0) {
        annotateState.zoomLevel = Math.min(3.0, annotateState.zoomLevel + 0.25);
        renderAnnotatePdfPage(annotateState.currentPageNum);
    }
}

function zoomOut() {
    if (annotateState.zoomLevel > 0.25) {
        annotateState.zoomLevel = Math.max(0.25, annotateState.zoomLevel - 0.25);
        renderAnnotatePdfPage(annotateState.currentPageNum);
    }
}

function zoomFit() {
    const container = document.getElementById('pdf-viewer-container');
    const pdfCanvas = document.getElementById('pdf-canvas');
    
    if (!annotateState.pdfDoc || !container || !pdfCanvas) return;

    // Get the available width
    const availableWidth = container.parentElement.clientWidth - 32; // 32px for padding
    
    // Get the base viewport width (without zoom)
    const baseViewportWidth = pdfCanvas.width / annotateState.zoomLevel;
    
    // Calculate the zoom level to fit the width
    const newZoomLevel = availableWidth / baseViewportWidth;
    
    // Limit zoom level to reasonable bounds
    annotateState.zoomLevel = Math.max(0.25, Math.min(3.0, newZoomLevel));
    
    renderAnnotatePdfPage(annotateState.currentPageNum);
}

function resetAnnotateState() {
    annotateState.pdfDoc = null;
    annotateState.uploadedFile = null;
    annotateState.currentPageNum = 1;
    annotateState.totalPages = 0;
    annotateState.zoomLevel = 1.0;
    annotateState.annotations = [];
    annotateState.selectedAnnotation = null;
    annotateState.tempAnnotation = null;

    const pdfCanvas = document.getElementById('pdf-canvas');
    const annotationCanvas = document.getElementById('annotation-canvas');
    const pdfCtx = pdfCanvas.getContext('2d');
    const annotationCtx = annotationCanvas.getContext('2d');

    pdfCtx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
    
    updateZoomDisplay();

    toggleVisibility(document.getElementById('annotate-drop-zone'), true);
    toggleVisibility(document.getElementById('annotate-viewer-section'), false);
    document.getElementById('annotate-file-input').value = '';

    removeInlineEditor();
}

// ============================================================================
// TAB SWITCHING
// ============================================================================

function setupTabSwitching() {
    const mergeTab = document.getElementById('merge-tab');
    const splitTab = document.getElementById('split-tab');
    const pptTab = document.getElementById('ppt-tab');
    const annotateTab = document.getElementById('annotate-tab');
    const mergeContent = document.getElementById('merge-content');
    const splitContent = document.getElementById('split-content');
    const pptContent = document.getElementById('ppt-content');
    const annotateContent = document.getElementById('annotate-content');

    if (mergeTab) {
        mergeTab.addEventListener('click', () => {
            const allTabs = [splitTab, pptTab, annotateTab].filter(Boolean);
            const allContents = [splitContent, pptContent, annotateContent].filter(Boolean);
            setActiveTab(mergeTab, allTabs, mergeContent, allContents);
        });
    }

    if (splitTab) {
        splitTab.addEventListener('click', () => {
            const allTabs = [mergeTab, pptTab, annotateTab].filter(Boolean);
            const allContents = [mergeContent, pptContent, annotateContent].filter(Boolean);
            setActiveTab(splitTab, allTabs, splitContent, allContents);
        });
    }

    if (pptTab) {
        pptTab.addEventListener('click', () => {
            const allTabs = [mergeTab, splitTab, annotateTab].filter(Boolean);
            const allContents = [mergeContent, splitContent, annotateContent].filter(Boolean);
            setActiveTab(pptTab, allTabs, pptContent, allContents);
        });
    }

    if (annotateTab) {
        annotateTab.addEventListener('click', () => {
            const allTabs = [mergeTab, splitTab, pptTab].filter(Boolean);
            const allContents = [mergeContent, splitContent, pptContent].filter(Boolean);
            setActiveTab(annotateTab, allTabs, annotateContent, allContents);
        });
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initApp() {
    initPdfJsWorker();
    initLucideIcons();
    setupTabSwitching();
    initMerge();
    initSplit();
    initExcel();
    initAnnotate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
