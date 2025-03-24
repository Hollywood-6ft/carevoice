import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

// Use edge runtime for better performance
export const runtime = 'edge';

// Create an OpenAI API client (that's edge-friendly)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY!,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    // Extract the messages from the request
    const { messages } = await req.json();

    // Check if this is a document analysis request
    const containsDocumentText = messages.some((message: any) => 
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

    // Create a properly formatted message array with the system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((message: any) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    // Request the completion from the OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: apiMessages,
      stream: true,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Return a StreamingTextResponse, which is a web standard response object
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('Error in OpenAI chat route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
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
