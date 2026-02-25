/**
 * PDF Annotation Module
 * Handles PDF annotation functionality with text, shapes, and highlights
 */

import { showNotification, toggleVisibility, toggleButtonDisabled, toggleLoader, getCanvasCoordinates, initLucideIcons, toggleDragOver, validateFileType } from '../utils/uiUtils.js';
import { initPdfJsWorker, loadPdfDocument, getViewport, loadPdfLibDocument, savePdfDocument, createPdfBlob, downloadBlob, calculateScaleFactors } from '../utils/pdfUtils.js';
import { calculateFontSize, createAnnotation, createTextAnnotation, findAnnotationAt, validateAnnotationSize, moveAnnotation, drawAnnotationOnCanvas, burnAnnotationToPdf, filterAnnotationsByPage } from '../utils/annotationUtils.js';
import { CONFIG } from '../config.js';

/**
 * Annotation module state
 */
const state = {
    pdfDoc: null,
    uploadedFile: null,
    currentPageNum: 1,
    totalPages: 0,
    pdfScale: CONFIG.pdf.defaultScale,
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

/**
 * Initialize annotation functionality
 */
export function initAnnotate() {
    // Initialize PDF.js worker
    initPdfJsWorker();

    // Note: Tab switching is now handled in main.js

    // Setup file upload
    setupFileUpload();

    // Setup tool buttons
    setupToolButtons();

    // Setup canvas events
    setupCanvasEvents();

    // Setup page navigation
    setupPageNavigation();

    // Setup action buttons
    setupActionButtons();

    // Setup color and size controls
    setupControls();

    // Initialize cursor
    updateCursor();
}

/**
 * Setup file upload handlers
 */
function setupFileUpload() {
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
        handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    document.getElementById('annotate-clear-file').addEventListener('click', resetState);
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
        state.pdfDoc = await loadPdfDocument(arrayBuffer);
        state.totalPages = state.pdfDoc.numPages;

        // Show viewer, hide drop zone
        toggleVisibility(document.getElementById('annotate-drop-zone'), false);
        toggleVisibility(document.getElementById('annotate-viewer-section'), true);

        // Reset annotations
        state.annotations = [];
        state.currentPageNum = 1;

        // Render first page
        await renderPdfPage(state.currentPageNum);

        // Update page info
        document.getElementById('current-page').textContent = state.currentPageNum;
        document.getElementById('total-pages').textContent = state.totalPages;

        showNotification('PDF loaded successfully! Start annotating.');
    } catch (error) {
        console.error('Error loading PDF:', error);
        showNotification('Failed to load the PDF file', 'error');
    }
}

/**
 * Render PDF page
 *
 * @param {number} pageNum - Page number to render
 */
async function renderPdfPage(pageNum) {
    if (!state.pdfDoc) return;

    try {
        const page = await state.pdfDoc.getPage(pageNum);
        const viewport = await getViewport(page, state.pdfScale);

        const pdfCanvas = document.getElementById('pdf-canvas');
        const annotationCanvas = document.getElementById('annotation-canvas');
        const pdfCtx = pdfCanvas.getContext('2d');
        const annotationCtx = annotationCanvas.getContext('2d');
        const container = document.getElementById('pdf-viewer-container');

        // Set canvas dimensions
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;

        // Set container dimensions
        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;

        // Render PDF page
        await page.render({ canvasContext: pdfCtx, viewport: viewport }).promise;

        // Re-render annotations
        renderAnnotations();

        // Update page navigation
        document.getElementById('prev-page').disabled = pageNum <= 1;
        document.getElementById('next-page').disabled = pageNum >= state.totalPages;
        document.getElementById('current-page').textContent = pageNum;
    } catch (error) {
        console.error('Error rendering page:', error);
    }
}

/**
 * Render annotations on canvas
 */
