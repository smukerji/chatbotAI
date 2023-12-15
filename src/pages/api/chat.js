import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
// Set the runtime to edge for best performance
export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the request object
    const { similaritySearchResults, messages, userQuery } = await req.json();

    // Set response headers for SSE

    // Fetch the response from the OpenAI API
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    });
    const response = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo-16k",
      model: "gpt-4",
      temperature: 0,
      top_p: 1,

      // messages: [
      //   {
      //     role: "system",
      //     content: `Use the following pieces of context to answer the users question.
      //       If you don't know the answer, just say that you don't know, don't try to make up an answer.
      //       ----------------
      //       context:
      //       ${similaritySearchResults}

      //       Answer user query and include images write respect to each line if available`,
      //   },
      //   ...messages,
      //   {
      //     role: "user",
      //     content: `
      //         Strictly write all the response in html format with only raw text and img tags.
      //         Answer user query and include images in response if available in the given context

      //         query: ${userQuery}`,
      //   },
      // ],
      messages: [
        {
          role: "system",
          content: `Use the following pieces of context to answer the users question.
            If you don't know the answer, simply give me the output in html format that you don't know the answer, don't try to make up an answer. and also, don't give me question back in response.
            ----------------
            context:
            ${similaritySearchResults}

            Answer user query only if it is available in context or in previos chat history.Strictly write all the response in html format with only raw text and image link inside img tag. Check previous history every time before giving answer. If something is out of context or chat history then simply say I don't know the answer. If user is giving some personal information then don't tell that I don't know. Just continue the conversation and remember the chat history and next time when user ask question from it then answer from chat history. give image if it is available in database and related to context. give image link inside img tag. Otherwise don't include img tag in your response.`,
        },
        ...messages,
        {
          role: "user",
          content: `
          Strictly write all the response in html format with only raw text and image link inside img tag. give answer only if it is available in context or previous history. Check previous messages every time before giving answer. If user is giving some personal information then don't tell that I don't know. Just continue the conversation and then remember the chat history and next time when user ask question related to it then answer from previous messages. If something is out of context or previous history then simply say I don't know the answer. give image if it is available in database and related to context. Otherwise don't include img tag in your response. 

              query: ${userQuery}`,
        },
      ],
      stream: true,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
  }
}
