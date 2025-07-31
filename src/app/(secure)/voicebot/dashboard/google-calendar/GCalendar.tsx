
import React, { useState, useEffect, useRef, useContext } from "react";
import { Button, List, Typography, message } from "antd";
import { CalendarOutlined, CheckCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../public/Google_Calendar.png";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";

const { Text } = Typography;

interface GCalendarProps {
  userId: string;
  assistantId: string;
  assistantPublished: boolean;
  triggerPublishMethod: () => Promise<void>;
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
  triggerPublishMethod
}) => {
  const [cookies] = useCookies(["userId"]);
  const userVerified = !!cookies.userId;

  const [selectedMenu, setSelectedMenu] = useState<ToolMenu>("none");
  const [hoveredMenu, setHoveredMenu] = useState<ToolMenu>("none");
  const [gcalAction, setGcalAction] = useState<GCalAction>("none");
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [callPublishAssistant, setCallPublishAssistant] = useState<boolean>(false);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

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
 
      if (data.connected) {
        setCallPublishAssistant(true);
      
       
      }
      
    } catch {
      setGcalStatus({ connected: false });
    }
    setLoading(false);
  };

  useEffect(() => { 
    async function _() {
      await triggerPublishMethod();
    }
    if (callPublishAssistant) {

      if ((Array.isArray(voicebotDetails.model.toolIds) && voicebotDetails.model.toolIds.length !== 2) || !("toolIds" in voicebotDetails.model) ) {
        
        voiceBotContextData.updateState("model.toolIds", ["85b3b0ac-4330-42c2-bb2f-459c6b87b68a",
        "82d7e7dc-c01e-4ffc-9a75-9049d8b22bd0"]);
        console.log("voice details on G-Calender ", voicebotDetails);
      }

      setCallPublishAssistant(false);
    }

  }, [callPublishAssistant])

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
    const onMessage = async (event: MessageEvent) => {
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
              style={{ opacity: 0.55, marginBottom: 14}}
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
    ) : null;
  };

  const renderRightPanel = () => {
    if (selectedMenu === "gcal" || gcalAction !== "none") {
      if (!gcalAction || gcalAction === "none") {
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
    }

    return null;
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div
        style={{
          width: 260,
          borderRight: "1px solid #f0f0f0",
          padding: "24px 12px",
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