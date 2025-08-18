import React, { useState, useEffect, useContext } from "react";
import { Button, Spin, message } from "antd";
import { useCookies } from "react-cookie";
import Image from "next/image";
import googleCalendarAPI from "../../../../../../../public/Google_Calendar.png";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import "./g-calendar.scss";

interface GCalendarProps {
  userId?: string;
  assistantId?: string;
  assistantPublished?: boolean;
  triggerPublishMethod: (value: boolean) => Promise<void>;
}

type TabAction = "check" | "create";

interface GoogleConsentStatus {
  connected: boolean;
  email?: string;
  name?: string;
  tools?: ToolsType[];
}

type ToolsType = {
  tool: string;
  publish: boolean;
};

const TOOL_DB_MAP: Record<TabAction, string> = {
  check: "check-availability",
  create: "create-event",
};

const TOOL_LABEL_MAP: Record<TabAction, string> = {
  check: "Tool name: google_calendar_check_availability_tool",
  create: "Tool name: google_calendar_tool_event_create",
};

const TOOL_ID_MAP: Record<string, string> = {
  "check-availability": "aa5dd6b5-e511-4400-ab5b-cdcff7279488",
  "create-event": "b29826a9-3941-498e-b6e7-3d083bb42bf0",
};

const GCalendar: React.FC<GCalendarProps> = ({
  userId,
  assistantId,
  assistantPublished,
  triggerPublishMethod,
}) => {
  const [cookies] = useCookies(["userId"]);
  const userVerified = !!(userId || cookies.userId);
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const [connectedTools, setConnectedTools] = useState<ToolsType[]>([]);
  const [callPublishAssistant, setCallPublishAssistant] = useState<boolean>(false);
  const [popupRef, setPopupRef] = useState<Window | null>(null);
  const [disconnecting, setDisconnecting] = useState<TabAction | null>(null);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData?.state ?? {};
  console.log("assistant data from G-Calendar ", voicebotDetails);

  useEffect(() => {
    if (assistantPublished && userVerified) {
      checkConnection();
    }
    // eslint-disable-next-line
  }, [assistantPublished, userVerified, assistantId, userId]);

  const checkConnection = async () => {
    setLoadingCheck(false);
    setLoadingCreate(false);
    try {
      const res = await fetch(
        `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${userId ?? cookies.userId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setGcalStatus({
        connected: !!data.connected,
        email: data.email,
        name: data.name,
        tools: data.tools || [],
      });
      console.log("conection data ", data);
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
      setLoadingCheck(false);
      setLoadingCreate(false);
      return;
    }
    //check request tool is exist, then update the publisher to true, before that publish the assistant
    if (gcalStatus && ("tools" in gcalStatus) && Array.isArray(gcalStatus.tools)) {
      //get the publish false result
      const assistantPreviousToolsId = voicebotDetails.model?.toolIds || [];
      if (tool == TOOL_DB_MAP.check) {
        assistantPreviousToolsId.push("aa5dd6b5-e511-4400-ab5b-cdcff7279488");
        voiceBotContextData?.updateState?.("model.toolIds", [
          ...assistantPreviousToolsId
        ]);
        await triggerPublishMethod(true);
        await executeAfterToolPublish(TOOL_DB_MAP.check, true);
        if (action === "check") setLoadingCheck(false);
        await checkConnection();
        
      }
      else if (tool == TOOL_DB_MAP.create) {
        assistantPreviousToolsId.push("b29826a9-3941-498e-b6e7-3d083bb42bf0");
        voiceBotContextData?.updateState?.("model.toolIds", [
          ...assistantPreviousToolsId
        ]);
        await triggerPublishMethod(true);
        await executeAfterToolPublish(TOOL_DB_MAP.create, true);
        if (action === "create") setLoadingCreate(false);
        await checkConnection();
      
      }
    }

  }

  // Disconnect handler
  const handleDisconnect = async (action: TabAction) => {
    const tool = TOOL_DB_MAP[action];
    setDisconnecting(action);
    if (gcalStatus && ("tools" in gcalStatus) && Array.isArray(gcalStatus.tools)) {//on single entry remove it from db, before that update the toolsid on vapi server
      const assistantPreviousToolsId = voicebotDetails.model?.toolIds || [];
      const foundedTool = connectedTools.find(x => x.tool === tool && x.publish === true);
      if (foundedTool!.tool == TOOL_DB_MAP.check) {
        const removedToolIdFilter: [] = assistantPreviousToolsId.filter((x: string) => x !== "aa5dd6b5-e511-4400-ab5b-cdcff7279488")
        if (removedToolIdFilter.length == 0) {
          const model = voicebotDetails.model;
          delete model.toolIds;
          voiceBotContextData.updateState("model", model);
        }
        else {
          voiceBotContextData?.updateState?.("model.toolIds", [
            ...removedToolIdFilter
          ]);
        }

        await triggerPublishMethod(true);
        await executeAfterToolPublish(TOOL_DB_MAP.check, false);
        await checkConnection();
      }
      else if (foundedTool!.tool == TOOL_DB_MAP.create) {
        const removedToolIdFilter = assistantPreviousToolsId.filter((x: string) => x !== "b29826a9-3941-498e-b6e7-3d083bb42bf0")
        if (removedToolIdFilter.length == 0) {
          const model = voicebotDetails.model;
          delete model.toolIds;
          voiceBotContextData.updateState("model", model);
        }
        else {
          voiceBotContextData?.updateState?.("model.toolIds", [
            ...removedToolIdFilter
          ]);
        }
        await triggerPublishMethod(true);
        await executeAfterToolPublish(TOOL_DB_MAP.create, false);
        await checkConnection();
      }
    }
    setDisconnecting(null);
  };

  useEffect(() => {
    async function _triggerFromParent() {
      await triggerPublishMethod(true);
    }

    if (callPublishAssistant) {
      if (gcalStatus && ("tools" in gcalStatus) && Array.isArray(gcalStatus.tools) && gcalStatus.tools.length == 1) {
        for (const elements of gcalStatus?.tools!) {
          const previousToolsId = voicebotDetails.model?.toolIds || [];
          if (elements.tool == TOOL_DB_MAP.check && !elements.publish) {
            previousToolsId.push("aa5dd6b5-e511-4400-ab5b-cdcff7279488");
            voiceBotContextData?.updateState?.("model.toolIds", [
              ...previousToolsId
            ]);
            _triggerFromParent();
            executeAfterToolPublish(TOOL_DB_MAP.check, true);
          }
          else if (elements.tool == TOOL_DB_MAP.create && !elements.publish) {
            previousToolsId.push("b29826a9-3941-498e-b6e7-3d083bb42bf0");
            voiceBotContextData?.updateState?.("model.toolIds", [
              ...previousToolsId
            ]);
            _triggerFromParent();
            executeAfterToolPublish(TOOL_DB_MAP.create, true);
          }
        }
      }
      setCallPublishAssistant(false);
    }
    // eslint-disable-next-line
  }, [callPublishAssistant]);

  async function executeAfterToolPublish(tool: string, publishValue: boolean) {
    const res = await fetch(
      `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
      { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue : publishValue }) }
    );
    const responseData = await res.json();
    console.log("executeAfterToolPublish your response data ", responseData);
  }

  const openConsentWindow = (tool: string) => {
    if (!assistantId || !(userId ?? cookies.userId)) {
      message.error(
        "Invalid Request, User and Assistant should be verified!",
        3
      );
      return;
    }
    const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`;
    const width = 500,
      height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      authUrl,
      "google_oauth",
      `width=${width},height=${height},left=${left},top=${top}`
    );
    setPopupRef(popup);
  };

  useEffect(() => {
    if (!popupRef) return;
    const poll = setInterval(() => {
      if (popupRef.closed) {
        setLoadingCheck(false);
        setLoadingCreate(false);
        setPopupRef(null);
        message.warning(
          "You haven’t connected your Google Calendar yet. Please verify your account to activate Google Calendar features."
        );
        clearInterval(poll);
      }
    }, 500);
    return () => clearInterval(poll);
  }, [popupRef]);

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      if (
        event.data === "google-oauth-success" ||
        event.data === "google-oauth-error"
      ) {
        setPopupRef(null); // close polling
        if (assistantPublished && userVerified) await checkConnection();
        setLoadingCheck(false);
        setLoadingCreate(false);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line
  }, [userId, assistantId, assistantPublished, userVerified]);

  // UI rendering
  const renderToolCard = (
    action: TabAction,
    title: string,
    loading: boolean
  ) => {
    // Check for both tool name and publish: true
    const isConnected = connectedTools.some(
      x => x.tool === TOOL_DB_MAP[action] && x.publish
    );
    return (
      <div className="gcal-tool-card">
        <div className="title-wrapper">
          <div className="gcal-tool-title">{title}</div>
          {isConnected && (
            <Button
              className="gcal-disconnect-btn"
              type="text"
              size="small"
              danger
              loading={disconnecting === action}
              onClick={() => handleDisconnect(action)}
            >
              Disconnect
            </Button>
          )}
        </div>

        <div className="gcal-tool-label">{TOOL_LABEL_MAP[action]}</div>
        {loading ? (
          <div className="gcal-tool-loading">
            <Spin size="small" />
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

  // --- UPDATED NOTE CARD STARTS HERE ---

  const renderNoteCard = () => (
    <>
     <>
  {/* Scenario 1 — Check availability only */}
  <div className="gcal-note-card">
    <div className="gcal-note-title">Scenario 1 — Check availability only</div>
    <ul>
      <li>Objective: Answer “am I free?” questions; do not create/edit events.</li>
      <li>
        Tools required: <code>google_calendar_check_availability_tool</code>
      </li>
      <li>
        Parameters used:&nbsp;
        <code>startTime</code>, <code>endTime</code>
      </li>
    </ul>
    <p>Sample system prompt:</p>
    <pre className="gcal-sample-prompt">{`Calendar policy:
- For availability queries, always call google_calendar_check_availability_tool.
- Never create, update, or delete events in this scenario.
- If startTime/endTime are missing or ambiguous, ask clarifying questions first.
- When parameters are clear, call google_calendar_check_availability_tool with {startTime, endTime}.
- If the requested time is busy, propose 2–3 alternative free slots with exact dates/times in the user's timezone.`}</pre>
  </div>

  {/* Scenario 2 — Only create event */}
  <div className="gcal-note-card">
    <div className="gcal-note-title">Scenario 2 — Create Event only</div>
    <ul>
      <li>
        Tools required: <code>google_calendar_tool_event_create</code>
      </li>
      <li>
        Parameters used:&nbsp;
        <code>title</code>, <code>startTime</code>, <code>endTime</code>, <code>description (optional)</code>
      </li>
    </ul>
    <p>Sample system prompt:</p>
    <pre className="gcal-sample-prompt">{`Calendar policy:
- For create event requests, directly call google_calendar_tool_event_create with { title, startTime, endTime, description }.
- If any required detail is missing or unclear, ask for it before creating.
- After creation, summarize the booking (title, date/time, timezone)`}</pre>
  </div>

  {/* Scenario 3 — Create an event after checking availability */}
  <div className="gcal-note-card">
    <div className="gcal-note-title">Scenario 3 — Create an event after checking availability</div>
    <ul>
      <li>Objective: Book events only after verifying and confirming details.</li>
      <li>
        Tools required: <code>google_calendar_check_availability_tool</code> and <code>google_calendar_tool_event_create</code>
      </li>
      <li>
        Parameters used:&nbsp;
        <code>title</code>, <code>startTime</code>, <code>endTime</code>, <code>description (optional)</code>
      </li>
    </ul>
    <p>Sample system prompt:</p>
    <pre className="gcal-sample-prompt">{`Calendar policy:
- First verify the requested time using google_calendar_check_availability_tool with { startTime, endTime }.
- If free, confirm the final details with the user: title, startTime, endTime, description.
- Only after explicit user confirmation, create the event via google_calendar_tool_event_create with { title, startTime, endTime, description }.
- If any required detail is missing or unclear, ask for it before creating.
- After creation, summarize the booking (title, date/time, timezone)`}</pre>
  </div>
</>
    </>
  );

  // --- UPDATED NOTE CARD ENDS HERE ---

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
      <div className="gcal-tools-area">
        {!assistantPublished || !userVerified ? (
          renderStatusAlert()
        ) : (
          <>
            <div className="gcal-tool-cards-row">
              {renderToolCard("check", "Check availability", loadingCheck)}
              {renderToolCard("create", "Create event", loadingCreate)}
            </div>
            {renderNoteCard()}
          </>
        )}
      </div>
    </div>
  );
  };





export default GCalendar;