function renderAnnotations() {
    const annotationCanvas = document.getElementById('annotation-canvas');
    const ctx = annotationCanvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    // Render annotations for current page
    const pageAnnotations = filterAnnotationsByPage(state.annotations, state.currentPageNum);
    pageAnnotations.forEach(ann => {
        drawAnnotationOnCanvas(ctx, ann, ann === state.selectedAnnotation);
    });
}

/**
 * Setup tool buttons
 */
function setupToolButtons() {
    const tools = ['select', 'text', 'highlight', 'arrow', 'rect', 'circle', 'line'];

    tools.forEach(tool => {
        const btn = document.getElementById(`tool-${tool}`);
        if (btn) {
            btn.addEventListener('click', () => {
                state.currentTool = tool;
                state.selectedAnnotation = null;
                removeInlineEditor();

                // Update active state
                tools.forEach(t => {
                    const b = document.getElementById(`tool-${t}`);
                    if (b) b.classList.remove('active');
                });
                btn.classList.add('active');

                // Update cursor
                updateCursor();

                // Re-render annotations
                renderAnnotations();
            });
        }
    });
}

/**
 * Update cursor based on current tool
 */
function updateCursor() {
    const annotationCanvas = document.getElementById('annotation-canvas');
    annotationCanvas.classList.remove('cursor-move', 'cursor-pointer', 'cursor-crosshair');

    if (state.currentTool === 'select') {
        annotationCanvas.classList.add('cursor-move');
    } else if (state.currentTool === 'text') {
        annotationCanvas.classList.add('cursor-pointer');
    } else {
        annotationCanvas.classList.add('cursor-crosshair');
    }
}

/**
 * Setup canvas mouse events
 */
function setupCanvasEvents() {
    const annotationCanvas = document.getElementById('annotation-canvas');

    annotationCanvas.addEventListener('mousedown', handleMouseDown);
    annotationCanvas.addEventListener('mousemove', handleMouseMove);
    annotationCanvas.addEventListener('mouseup', handleMouseUp);
    annotationCanvas.addEventListener('mouseleave', handleMouseUp);

    // Touch events
    annotationCanvas.addEventListener('touchstart', handleTouchStart);
    annotationCanvas.addEventListener('touchmove', handleTouchMove);
    annotationCanvas.addEventListener('touchend', handleTouchEnd);
}

/**
 * Handle mouse down
 *
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseDown(e) {
    const annotationCanvas = document.getElementById('annotation-canvas');
    const coords = getCanvasCoordinates(e, annotationCanvas);
    state.startX = coords.x;
    state.startY = coords.y;
    state.isDrawing = true;
    state.hasMovedSignificantly = false;

    if (state.currentTool === 'select') {
        state.selectedAnnotation = findAnnotationAt(state.annotations, state.currentPageNum, coords.x, coords.y);
        if (state.selectedAnnotation && state.selectedAnnotation.type !== 'text') {
            renderAnnotations();
        }
    } else if (state.currentTool === 'text') {
        const rect = annotationCanvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        showTextInput(coords.x, coords.y, clientX, clientY);
        state.isDrawing = false;
    } else {
        const colorPicker = document.getElementById('annotation-color');
        const sizeSlider = document.getElementById('annotation-size');
        state.tempAnnotation = createAnnotation(
            state.currentTool,
            coords.x,
            coords.y,
            colorPicker.value,
            parseInt(sizeSlider.value),
            state.currentPageNum
        );
    }
}

/**
 * Handle mouse move
 *
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseMove(e) {
    if (!state.isDrawing) return;

    const annotationCanvas = document.getElementById('annotation-canvas');
    const coords = getCanvasCoordinates(e, annotationCanvas);

    // Check if moved significantly
    if (!state.hasMovedSignificantly) {
        const dx = Math.abs(coords.x - state.startX);
        const dy = Math.abs(coords.y - state.startY);
        if (dx > CONFIG.annotation.clickThreshold || dy > CONFIG.annotation.clickThreshold) {
            state.hasMovedSignificantly = true;
        }
    }

    if (state.currentTool === 'select' && state.selectedAnnotation) {
        const dx = coords.x - state.startX;
        const dy = coords.y - state.startY;
        moveAnnotation(state.selectedAnnotation, dx, dy);
        state.startX = coords.x;
        state.startY = coords.y;
        renderAnnotations();
    } else if (state.tempAnnotation) {
        state.tempAnnotation.endX = coords.x;
        state.tempAnnotation.endY = coords.y;
        renderAnnotations();
        drawAnnotationOnCanvas(
            annotationCanvas.getContext('2d'),
            state.tempAnnotation,
            false
        );
    }
}

/**
 * Handle mouse up
 *
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseUp(e) {
    if (!state.isDrawing) return;

    // For select tool with text annotation
    if (state.currentTool === 'select' && state.selectedAnnotation && state.selectedAnnotation.type === 'text') {
        if (!state.hasMovedSignificantly) {
            showInlineEditorForText(state.selectedAnnotation);
        }
        state.hasMovedSignificantly = false;
    }

    if (state.tempAnnotation && state.currentTool !== 'select' && state.currentTool !== 'text') {
        if (validateAnnotationSize(state.tempAnnotation)) {
            state.annotations.push({ ...state.tempAnnotation, id: Date.now() });
            showNotification('Annotation added');
        }
        state.tempAnnotation = null;
        renderAnnotations();
    }

    state.isDrawing = false;
    state.hasMovedSignificantly = false;
}

/**
 * Touch event handlers
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseDown(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    handleMouseMove(mouseEvent);
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    handleMouseUp(mouseEvent);
}

/**
 * Show text input for new annotation
 *
 * @param {number} canvasX - Canvas X coordinate
 * @param {number} canvasY - Canvas Y coordinate
 * @param {number} clientX - Client X coordinate
 * @param {number} clientY - Client Y coordinate
 */
