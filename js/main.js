/**
 * PDF Tools Suite - Main Entry Point
 * Initializes all modules and handles application setup
 */

import { initLucideIcons, setActiveTab } from './utils/uiUtils.js';
import { initPdfJsWorker } from './utils/pdfUtils.js';
import { initMerge } from './modules/merge.js';
import { initSplit } from './modules/split.js';
import { initExcel } from './modules/excel.js';
import { initCompress } from './modules/compress.js';
import { initAnnotate } from './modules/annotate.js';

/**
 * Tab button / content panel pairs.
 * Adding a feature tab means adding one entry here.
 */
const TAB_DEFINITIONS = [
    { tabId: 'merge-tab',    contentId: 'merge-content' },
    { tabId: 'split-tab',    contentId: 'split-content' },
    { tabId: 'ppt-tab',      contentId: 'ppt-content' },
    { tabId: 'compress-tab', contentId: 'compress-content' },
    { tabId: 'annotate-tab', contentId: 'annotate-content' }
];

/**
 * Setup tab switching for all tabs
 */
function setupTabSwitching() {
    const tabs = TAB_DEFINITIONS.map(def => ({
        tab: document.getElementById(def.tabId),
        content: document.getElementById(def.contentId)
    }));

    tabs.forEach(current => {
        if (!current.tab || !current.content) return;

        current.tab.addEventListener('click', () => {
            const others = tabs.filter(other => other !== current);
            const otherTabs = others.map(other => other.tab).filter(Boolean);
            const otherContents = others.map(other => other.content).filter(Boolean);
            setActiveTab(current.tab, otherTabs, current.content, otherContents);
        });
    });
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
        initCompress();
        console.log('[DEBUG] Compress module initialized');
    } catch (error) {
        console.error('[ERROR] Failed to initialize compress module:', error);
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
