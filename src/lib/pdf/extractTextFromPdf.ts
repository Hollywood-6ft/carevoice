/**
 * Utility function to extract text from PDF documents
 */

// Define our own interface instead of importing from pdf-parse
interface PDFData {
  text: string;
  numpages: number;
  info: Record<string, any>;
  metadata: Record<string, any>;
  version: string;
}

// Function to extract text from PDF files
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid SSR issues
    const pdfParse = (await import('pdf-parse')).default;
    
    // Parse the PDF buffer
    const data: PDFData = await pdfParse(pdfBuffer);
    
    // Return the extracted text
    return data.text || '';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
} 