function showTextInput(canvasX, canvasY, clientX, clientY) {
    removeInlineEditor();

    const editorCreationTime = Date.now();
    const colorPicker = document.getElementById('annotation-color');
    const sizeSlider = document.getElementById('annotation-size');
    const container = document.getElementById('pdf-viewer-container');

    const inlineEditor = document.createElement('div');
    inlineEditor.contentEditable = true;

    // Set all styles inline
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

    state.inlineEditor = inlineEditor;

    setTimeout(() => {
        if (!state.inlineEditor) return;

        const finishEditing = () => {
            const timeSinceCreation = Date.now() - editorCreationTime;
            if (timeSinceCreation < CONFIG.annotation.blurDelay) return;

            const text = state.inlineEditor?.textContent.trim() || '';
            if (text && text !== '\u200B') {
                const annotation = createTextAnnotation(
                    canvasX,
                    canvasY,
                    text,
                    colorPicker.value,
                    calculateFontSize(parseInt(sizeSlider.value)),
                    state.currentPageNum
                );
                state.annotations.push(annotation);
                renderAnnotations();
                showNotification('Text annotation added');
            }
            removeInlineEditor();
        };

        state.inlineEditor.addEventListener('blur', finishEditing);
        state.inlineEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                removeInlineEditor();
            }
        });
    }, 100);
}

/**
 * Show inline editor for existing text annotation
 *
 * @param {Object} annotation - Text annotation object
 */
function showInlineEditorForText(annotation) {
    removeInlineEditor();

    const originalText = annotation.text;
    annotation.text = '';
    renderAnnotations();

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

    // Set all styles inline
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

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(inlineEditor);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    state.inlineEditor = inlineEditor;

    showTextSizeControls(annotation, inlineEditor);

    setTimeout(() => {
        if (!state.inlineEditor) return;

        const finishEditing = () => {
            const timeSinceCreation = Date.now() - editorCreationTime;
            if (timeSinceCreation < CONFIG.annotation.blurDelay) return;

            annotation.text = state.inlineEditor.textContent.trim();
            renderAnnotations();
            removeInlineEditor();
        };

        const cancelEditing = () => {
            annotation.text = originalText;
            renderAnnotations();
            removeInlineEditor();
        };

        state.inlineEditor.addEventListener('blur', (e) => {
            if (state.textSizeControls && e.relatedTarget === state.textSizeControls) return;
            if (state.textSizeControls && state.textSizeControls.contains(e.relatedTarget)) return;
            finishEditing();
        });

        state.inlineEditor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEditing();
            }
        });
    }, 100);
}

