import { message } from "antd";
import React from "react";
import Image from "next/image";
import copyIcon  from "../../../../../../public/svgs/copy-icon.svg";
import "./embedding-style.scss";

function Embedding({assistantId}:{assistantId:string}) {


const script = `<script>
  var vapiInstance = null;
        const assistant = "${assistantId}"; 
        // Substitute with your assistant ID
        const apiKey = "${process.env.NEXT_PUBLIC_VAP_API}"; 
        // Substitute with your Public key from Vapi Dashboard.
        const buttonConfig = {}; // Modify this as required
        (function (d, t) {
            var g = document.createElement(t),
            s = d.getElementsByTagName(t)[0];
           g.src = "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
            g.defer = true;
            g.async = true;
            s.parentNode.insertBefore(g, s);
            g.onload = function () {
            vapiInstance = window.vapiSDK.run({
                apiKey: apiKey, // mandatory
                assistant: assistant, // mandatory
                config: buttonConfig, // optional
            });
            };
        })(document, "script");
    </script>
        `;
    const copyButtonConfig = {
        position: "bottom-right", // "bottom" | "top" | "left" | "right" | "top-right" | "top-left" | "bottom-left" | "bottom-right"
        offset: "40px", // decide how far the button should be from the edge
        width: "50px", // min-width of the button
        height: "50px", // height of the button
        idle: { // button state when the call is not active.
          color: `rgb(93, 254, 202)`, 
          type: "pill", // or "round"
          title: "Have a quick question?", // only required in case of Pill
          subtitle: "Talk with our AI assistant", // only required in case of pill
          icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone.svg`,
        },
        loading: { // button state when the call is connecting
          color: `rgb(93, 124, 202)`,
          type: "pill", // or "round"
          title: "Connecting...", // only required in case of Pill
          subtitle: "Please wait", // only required in case of pill
          icon: `https://unpkg.com/lucide-static@0.321.0/icons/loader-2.svg`,
        },
        active: { // button state when the call is in progress or active.
          color: `rgb(255, 0, 0)`,
          type: "pill", // or "round"
          title: "Call is in progress...", // only required in case of Pill
          subtitle: "End the call.", // only required in case of pill
          icon: `https://unpkg.com/lucide-static@0.321.0/icons/phone-off.svg`,
        },
      }
     



      const handleOk = async (text: string,type:string) => {
        try {
            if(type === "script"){
          await navigator.clipboard.writeText(text);
        } else {
      const formattedConfig = JSON.stringify(copyButtonConfig, null, 2);
      await navigator.clipboard.writeText(`const buttonConfig = ${formattedConfig}`);
    }
          message.success("Content copied to clipboard");
        } catch (err: any) {
          message.error("Failed to copy ", err.message);
        }
      };
    return (
        <div className="embedding-container">
            <div className="script">
                <p className="share-note">
                    Button&apos;s Styles config
                </p>
                   
                
                <p className="script-container">
                    <pre>
                    <code>
                      {/* button config code here */}
                      {
                        `const buttonConfig = ${JSON.stringify(copyButtonConfig, null, 2)}`
                      }
                        {/* button config code here */}
                      
                    </code>
                    </pre>
                </p>
                <button onClick={() => handleOk("","button")}>
                    <Image src={copyIcon} alt="copy-icon" />
                    Copy Button Config
                </button>
            </div>
            <div className="script">
                <p className="share-note">
                    One click to call your Voice-Assistant after adding this script to your website.
                </p>
                <p className="script-container">
                    <pre>
                        <code>
                         
                                {script}

                           
                        </code>
                    </pre>
                    </p>
                <button onClick={() => handleOk(script,"script")}>
                    <Image src={copyIcon} alt="copy-icon" />
                    Copy Script
                </button>
            </div>
        </div>
       
    );
}

export default Embedding;
// This component is a placeholder for the Embedding feature of the Voicebot dashboard.