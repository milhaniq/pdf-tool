# PDF Tools Suite - Modular Structure

This document describes the modular architecture of the PDF Tools Suite application.

## Directory Structure

```
/
├── index.html          # Main HTML file (uses ES6 modules)
├── index.html                  # Original single-file version (for reference)
├── js/
│   ├── main.js                 # Application entry point
│   ├── config.js               # Configuration constants
│   ├── utils/
│   │   ├── pdfUtils.js         # PDF utility functions
│   │   ├── uiUtils.js          # UI utility functions
│   │   └── annotationUtils.js  # Annotation utility functions
│   └── modules/
│       ├── merge.js            # PDF merge functionality
│       ├── split.js            # PDF split functionality
│       ├── ppt.js              # PDF to PPT conversion
│       └── annotate.js         # PDF annotation system
├── css/
│   └── styles.css              # (Optional) Extracted CSS styles
├── AGENTS.md                   # Main project documentation
└── .kilocode/
    └── rules-*/
        └── AGENTS.md           # Mode-specific documentation
```

## Module Descriptions

### Core Files

#### `js/main.js`
- **Purpose**: Application entry point
- **Responsibilities**:
  - Initialize PDF.js worker
  - Initialize Lucide icons
  - Initialize all feature modules
- **Dependencies**: All utility and module files

#### `js/config.js`
- **Purpose**: Centralized configuration
- **Exports**: `CONFIG` object containing:
  - CDN URLs
  - PDF rendering settings
  - Annotation settings
  - UI settings
  - File size formatting constants

### Utility Modules

#### `js/utils/pdfUtils.js`
- **Purpose**: PDF processing utilities
- **Key Functions**:
  - `initPdfJsWorker()` - Initialize PDF.js worker
  - `canvasToPdfCoords()` - Convert canvas to PDF coordinates
  - `sanitizeTextForPdf()` - Sanitize text for WinAnsi encoding
  - `hexToRgb()` - Convert hex color to RGB
  - `loadPdfDocument()` - Load PDF with PDF.js
  - `loadPdfLibDocument()` - Load PDF with PDF-lib
  - `createPdfDocument()` - Create new PDF
  - `savePdfDocument()` - Save PDF to bytes
  - `createPdfBlob()` - Create blob from PDF bytes
  - `downloadBlob()` - Download file via blob
  - `revokeObjectUrl()` - Revoke object URL (memory management)

#### `js/utils/uiUtils.js`
- **Purpose**: UI helper functions
- **Key Functions**:
  - `showNotification()` - Display notification messages
  - `formatFileSize()` - Format file size in human-readable format
  - `setActiveTab()` - Handle tab switching
  - `getCanvasCoordinates()` - Get canvas coordinates from event
  - `createFileInfoHtml()` - Create file info HTML
  - `toggleVisibility()` - Show/hide elements
  - `toggleButtonDisabled()` - Enable/disable buttons
  - `updateProgress()` - Update progress bar

#### `js/utils/annotationUtils.js`
- **Purpose**: Annotation system utilities
- **Key Functions**:
  - `calculateFontSize()` - Calculate font size from slider
  - `createAnnotation()` - Create annotation object
  - `createTextAnnotation()` - Create text annotation
  - `findAnnotationAt()` - Find annotation at coordinates
  - `validateAnnotationSize()` - Validate annotation size
  - `moveAnnotation()` - Move annotation by delta
  - `drawAnnotationOnCanvas()` - Draw annotation on canvas
  - `drawArrowOnCanvas()` - Draw arrow on canvas
  - `drawArrowOnPdf()` - Draw arrow on PDF
  - `burnAnnotationToPdf()` - Burn annotation into PDF
  - `filterAnnotationsByPage()` - Filter annotations by page

### Feature Modules

#### `js/modules/merge.js`
- **Purpose**: PDF merge functionality
- **State**: `uploadedFiles`, `sortable`, `blobUrl`
- **Key Functions**:
  - `initMerge()` - Initialize merge module
  - `handleFiles()` - Handle uploaded files
  - `renderFileList()` - Render file list with drag-drop
  - `mergePdfs()` - Merge PDF files
  - `resetMerge()` - Reset merge state

