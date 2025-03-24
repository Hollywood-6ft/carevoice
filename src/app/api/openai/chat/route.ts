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

    // More comprehensive document detection
    const containsDocumentText = messages.some((message: any) => 
      message.role === 'user' && 
      (
        message.content.includes("I've uploaded a document") || 
        message.content.includes("document:") ||
        message.content.includes("Analyze this document") ||
        message.content.includes(".pdf") ||
        message.content.includes(".docx") ||
        message.content.includes(".doc") ||
        message.content.includes(".txt")
      )
    );

    // Modified system prompt that prioritizes extraction over interpretation
    let systemPrompt = "You are a helpful AI assistant specializing in care assessments and social work.";
    
    if (containsDocumentText) {
      systemPrompt = `You are a precise document extraction assistant for care assessments. Your primary goal is to EXTRACT information exactly as it appears in the document, with minimal interpretation.

IMPORTANT GUIDELINES:
1. NEVER make up or infer information that isn't explicitly stated in the document
2. DO NOT add your own interpretations, assumptions, or clinical judgments
3. If a piece of information (like date of birth, medication details, etc.) is not clearly stated, indicate "Not specified in document" rather than guessing
4. Present information in the exact format it appears in the document whenever possible
5. Use direct quotes when appropriate, especially for key details
6. Report ALL data points found in the document without filtering or prioritizing

When presenting the extracted information:
- Use clear headings that match the document's sections
- Maintain the same terminology used in the original document
- Include exact dates, names, numbers, and measurements as they appear
- Preserve the context and relationships between pieces of information
- Indicate when information seems ambiguous or unclear in the source document

If asked to provide an assessment or recommendations, clearly state: "As an extraction assistant, I can only provide the information that's explicitly stated in the document. I cannot offer clinical judgments or recommendations beyond what is directly written."

Your value comes from accurate extraction, not from interpretation or enhancement.`;
    }

    // Create a standard OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Calling OpenAI API for document analysis or general assistance');
    
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
