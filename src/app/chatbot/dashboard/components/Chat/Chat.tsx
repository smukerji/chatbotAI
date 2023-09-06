import React, { Suspense, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./chat.css";
import { SendOutlined } from "@ant-design/icons";
import Image from "next/image";

function Chat({
  chatbot,
  messages,
  setMessages,
  messageImages,
  setMessageImages,
}: any) {
  const [cookies, setCookies] = useCookies(["userId"]);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  /// loading state
  const [loading, setLoading] = useState(false);

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userQuery.trim() == "") {
        alert("Please enter the message");
      } else {
        /// clear the response
        setUserQuery("");
        /// set the user query
        setMessages((prev: any) => [
          ...prev,
          { role: "user", content: userQuery },
        ]);
        setMessageImages((prev: any) => [...prev, { role: "user" }]);
        /// check which chatbot to interact with i.e. chatbase bot or custom bot
        const chatbotIdLength = chatbot?.id.length;
        if (chatbotIdLength !== 36) {
          const options = {
            method: "POST",
            headers: {
              accept: "application/json",
              "content-type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
              cache: "no-store",
            },
            body: JSON.stringify({
              stream: true,
              temperature: 0,
              chatId: chatbot.id,
              messages: [...messages, { role: "user", content: userQuery }],
            }),
          };

          /// get the response from chatbase api
          let resptext = "";
          try {
            setLoading(true);
            const response: any = await fetch(
              "https://www.chatbase.co/api/v1/chat",
              options
            );
            // Read the response as a stream of data
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            /// decode the chunks
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                /// setting the response when completed
                setMessages((prev: any) => [
                  ...prev,
                  { role: "assistant", content: resptext },
                ]);
                setResponse("");
                break;
              }

              // Massage and parse the chunk of data
              const chunk = decoder.decode(value);
              resptext += chunk;
              setResponse(resptext);
            }

            if (!response.ok) {
              throw new Error(` when getting user query response `);
            }
          } catch (error) {
            console.log(error);
          } finally {
            setLoading(false);
          }
        } else {
          try {
            setLoading(true);
            /// get similarity search
            const response: any = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
              {
                method: "POST",
                body: JSON.stringify({
                  userQuery,
                  chatbotId: chatbot?.id,
                  userId: cookies.userId,
                }),
              }
            );

            /// parse the response and extract the similarity results
            const respText = await response.text();
            const similaritySearchResults = JSON.parse(respText).join("\n");

            const responseOpenAIFunction: any = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
                },
                body: JSON.stringify({
                  model: "gpt-3.5-turbo",
                  temperature: 0.5,
                  top_p: 1,
                  messages: [
                    {
                      role: "system",
                      content: `Use the following pieces of context to answer the users question.
                    If you don't know the answer, just say that you don't know, don't try to make up an answer.
                    ----------------
                    ${similaritySearchResults}`,
                    },
                    // ...messages,
                    {
                      role: "user",
                      content: `Give me the file name, corresponding to user question: ${userQuery}`,
                    },
                  ],
                  functions: [
                    {
                      name: "getFileName",
                      description: "Get the filename of the question",
                      parameters: {
                        type: "object",
                        properties: {
                          filename: {
                            type: "string",
                            description:
                              "File name if available and has .png,.jpeg,etc image format in text. else write null",
                          },
                        },
                        required: ["location"],
                      },
                    },
                  ],
                }),
              }
            );
            const fileName = await responseOpenAIFunction.json();
            const args = JSON.parse(
              fileName.choices[0].message.function_call.arguments
            );

            console.log("Funtion calling", args);

            // if (args && args?.filename && args?.filename != null) {
            setMessageImages((prev: any) => [
              ...prev,
              { role: "assistant", image: args?.filename },
            ]);
            // }
            // Read the response as a stream of data

            // Fetch the response from the OpenAI API
            const responseOpenAI: any = await fetch(
              "https://api.openai.com/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
                },
                body: JSON.stringify({
                  model: "gpt-3.5-turbo",
                  temperature: 0.5,
                  top_p: 1,
                  messages: [
                    {
                      role: "system",
                      content: `Use the following pieces of context to answer the users question.
              If you don't know the answer, just say that you don't know, don't try to make up an answer.
              ----------------
              ${similaritySearchResults}`,
                    },
                    ...messages,
                    { role: "user", content: userQuery },
                  ],
                  stream: true,
                }),
              }
            );

            console.log(similaritySearchResults);
            

            let resptext = "";
            const reader = responseOpenAI.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                /// setting the response when completed
                setMessages((prev: any) => [
                  ...prev,
                  { role: "assistant", content: resptext },
                ]);
                /// store the chathistory
                setResponse("");
                //   setLoading(false);
                //   const store = await fetch(
                //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chathistory`,
                //     {
                //       method: "POST",
                //       body: JSON.stringify({
                //         chatHistory: messages,
                //         chatbotId: chatbot.id,
                //       }),
                //     }
                //   );

                //   if (!store.ok) {
                //     alert(await store.text());
                //   }
                break;
              }
              // Massage and parse the chunk of data
              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");
              const parsedLines = lines
                .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
                .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
                .map((line, index) => JSON.parse(line)); // Parse the JSON string

              for (const parsedLine of parsedLines) {
                const { choices } = parsedLine;
                const { delta } = choices[0];
                const { content } = delta;
                // Update the UI with the new content
                if (content) {
                  resptext += content;
                  setResponse(resptext);
                }
              }
            }
            // console.log("Response.", model.data);
          } catch (e: any) {
            console.log(
              "Error while getting completion from custom chatbot",
              e.message
            );
          } finally {
            setLoading(false);
          }
        }
      }
    }
  }

  // console.log(messageImages);

  return (
    <div className="chat-container">
      <div className="conversation-container">
        {messages.map((message: any, index: any) => {
          if (message.role == "assistant")
            return (
              <React.Fragment key={index}>
                <div className="assistant-message">
                  {message.content}
                  {messageImages[index]?.image &&
                    messageImages[index].image != null && (
                      <Image
                        style={{ width: "100%", height: "fit-content" }}
                        src={`/qa-images/${messageImages[index]?.image}`}
                        alt="me"
                        width="604"
                        height="604"
                      />
                    )}
                </div>
              </React.Fragment>
            );
          else
            return (
              <div className="user-message" key={index}>
                {message.content}
              </div>
            );
        })}
        {loading && response.length == 0 && (
          <div className="assistant-message">
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        {response && <div className="assistant-message">{response}</div>}
      </div>
      <div className="chat-question">
        <input
          type="text"
          onKeyDown={getReply}
          onChange={(event) => {
            setUserQuery(event.target.value);
          }}
          value={userQuery}
        />
        <SendOutlined className="icon" onClick={() => getReply("click")} />
      </div>
    </div>
  );
}

export default Chat;
