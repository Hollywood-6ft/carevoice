import fs from 'fs';
import path from 'path';

// Cache for PDF extraction to avoid processing the same file multiple times
const extractionCache = new Map<string, { text: string, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extracts text content from a PDF file with caching
 * @param filePath Path to the PDF file
 * @returns Promise resolving to the extracted text content
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  // Check cache first - this will significantly speed up repeated requests for the same PDF
  const fileStats = fs.statSync(filePath);
  const cacheKey = `${filePath}-${fileStats.size}-${fileStats.mtimeMs}`;
  
  // If we have a recent cached result, use it
  const cached = extractionCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('Using cached PDF extraction result');
    return cached.text;
  }
  
  try {
    // Avoid importing the default require as it might trigger test behavior
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    
    // To make extraction faster, we'll set some optimized options
    const options = {
      // No page limit
      max: 0,
      // Avoid rendering by setting version to false
      version: false,
      // Minimal processing for faster results
      pagerender: function(pageData: any) {
        // Extract text from page - this is faster than the default renderer
        return pageData.getTextContent({normalizeWhitespace: true})
          .then(function(textContent: any) {
            let text = '';
            // Combine the text items into a single string, preserving some structure
            let lastY = -1;
            textContent.items.forEach(function(item: any) {
              if(lastY !== item.transform[5]) {
                lastY = item.transform[5];
                text += '\n';
              }
              text += item.str + ' ';
            });
            return text;
          });
      },
      // Provide empty render to avoid default rendering which uses test files
      renderer: {
        render: () => {}
      }
    };
    
    // Load the PDF file as a binary array - we'll use a more memory-efficient approach
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF with explicit options
    const data = await pdfParse(dataBuffer, options);
    
    // Process the extracted text to improve readability
    let extractedText = data.text || '';
    
    // Clean up text - remove excessive whitespace but preserve paragraph breaks
    extractedText = extractedText.replace(/\s+/g, ' ')     // Collapse multiple spaces
                               .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
                               .trim();
    
    // If there's no text, use a fallback message
    if (!extractedText || extractedText.trim() === '') {
      const result = "The PDF document appears to contain no extractable text. It may be scanned or image-based.";
      // Cache the result
      extractionCache.set(cacheKey, { text: result, timestamp: Date.now() });
      return result;
    }
    
    // Cache the successful result
    extractionCache.set(cacheKey, { text: extractedText, timestamp: Date.now() });
    
    return extractedText;
  } catch (error) {
    // Log detailed error but return a simple message
    console.error('Error extracting text from PDF:', error);
    
    // Try a fallback method for error cases
    try {
      // If the file exists but can't be parsed properly, return basic file info
      const fileName = path.basename(filePath);
      const fileSize = (fileStats.size / 1024).toFixed(2);
      const result = `Unable to extract text from ${fileName} (${fileSize} KB). The PDF may be protected, corrupted, or contain only images. Please upload a text-based PDF or manually enter the information.`;
      
      // Cache the error result too to prevent repeated attempts
      extractionCache.set(cacheKey, { text: result, timestamp: Date.now() });
      
      return result;
    } catch (fallbackError) {
      console.error('Error in fallback extraction:', fallbackError);
    }
    
    // If everything fails, return a user-friendly message instead of throwing
    const finalResult = "Unable to process this PDF document. Please try a different document or type the content directly in the chat.";
    extractionCache.set(cacheKey, { text: finalResult, timestamp: Date.now() });
    return finalResult;
  }
} 