import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the request object
    const body = JSON.parse(req.body);

    const { similaritySearchResults, messages, userQuery } = body;

    // Set response headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Content-Encoding", "none");

    // Fetch the response from the OpenAI API
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    });
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      temperature: 0,
      top_p: 1,
      messages: [
        {
          role: "system",
          content: `Use the following pieces of context to answer the users question.
                  If you don't know the answer, just say that you don't know, don't try to make up an answer.
                  ----------------
                  context:
                  ${similaritySearchResults}
    
                  Answer user query and include images write respect to each line if available`,
        },
        ...messages,
        {
          role: "user",
          content: `
                    Strictly write all the response in html format with only raw text and img tags.
                    Answer user query and include images in response if available in the given context
    
                    query: ${userQuery}`,
        },
      ],
      stream: true,
    });
    for await (const part of stream) {
      res.write(part.choices[0]?.delta?.content || "");
    }

    res.end();
  }
}
