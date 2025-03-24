import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Standard Node.js environment for reliability
export const runtime = 'nodejs';

export async function POST(req: Request) {
  console.log('OpenAI API called for document analysis');
  try {
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Extract the messages from the request
    const { messages } = await req.json();
    
    console.log(`Received ${messages.length} messages`);

    // Check for direct extraction command
    const extractionMessage = messages.find((message: any) => 
      message.role === 'user' && 
      message.content.startsWith('extract_everything')
    );

    // If we have a direct extraction command, handle it specially
    if (extractionMessage) {
      console.log('Direct extraction command detected');
      
      // Extract document content
      const documentContent = extractionMessage.content.replace('extract_everything', '').trim();
      
      // Create a specialized system prompt with the document content included
      const systemPrompt = `You are an expert care document analyst. The following text was extracted from a care assessment document:

${documentContent}

Your task is to analyze this document comprehensively and provide ALL relevant information in a clear, structured format.

IMPORTANT GUIDELINES:
1. Extract and organize ALL key information from the document
2. Use clear headings to organize different sections of information 
3. Present factual information as stated in the document without interpretation
4. Include names, dates, times, medications, care needs, and other specific details exactly as they appear
5. Format the information for maximum readability with clear section headings
6. If information appears to be missing, note this specifically

DO NOT ask for more information or say you can't access the document - the full text is provided above.`;

      // Create OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      console.log('Calling OpenAI API with direct document content');
      
      // Make a direct call with just the system prompt and a simple user message
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',  // Using GPT-4 for better extraction accuracy
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: "Please analyze this document completely and extract all key information." }
        ],
        temperature: 0.1,  // Lower temperature for more factual responses
      });

      console.log('Received extraction response from OpenAI');
      
      // Return the direct extraction response
      return NextResponse.json({ 
        message: completion.choices[0].message
      });
    }
    
    // Handle regular chat messages
    // General document detection
    const containsDocumentText = messages.some((message: any) => 
      message.role === 'user' && 
      (
        message.content.includes("I've uploaded a document") || 
        message.content.includes("document:") ||
        message.content.includes("Extract ALL information from this document") ||
        message.content.includes("Analyze this document") ||
        message.content.includes(".pdf") ||
        message.content.includes(".docx") ||
        message.content.includes(".doc") ||
        message.content.includes(".txt")
      )
    );

    // Select appropriate system prompt
    let systemPrompt = "You are a helpful AI assistant specializing in care assessments and social work.";
    
    if (containsDocumentText) {
      systemPrompt = `You are a precise document extraction assistant for care assessments. Your primary goal is to EXTRACT information exactly as it appears in the document, with minimal interpretation.

IMPORTANT GUIDELINES:
1. NEVER tell the user you cannot access files directly. The document content is provided directly in the user message or will be provided in a follow-up message.
2. NEVER make up or infer information that isn't explicitly stated in the document
3. DO NOT add your own interpretations, assumptions, or clinical judgments
4. If a piece of information (like date of birth, medication details, etc.) is not clearly stated, indicate "Not specified in document" rather than guessing
5. Present information in the exact format it appears in the document whenever possible
6. Use direct quotes when appropriate, especially for key details
7. Report ALL data points found in the document without filtering or prioritizing

When presenting the extracted information:
- Use clear headings that match the document's sections
- Maintain the same terminology used in the original document
- Include exact dates, names, numbers, and measurements as they appear
- Preserve the context and relationships between pieces of information
- Indicate when information seems ambiguous or unclear in the source document`;
    }

    // Create a standard OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Calling OpenAI API for regular chat');
    
    // Make a simple non-streaming call for reliability
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',  // Using GPT-4 for better extraction accuracy
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.1,  // Lower temperature for more factual, less creative responses
    });

    console.log('Received response from OpenAI');
    
    // Return the response directly
    return NextResponse.json({ 
      message: completion.choices[0].message
    });
    
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Provide more helpful error information in production
    const errorMessage = error?.message || "An error occurred with the OpenAI service";
    const errorDetails = error?.response?.data?.error?.message || error?.stack || "No additional details available";
    
    console.error('Error details:', errorDetails);
    
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}
