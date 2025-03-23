import OpenAI from "openai";
import { StreamingTextResponse } from 'ai';

export const runtime = "edge";

type Role = 'user' | 'assistant' | 'system';

interface Message {
  role: Role;
  content: string;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        ...(messages as Message[]).map(msg => ({
          role: msg.role as Role,
          content: msg.content
        }))
      ],
      max_tokens: 4000,
      temperature: 0.7,
      stream: true
    });

    // Return the streaming response
    return new StreamingTextResponse(response.toReadableStream());
  } catch (error) {
    console.error('Error calling AI API:', error);
    // Cast error to any type to access status and message properties
    const err = error as any;
    
    // Return appropriate error response
    return new Response(
      JSON.stringify({
        error: err.message || 'An error occurred during your request.',
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
