(async function EmbedBot() {
  const cssStyles = `
  <style>
    @media only screen and (max-width: 768px) {
      iframe {
        width: 90% !important;
      }
    }

    @media only screen and (max-width: 450px) {
      iframe {
        width: 330px !important;
      }
    }

    @media only screen and (max-height: 750px) {
      iframe {
        height: 600px !important;
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
  const scriptElement = document.querySelector('script[src="https://torri.ai/embed-bot.js"]');

  // Access the data attributes
  const param1 = scriptElement.getAttribute("chatbotID");
  let bubbleIconUrl, chatbubbleColor;

  // Fetch bot settings
  try {
    const response = await fetch(`https://torri.ai/chatbot/popup/details/api?chatbotId=${param1}`);
    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    console.log(data?.chatbotSettings[0]?.bubbleIconUrl);
    bubbleIconUrl = data?.chatbotSettings[0]?.bubbleIconUrl == "" ? "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg" : data?.chatbotSettings[0]?.bubbleIconUrl;
    chatbubbleColor = data?.chatbotSettings[0]?.chatbotIconColor;
  } catch (error) {
    console.error("Error fetching bot settings:", error);
    return;
  }

  const chatWidget = document.createElement("div");
  chatWidget.id = "chat-widget";

  const icon_img = `
    <img
      src="${bubbleIconUrl ? bubbleIconUrl : ''}"
      alt="icon"
      height="${bubbleIconUrl == "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg" ? '32' : '64'}"
      width="${bubbleIconUrl == "https://xyhog03g93hzc0am.public.blob.vercel-storage.com/message-2-cbgyJSCUz2djFE1PMXYozzVSV8Uwfp.svg" ? '32' : '64'}"
      style="border-radius: 50%;"
    />
  `;

  chatWidget.innerHTML = `
    <iframe
      id="chat-frame-widget"
      src="https://torri.ai/embed-bot?chatbotID=${param1}"
      frameborder="0"
      style="display: none; position: fixed; inset: auto 15px 0px auto; width: 400px; height: 750px; opacity: 1; color-scheme: none; margin: 0px; max-height: 100vh; max-width: 100vw; transform: translateY(0px); transition: none 0s ease 0s !important; visibility: visible; border: none; bottom: 15px;"
    ></iframe>
    <button id="btn-trigger-chat">${icon_img}</button>
  `;

  document.head.insertAdjacentHTML("beforeend", cssStyles);
  document.body.appendChild(chatWidget);

  const btn = document.getElementById("btn-trigger-chat");
  const frameWidget = document.getElementById("chat-frame-widget");

  btn.style.backgroundColor = chatbubbleColor ? chatbubbleColor : "#9b00fb";
  frameWidget.style.display = "none";

  btn.addEventListener("click", () => {
    if (frameWidget.style.display === "none") {
      frameWidget.style.display = "block";
    } else {
      frameWidget.style.display = "none";
    }
  });
})();
