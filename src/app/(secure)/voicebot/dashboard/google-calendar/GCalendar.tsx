// import React, { useState } from "react";
// import { Button } from "antd";
// import Image from "next/image";
// import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";

// function GCalendar() {
//   const [authToken, setAuthToken] = useState<string | null>(null);

//   const handleGoogleAuth = () => {
//     // Open the backend endpoint that generates the Google OAuth URL using googleapis
//     const authUrl = "/voicebot/dashboard/api/google/calendar"; // Use relative path for deployment
//     const width = 500,
//       height = 600;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;

//     const popup = window.open(
//       authUrl,
//       "google_oauth",
//       `width=${width},height=${height},left=${left},top=${top}`
//     );

//     // You may need to handle the token retrieval after redirect, depending on your backend implementation.
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
//         <Button
//           type="primary"
//           size="large"
//           onClick={handleGoogleAuth}
//           style={{ minWidth: 160 }}
//           disabled={!!authToken}
//         >
//           Connect
//         </Button>
//       </div>
//       {authToken && (
//         <div
//           style={{
//             marginTop: 24,
//             wordBreak: "break-all",
//             textAlign: "center",
//           }}
//         >
//           <p>Authenticated with Google Calendar</p>
//           <p style={{ fontSize: 12, color: "#888" }}>
//             Access Token: {authToken}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

// export default GCalendar;






"use client";
import React, { useState, useEffect, useContext } from "react";
import { Button } from "antd";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
import { useSearchParams } from "next/navigation";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";

function GCalendar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  // console.log("context data ", voiceBotContextData);
  const voicebotDetails = voiceBotContextData.state;
  console.log("voicebotDetails", voicebotDetails);
  // const checkConnection = async () => {
  //   setLoading(true);
  //   try {
  //     const res = await fetch("/voicebot/dashboard/api/google/status", { cache: "no-store" });
  //     const data = await res.json();
  //     setConnected(data.connected);
  //   } catch {
  //     setConnected(false);
  //   }
  //   setLoading(false);
  // };

  const searchParams = useSearchParams();
  const assistantId = searchParams ? searchParams.get("assistantId") : null;
  const checkConnection = async () => {
    setLoading(true);
    try {
        
        const res = await fetch(`/voicebot/dashboard/api/google/calendar/status?assistantId=${assistantId}`, {
            cache: "no-store",
        });
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

  const handleGoogleAuth = () => {
    const authUrl = "/voicebot/dashboard/api/google/calendar";
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div style={{
      minHeight: 300,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
    }}>
      <Image src={googleCalendarAPI} alt="Google Calendar" width={48} height={48} style={{ marginBottom: 8 }} />
      <h2>Google Calendar</h2>
      <div style={{ marginTop: 24 }}>
        {loading || connected === null ? (
          <Button type="primary" size="large" style={{ minWidth: 160 }} disabled>
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
            onClick={handleGoogleAuth}
            style={{ minWidth: 160 }}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default GCalendar;