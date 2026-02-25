# 📄 PDF Tools Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/license/yourusername/pdf-tools-suite)](https://github.com/yourusername/pdf-tools-suite)

A powerful, browser-based toolkit to **merge, split, convert PDF files to PowerPoint (PPTX) or Excel (.xlsx), and annotate PDFs** — all client-side, with no server uploads required.
Built using **HTML, TailwindCSS, JavaScript, PDF-Lib, PDF.js, JSZip, SortableJS, PptxGenJS, and SheetJS**.

---

## 🚀 Features

### ✅ **Merge PDFs**

* Drag & drop multiple PDF files
* Reorder files easily using drag-and-drop
* Clear individual files or all at once
* Download merged PDF instantly

### ✂️ **Split PDF**

* Upload a single PDF
* Split into:

  * Individual pages
  * Specific page ranges (e.g., `1-3, 5, 7-10`)
* Export results as a ZIP file

### 🔁 **PDF → PPTX Converter**

* Convert PDF pages into high-quality PowerPoint slides
* Optional:

  * **Preserve aspect ratio**
  * **High-quality rendering**
* Live progress bar
* Download as `.pptx`

### 📊 **PDF → Excel Converter**

* Extract tables and data from PDFs into Excel spreadsheets
* Features:

  * **Automatic table detection** using position-based clustering
  * **Multiple tables per page** detection
  * **Auto-fit column widths**
  * **Header detection** and bold formatting
  * **Auto-filter** for easy data sorting
* Live progress bar with confidence indicators
* Download as `.xlsx`

**⚠️ Accuracy Notice:** Works best with simple, native PDFs containing clear tabular data. Complex layouts, scanned documents, or merged cells may have reduced accuracy. Since this is 100% client-side (for your privacy), we continuously improve our algorithms but perfect conversion isn't always possible.

### ✏️ **PDF Annotation**

* Upload any PDF document (forms, reports, etc.)
* Annotate with multiple tools:

  * **Text boxes** - Add text anywhere on the page
  * **Highlighter** - Highlight text with semi-transparent overlay
  * **Arrows** - Draw arrows to point to specific content
  * **Shapes** - Draw rectangles, circles, and lines
* Customize annotations:

  * Choose from any color
  * Adjust line thickness
  * Move and resize annotations
  * Delete individual annotations or clear all
* Navigate between pages while preserving annotations
* Download annotated PDF with all changes burned in
* Touch-friendly for mobile devices

### 🔐 **100% Client-Side**

All processing happens inside the browser.
No files are uploaded, stored, or sent to any server.

---

## 🛠️ Technologies Used

| Library / Tool  | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| **TailwindCSS** | UI styling                                           |
| **PDF-Lib**     | Merging, splitting PDFs & burning annotations        |
| **SortableJS**  | Drag-and-drop file ordering                          |
| **JSZip**       | Creating ZIP archives for split files                |
| **PDF.js**      | Rendering PDF pages for PPT conversion & annotation  |
| **PptxGenJS**   | Generating PowerPoint presentations                  |
| **SheetJS**     | Generating Excel spreadsheets                        |

---

## 📦 Installation & Usage

### Option 1: Direct File Access (Recommended)

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pdf-tools-suite.git
cd pdf-tools-suite
```

2. Open `index.html` in any modern browser

✔ **No build steps needed**
✔ **No dependencies to install**
✔ **Works offline after first load**

### Option 2: Live Server (For Development)

If you prefer to run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000/index.html
```

---

## 🧰 Project Structure

