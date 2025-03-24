import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

export const runtime = 'edge';

// Debug flag to help with diagnosis
const DEBUG = true;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

type Role = 'user' | 'assistant' | 'system';

interface Message {
  role: Role;
  content: string;
}

export async function POST(req: Request) {
  try {
    if (DEBUG) console.log('OpenAI chat API called');
    
    // Check if API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    if (DEBUG) console.log('API Key exists, parsing request body');
    
    const { messages } = await req.json();
    
    if (DEBUG) console.log(`Received ${messages.length} messages`);

    // Check if this is a document analysis request
    const containsDocumentText = messages.some((message: Message) => 
      message.role === 'user' && 
      (message.content.includes("I've uploaded a document called") || 
       message.content.includes("I'm uploading a document:"))
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

    if (DEBUG) console.log('Preparing messages for API call');
    
    // Prepare messages array with proper typing
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    if (DEBUG) console.log('Making API call to OpenAI');
    
    // Try a simpler non-streaming approach first to debug
    try {
      // Make the API call without streaming
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use a simpler model for testing
        messages: apiMessages,
        temperature: 0.7,
        stream: false
      });
      
      if (DEBUG) console.log('OpenAI non-streaming response:', response);
      
      // If we get here, the API connection works, but there might be an issue with streaming
      // Let's try to use streaming approach now
      const streamingResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: apiMessages,
        temperature: 0.7,
        stream: true
      });
      
      if (DEBUG) console.log('OpenAI streaming response initiated');
      
      // Convert the response to a ReadableStream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamingResponse) {
              if (DEBUG) console.log('Received chunk:', chunk);
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            console.error('Error processing stream chunks:', error);
            controller.error(error);
          }
        }
      });

      if (DEBUG) console.log('Stream created, returning StreamingTextResponse');
      
      // Return the streaming response
      return new StreamingTextResponse(stream);
    } catch (innerError) {
      console.error('Error in inner try-catch:', innerError);
      throw innerError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error calling AI API:', error);
    
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    const err = error as any;
    
    return new Response(
      JSON.stringify({
        error: err.message || 'An error occurred during your request.',
        details: DEBUG ? (err.stack || 'No stack trace available') : undefined
      }),
      {
        status: err.status || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
