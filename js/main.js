/**
 * PDF Tools Suite - Main Entry Point
 * Initializes all modules and handles application setup
 */

import { initLucideIcons, setActiveTab } from './utils/uiUtils.js';
import { initPdfJsWorker } from './utils/pdfUtils.js';
import { initMerge } from './modules/merge.js';
import { initSplit } from './modules/split.js';
import { initExcel } from './modules/excel.js';
import { initAnnotate } from './modules/annotate.js';

/**
 * Setup tab switching for all tabs
 */
function setupTabSwitching() {
    // Get all tab elements
    const mergeTab = document.getElementById('merge-tab');
    const splitTab = document.getElementById('split-tab');
    const pptTab = document.getElementById('ppt-tab');
    const annotateTab = document.getElementById('annotate-tab');
    const mergeContent = document.getElementById('merge-content');
    const splitContent = document.getElementById('split-content');
    const pptContent = document.getElementById('ppt-content');
    const annotateContent = document.getElementById('annotate-content');

    // Setup merge tab
    if (mergeTab) {
        mergeTab.addEventListener('click', () => {
            const allTabs = [splitTab, pptTab, annotateTab].filter(Boolean);
            const allContents = [splitContent, pptContent, annotateContent].filter(Boolean);
            setActiveTab(mergeTab, allTabs, mergeContent, allContents);
        });
    }

    // Setup split tab
    if (splitTab) {
        splitTab.addEventListener('click', () => {
            const allTabs = [mergeTab, pptTab, annotateTab].filter(Boolean);
            const allContents = [mergeContent, pptContent, annotateContent].filter(Boolean);
            setActiveTab(splitTab, allTabs, splitContent, allContents);
        });
    }

    // Setup ppt tab
    if (pptTab) {
        pptTab.addEventListener('click', () => {
            const allTabs = [mergeTab, splitTab, annotateTab].filter(Boolean);
            const allContents = [mergeContent, splitContent, annotateContent].filter(Boolean);
            setActiveTab(pptTab, allTabs, pptContent, allContents);
        });
    }

    // Setup annotate tab
    if (annotateTab) {
        annotateTab.addEventListener('click', () => {
            const allTabs = [mergeTab, splitTab, pptTab].filter(Boolean);
            const allContents = [mergeContent, splitContent, pptContent].filter(Boolean);
            setActiveTab(annotateTab, allTabs, annotateContent, allContents);
        });
    }
}

/**
 * Initialize application
 */
function initApp() {
    console.log('[DEBUG] Initializing PDF Tools Suite...');
    console.log('[DEBUG] Checking global libraries...');
    console.log('[DEBUG] pdfjsLib:', typeof pdfjsLib);
    console.log('[DEBUG] PDFLib:', typeof PDFLib);
    console.log('[DEBUG] Sortable:', typeof Sortable);
    console.log('[DEBUG] lucide:', typeof lucide);
    console.log('[DEBUG] JSZip:', typeof JSZip);
    console.log('[DEBUG] PptxGenJS:', typeof PptxGenJS);
    
    // Check if all required libraries are loaded
    if (typeof pdfjsLib === 'undefined') {
        console.error('[ERROR] pdfjsLib is not defined!');
        return;
    }
    if (typeof PDFLib === 'undefined') {
        console.error('[ERROR] PDFLib is not defined!');
        return;
    }
    if (typeof lucide === 'undefined') {
        console.error('[ERROR] lucide is not defined!');
        return;
    }
    
    console.log('[DEBUG] All required libraries loaded successfully');
    
    // Initialize PDF.js worker
    console.log('[DEBUG] Initializing PDF.js worker...');
    initPdfJsWorker();
    console.log('[DEBUG] PDF.js worker initialized');

    // Initialize Lucide icons
    console.log('[DEBUG] Initializing Lucide icons...');
    initLucideIcons();
    console.log('[DEBUG] Lucide icons initialized');

    // Setup tab switching BEFORE initializing modules
    console.log('[DEBUG] Setting up tab switching...');
    setupTabSwitching();
    console.log('[DEBUG] Tab switching set up');

    // Initialize all modules
    console.log('[DEBUG] Initializing modules...');
    try {
        initMerge();
        console.log('[DEBUG] Merge module initialized');
    } catch (error) {
        console.error('[ERROR] Failed to initialize merge module:', error);
    }
    
    try {
        initSplit();
        console.log('[DEBUG] Split module initialized');
    } catch (error) {
        console.error('[ERROR] Failed to initialize split module:', error);
    }
    
    try {
        initExcel();
        console.log('[DEBUG] Excel module initialized');
    } catch (error) {
        console.error('[ERROR] Failed to initialize Excel module:', error);
    }
    
    try {
        initAnnotate();
        console.log('[DEBUG] Annotate module initialized');
    } catch (error) {
        console.error('[ERROR] Failed to initialize annotate module:', error);
    }

    console.log('[DEBUG] PDF Tools Suite initialization complete');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Export for potential external use
export { initApp };