```
pdf-tools-suite/
├── index.html     # Main application entry point
├── bundle.js              # Bundled JavaScript (for file:// protocol)
├── js/
│   ├── main.js           # Application initialization
│   ├── config.js         # Configuration constants
│   ├── modules/          # Feature modules
│   │   ├── merge.js      # PDF merging
│   │   ├── split.js      # PDF splitting
│   │   ├── excel.js      # PDF to Excel conversion
│   │   ├── ppt.js        # PDF to PPT conversion
│   │   └── annotate.js   # PDF annotation
│   └── utils/            # Utility functions
│       ├── pdfUtils.js        # PDF helper functions
│       ├── uiUtils.js          # UI helper functions
│       ├── tableDetector.js    # Excel table detection
│       └── annotationUtils.js  # Annotation utilities
├── plans/                 # Architecture documentation
├── README.md              # This file
├── LICENSE                # MIT License
└── .gitignore            # Git ignore rules
```

---

## 🧪 How It Works (Technical Summary)

### PDF Merge

* Reads all files using `File.arrayBuffer()`
* Uses **PDF-Lib** to load each document and copy pages into a new PDF
* Creates a downloadable Blob using `URL.createObjectURL()`

### PDF Split

* Loads the uploaded PDF using **PDF-Lib**
* Creates separate PDFs for pages or ranges
* Packages output using **JSZip**

### PDF → PPTX Conversion

* Renders each page as a canvas image using **PDF.js**
* Inserts each image as a slide in **PptxGenJS**
* Exports the `.pptx` file client-side

### PDF → Excel Conversion

* Extracts text content from PDF using **PDF.js**
* Detects tabular structures using custom algorithms:
  - Groups text items by Y-coordinates (rows)
  - Clusters X-coordinates (columns)
  - Validates grid structure
  - Reconstructs cells from positioned text
* Generates Excel workbook using **SheetJS**
* Applies formatting: auto-fit columns, bold headers, auto-filter
* Exports the `.xlsx` file client-side

### PDF Annotation

* Renders PDF pages using **PDF.js** on a canvas
* Overlays a second canvas for drawing annotations
* Stores annotations as objects with type, coordinates, and properties
* Supports multiple annotation types: text, highlight, arrow, rectangle, circle, line
* On download, uses **PDF-Lib** to burn annotations into the PDF:
  * Converts canvas coordinates to PDF coordinates
  * Draws text, shapes, and highlights using PDF-lib's graphics API
  * Preserves original PDF quality while adding annotations
* All processing happens client-side with no server uploads

---

## ⚠️ Limitations

* Password-protected or corrupted PDFs may fail to load
* Very large PDFs may cause high memory usage in the browser
* PowerPoint quality depends on screen resolution and rendering settings
* **Excel conversion accuracy varies:**
  * Works best with simple, native PDFs with clear tabular data (85-95% accuracy)
  * Medium complexity PDFs: 70-85% accuracy
  * Complex layouts, scanned documents, or merged cells: 50-70% accuracy
  * Scanned PDFs (images) require OCR (not currently supported)

---

Libraries used:

* [PDF-Lib](https://pdf-lib.js.org/)
* [PDF.js](https://mozilla.github.io/pdf.js/)
* [JSZip](https://stuk.github.io/jszip/)
* [SortableJS](https://sortablejs.github.io/Sortable/)
* [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)
* [SheetJS](https://sheetjs.com/)

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and structure
- Add comments for complex logic
- Test your changes thoroughly before submitting
- Update documentation as needed

### Areas for Improvement

- [ ] Add OCR support for scanned PDFs
- [ ] Improve Excel conversion accuracy for complex layouts
- [ ] Add more annotation tools (stamps, signatures, etc.)
- [ ] Support for password-protected PDFs
- [ ] Batch processing for multiple files

---

## 🐛 Reporting Issues

Found a bug? Please open an issue on GitHub with:

- **Title**: Clear description of the bug
- **Description**: Steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: Browser and OS details

---

## 📄 License

This project is open source under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## ⭐ Show Your Support

If you find this project useful, please consider:

- Giving it a ⭐ on GitHub
- Sharing it with others who might need it
- Providing feedback or suggestions for improvements

---

💼 Built with ❤️ to simplify PDF management for everyone - [https://milhaniq.com](https://milhaniq.com)