/**
 * Show text size controls
 *
 * @param {Object} annotation - Annotation object
 * @param {HTMLElement} editorElement - Editor element
 */
function showTextSizeControls(annotation, editorElement) {
    if (state.textSizeControls) {
        state.textSizeControls.remove();
    }

    const textSizeControls = document.createElement('div');
    const container = document.getElementById('pdf-viewer-container');

    // Set all styles inline
    textSizeControls.style.position = 'absolute';
    textSizeControls.style.background = 'white';
    textSizeControls.style.border = '1px solid #e5e7eb';
    textSizeControls.style.borderRadius = '8px';
    textSizeControls.style.padding = '8px 12px';
    textSizeControls.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    textSizeControls.style.zIndex = '1001';
    textSizeControls.style.display = 'flex';
    textSizeControls.style.alignItems = 'center';
    textSizeControls.style.gap = '8px';

    // Position controls
    const editorRect = editorElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const controlsHeight = 50;

    textSizeControls.style.left = `${editorRect.left - containerRect.left}px`;

    if (editorRect.bottom + controlsHeight <= containerRect.bottom) {
        textSizeControls.style.top = `${editorRect.bottom - containerRect.top + 8}px`;
    } else {
        textSizeControls.style.top = `${editorRect.top - containerRect.top - controlsHeight - 8}px`;
    }

    textSizeControls.innerHTML = `
        <label style="font-size: 12px; color: #6b7280; font-weight: 500;">Font Size:</label>
        <input type="range" min="${CONFIG.textEditor.minFontSize}" max="${CONFIG.textEditor.maxFontSize}" value="${annotation.fontSize}" style="width: 100px;">
        <span style="font-size: 12px; color: #37151; min-width: 30px;">${annotation.fontSize}px</span>
        <label style="font-size: 12px; color: #6b7280; font-weight: 500; margin-left: 8px;">Color:</label>
        <input type="color" value="${annotation.color}" style="width: 30px; height: 30px; border: none; cursor: pointer;">
    `;

    container.appendChild(textSizeControls);

    const slider = textSizeControls.querySelector('input[type="range"]');
    const sizeSpan = textSizeControls.querySelector('span');
    const colorPicker = textSizeControls.querySelector('input[type="color"]');

    slider.addEventListener('input', (e) => {
        const newSize = parseInt(e.target.value);
        annotation.fontSize = newSize;
        editorElement.style.fontSize = `${newSize}px`;
        sizeSpan.textContent = `${newSize}px`;
    });

    colorPicker.addEventListener('input', (e) => {
        const newColor = e.target.value;
        annotation.color = newColor;
        editorElement.style.color = newColor;
    });

    slider.addEventListener('change', () => renderAnnotations());
    colorPicker.addEventListener('change', () => renderAnnotations());

    state.textSizeControls = textSizeControls;
}

/**
 * Remove inline editor and controls
 */
function removeInlineEditor() {
    if (state.inlineEditor) {
        state.inlineEditor.remove();
        state.inlineEditor = null;
    }
    if (state.textSizeControls) {
        state.textSizeControls.remove();
        state.textSizeControls = null;
    }
}

/**
 * Setup page navigation
 */
function setupPageNavigation() {
    document.getElementById('prev-page').addEventListener('click', async () => {
        if (state.currentPageNum > 1) {
            state.currentPageNum--;
            removeInlineEditor();
            await renderPdfPage(state.currentPageNum);
        }
    });

    document.getElementById('next-page').addEventListener('click', async () => {
        if (state.currentPageNum < state.totalPages) {
            state.currentPageNum++;
            removeInlineEditor();
            await renderPdfPage(state.currentPageNum);
        }
    });
}

