/**
 * PDF utility functions
 */

import { CONFIG } from '../config.js';

/**
 * Initialize PDF.js worker
 * MUST be called before any PDF operations
 */
export function initPdfJsWorker() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.cdn.pdfJsWorker;
    }
}

/**
 * Convert canvas coordinates to PDF coordinates
 * Canvas: Y increases downward (0 at top)
 * PDF: Y increases upward (0 at bottom)
 *
 * @param {number} canvasX - X coordinate in canvas space
 * @param {number} canvasY - Y coordinate in canvas space
 * @param {number} pdfPageWidth - Width of PDF page
 * @param {number} pdfPageHeight - Height of PDF page
 * @param {number} viewportWidth - Width of viewport
 * @param {number} viewportHeight - Height of viewport
 * @returns {Object} { x, y } - Coordinates in PDF space
 */
export function canvasToPdfCoords(canvasX, canvasY, pdfPageWidth, pdfPageHeight, viewportWidth, viewportHeight) {
    const scaleX = pdfPageWidth / viewportWidth;
    const scaleY = pdfPageHeight / viewportHeight;

    return {
        x: canvasX * scaleX,
        y: pdfPageHeight - (canvasY * scaleY) // Flip Y axis
    };
}

/**
 * Calculate scale factors for coordinate conversion
 *
 * @param {Object} viewport - PDF.js viewport object
 * @param {number} pdfPageWidth - Width of PDF page
 * @param {number} pdfPageHeight - Height of PDF page
 * @returns {Object} { scaleX, scaleY }
 */
export function calculateScaleFactors(viewport, pdfPageWidth, pdfPageHeight) {
    return {
        scaleX: pdfPageWidth / viewport.width,
        scaleY: pdfPageHeight / viewport.height
    };
}

/**
 * Get viewport for a PDF page
 *
 * @param {Object} pdfPage - PDF.js page object
 * @param {number} scale - Scale factor (default from config)
 * @returns {Promise<Object>} PDF.js viewport
 */
export async function getViewport(pdfPage, scale = CONFIG.pdf.defaultScale) {
    return await pdfPage.getViewport({ scale });
}

/**
 * Sanitize text for PDF encoding
 * PDF-lib uses WinAnsi encoding (Latin-1 only)
 *
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeTextForPdf(text) {
    if (!text) return '';

    // Remove zero-width characters
    // Replace non-Latin-1 characters with ?
    return text
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u0100-\uFFFF]/g, '?');
}

/**
 * Convert hex color to RGB for PDF-lib
 *
 * @param {string} hex - Hex color (e.g., "#ff0000")
 * @returns {Object} { r, g, b } - RGB values (0-1 range)
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

/**
 * Load PDF document using PDF.js
 *
 * @param {ArrayBuffer} arrayBuffer - PDF file data
 * @returns {Promise<Object>} PDF document proxy
 */
export async function loadPdfDocument(arrayBuffer) {
    return await pdfjsLib.getDocument(arrayBuffer).promise;
}

/**
 * Load PDF document using PDF-lib
 *
 * @param {ArrayBuffer} arrayBuffer - PDF file data
 * @returns {Promise<Object>} PDF document
 */
export async function loadPdfLibDocument(arrayBuffer) {
    return await PDFLib.PDFDocument.load(arrayBuffer);
}

/**
 * Create a new PDF document
 *
 * @returns {Promise<Object>} New PDF document
 */
export async function createPdfDocument() {
    return await PDFLib.PDFDocument.create();
}

/**
 * Save PDF document to bytes
 *
 * @param {Object} pdfDoc - PDF-lib document
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function savePdfDocument(pdfDoc) {
    return await pdfDoc.save();
}

/**
 * Create blob from PDF bytes
 *
 * @param {Uint8Array} pdfBytes - PDF bytes
 * @returns {Blob} PDF blob
 */
export function createPdfBlob(pdfBytes) {
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Create object URL from blob
 *
 * @param {Blob} blob - Blob object
 * @returns {string} Object URL
 */
export function createObjectUrl(blob) {
    return URL.createObjectURL(blob);
}

/**
 * Revoke object URL to prevent memory leaks
 *
 * @param {string} url - Object URL to revoke
 */
export function revokeObjectUrl(url) {
    if (url) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Download file via blob
 *
 * @param {Blob} blob - File blob
 * @param {string} filename - Download filename
 */
export function downloadBlob(blob, filename) {
    const url = createObjectUrl(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    revokeObjectUrl(url);
}
