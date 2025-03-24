import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// Edge runtime
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    // Extract the messages from the request
    const { messages } = await req.json();

    // Check if this is a document analysis request
    const containsDocumentText = messages.some((message: any) => 
      message.role === 'user' && 
      (message.content.includes("I've uploaded a document") || 
       message.content.includes("document:"))
    );

    // Use different system prompts based on the request type
    let systemPrompt = "You are a helpful AI assistant specializing in care assessments and social work.";
    
    if (containsDocumentText) {
      systemPrompt = `You are an expert care assessment analyst specialized in reviewing care documents and extracting relevant information. 
      
When analyzing documents:
1. Focus on identifying key medical conditions, care needs, support requirements, and personal circumstances
2. Organize your analysis into clear sections for easy reference
3. Highlight important information that should be included in a care assessment
4. Suggest recommendations based on the identified needs

Present your analysis in a structured format that can be easily incorporated into a care assessment form.`;
    }

    // Create a standard OpenAI client - works better with Vercel
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ""
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
    });

    // Create a readable stream manually to avoid type issues
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });
    
    // Return the streaming response
    return new StreamingTextResponse(stream);
    
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error?.message || "An error occurred with the OpenAI service",
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
