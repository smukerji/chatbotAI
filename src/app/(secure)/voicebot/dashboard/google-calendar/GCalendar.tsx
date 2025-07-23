// "use client";
// import React, { useState, useEffect, useContext } from "react";
// import { Button, message } from "antd";
// import Image from "next/image";
// import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
// import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
// import { useCookies } from "react-cookie";

// function GCalendar() {
//   const [connected, setConnected] = useState<boolean | null>(null);
//   const [loading, setLoading] = useState(true);

//   const voiceBotContextData: any = useContext(CreateVoiceBotContext);
//   const vapiAssistantId = voiceBotContextData.assistantInfo?.vapiAssistantId;
//   const [cookies] = useCookies(["userId"]);

//   const checkConnection = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/status?assistantId=${vapiAssistantId}&userId=${cookies.userId}`,
//         { cache: "no-store" }
//       );
//       const data = await res.json();
//       setConnected(data.connected);
//     } catch {
//       setConnected(false);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     checkConnection();
//     const onMessage = (event: MessageEvent) => {
//       if (
//         event.data === "google-oauth-success" ||
//         event.data === "google-oauth-error"
//       ) {
//         checkConnection();
//       }
//     };
//     window.addEventListener("message", onMessage);
//     return () => window.removeEventListener("message", onMessage);
//   }, []);

//   const handleGoogleAuth = () => {
//     if (!vapiAssistantId || !cookies.userId) {
//       message.error("Invalid Request, User and Assistant should be verified!", 3);
//       return;
//     }
//     const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${vapiAssistantId}&userId=${cookies.userId}`;
//     const width = 500, height = 600;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;
//     window.open(
//       authUrl,
//       "google_oauth",
//       `width=${width},height=${height},left=${left},top=${top}`
//     );
//   };

//   return (
//     <div
//       style={{
//         minHeight: 300,
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         marginTop: 40,
//       }}
//     >
//       <Image
//         src={googleCalendarAPI}
//         alt="Google Calendar"
//         width={48}
//         height={48}
//         style={{ marginBottom: 8 }}
//       />
//       <h2>Google Calendar</h2>
//       <div style={{ marginTop: 24 }}>
//         {loading || connected === null ? (
//           <Button
//             type="primary"
//             size="large"
//             style={{ minWidth: 160 }}
//             disabled
//           >
//             Loading...
//           </Button>
//         ) : connected ? (
//           <Button
//             type="primary"
//             size="large"
//             style={{
//               minWidth: 160,
//               background: "#27ae60",
//               borderColor: "#27ae60",
//               color: "#fff",
//               cursor: "default",
//             }}
//             disabled
//           >
//             Connected to Google Calendar
//           </Button>
//         ) : (
//           <Button
//             type="primary"
//             size="large"
//             onClick={handleGoogleAuth}
//             style={{ minWidth: 160 }}
//           >
//             Connect
//           </Button>
//         )}
//       </div>
//     </div>
//   );
// }

// export default GCalendar;






import React, { useState, useEffect, useContext } from "react";
import { Button, message, Modal } from "antd";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { useCookies } from "react-cookie";

function GCalendar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [otherAssistantName, setOtherAssistantName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [pendingAuthUrl, setPendingAuthUrl] = useState<string | null>(null);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const vapiAssistantId = voiceBotContextData.assistantInfo?.vapiAssistantId;
  const [cookies] = useCookies(["userId"]);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/voicebot/dashboard/api/google/status?assistantId=${vapiAssistantId}&userId=${cookies.userId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setConnected(data.connected);
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkConnection();
    const onMessage = (event: MessageEvent) => {
      if (
        event.data === "google-oauth-success" ||
        event.data === "google-oauth-error"
      ) {
        checkConnection();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const preCheckAndHandleGoogleAuth = async () => {
    if (!vapiAssistantId || !cookies.userId) {
      message.error("Invalid Request, User and Assistant should be verified!", 3);
      return;
    }
    try {
      const res = await fetch(`/voicebot/dashboard/api/google/precheck?assistantId=${vapiAssistantId}&userId=${cookies.userId}`);
      const data = await res.json();
      const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${vapiAssistantId}&userId=${cookies.userId}`;
      if (data.alreadyConnectedToOther) {
        setOtherAssistantName(data.otherAssistantName);
        setGoogleEmail(data.googleEmail);
        setPendingAuthUrl(authUrl);
        setConfirmVisible(true);
      } else {
        openConsentWindow(authUrl);
      }
    } catch {
      message.error("Something went wrong. Please try again.", 3);
    }
  };

  const openConsentWindow = (authUrl: string) => {
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleConfirmYes = () => {
    setConfirmVisible(false);
    if (pendingAuthUrl) openConsentWindow(pendingAuthUrl);
  };

  const handleConfirmNo = () => {
    setConfirmVisible(false);
    setPendingAuthUrl(null);
    setOtherAssistantName("");
    setGoogleEmail("");
  };

  return (
    <div
      style={{
        minHeight: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
      }}
    >
      <Image
        src={googleCalendarAPI}
        alt="Google Calendar"
        width={48}
        height={48}
        style={{ marginBottom: 8 }}
      />
      <h2>Google Calendar</h2>
      <div style={{ marginTop: 24 }}>
        {loading || connected === null ? (
          <Button
            type="primary"
            size="large"
            style={{ minWidth: 160 }}
            disabled
          >
            Loading...
          </Button>
        ) : connected ? (
          <Button
            type="primary"
            size="large"
            style={{
              minWidth: 160,
              background: "#27ae60",
              borderColor: "#27ae60",
              color: "#fff",
              cursor: "default",
            }}
            disabled
          >
            Connected to Google Calendar
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            onClick={preCheckAndHandleGoogleAuth}
            style={{ minWidth: 160 }}
          >
            Connect
          </Button>
        )}
      </div>

      <Modal
        open={confirmVisible}
        title="Google Account Already Linked"
        onOk={handleConfirmYes}
        onCancel={handleConfirmNo}
        okText="Yes"
        cancelText="No"
        closable={false}
        maskClosable={false}
      >
        <p>
          The Google account <b>{googleEmail}</b> is already connected with voicebot <b>{otherAssistantName}</b>.<br />
          Do you still want to continue?
        </p>
      </Modal>
    </div>
  );
}

export default GCalendar;