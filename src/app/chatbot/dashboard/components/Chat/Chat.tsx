import React, { Suspense, useState } from "react";
import { useCookies } from "react-cookie";
import "./chat.css";
import { SendOutlined } from "@ant-design/icons";
import { getSimilarityResults } from "../../../../../helper/pinecone";
import { createEmbedding } from "../../../../../helper/embeddings";
const { PineconeClient } = require("pinecone-client");

function Chat({ chatbot }: any) {
  const [cookies, setCookies] = useCookies(["userId"]);
  /// messages
  const [messages, setMessages] = useState(
    chatbot.initial_message == null
      ? [{ role: "assistant", content: `Hi! What can I help you with?` }]
      : [{ role: "assistant", content: chatbot.initial_message }]
  );

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
        setMessages((prev) => [...prev, { role: "user", content: userQuery }]);
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
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: resptext },
                ]);
                // setMessages(messagesArray);
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
          /// get similarity search
          // const similarityResult = await getSimilarityResults(
          //   userQuery,
          //   cookies.userId,
          //   chatbot?.id
          // );
          // const embedding = createEmbedding(userQuery);
          // const pinecone = new PineconeClient({
          //   apiKey: process.env.NEXT_PUBLIC_PINECONE_KEY,
          //   baseUrl:
          //     "https://sapahk-chatbot-2e36a9f.svc.asia-southeast1-gcp-free.pinecone.io",
          //   namespace: process.env.NEXT_PUBLIC_PINECONE_INDEX,
          // });

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
            {
              method: "POST",
              body: JSON.stringify({ userQuery }),
            }
          );

          console.log("Response.", response);

          // const result = await pinecone.query({
          //   vector: embedding,
          //   topK: 1,
          // });
          // console.log(result?.matches);
        }
      }
    }
  }

  return (
    <div className="chat-container">
      <div className="conversation-container">
        {messages.map((message, index) => {
          if (message.role == "assistant")
            return (
              <div className="assistant-message" key={index}>
                {message.content}
              </div>
            );
          else
            return (
              <div className="user-message" key={index}>
                {message.content}
              </div>
            );
        })}
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
