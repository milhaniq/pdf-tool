/**
 * Configuration constants for PDF Tools Suite
 */

export const CONFIG = {
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
        minAnnotationSize: 5, // Minimum pixels to consider annotation valid
        clickThreshold: 5,    // Pixels to distinguish click from drag
        blurDelay: 200,       // Milliseconds to prevent immediate blur removal
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
        notificationDuration: 3000, // Milliseconds
        dragOverScale: 1.02
    },

    // File size formatting
    fileSize: {
        units: ['Bytes', 'KB', 'MB', 'GB'],
        kilo: 1024
    },

    // Compression settings
    compress: {
        // Presets shown as selectable cards
        presets: [
            { id: 'min',    name: 'Smallest file', desc: '72 DPI · greyscale · maximum squeeze', dpi: 72,  quality: 32, color: 'gray' },
            { id: 'strong', name: 'Strong',        desc: '96 DPI · good for email attachments',  dpi: 96,  quality: 50, color: 'colour' },
            { id: 'bal',    name: 'Balanced',      desc: '144 DPI · readable on screen',         dpi: 144, quality: 68, color: 'colour' },
            { id: 'light',  name: 'Light',         desc: '200 DPI · near print quality',         dpi: 200, quality: 82, color: 'colour' },
            { id: 'scan',   name: 'Scanned text',  desc: '150 DPI · black & white, tiny',        dpi: 150, quality: 60, color: 'bw' }
        ],

        defaultPreset: 'strong', // Preset selected on load
        minDpi: 40,
        maxDpi: 300,
        dpiStep: 2,
        minQuality: 10,
        maxQuality: 95,
        maxScale: 4,             // Upper bound on the render scale factor
        bwThreshold: 170,        // Luminance cut-off for black & white mode
        safeMode: true           // Keep the original when compression does not help
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

export default CONFIG;
