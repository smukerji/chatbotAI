import OpenAI from "openai";
require("dotenv").config();
const open_ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//ANCHOR - OpenAI call for data embedding
export const createEmbeddings = async (data: any) => {
  var batchSize = 500;
  try {
    const embeddings = [];
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const embeddingRes = await open_ai.embeddings.create({
        model: "text-embedding-ada-002",
        input: batch,
      });

      const embedding = embeddingRes.data.map((item) => item.embedding);
      // console.log(embedding);
      for (const arr of embedding) {
        if (Array.isArray(arr) && arr.length > 0) {
          embeddings.push([...arr]);
        }
      }
    }
    return embeddings;
  } catch (error) {
    console.log("err:" + error);
    return error;
  }
};

//ANCHOR - OpenAI call for chat compilation.
export const createResponse = async (question: any, data: any) => {
  console.log(question, data)
  let content = `
                  Give answer of this question 
                  ${question} 
                  from the given data 
                  ${data}`
  const result = await open_ai.chat.completions.create({
    model : "gpt-3.5-turbo",
    messages : [{role: 'user',content:content}],
  });
  console.log(result.choices[0].message.content)
  return result.choices[0].message.content
};
