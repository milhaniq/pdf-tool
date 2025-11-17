# 📄 PDF Tools Suite

A powerful, browser-based toolkit to **merge, split, and convert PDF files to PowerPoint (PPTX)** — all client-side, with no server uploads required.
Built using **HTML, TailwindCSS, JavaScript, PDF-Lib, PDF.js, JSZip, SortableJS, and PptxGenJS**.

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

### 🔐 **100% Client-Side**

All processing happens inside the browser.
No files are uploaded, stored, or sent to any server.

---

## 🛠️ Technologies Used

| Library / Tool  | Purpose                                |
| --------------- | -------------------------------------- |
| **TailwindCSS** | UI styling                             |
| **PDF-Lib**     | Merging & splitting PDFs               |
| **SortableJS**  | Drag-and-drop file ordering            |
| **JSZip**       | Creating ZIP archives for split files  |
| **PDF.js**      | Rendering PDF pages for PPT conversion |
| **PptxGenJS**   | Generating PowerPoint presentations    |

---

## 📦 Installation (Local Development)

1. Clone the repository:

```bash
git clone https://github.com/your-username/pdf-tools-suite.git
```

2. Open the project folder:

```bash
cd pdf-tools-suite
```

3. Launch the app by opening `index.html` in any modern browser.

✔ **No build steps needed**
✔ **No dependencies to install**

---

## 🧰 Project Structure

```
/
├── index.html        # Main application (all logic included)
├── README.md         # Documentation
└── /assets           # (Optional) Add icons, images, etc.
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

---

## ⚠️ Limitations

* Password-protected or corrupted PDFs may fail to load
* Very large PDFs may cause high memory usage in the browser
* PowerPoint quality depends on screen resolution and rendering settings

---

Libraries used:

* [PDF-Lib](https://pdf-lib.js.org/)
* [PDF.js](https://mozilla.github.io/pdf.js/)
* [JSZip](https://stuk.github.io/jszip/)
* [SortableJS](https://sortablejs.github.io/Sortable/)
* [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)

---

## 📄 License

This project is open source under the **MIT License**.
Feel free to use, modify, and distribute.


---

💼 Built with ❤️ to simplify PDF management for everyone -[https://milhaniq.com](https://milhaniq.com)

