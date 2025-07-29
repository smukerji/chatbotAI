import React, { useState, useEffect, useRef } from "react";
import { Button, List, Typography, Spin, message } from "antd";
import { CalendarOutlined, CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";

const { Title, Text } = Typography;

interface GCalendarProps {
  userId: string;
  assistantId: string;
  assistantPublished: boolean;
}

type ToolMenu = "none" | "gcal";
type GCalAction = "none" | "check" | "create";

interface GoogleConsentStatus {
  connected: boolean;
  email?: string;
  name?: string;
}

const GCalendar: React.FC<GCalendarProps> = ({
  userId,
  assistantId,
  assistantPublished,
}) => {
  const [cookies] = useCookies(["userId"]);
  const userVerified = !!cookies.userId;

  const [selectedMenu, setSelectedMenu] = useState<ToolMenu>("none");
  const [gcalAction, setGcalAction] = useState<GCalAction>("none");
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const calendarBtnRef = useRef<HTMLDivElement>(null);

  const handleMenuSelect = (key: ToolMenu) => {
    setSelectedMenu(key);
    setGcalAction("none");
    setGcalStatus(null);
  };

  const checkConnection = async () => {
    setLoading(true);
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
      });
    } catch {
      setGcalStatus({ connected: false });
    }
    setLoading(false);
  };

  const handleGCalAction = async (action: GCalAction) => {
    setGcalAction(action);
    if (assistantPublished && userVerified) {
      await checkConnection();
    }
  };

  // Updated: Accept tool parameter
  const openConsentWindow = (tool: "check-availability" | "create-event") => {
    if (!assistantId || !userId) {
      message.error("Invalid Request, User and Assistant should be verified!", 3);
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
    const onMessage = (event: MessageEvent) => {
      if (
        event.data === "google-oauth-success" ||
        event.data === "google-oauth-error"
      ) {
        if (
          gcalAction !== "none" &&
          assistantPublished &&
          userVerified
        )
          checkConnection();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [gcalAction, userId, assistantId, assistantPublished, userVerified]);

  const tools = [
    {
      key: "gcal",
      icon: <CalendarOutlined style={{ color: "#1890ff" }} />,
      label: "Google Calendar",
    },
  ];

  const attractiveFont = "'Segoe UI', 'Montserrat', 'Roboto', 'Poppins', 'Arial', sans-serif";

  const renderStatusAlert = () => {
    if (!assistantPublished) {
      return (
        <div style={{ width: "100%", maxWidth: 420, margin: "40px auto 0 auto" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "22px",
              fontFamily: attractiveFont,
              marginBottom: 10,
              color: "#faad14",
              textAlign: "center",
              letterSpacing: "0.5px",
            }}
          >
            Assistant Not Published
          </div>
          <div
            style={{
              fontSize: "16px",
              fontFamily: attractiveFont,
              color: "#555",
              background: "#fffbe6",
              borderRadius: 8,
              padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(250,173,20,0.10)",
              textAlign: "center",
              lineHeight: "1.65",
              border: "1px solid #ffe58f",
            }}
          >
            <Image
              src={googleCalendarAPI}
              alt="Google Calendar"
              width={54}
              height={54}
              style={{ opacity: 0.55, marginBottom: 14 }}
            />
            <br />
            You haven't published your assistant yet.<br />
            <span style={{ color: "#d48806", fontWeight: 500 }}>
              Please Publish it first to use Google Calendar features.
            </span>
          </div>
        </div>
      );
    }
    if (!userVerified) {
      return (
        <div style={{ width: "100%", maxWidth: 420, margin: "40px auto 0 auto" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "22px",
              fontFamily: attractiveFont,
              marginBottom: 10,
              color: "#f5222d",
              textAlign: "center",
              letterSpacing: "0.5px",
            }}
          >
            User Not Verified
          </div>
          <div
            style={{
              fontSize: "16px",
              fontFamily: attractiveFont,
              color: "#555",
              background: "#fff1f0",
              borderRadius: 8,
              padding: "18px 20px",
              boxShadow: "0 2px 8px rgba(245,34,45,0.10)",
              textAlign: "center",
              lineHeight: "1.65",
              border: "1px solid #ffa39e",
            }}
          >
            <Image
              src={googleCalendarAPI}
              alt="Google Calendar"
              width={54}
              height={54}
              style={{ opacity: 0.55, marginBottom: 14 }}
            />
            <br />
            You are not logged in.<br />
            <span style={{ color: "#cf1322", fontWeight: 500 }}>
              Please Login to continue.
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderPopover = () => {
    const rect = calendarBtnRef.current?.getBoundingClientRect();
    const top = rect ? rect.top + rect.height / 2 - 32 : 80;
    const left = rect ? rect.right + 10 : 280;

    return (
      <div
        className="gcal-popover"
        style={{
          position: "fixed",
          top,
          left,
          zIndex: 1000,
        }}
      >
        <div className="gcal-popover-arrow" />
        <div className="gcal-popover-inner">
          <div
            className={`gcal-popover-item${gcalAction === "check" ? " selected" : ""}`}
            onClick={() => handleGCalAction("check")}
          >
            <CheckCircleOutlined style={{ marginRight: 8 }} />
            Check Availability
          </div>
          <div
            className={`gcal-popover-item${gcalAction === "create" ? " selected" : ""}`}
            onClick={() => handleGCalAction("create")}
          >
            <PlusOutlined style={{ marginRight: 8 }} />
            Create Event
          </div>
        </div>
        <style jsx>{`
          .gcal-popover-arrow {
            position: absolute;
            left: -10px;
            top: 28px;
            width: 20px;
            height: 20px;
            background: transparent;
          }
          .gcal-popover-arrow::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 20px;
            height: 20px;
            background: #fff;
            box-shadow: -2px 2px 8px rgba(0,0,0,0.06);
            transform: rotate(45deg);
          }
          .gcal-popover-inner {
            min-width: 220px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.12);
            padding: 8px 0;
          }
          .gcal-popover-item {
            padding: 14px 24px 14px 18px;
            cursor: pointer;
            font-size: 17px;
            display: flex;
            align-items: center;
            transition: background 0.12s;
          }
          .gcal-popover-item:hover, .gcal-popover-item.selected {
            background: #f5faff;
          }
          .gcal-popover-item.selected {
            font-weight: 600;
            color: #1890ff;
          }
        `}</style>
      </div>
    );
  };

  const renderRightPanel = () => {
    if (selectedMenu === "none") return null;

    if (selectedMenu === "gcal" && (!gcalAction || gcalAction === "none")) {
      return (
        <div style={{ position: "relative", height: "100%" }}>
          {renderPopover()}
        </div>
      );
    }

    let actionTitle = "";
    let toolParam: "check-availability" | "create-event" = "check-availability";
    if (gcalAction === "check") {
      actionTitle = "Check Availability:";
      toolParam = "check-availability";
    }
    if (gcalAction === "create") {
      actionTitle = "Create Event:";
      toolParam = "create-event";
    }

    if (gcalAction === "check" || gcalAction === "create") {
      if (!assistantPublished) {
        return (
          <div style={{ position: "relative", minHeight: 300 }}>
            <div style={{
              position: "absolute",
              top: 10,
              left: 25,
              fontWeight: 600,
              fontSize: 18,
              fontFamily: attractiveFont,
              color: "#222",
              zIndex: 2
            }}>
              {actionTitle}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}>
              {renderStatusAlert()}
            </div>
          </div>
        );
      }
      // Normal panel if assistant is published
      return (
        <div style={{ position: "relative", minHeight: 300 }}>
          <div style={{
            position: "absolute",
            top: 10,
            left: 25,
            fontWeight: 600,
            fontSize: 18,
            fontFamily: attractiveFont,
            color: "#222",
            zIndex: 2
          }}>
            {actionTitle}
          </div>
          <div style={{
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 16px",
            textAlign: "center",
          }}>
            <Image
              src={googleCalendarAPI}
              alt="Google Calendar"
              width={54}
              height={54}
              style={{ marginBottom: 14 }}
            />
            <h2 style={{
              marginBottom: 20,
              fontWeight: 600,
              fontSize: 22,
              fontFamily: attractiveFont
            }}>
              Google Calendar
            </h2>
            {gcalStatus?.connected ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  style={{
                    minWidth: 240,
                    background: "#27ae60",
                    borderColor: "#27ae60",
                    color: "#fff",
                    cursor: "default",
                    fontFamily: attractiveFont,
                    fontWeight: 600,
                    fontSize: 18,
                  }}
                  disabled
                >
                  {gcalStatus.name
                    ? `${gcalStatus.name}'s Google Calendar Connected`
                    : "Google Calendar Connected"}
                </Button>
                {gcalStatus.email && (
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary" style={{ fontFamily: attractiveFont }}>
                      Authorized as:{" "}
                      <span style={{ color: "#222", fontWeight: 500 }}>
                        {gcalStatus.email}
                      </span>
                    </Text>
                  </div>
                )}
              </>
            ) : (
              // Updated: Pass toolParam to openConsentWindow
              <Button
                type="primary"
                size="large"
                onClick={() => openConsentWindow(toolParam)}
                style={{
                  minWidth: 240,
                  fontFamily: attractiveFont,
                  fontWeight: 600,
                  fontSize: 18,
                }}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div
        style={{
          width: 260,
          borderRight: "1px solid #f0f0f0",
          padding: "24px 0",
          height: "100%",
          background: "#fff",
          position: "relative",
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={tools}
          renderItem={tool => (
            <List.Item
              style={{
                paddingLeft: 0,
                paddingRight: 0,
                background: selectedMenu === tool.key ? "#ededed" : undefined,
                borderRadius: selectedMenu === tool.key ? 8 : 0,
                marginBottom: 4,
                position: "relative",
                zIndex: 10,
              }}
            >
              <div
                ref={tool.key === "gcal" ? calendarBtnRef : undefined}
                style={{
                  width: "100%",
                  padding: "0 24px",
                  borderRadius: 8,
                  background: selectedMenu === tool.key ? "#ededed" : undefined,
                  display: "flex",
                  alignItems: "center",
                  height: 48,
                  cursor: "pointer",
                  fontWeight: selectedMenu === tool.key ? 600 : undefined,
                  fontFamily: attractiveFont,
                  fontSize: 17,
                }}
                onClick={() => handleMenuSelect(tool.key as ToolMenu)}
              >
                <Image
                  src={googleCalendarAPI}
                  alt="Google Calendar"
                  width={28}
                  height={28}
                  style={{ marginRight: 8, verticalAlign: "middle" }}
                />
                <span style={{ color: "#222" }}>{tool.label}</span>
              </div>
            </List.Item>
          )}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: "0",
          minHeight: 500,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {renderRightPanel()}
      </div>
    </div>
  );
};

export default GCalendar;