#### `js/modules/split.js`
- **Purpose**: PDF split functionality
- **State**: `uploadedFile`, `pdfDoc`, `blobUrl`, `mergedBlobUrl`, `hasSplitFile`
- **Key Functions**:
  - `initSplit()` - Initialize split module
  - `handleFile()` - Handle uploaded file
  - `splitPdf()` - Split PDF file
  - `parsePageRanges()` - Parse page range strings
  - `resetSplit()` - Reset split state

#### `js/modules/ppt.js`
- **Purpose**: PDF to PowerPoint conversion
- **State**: `uploadedFile`, `blobUrl`
- **Key Functions**:
  - `initPpt()` - Initialize PPT module
  - `handleFile()` - Handle uploaded file
  - `convertToPpt()` - Convert PDF to PowerPoint
  - `resetPpt()` - Reset PPT state

#### `js/modules/annotate.js`
- **Purpose**: PDF annotation system
- **State**: `pdfDoc`, `uploadedFile`, `currentPageNum`, `totalPages`, `currentTool`, `annotations`, `selectedAnnotation`, etc.
- **Key Functions**:
  - `initAnnotate()` - Initialize annotation module
  - `handleFile()` - Handle uploaded PDF
  - `renderPdfPage()` - Render PDF page
  - `renderAnnotations()` - Render annotations on canvas
  - `handleMouseDown/Move/Up()` - Mouse event handlers
  - `showTextInput()` - Show text input for new annotation
  - `showInlineEditorForText()` - Show editor for existing text
  - `showTextSizeControls()` - Show font size/color controls
  - `downloadAnnotatedPdf()` - Download annotated PDF
  - `resetAnnotate()` - Reset annotation state

## Usage

### Development
1. Open `index.html` in a browser
2. No build process required
3. Edit individual module files
4. Refresh browser to see changes

### Important Notes

1. **ES6 Modules**: The application uses ES6 modules with `type="module"`
2. **No Build Step**: Direct browser loading, no bundler required
3. **CDN Dependencies**: All libraries loaded via CDN
4. **Client-Side Only**: All processing happens in the browser
5. **Memory Management**: Always revoke Blob URLs to prevent leaks

## Module Dependencies

```
main.js
├── config.js
├── utils/
│   ├── pdfUtils.js (depends on: config.js)
│   ├── uiUtils.js (depends on: config.js)
│   └── annotationUtils.js (depends on: config.js, pdfUtils.js)
└── modules/
    ├── merge.js (depends on: utils/pdfUtils.js, utils/uiUtils.js)
    ├── split.js (depends on: utils/pdfUtils.js, utils/uiUtils.js)
    ├── ppt.js (depends on: utils/pdfUtils.js, utils/uiUtils.js, config.js)
    └── annotate.js (depends on: utils/pdfUtils.js, utils/uiUtils.js, utils/annotationUtils.js, config.js)
```

## Key Patterns

### State Management
- Each module maintains its own state object
- State is encapsulated within module closures
- No global state pollution

### Event Handling
- Event listeners set up in module init functions
- Event handlers use module-scoped state
- Cleanup functions provided for reset scenarios

### Error Handling
- Try-catch blocks around async operations
- User-friendly error notifications
- Console logging for debugging

### Memory Management
- Blob URLs tracked and revoked
- Event listeners cleaned up on reset
- Canvas contexts cleared when needed

## Migration from Single File

The original `index.html` contains all functionality in a single file. The modular version (`index.html`) maintains identical functionality while improving:

1. **Maintainability**: Code organized by feature
2. **Scalability**: Easy to add new features
3. **Testability**: Modules can be tested independently
4. **Readability**: Smaller, focused files
5. **Reusability**: Utility functions shared across modules

## Future Enhancements

With the modular structure in place, future improvements could include:

1. **Build Process**: Add Vite or Webpack for bundling
2. **Testing**: Add Vitest or Jest for unit tests
3. **TypeScript**: Migrate to TypeScript for type safety
4. **State Management**: Add Zustand or Redux for global state
5. **Component Framework**: Consider React/Vue for UI components
6. **CSS Extraction**: Move inline styles to separate CSS file
7. **Code Splitting**: Lazy load modules for better performance
