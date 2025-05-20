import React, { useState } from "react";
import { Button } from "antd";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";

function GCalendar() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleGoogleAuth = () => {
    // Open the backend endpoint that generates the Google OAuth URL using googleapis
    const authUrl = "/voicebot/dashboard/api/google/calendar"; // Use relative path for deployment
    const width = 500,
      height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // You may need to handle the token retrieval after redirect, depending on your backend implementation.
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
        <Button
          type="primary"
          size="large"
          onClick={handleGoogleAuth}
          style={{ minWidth: 160 }}
          disabled={!!authToken}
        >
          Connect
        </Button>
      </div>
      {authToken && (
        <div
          style={{
            marginTop: 24,
            wordBreak: "break-all",
            textAlign: "center",
          }}
        >
          <p>Authenticated with Google Calendar</p>
          <p style={{ fontSize: 12, color: "#888" }}>
            Access Token: {authToken}
          </p>
        </div>
      )}
    </div>
  );
}

export default GCalendar;