/**
 * Setup action buttons
 */
function setupActionButtons() {
    document.getElementById('tool-delete').addEventListener('click', () => {
        if (state.selectedAnnotation) {
            state.annotations = state.annotations.filter(ann => ann.id !== state.selectedAnnotation.id);
            state.selectedAnnotation = null;
            removeInlineEditor();
            renderAnnotations();
            showNotification('Annotation deleted');
        } else {
            showNotification('Select an annotation to delete', 'info');
        }
    });

    document.getElementById('tool-clear').addEventListener('click', () => {
        if (state.annotations.length === 0) {
            showNotification('No annotations to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all annotations?')) {
            state.annotations = [];
            state.selectedAnnotation = null;
            removeInlineEditor();
            renderAnnotations();
            showNotification('All annotations cleared');
        }
    });

    document.getElementById('annotate-download-btn').addEventListener('click', downloadAnnotatedPdf);
}

/**
 * Setup color and size controls
 */
function setupControls() {
    const sizeSlider = document.getElementById('annotation-size');
    const sizeValueSpan = document.getElementById('annotation-size-value');

    sizeSlider.addEventListener('input', (e) => {
        sizeValueSpan.textContent = e.target.value;
    });
}

/**
 * Download annotated PDF
 */
async function downloadAnnotatedPdf() {
    if (!state.pdfDoc || !state.uploadedFile) {
        showNotification('Please upload a PDF first', 'error');
        return;
    }

    const downloadBtn = document.getElementById('annotate-download-btn');
    const loader = document.getElementById('annotate-loader');

    toggleButtonDisabled(downloadBtn, true);
    toggleLoader(loader, true);

    try {
        const arrayBuffer = await state.uploadedFile.arrayBuffer();
        const pdfDoc = await loadPdfLibDocument(arrayBuffer);
        const pages = pdfDoc.getPages();

        for (let pageNum = 1; pageNum <= state.totalPages; pageNum++) {
            const pageAnnotations = filterAnnotationsByPage(state.annotations, pageNum);
            if (pageAnnotations.length === 0) continue;

            const page = pages[pageNum - 1];
            const { width, height } = page.getSize();
            const viewport = await getViewport(await state.pdfDoc.getPage(pageNum), state.pdfScale);

            for (const ann of pageAnnotations) {
                await burnAnnotationToPdf(page, ann, width, height, viewport, pdfDoc);
            }
        }

        const pdfBytes = await savePdfDocument(pdfDoc);
        const blob = createPdfBlob(pdfBytes);
        const filename = `${state.uploadedFile.name.replace('.pdf', '')}_annotated.pdf`;
        downloadBlob(blob, filename);

        showNotification('Annotated PDF downloaded successfully!');
    } catch (error) {
        console.error('Error generating annotated PDF:', error);
        showNotification('Failed to generate annotated PDF: ' + error.message, 'error');
    } finally {
        toggleButtonDisabled(downloadBtn, false);
        toggleLoader(loader, false);
    }
}

/**
 * Reset annotation state
 */
function resetState() {
    state.pdfDoc = null;
    state.uploadedFile = null;
    state.currentPageNum = 1;
    state.totalPages = 0;
    state.annotations = [];
    state.selectedAnnotation = null;
    state.tempAnnotation = null;

    // Clear canvases
    const pdfCanvas = document.getElementById('pdf-canvas');
    const annotationCanvas = document.getElementById('annotation-canvas');
    const pdfCtx = pdfCanvas.getContext('2d');
    const annotationCtx = annotationCanvas.getContext('2d');
    pdfCtx.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
    annotationCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);

    // Reset UI
    toggleVisibility(document.getElementById('annotate-drop-zone'), true);
    toggleVisibility(document.getElementById('annotate-viewer-section'), false);
    document.getElementById('annotate-file-input').value = '';

    removeInlineEditor();
}

/**
 * Reset annotate module (exported for cleanup)
 */
export function resetAnnotate() {
    resetState();
}
