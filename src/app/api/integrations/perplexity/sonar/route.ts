import { NextResponse } from "next/server";

// Send a new message to a thread
export async function POST(_request: any) {
  const data = await _request.json();
  const { userQuery } = data;

  const perplexityData = await fetch(
    "https://api.perplexity.ai/chat/completions",
    // options
    {
      method: "POST",
      headers: {
        Authorization:
          "Bearer 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",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are helpful assistant.",
          },
          {
            role: "user",
            content: userQuery,
          },
        ],
        max_tokens: "1000",
        // temperature: 0.2,
        // top_p: 0.9,
        // search_domain_filter: ['perplexity.ai'],
        // return_images: false,
        // return_related_questions: false,
        // search_recency_filter: 'month',
        // top_k: 0,
        stream: false,
        // presence_penalty: 0,
        // frequency_penalty: 1,
        // response_format: null,
      }),
    }
  )
    .then((response) => response.json())
    .then((response) => {
      return response;
    })
    .catch((err) => console.error(err));

  return NextResponse.json({
    message: perplexityData?.choices?.[0]?.message?.content,
    sources: perplexityData?.citations,
  });
}

export const maxDuration = 300;
