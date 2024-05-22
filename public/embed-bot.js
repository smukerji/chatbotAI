(async function EmbedBot() {
  const cssStyles = `
  <style>
   

      @media (max-width: 768px) { /* Adjust the max-width as needed for your mobile devices */
      iframe {
        width: 90%;
      }
    }

    #chat-widget{
      position: fixed;
      bottom:20px;
      display: grid;
    }

    #btn-trigger-chat{
      box-sizing: border-box;
      margin-right: auto;
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9999px;
      color: white;
      cursor: pointer;
      border-style: none;
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 999;
    }
    </style>
  `;


  // Get the script element
  const scriptElement = document.querySelector(
    'script[src="https://chatbot-ai-silk.vercel.app/embed-bot.js"]'
    // 'script[src="http://192.168.1.76:3000/embed-bot.js"]'
  );
  
  // Access the data attributes
  const param1 = scriptElement.getAttribute("chatbotID");
  let response, bubbleIconUrl, chatbubbleColor;
  
  
  //   const param2 = scriptElement.getAttribute("userID");


  
  
  // Api call for   bot setting
  try {
    const res =await fetch(
      `https://chatbot-ai-silk.vercel.app/chatbot/popup/details/api?chatbotId=${param1}`,{mode:"no-cors",method:"GET"}
    )
    const data = await res.json();
    response = data;
    // console.log('dataaaaaaaa', data);
    bubbleIconUrl = data?.chatbotSettings[0]?.bubbleIconUrl
    chatbubbleColor = data?.chatbotSettings[0]?.chatbotIconColor;
  } catch (error) {
    console.error('Error', error);
  }
  


   // Check if bubble image is available then set it otherwise put default image
// {
//   response.chatbotSettings[0]?.bubbleIconUrl !== null
//     ? ((btn.style.backgroundImage = `${bubbleIconUrl}`),
//       ((btn.style.backgroundRepeat = 'no-repeat'),
//       (btn.style.backgroundSize = 'cover')))
//     : (btn.style.backgroundColor = `#${response?.BubbleColor}`);
// }

  const chatWidget = document.createElement('div');
  chatWidget.id = 'chat-widget';

  const icon_img = `
  <Image
    src=${bubbleIconUrl ? bubbleIconUrl : ''}
    alt="icon"
    height=${bubbleIconUrl ? "64" : "32"}
    width=${bubbleIconUrl ? "64" : "32"}
    style="border-radius:60%"
  />
`;

  chatWidget.innerHTML = `<iframe
  id="chat-frame-widget"
  src="https://chatbot-ai-silk.vercel.app/embed-bot?chatbotID=${param1}";
  frameborder="0"
  style="display: none; position: fixed; inset: auto 15px 0px auto; width: 400px; height: 750px; opacity: 1; color-scheme: none; margin: 0px; max-height: 100vh; max-width: 100vw; transform: translateY(0px); transition: none 0s ease 0s !important; visibility: visible; border:none"
  ></iframe>
  <button id="btn-trigger-chat" >${icon_img}</button>`

document.head.insertAdjacentHTML('beforeend', cssStyles);
document.body.appendChild(chatWidget);

const btn = document.getElementById('btn-trigger-chat');
const frameWidget = document.getElementById('chat-frame-widget');


btn.style.backgroundColor = `${chatbubbleColor? chatbubbleColor : '#000'}`;
frameWidget.style.display = 'none';

btn.addEventListener('click', ()=>{
  if(frameWidget.style.display == 'none'){
    frameWidget.style.display = 'block'
  }else{
    frameWidget.style.display = 'none';
  }
})




  // // Use the values as needed
  
  // const styleElement = document.createElement("style");
  // styleElement.innerHTML = cssStyles;
  // document.head.appendChild(styleElement);
  // // src = "http://192.168.1.76:3000/embed-bot?chatbotID=${param1}";
  
  // /// Append chatbot-related elements to the body
  // document.body.insertAdjacentHTML(
  //   "beforeend",
  //   `<iframe
  //   src="http://localhost:3000/embed-bot?chatbotID=${param1}";
  //   frameborder="0"
  //   ></iframe>`
  // );
  // const btnClicked = document.getElementsByClassName('message-icon-child');
  // console.log(btnClicked);
})();
