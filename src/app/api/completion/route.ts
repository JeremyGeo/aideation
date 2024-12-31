import { Configuration, OpenAIApi } from "openai-edge";

// /api/completion
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Create the chat completion with streaming enabled
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI embedded in a notion text editor app that is used to autocomplete sentences.
                    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
                    AI is a well-behaved and well-mannered individual.
                    AI is always friendly, kind, and inspiring, and eager to provide vivid and thoughtful responses to the user.`,
        },
        {
          role: "user",
          content: `I am writing a piece of text in a notion text editor app.
            Help me complete my train of thought here: ##${prompt}##
            Keep the tone of the text consistent with the rest of the text.
            Keep the response short and sweet.`,
        },
      ],
      stream: true, 
    });

    let fullSentence = "";

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
    
        if (!reader) {
          console.error("No reader available on response.body.");
          throw new Error("Failed to obtain reader from response body.");
        }
    
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            console.log("Stream finished. Full sentence:", fullSentence);
            break;
          }
    
          const chunk = decoder.decode(value, { stream: true });
    
          // Handle chunks that don't have valid JSON data
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.replace(/^data: /, "").trim();
    
              // Ignore empty data lines or [DONE] signal
              if (jsonString === "[DONE]") {
                console.log("Completed sentence: ", fullSentence);
                // Send the complete sentence once the stream is done
                controller.enqueue(encoder.encode(`data: ${fullSentence}\n\n`));
                controller.close();
                return;
              }
    
              try {
                const parsedChunk = JSON.parse(jsonString);
                const content = parsedChunk.choices[0]?.delta?.content;
    
                // Only process valid content
                if (content) {
                  console.log("Content chunk:", content); // Log the individual chunk content
                  fullSentence += content; // Append the content to the full sentence
                  controller.enqueue(encoder.encode(`data: ${content}\n\n`)); // Stream the chunks
                } else {
                  console.log("No content in chunk:", parsedChunk);
                }
              } catch (error) {
                console.error("Error parsing chunk:", error, "Chunk:", jsonString);
              }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
    
  } catch (error) {
    console.error("Error in /api/completion:", error);

    return new Response(
      JSON.stringify({ error: "Failed to generate completion." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
