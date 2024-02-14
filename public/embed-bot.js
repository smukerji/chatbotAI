(function EmbedBot() {
  const cssStyles = `
    iframe{
      position:fixed;
      bottom:20px !important;
      right:20px !important;
      border:none;
    }
  `;

  // Get the script element
  const scriptElement = document.querySelector(
    'script[src="https://chatbot-ai-silk.vercel.app/embed-bot.js"]'
    // 'script[src="http://192.168.1.76:3000/embed-bot.js"]'
  );

  // Access the data attributes
  const param1 = scriptElement.getAttribute("chatbotID");
  //   const param2 = scriptElement.getAttribute("userID");

  // Use the values as needed

  //   console.log("Parameter 2:", param2);

  const styleElement = document.createElement("style");
  styleElement.innerHTML = cssStyles;
  document.head.appendChild(styleElement);
  // src = "http://192.168.1.76:3000/embed-bot?chatbotID=${param1}";

  /// Append chatbot-related elements to the body
  document.body.insertAdjacentHTML(
    "beforeend",
    `<iframe
      src="https://chatbot-ai-silk.vercel.app/embed-bot?chatbotID=${param1}";
      frameborder="0"
    ></iframe>`
  );
})();
