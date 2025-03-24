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

    // Enhanced system prompt optimized for PDF and document analysis
    let systemPrompt = "You are a helpful AI assistant specializing in care assessments and social work.";
    
    if (containsDocumentText) {
      systemPrompt = `You are an expert care assessment analyst specialized in reviewing care documents and extracting relevant information.

Your task is to thoroughly analyze the document content and provide structured information that can be used in a care assessment form.

When analyzing documents:
1. Identify and categorize key medical conditions, disabilities, and health issues
2. Extract care needs, support requirements, and personal circumstances
3. Note important dates, schedules, medications, or treatment plans
4. Summarize mobility issues, housing requirements, and daily living assistance needs
5. Highlight social care needs, mental health considerations, and family support information
6. Identify risk factors and safety concerns

Present your analysis in this format:
- SUMMARY: Brief overview of the document contents
- KEY INFORMATION: Bulleted list of important facts
- CARE NEEDS: Categorized list of identified needs
- RECOMMENDATIONS: Suggested care approaches based on the document

Your analysis should be thorough while focusing on information relevant to care planning.`;
    }

    // Create a standard OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Calling OpenAI API for document analysis or general assistance');
    
    // Make a simple non-streaming call for reliability
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
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
