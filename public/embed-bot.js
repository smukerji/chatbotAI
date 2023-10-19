(function EmbedBot() {
  const cssStyles = `
      iframe{
        position:fixed;
      }
    `;

  // Get the script element
  const scriptElement = document.querySelector(
    'script[src="https://chatbot-ai-eight.vercel.app/embed-bot.js"]'
  );

  console.log(scriptElement);
  // Access the data attributes
  const param1 = scriptElement.getAttribute("chatbotID");
  //   const param2 = scriptElement.getAttribute("userID");

  // Use the values as needed
  console.log("Parameter 1:", param1);
  //   console.log("Parameter 2:", param2);

  const styleElement = document.createElement("style");
  styleElement.innerHTML = cssStyles;
  document.head.appendChild(styleElement);

  /// Append chatbot-related elements to the body
  document.body.insertAdjacentHTML(
    "beforeend",
    `<iframe
      src="https://chatbot-ai-eight.vercel.app/embed-bot?chatbotID=${param1}"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>`
  );
})();
