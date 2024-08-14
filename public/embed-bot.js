(async function EmbedBot() {
  let cssStyles = `
  <style>
    #chat-frame-widget{
      display: none; position: fixed; inset: auto 15px 0px auto; width: 400px; height: 750px; opacity: 1; color-scheme: none; margin: 0px; max-height: 100vh; max-width: 100vw; transform: translateY(0px); transition: none 0s ease 0s !important; visibility: visible; border: none; bottom: 15px;
    }

    @media only screen and (max-width: 768px) {
      iframe {
        width: 90% !important;
      }

       #chat-widget {
        width: 100%;
        height: 100%;
        bottom: 0;
        display: unset;
      }

      #chat-frame-widget{
        position: fixed !important;
        inset: 0 !important; 
        height: 100% !important;
        width: 100% !important;
        max-height: 100% !important;
        max-width: 100% !important;
      }
    }

    @media only screen and (max-width: 450px) {
      iframe {
        width: 330px !important;
      }
    }


    #chat-widget {
      position: fixed;
      bottom: 20px;
      display: grid;
      z-index: 1;
    }

    #btn-trigger-chat {
      box-sizing: border-box;
      margin-right: auto;
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      cursor: pointer;
      border-style: none;
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999;
      height: 64px;
      width: 64px;
      padding-inline: 0;
    }
  </style>
  `;
  // Get the script element
  const scriptElement = document.querySelector(
    'script[src="https://chatbot-ai-silk.vercel.app/embed-bot.js"]'
  );

  // Access the data attributes
  const param1 = scriptElement.getAttribute("chatbotID");
  let bubbleIconUrl, chatbubbleColor, chatbotBubbleAlignment;

  // Fetch bot settings
  try {
    const response = await fetch(
      // `https://chatbot-ai-silk.vercel.app/chatbot/popup/details/api?chatbotId=${param1}`
      `https://chatbot-ai-silk.vercel.app/chatbot/popup/details/api?chatbotId=${param1}`
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();

    /// change the bubble alignment

    if (data?.chatbotSettings[0]?.chatbotBubbleAlignment == "left") {
      chatbotBubbleAlignment = data?.chatbotSettings[0]?.chatbotBubbleAlignment;
    }

    bubbleIconUrl =
      data?.chatbotSettings[0]?.bubbleIconUrl == ""
        ? "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg"
        : data?.chatbotSettings[0]?.bubbleIconUrl;
    chatbubbleColor = data?.chatbotSettings[0]?.chatbotIconColor;
  } catch (error) {
    console.error("Error fetching bot settings:", error);
    return;
  }

  const chatWidget = document.createElement("div");
  chatWidget.id = "chat-widget";

  const icon_img = `
    <img
      src="${bubbleIconUrl ? bubbleIconUrl : ""}"
      alt="icon"
      height="${
        bubbleIconUrl ==
        "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg"
          ? "32"
          : "64"
      }"
      width="${
        bubbleIconUrl ==
        "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg"
          ? "32"
          : "64"
      }"
      style="border-radius: 50%;"
    />
  `;

  iframe = `<iframe
    id="chat-frame-widget"
    src="https://chatbot-ai-silk.vercel.app/embed-bot?chatbotID=${param1}"
    frameborder="0"
  ></iframe>
  <button id="btn-trigger-chat">${icon_img}</button>
`;
  if (chatbotBubbleAlignment === "left") {
    cssStyles = cssStyles.replace("right: 20px", "left: 20px");
    iframe = iframe.replace("position: fixed;", "position: unset;");
  }

  chatWidget.innerHTML = iframe;

  document.head.insertAdjacentHTML("beforeend", cssStyles);
  document.body.appendChild(chatWidget);

  const btn = document.getElementById("btn-trigger-chat");
  const frameWidget = document.getElementById("chat-frame-widget");

  btn.style.backgroundColor = chatbubbleColor ? chatbubbleColor : "#9b00fb";
  frameWidget.style.display = "none";

  btn.addEventListener("click", () => {
    if (frameWidget.style.display === "none") {
      frameWidget.style.display = "block";
      /// remove the button if the screen size is less than 768px
      if (window.innerWidth < 768) {
        btn.style.display = "none";
      }
    } else {
      frameWidget.style.display = "none";
    }
  });

  window.addEventListener("message", function (event) {
    // Validate the origin of the message
    if (event.origin !== "https://chatbot-ai-silk.vercel.app") {
      return;
    }

    // Handle the message
    if (event.data === "disable-iframe") {
      frameWidget.style.display = "none";
      /// add the button if the screen size is less than 768px
      btn.style.display = "block";
    }
  });
})();
