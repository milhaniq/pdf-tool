/**
 * Annotation utility functions
 */

import { CONFIG } from '../config.js';
import { canvasToPdfCoords, hexToRgb, sanitizeTextForPdf } from './pdfUtils.js';

/**
 * Calculate font size from slider value
 *
 * @param {number} sliderValue - Value from size slider (1-20)
 * @returns {number} Font size in pixels
 */
export function calculateFontSize(sliderValue) {
    return sliderValue * CONFIG.textEditor.fontSizeMultiplier + CONFIG.textEditor.fontSizeOffset;
}

/**
 * Create annotation object
 *
 * @param {string} type - Annotation type
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} color - Hex color
 * @param {number} lineWidth - Line width
 * @param {number} pageNumber - Page number
 * @returns {Object} Annotation object
 */
export function createAnnotation(type, x, y, color, lineWidth, pageNumber) {
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

/**
 * Create text annotation object
 *
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} text - Text content
 * @param {string} color - Hex color
 * @param {number} fontSize - Font size
 * @param {number} pageNumber - Page number
 * @returns {Object} Text annotation object
 */
export function createTextAnnotation(x, y, text, color, fontSize, pageNumber) {
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

/**
 * Check if annotation is at given coordinates
 *
 * @param {Object} annotation - Annotation object
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} Whether annotation is at coordinates
 */
export function isAnnotationAt(annotation, x, y) {
    if (annotation.type === 'text') {
        // Check if near text position
        return Math.abs(x - annotation.x) < 50 && Math.abs(y - annotation.y) < 20;
    } else {
        // Check if within shape bounds
        const minX = Math.min(annotation.x, annotation.endX);
        const maxX = Math.max(annotation.x, annotation.endX);
        const minY = Math.min(annotation.y, annotation.endY);
        const maxY = Math.max(annotation.y, annotation.endY);

        return x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10;
    }
}

/**
 * Find annotation at coordinates
 *
 * @param {Object[]} annotations - Array of annotations
 * @param {number} pageNumber - Current page number
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} Found annotation or null
 */
export function findAnnotationAt(annotations, pageNumber, x, y) {
    // Search in reverse order (topmost first)
    for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        if (ann.pageNumber !== pageNumber) continue;

        if (isAnnotationAt(ann, x, y)) {
            return ann;
        }
    }
    return null;
}

/**
 * Validate annotation size
 *
 * @param {Object} annotation - Annotation object
 * @returns {boolean} Whether annotation is valid size
 */
export function validateAnnotationSize(annotation) {
    const dx = Math.abs(annotation.endX - annotation.x);
    const dy = Math.abs(annotation.endY - annotation.y);

    return dx > CONFIG.annotation.minAnnotationSize ||
           dy > CONFIG.annotation.minAnnotationSize;
}

/**
 * Move annotation by delta
 *
 * @param {Object} annotation - Annotation object
 * @param {number} dx - X delta
 * @param {number} dy - Y delta
 */
export function moveAnnotation(annotation, dx, dy) {
    annotation.x += dx;
    annotation.y += dy;
    if (annotation.endX !== undefined) {
        annotation.endX += dx;
        annotation.endY += dy;
    }
}

/**
 * Draw arrow on canvas
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} fromX - Start X
 * @param {number} fromY - Start Y
 * @param {number} toX - End X
 * @param {number} toY - End Y
 * @param {number} lineWidth - Line width
 */
export function drawArrowOnCanvas(ctx, fromX, fromY, toX, toY, lineWidth) {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

/**
 * Draw annotation on canvas
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} ann - Annotation object
 * @param {boolean} isSelected - Whether annotation is selected
 */
export function drawAnnotationOnCanvas(ctx, ann, isSelected = false) {
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

/**
 * Draw arrow on PDF page
 *
 * @param {Object} page - PDF-lib page object
 * @param {number} fromX - Start X
 * @param {number} fromY - Start Y
 * @param {number} toX - End X
 * @param {number} toY - End Y
 * @param {number} thickness - Line thickness
 * @param {Object} rgbColor - RGB color object
 */
export function drawArrowOnPdf(page, fromX, fromY, toX, toY, thickness, rgbColor) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw arrowhead lines
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

/**
 * Burn annotation into PDF page
 *
 * @param {Object} page - PDF-lib page object
 * @param {Object} ann - Annotation object
 * @param {number} pdfPageWidth - PDF page width
 * @param {number} pdfPageHeight - PDF page height
 * @param {Object} viewport - PDF.js viewport
 * @param {Object} pdfDoc - PDF-lib document (for font embedding)
 */
export async function burnAnnotationToPdf(page, ann, pdfPageWidth, pdfPageHeight, viewport, pdfDoc) {
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

/**
 * Filter annotations by page number
 *
 * @param {Object[]} annotations - All annotations
 * @param {number} pageNumber - Page number to filter by
 * @returns {Object[]} Filtered annotations
 */
export function filterAnnotationsByPage(annotations, pageNumber) {
    return annotations.filter(ann => ann.pageNumber === pageNumber);
}
