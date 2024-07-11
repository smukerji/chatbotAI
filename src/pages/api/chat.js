import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { isWithinTokenLimit } from "gpt-tokenizer/model/gpt-3.5-turbo";
import { models } from "../../app/_helpers/openaiModelContants";
import { RateLimiterMemory } from "rate-limiter-flexible";
import rateLimitMiddleware from "../../app/_helpers/middleware/ratelimiter";

// Set the runtime to edge for best performance
export const config = {
  runtime: "edge",
};

async function handler(req, res) {
  if (req.method === "POST") {
    /// parse the request object
    const { similaritySearchResults, messages, userQuery, chatbotId, userId } =
      await req.json();
    // Set response headers for SSE

    // Fetch the response from the OpenAI API
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    });
    /// get the chatbot settings from database
    const chatbotSettingsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api?chatbotId=${chatbotId}&userId=${userId}`,
      {
        method: "GET",
        next: { revalidate: 0 },
      }
    );
    const data = await chatbotSettingsResponse.json();
    const chatbotSetting = data?.chatbotSetting;

    // const systemContent = `Use the following pieces of context to answer the users question.
    // If you don't know the answer, simply give me the output in html format that you don't know the answer, don't try to make up an answer. and also, don't give me question back in response. Also focus on the instruction given to answer the question.
    // ----------------
    // context:
    // ${similaritySearchResults}

    // instruction:
    // ${chatbotSetting?.instruction}

    // Answer user query only if it is available in context or in previos chat history.Strictly write all the response in html format with only raw text and image link inside img tag. Check previous history every time before giving answer. If something is out of context or chat history then simply say I don't know the answer. If user is giving some personal information then don't tell that I don't know. Just continue the conversation and remember the chat history and next time when user ask question from it then answer from chat history. give image if it is available in database and related to context. give image link inside img tag. Otherwise don't include img tag in your response.`;

    const systemContent = `
      ${chatbotSetting?.instruction}

       context:
    ${similaritySearchResults}
      `;

    const userContent = `
    Answer only if it is available in context. Strictly write all the response in html format without html and body tag. Also add image link inside img tag and video link inside anchor tag with target blank if available in the context. Give answer with no pre-amble.
      query: ${userQuery}`;

    //// count the token before sending to openai
    // let tokenCount = encode(systemContent).length;
    // tokenCount += encode(userContent).length;

    // const filteredMesages = updateTokens(messages, tokenCount);

    const model = chatbotSetting?.model ? chatbotSetting?.model : "gpt-4";

    /// calculate the tokens for system and user prompts assuming it to be less that 8k tokens as top_k = 3
    const systemContentTokens = isWithinTokenLimit(
      systemContent,
      models[model] - 2000
    );
    const userContentTokens = isWithinTokenLimit(
      userContent,
      models[model] - 2000
    );

    let tempMessages = [
      {
        role: "system",
        content: systemContent,
      },
      ...messages,
      {
        role: "user",
        content: userContent,
      },
    ];

    /// if the context exceeds the model length pop the messages from the hitory to avoid rate limit
    while (
      !isWithinTokenLimit(
        messages,
        models[model] - 2000 - systemContentTokens - userContentTokens
      )
    ) {
      messages.shift();
      tempMessages = [
        {
          role: "system",
          content: systemContent,
        },
        ...messages,
        {
          role: "user",
          content: userContent,
        },
      ];
    }

    const response = await openai.chat.completions.create({
      // model: "gpt-3.5-turbo-16k",
      model: model,
      temperature: chatbotSetting?.temperature
        ? chatbotSetting?.temperature
        : 0,
      top_p: 1,
      messages: tempMessages,
      stream: true,
    });

    try {
      // Convert the response into a friendly text-stream
      const stream = OpenAIStream(response);
      // Respond with the stream
      return new StreamingTextResponse(stream);
    } catch (error) {
      console.log("errr", error);
      return res.send(400).send(error);
    }
  }
}

export default rateLimitMiddleware(handler);
