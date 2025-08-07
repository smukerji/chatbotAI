import React, { useState, useEffect, useContext } from "react";
import { Button, Spin, message } from "antd";
import { useCookies } from "react-cookie";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import "./g-calendar.scss";

interface GCalendarProps {
  userId: string;
  assistantId: string;
  assistantPublished: boolean;
  triggerPublishMethod: () => Promise<void>;
}

type TabAction = "check" | "create";

interface GoogleConsentStatus {
  connected: boolean;
  email?: string;
  name?: string;
  tools?: string[];
}

const TOOL_DB_MAP: Record<TabAction, string> = {
  check: "check-availability",
  create: "create-event",
};

const GCalendar: React.FC<GCalendarProps> = ({
  userId,
  assistantId,
  assistantPublished,
  triggerPublishMethod,
}) => {
  const [cookies] = useCookies(["userId"]);
  const userVerified = !!cookies.userId;
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(
    null
  );
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const [connectedTools, setConnectedTools] = useState<string[]>([]);
  const [callPublishAssistant, setCallPublishAssistant] =
    useState<boolean>(false);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  useEffect(() => {
    if (assistantPublished && userVerified) {
      checkConnection();
    }
  }, [assistantPublished, userVerified, assistantId, userId]);

  const checkConnection = async () => {
    setLoadingCheck(false);
    setLoadingCreate(false);
    try {
      const res = await fetch(
        `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${userId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setGcalStatus({
        connected: !!data.connected,
        email: data.email,
        name: data.name,
        tools: data.tools || [],
      });
      setConnectedTools(data.tools || []);
      if (data.connected) setCallPublishAssistant(true);
    } catch {
      setGcalStatus({ connected: false, tools: [] });
      setConnectedTools([]);
    }
  };

  const handleConnect = async (action: TabAction) => {
    const tool = TOOL_DB_MAP[action];
    if (!assistantPublished || !userVerified) return;
    if (action === "check") setLoadingCheck(true);
    if (action === "create") setLoadingCreate(true);

    if (!gcalStatus?.connected) {
      openConsentWindow(tool);
      return;
    }

    if (!connectedTools.includes(tool)) {
      try {
        const res = await fetch(
          `/voicebot/dashboard/api/google/add-tool?assistantId=${assistantId}&userId=${userId}&tool=${tool}`,
          { method: "POST" }
        );
        const data = await res.json();
        if (data.success) {
          setConnectedTools(data.tools || []);
          setGcalStatus((prev) =>
            prev ? { ...prev, tools: data.tools || [] } : prev
          );
          await checkConnection();
        } else {
          message.error("Failed to connect tool. Try again.");
        }
      } catch (err) {
        message.error("Failed to connect tool. Try again.");
      }
    }
    setLoadingCheck(false);
    setLoadingCreate(false);
  };

  useEffect(() => {
    async function _() {
      await triggerPublishMethod();
    }
    if (callPublishAssistant) {
      if (
        (Array.isArray(voicebotDetails.model.toolIds) &&
          voicebotDetails.model.toolIds.length !== 2) ||
        !("toolIds" in voicebotDetails.model)
      ) {
        voiceBotContextData.updateState("model.toolIds", [
          "aa5dd6b5-e511-4400-ab5b-cdcff7279488",
          "b29826a9-3941-498e-b6e7-3d083bb42bf0",
        ]);
      }
      setCallPublishAssistant(false);
    }
  }, [callPublishAssistant]);

  const openConsentWindow = (tool: string) => {
    if (!assistantId || !userId) {
      message.error(
        "Invalid Request, User and Assistant should be verified!",
        3
      );
      return;
    }
    const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${userId}&tool=${tool}`;
    const width = 500,
      height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (
        event.data === "google-oauth-success" ||
        event.data === "google-oauth-error"
      ) {
        if (assistantPublished && userVerified) await checkConnection();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [userId, assistantId, assistantPublished, userVerified]);

  // Sidebar Google Calendar Card
  const renderSidebar = () => (
    <div className="gcal-sidebar-card">
      <Image
        src={googleCalendarAPI}
        alt="Google Calendar"
        width={32}
        height={32}
      />
      <span className="gcal-sidebar-label">Google Calendar</span>
    </div>
  );

  // Card for each tool
  const renderToolCard = (
    action: TabAction,
    title: string,
    loading: boolean
  ) => {
    const isConnected = connectedTools.includes(TOOL_DB_MAP[action]);
    return (
      <div className="gcal-tool-card">
        <div className="gcal-tool-title">{title}</div>
        {loading ? (
          <div className="gcal-tool-loading">
            <Spin size="large" />
          </div>
        ) : !isConnected ? (
          <Button
            className="gcal-connect-btn"
            style={{ width: "100%" }}
            size="large"
            onClick={() => handleConnect(action)}
          >
            Connect to Google Calendar
          </Button>
        ) : (
          <div className="gcal-connected-box">
            <div className="gcal-connected-pill">
              {gcalStatus?.name
                ? `${gcalStatus.name}'s Google Calendar connected`
                : "Google Calendar Connected"}
            </div>
            {gcalStatus?.email && (
              <div className="gcal-connected-email">
                Authorized as: {gcalStatus.email}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Alerts for not published/not verified
  const renderStatusAlert = () => {
    if (!assistantPublished) {
      return (
        <div className="gcal-status-alert gcal-status-alert--not-published">
          <div>
            <Image
              src={googleCalendarAPI}
              alt="Google Calendar"
              width={54}
              height={54}
              style={{ opacity: 0.55, marginBottom: 14 }}
            />
            <br />
            You haven't published your assistant yet.
            <br />
            <span className="gcal-status-alert__highlight">
              Please Publish it first to use Google Calendar features.
            </span>
          </div>
        </div>
      );
    }
    if (!userVerified) {
      return (
        <div className="gcal-status-alert gcal-status-alert--not-verified">
          <Image
            src={googleCalendarAPI}
            alt="Google Calendar"
            width={54}
            height={54}
            style={{ opacity: 0.55, marginBottom: 14 }}
          />
          <br />
          You are not logged in.
          <br />
          <span className="gcal-status-alert__highlight">
            Please Login to continue.
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="gcal-main-layout">
      <div className="gcal-sidebar-wrapper">{renderSidebar()}</div>
      <div className="gcal-tools-area">
        {!assistantPublished || !userVerified ? (
          renderStatusAlert()
        ) : (
          <>
            {renderToolCard("check", "Check availability", loadingCheck)}
            {renderToolCard("create", "Create event", loadingCreate)}
          </>
        )}
      </div>
    </div>
  );
};

export default GCalendar;
