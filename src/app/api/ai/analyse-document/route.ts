import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { extractTextFromPdf } from '@/lib/utils/extractTextFromPdf';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

// Updated configuration format for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Process the form data
async function processFormData(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return { error: 'No file provided' };
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File size exceeds the 10MB limit' };
  }

  // Check file type
  const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt') && !file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
    return { error: 'Unsupported file type. Only PDF, DOC, DOCX, and TXT files are supported.' };
  }

  // Start an immediate "processing" timer to ensure we don't block for too long
  const processingTimeout = setTimeout(() => {
    console.log('Document processing is taking longer than expected');
  }, 5000);

  try {
    // Get file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if the file is valid
    if (!buffer || buffer.length === 0) {
      clearTimeout(processingTimeout);
      return { error: 'Invalid file content' };
    }

    // Save file to temporary directory
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    
    try {
      // Use Uint8Array to fix type issues with writeFile
      await writeFile(tempFilePath, new Uint8Array(buffer));
    } catch (err) {
      console.error('Error saving file:', err);
      return { error: 'Failed to process the file' };
    }

    let text = '';
    try {
      // Extract text based on file type
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Set a timeout for PDF extraction to ensure we don't block for too long
        const extractionPromise = extractTextFromPdf(tempFilePath);
        
        // Create a timeout promise
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve("PDF extraction is taking longer than expected. Returning partial results.");
          }, 8000); // 8 second timeout
        });
        
        // Race the extraction against the timeout
        text = await Promise.race([extractionPromise, timeoutPromise]);
        
        // If we got the timeout message, return it with a warning
        if (text.includes("PDF extraction is taking longer than expected")) {
          return { 
            text: "The system is still processing your document. Results will be available shortly.", 
            fileName: file.name, 
            warning: "PDF extraction timeout - partial results" 
          };
        }
        
        // The extractTextFromPdf function now returns an error message instead of throwing
        // Let's check if the message indicates an error
        if (text.includes("Unable to extract text from") || text.includes("Unable to process this PDF")) {
          // We'll still return the text as it contains useful diagnostic information
          return { text, fileName: file.name, warning: "PDF extraction partial or failed" };
        }
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        text = buffer.toString('utf-8');
      } else {
        // For DOC/DOCX files, we'd need a specific library
        // For now, just return a message saying we can't process these yet
        return { error: 'DOC/DOCX file processing is not yet implemented' };
      }

      // If we couldn't extract text, return an error
      if (!text || text.trim() === '') {
        return { error: 'Could not extract text from the file' };
      }

      // Clear the processing timeout since we're done
      clearTimeout(processingTimeout);
      
      return { text, fileName: file.name };
    } catch (err: any) { // Type assertion for err
      console.error('Error extracting text:', err);
      return { 
        error: 'Failed to extract text from the file', 
        details: err && err.message ? err.message : 'Unknown error'
      };
    }
  } catch (error) {
    // Clear the processing timeout if there's an error
    clearTimeout(processingTimeout);
    throw error;
  }
}

// Analyse the text with Claude
async function analyseWithClaude(text: string, fileName: string) {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    const prompt = `You are a helpful AI assistant specialising in care assessments and social work. You've been provided with the contents of a document called "${fileName}". 

    Please analyse this document for information relevant to a care assessment, focusing on:
    - Medical conditions and diagnoses
    - Care needs and limitations
    - Support requirements
    - Medication information
    - Current situation and background context
    
    The document content is:
    ${text}
    
    Based on the above content, please provide:
    1. A concise summary of the key care-related information
    2. A list of identified care needs
    3. Any recommended actions or considerations`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the analysis from the response with type checking
    const content = response.content[0];
    const analysis = typeof content === 'object' && 'text' in content ? content.text : '';
    return { analysis };
  } catch (err) {
    console.error('Error analysing with Claude:', err);
    return { error: 'Failed to analyse the document' };
  }
}

// API handler
export async function POST(req: NextRequest) {
  try {
    // Process the form data and extract text
    const result = await processFormData(req);
    
    if ('error' in result) {
      return NextResponse.json({ 
        error: result.error, 
        details: 'details' in result ? result.details : '' 
      }, { status: 400 });
    }

    // Call AI analysis with Claude
    const analysisResult = await analyseWithClaude(result.text, result.fileName);
    
    if ('error' in analysisResult) {
      return NextResponse.json({ error: analysisResult.error }, { status: 500 });
    }

    return NextResponse.json({ 
      text: result.text,
      analysis: analysisResult.analysis,
      fileName: result.fileName,
      warning: 'warning' in result ? result.warning : null
    });
  } catch (error: any) { // Type assertion for error
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process the document', 
        details: error && error.message ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 