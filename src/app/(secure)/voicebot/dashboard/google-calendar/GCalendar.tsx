
import React, { useState, useEffect, useRef } from "react";
import { Button, List, Spin, Typography, message } from "antd";
import { CalendarOutlined, CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
import './g-calendar.scss'

const { Text } = Typography;

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


const SIDEBAR_BG_DEFAULT = "#fff";
const SIDEBAR_BG_HOVER = "#e7eaf0";   // hover/grayish
const SIDEBAR_BG_ACTIVE = "#a4c8fa";  // selected/blue

const GCalendar: React.FC<GCalendarProps> = ({
  userId,
  assistantId,
  assistantPublished,
}) => {
  const [cookies] = useCookies(["userId"]);
  const userVerified = !!cookies.userId;

  const [selectedMenu, setSelectedMenu] = useState<ToolMenu>("none");
  const [hoveredMenu, setHoveredMenu] = useState<ToolMenu>("none");
  const [gcalAction, setGcalAction] = useState<GCalAction>("none");
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [popoverVisible, setPopoverVisible] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const calendarBtnRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for sidebar and popover
  const popoverMouseOver = useRef(false);
  const buttonMouseOver = useRef(false);

  // Set popover position on hover
  const handleBtnMouseEnter = () => {
    buttonMouseOver.current = true;
    setHoveredMenu("gcal");
    if (calendarBtnRef.current) {
      const rect = calendarBtnRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.top + window.scrollY + rect.height / 2 - 32,
        left: rect.right + 10 + window.scrollX,
      });
      setPopoverVisible(true);
    }
  };
  const handleBtnMouseLeave = () => {
    buttonMouseOver.current = false;
    setHoveredMenu("none");
    setTimeout(() => {
      if (!popoverMouseOver.current) setPopoverVisible(false);
    }, 50);
  };
  const handlePopoverMouseEnter = () => {
    popoverMouseOver.current = true;
  };
  const handlePopoverMouseLeave = () => {
    popoverMouseOver.current = false;
    setTimeout(() => {
      if (!buttonMouseOver.current) setPopoverVisible(false);
    }, 50);
  };

  // Hide popover when clicking outside
  useEffect(() => {
    if (!popoverVisible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        calendarBtnRef.current &&
        !calendarBtnRef.current.contains(event.target as Node)
      ) {
        setPopoverVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverVisible]);

  // Always fetch GCal status when Google Calendar is selected
  useEffect(() => {
    if (selectedMenu === "gcal" && assistantPublished && userVerified) {
      checkConnection();
    }
  }, [selectedMenu, assistantPublished, userVerified, assistantId, userId]);

  const handleGCalAction = async (action: GCalAction) => {
    setSelectedMenu("gcal");
    setGcalAction(action);
    setPopoverVisible(false);
    if (assistantPublished && userVerified) {
      await checkConnection();
    }
  };

  // Only reset status; do NOT reset gcalAction if one is already selected
  const handleMenuSelect = (key: ToolMenu) => {
    if (selectedMenu !== key) {
      setSelectedMenu(key);
      setGcalStatus(null);
    }
    // If user re-clicks Google Calendar, do not reset gcalAction
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
            className="gcal-status-alert gcal-status-alert--not-published"
          >
            <Image
              src={googleCalendarAPI}
              alt="Google Calendar"
              width={54}
              height={54}
              style={{ opacity: 0.55, marginBottom: 14}}
            />
            <br />
            You haven't published your assistant yet.<br />
            <span className="gcal-status-alert__highlight">
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
            className="gcal-status-alert gcal-status-alert--not-verified"
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
            <span className="gcal-status-alert__highlight">
              Please Login to continue.
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderPopover = () => {
    return popoverVisible ? (
      <div
        ref={popoverRef}
        className="gcal-popover"
        style={{
          position: "fixed",
          top: popoverPos.top,
          left: popoverPos.left,
          zIndex: 1000,
        }}
        onMouseEnter={handlePopoverMouseEnter}
        onMouseLeave={handlePopoverMouseLeave}
      >
        <div className="gcal-popover-arrow" />
        <div className="gcal-popover-inner">
          <div
            className={`gcal-popover-item${gcalAction === "check" ? " selected" : ""}`}
            onClick={() => handleGCalAction("check")}
            style={{ cursor: "pointer" }}
          >
            <CheckCircleOutlined style={{ marginRight: 8 }} />
            Check Availability
          </div>
          <div
            className={`gcal-popover-item${gcalAction === "create" ? " selected" : ""}`}
            onClick={() => handleGCalAction("create")}
            style={{ cursor: "pointer" }}
          >
            <PlusOutlined style={{ marginRight: 8 }} />
            Create Event
          </div>
        </div>
      </div>
    ) : null;
  };


  const renderRightPanel = () => {
    if (selectedMenu === "gcal" || gcalAction !== "none") {
      if (!gcalAction || gcalAction === "none") {
        return (
          <div style={{ position: "relative", height: "100%" }}>
            {/* {renderPopover()} */}
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
  
      // Loader and only action title while loading
      if (loading) {
        return (
          <div className="gcal-panel-loading">
            <h2 className="gcal-panel-title">
              {actionTitle}
            </h2>
            <div style={{ marginTop: 24 }}>
              <Spin size="large" />
            </div>
          </div>
        );
      }
  
      if (gcalAction === "check" || gcalAction === "create") {
        if (!assistantPublished) {
          return (
            <div style={{ position: "relative", minHeight: 300 }}>
              <div className="gcal-panel-title" style={{ top: 10, left: 25, position: "absolute", zIndex: 2 }}>
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
        // Normal panel if assistant is published and not loading
        return (
          <div style={{ position: "relative", minHeight: 300 }}>
            <div className="gcal-panel-title" style={{ top: 10, left: 25, position: "absolute", zIndex: 2 }}>
              {actionTitle}
            </div>
            <div className="gcal-panel-content">
              <Image
                src={googleCalendarAPI}
                alt="Google Calendar"
                width={54}
                height={54}
                style={{ marginBottom: 14 }}
              />
              <h2 className="gcal-panel-title">
                Google Calendar
              </h2>
              {gcalStatus?.connected ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    className="gcal-panel-btn gcal-panel-btn--connected"
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
                <Button
                  type="primary"
                  size="large"
                  onClick={() => openConsentWindow(toolParam)}
                  className="gcal-panel-btn"
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        );
      }
    }
  
    return null;
  };
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div
        style={{
          width: 260,
          borderRight: "1px solid #f0f0f0",
          padding: "24px 8px",
          height: "100%",
          background: "#fff",
          position: "relative",
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={tools}
          renderItem={tool => {
            const isSelected = selectedMenu === tool.key;
            const isHovered = hoveredMenu === tool.key;
            let bgColor = SIDEBAR_BG_DEFAULT;
            if (isSelected) bgColor = SIDEBAR_BG_ACTIVE;
            else if (isHovered) bgColor = SIDEBAR_BG_HOVER;

            return (
              <List.Item
                style={{
                  paddingLeft: 0,
                  paddingRight: 0,
                  background: bgColor,
                  borderRadius: 10,
                  marginBottom: 4,
                  position: "relative",
                  zIndex: 10,
                  border: isSelected ? "1px solid #a4c8fa" : "1px solid #dbdde4",
                  transition: "background 0.15s, border 0.15s",
                }}
              >
                <div
                  ref={tool.key === "gcal" ? calendarBtnRef : undefined}
                  style={{
                    width: "100%",
                    padding: "0 24px",
                    borderRadius: 10,
                    background: bgColor,
                    display: "flex",
                    alignItems: "center",
                    height: 48,
                    cursor: "pointer",
                    fontWeight: isSelected ? 600 : undefined,
                    fontFamily: attractiveFont,
                    fontSize: 17,
                    position: "relative",
                    transition: "background 0.15s, border 0.15s",
                  }}
                  onClick={() => handleMenuSelect(tool.key as ToolMenu)}
                  onMouseEnter={handleBtnMouseEnter}
                  onMouseLeave={handleBtnMouseLeave}
                >
                  <Image
                    src={googleCalendarAPI}
                    alt="Google Calendar"
                    width={28}
                    height={28}
                    style={{ marginRight: 8, verticalAlign: "middle" }}
                  />
                  <span style={{ color: "#222" }}>{tool.label}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    style={{
                      marginLeft: "auto",
                      display: "inline-block",
                      verticalAlign: "middle"
                    }}
                  >
                    <polyline
                      points="6,4 12,9 6,14"
                      fill="none"
                      stroke="#222"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                {/* Only show popover if visible and this is google calendar */}
                {popoverVisible && tool.key === "gcal" && renderPopover()}
              </List.Item>
            );
          }}
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