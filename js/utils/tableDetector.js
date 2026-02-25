/**
 * Table Detection Utilities
 * Algorithms for detecting tabular data in PDF text items
 */

import { CONFIG } from '../config.js';

/**
 * Group text items by Y-coordinate (rows)
 * 
 * @param {Array} textItems - Array of text items with x, y, text properties
 * @param {number} threshold - Y-coordinate tolerance for grouping
 * @returns {Array} Array of rows, each containing text items
 */
export function groupByY(textItems, threshold = CONFIG.excel.rowThreshold) {
    if (!textItems || textItems.length === 0) return [];
    
    // Sort by Y coordinate (descending - PDF coordinates)
    const sorted = [...textItems].sort((a, b) => b.y - a.y);
    
    const rows = [];
    let currentRow = [sorted[0]];
    let currentY = sorted[0].y;
    
    for (let i = 1; i < sorted.length; i++) {
        const item = sorted[i];
        
        if (Math.abs(item.y - currentY) <= threshold) {
            // Same row
            currentRow.push(item);
        } else {
            // New row
            rows.push(currentRow);
            currentRow = [item];
            currentY = item.y;
        }
    }
    
    // Don't forget the last row
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }
    
    return rows;
}

/**
 * Extract all X positions from rows
 * 
 * @param {Array} rows - Array of rows containing text items
 * @returns {Array} Array of unique X positions
 */
export function extractXPositions(rows) {
    const xPositions = new Set();
    
    for (const row of rows) {
        for (const item of row) {
            xPositions.add(Math.round(item.x));
        }
    }
    
    return Array.from(xPositions).sort((a, b) => a - b);
}

/**
 * Cluster X positions into columns
 * 
 * @param {Array} xPositions - Array of X positions
 * @param {number} threshold - X-coordinate tolerance for clustering
 * @returns {Array} Array of column X positions
 */
export function clusterXPositions(xPositions, threshold = CONFIG.excel.columnThreshold) {
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
            // Use average of cluster as column position
            const avgX = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
            clusters.push(Math.round(avgX));
            
            currentCluster = [x];
            currentX = x;
        }
    }
    
    // Don't forget last cluster
    if (currentCluster.length > 0) {
        const avgX = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length;
        clusters.push(Math.round(avgX));
    }
    
    return clusters;
}

/**
 * Calculate grid density
 * Measures how well the text items fit into the detected grid
 * 
 * @param {Array} rows - Array of rows
 * @param {Array} columns - Array of column X positions
 * @returns {number} Grid density (0-1)
 */
