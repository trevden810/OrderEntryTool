/**
 * PDF Processing Service
 * Handles text extraction and OCR
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from PDF using PDF.js
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  const pageTexts = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    pageTexts.push(pageText);
    fullText += pageText + '\n';
  }
  
  return {
    fullText,
    pageTexts,
    pageCount: pdf.numPages,
    wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length
  };
}

/**
 * Process PDF with OCR using Tesseract
 */
export async function extractTextWithOCR(file, onProgress) {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data: { text, confidence } } = await worker.recognize(file, {
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      }
    });
    
    await worker.terminate();
    
    return {
      fullText: text,
      confidence: Math.round(confidence),
      method: 'OCR'
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}

/**
 * Determine if PDF needs OCR (low word count suggests scanned document)
 */
export function needsOCR(extractedData) {
  return extractedData.wordCount < 50;
}

/**
 * Process PDF with automatic method selection
 */
export async function processPDF(file, mode = 'auto', onProgress) {
  const textData = await extractTextFromPDF(file);
  
  if (mode === 'ocr' || (mode === 'auto' && needsOCR(textData))) {
    onProgress?.({ status: 'switching to OCR', progress: 0 });
    const ocrData = await extractTextWithOCR(file, (progress) => {
      onProgress?.({ status: 'OCR processing', progress });
    });
    return { ...ocrData, pageCount: textData.pageCount };
  }
  
  return { ...textData, method: 'text', confidence: 95 };
}