export function calculateGridDensity(rows, columns) {
    if (!rows.length || !columns.length) return 0;
    
    let totalCells = 0;
    let filledCells = 0;
    
    for (const row of rows) {
        for (let i = 0; i < columns.length; i++) {
            totalCells++;
            
            const colStart = columns[i];
            const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
            
            // Check if any text item falls in this column
            const hasText = row.some(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            if (hasText) filledCells++;
        }
    }
    
    return totalCells > 0 ? filledCells / totalCells : 0;
}

/**
 * Measure column consistency across rows
 * 
 * @param {Array} rows - Array of rows
 * @param {Array} columns - Array of column X positions
 * @returns {number} Column consistency (0-1)
 */
export function measureColumnConsistency(rows, columns) {
    if (!rows.length || !columns.length) return 0;
    
    let consistentColumns = 0;
    
    for (let i = 0; i < columns.length; i++) {
        const colStart = columns[i];
        const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
        
        // Count how many rows have text in this column
        let rowsWithText = 0;
        
        for (const row of rows) {
            const hasText = row.some(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            if (hasText) rowsWithText++;
        }
        
        // Column is consistent if most rows have text in it
        if (rowsWithText >= rows.length * 0.5) {
            consistentColumns++;
        }
    }
    
    return columns.length > 0 ? consistentColumns / columns.length : 0;
}

/**
 * Validate if detected grid represents a valid table
 * 
 * @param {Array} rows - Array of rows
 * @param {Array} columns - Array of column X positions
 * @returns {Object} Validation result with isValid and confidence
 */
export function validateTableGrid(rows, columns) {
    const minRows = CONFIG.excel.minRows;
    const minCols = CONFIG.excel.minCols;
    
    // Check minimum requirements
    if (rows.length < minRows || columns.length < minCols) {
        return {
            isValid: false,
            confidence: 0,
            reason: `Need at least ${minRows} rows and ${minCols} columns`
        };
    }
    
    // Calculate grid metrics
    const gridDensity = calculateGridDensity(rows, columns);
    const consistency = measureColumnConsistency(rows, columns);
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

/**
 * Detect tables in a page
 * 
 * @param {Array} textItems - Array of text items
 * @returns {Array} Array of detected tables
 */
export function detectTables(textItems) {
    if (!textItems || textItems.length === 0) return [];
    
    // Group into rows
    const rows = groupByY(textItems);
    
    // Detect columns
    const xPositions = extractXPositions(rows);
    const columns = clusterXPositions(xPositions);
    
    // Validate table
    const validation = validateTableGrid(rows, columns);
    
    if (validation.isValid) {
        return [{
            rows,
            columns,
            confidence: validation.confidence,
            gridDensity: validation.gridDensity,
            consistency: validation.consistency
        }];
    }
    
    // Try to detect multiple smaller tables
    return detectMultipleTables(textItems, rows);
}

/**
 * Detect multiple tables in a page
 * 
 * @param {Array} textItems - Array of text items
 * @param {Array} rows - Array of rows
 * @returns {Array} Array of detected tables
 */
function detectMultipleTables(textItems, rows) {
    const tables = [];
    
    // Simple approach: try to split by vertical gaps
    // Group consecutive rows that form valid tables
    
    let currentTableRows = [];
    
    for (const row of rows) {
        currentTableRows.push(row);
        
        // Check if current rows form a valid table
        const xPositions = extractXPositions(currentTableRows);
        const columns = clusterXPositions(xPositions);
        const validation = validateTableGrid(currentTableRows, columns);
        
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

/**
 * Reconstruct cells from rows and columns
 * 
 * @param {Array} rows - Array of rows containing text items
 * @param {Array} columns - Array of column X positions
 * @returns {Array} 2D array representing the table
 */
export function reconstructCells(rows, columns) {
    const table = [];
    
    for (const row of rows) {
        const tableRow = [];
        
        for (let i = 0; i < columns.length; i++) {
            const colStart = columns[i];
            const colEnd = i < columns.length - 1 ? columns[i + 1] : colStart + 1000;
            
            // Find text items within this column
            const cellItems = row.filter(item => 
                item.x >= colStart && item.x < colEnd
            );
            
            // Sort by X position and join text
            cellItems.sort((a, b) => a.x - b.x);
            const cellText = cellItems.map(item => item.text).join(' ').trim();
            
            tableRow.push(cellText);
        }
        
        table.push(tableRow);
    }
    
    return table;
}

/**
 * Detect potential merged cells
 * 
 * @param {Array} table - 2D array representing the table
 * @param {Array} columns - Array of column X positions
 * @returns {Array} Array of merged cell info
 */
export function detectMergedCells(table, columns) {
    const mergedCells = [];
    
    for (let row = 0; row < table.length; row++) {
        for (let col = 0; col < table[row].length; col++) {
            const cellText = table[row][col];
            
            if (!cellText) continue;
            
            // Estimate text width (rough approximation)
            const textWidth = cellText.length * 7; // Assume ~7px per character
            
            if (col < columns.length - 1) {
                const colWidth = columns[col + 1] - columns[col];
                
                // If text is much wider than column, it might be merged
                if (textWidth > colWidth * CONFIG.excel.mergedCellThreshold) {
                    // Calculate span
                    let span = 1;
                    let totalWidth = colWidth;
                    
                    while (span < 5 && col + span < columns.length - 1) {
                        const nextColWidth = columns[col + span + 1] - columns[col + span];
                        totalWidth += nextColWidth;
                        
                        if (textWidth <= totalWidth * 1.1) break;
                        span++;
                    }
                    
                    if (span > 1) {
                        mergedCells.push({ row, col, span });
                    }
                }
            }
        }
    }
    
    return mergedCells;
}

/**
 * Extract text items from PDF.js text content
 * 
 * @param {Object} textContent - PDF.js text content object
 * @returns {Array} Array of text items with position info
 */
export function extractTextItems(textContent) {
    if (!textContent || !textContent.items) return [];
    
    const textItems = [];
    
    for (const item of textContent.items) {
        if (item.str.trim() === '') continue;
        
        textItems.push({
            text: item.str.trim(),
            x: Math.round(item.transform[4]), // X coordinate
            y: Math.round(item.transform[5]), // Y coordinate
            width: Math.round(item.width),
            height: Math.round(item.height || 12),
            font: item.fontName || 'unknown'
        });
    }
    
    return textItems;
}

/**
 * Calculate column widths for Excel
 * 
 * @param {Array} table - 2D array representing the table
 * @returns {Array} Array of column widths
 */
export function calculateColumnWidths(table) {
    if (!table || table.length === 0) return [];
    
    const colCount = Math.max(...table.map(row => row.length));
    const widths = [];
    
    for (let col = 0; col < colCount; col++) {
        let maxWidth = 10; // Minimum width
        
        for (const row of table) {
            const cellText = row[col] || '';
            // Rough estimate: character count + padding
            const width = Math.min(Math.max(cellText.length, 10), 50);
            maxWidth = Math.max(maxWidth, width);
        }
        
        widths.push(maxWidth);
    }
    
    return widths;
}
