// import React, { useState, useEffect, useContext } from "react";
// import { Button, Spin, message } from "antd";
// import { useCookies } from "react-cookie";
// import Image from "next/image";
// import googleCalendarAPI from "../../../../../../../public/Google_Calendar.png";
// import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
// import "./g-calendar.scss";

// interface GCalendarProps {
//   userId?: string;
//   assistantId?: string;
//   assistantPublished?: boolean;
//   triggerPublishMethod?: (value: boolean) => Promise<void>;
// }

// type TabAction = "check" | "create";

// interface GoogleConsentStatus {
//   connected: boolean;
//   email?: string;
//   name?: string;
//   tools?: ToolsType[];
// }

// type ToolsType = {
//   tool: string;
//   publish: boolean;
// };

// const TOOL_DB_MAP: Record<TabAction, string> = {
//   check: "check-availability",
//   create: "create-event",
// };

// const TOOL_LABEL_MAP: Record<TabAction, string> = {
//   check: "Tool name: google_calendar_check_availability_tool",
//   create: "Tool name: google_calendar_tool_event_create",
// };

// const TOOL_ID_MAP: Record<string, string> = {
//   "check-availability": "aa5dd6b5-e511-4400-ab5b-cdcff7279488",
//   "create-event": "b29826a9-3941-498e-b6e7-3d083bb42bf0",
// };

// const GCalendar: React.FC<GCalendarProps> = ({
//   userId,
//   assistantId,
//   assistantPublished,
//   triggerPublishMethod,
// }) => {
//   const [cookies] = useCookies(["userId"]);
//   const userVerified = !!(userId || cookies.userId);
//   const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
//   const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
//   const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
//   const [connectedTools, setConnectedTools] = useState<ToolsType[]>([]);
//   const [callPublishAssistant, setCallPublishAssistant] = useState<boolean>(false);
//   const [popupRef, setPopupRef] = useState<Window | null>(null);
//   const [disconnecting, setDisconnecting] = useState<TabAction | null>(null);

//   const voiceBotContextData: any = useContext(CreateVoiceBotContext);
//   const voicebotDetails = voiceBotContextData?.state ?? {};

//   useEffect(() => {
//     if (assistantPublished && userVerified) {
//       checkConnection();
//     }
//   // eslint-disable-next-line
//   }, [assistantPublished, userVerified, assistantId, userId]);

//   const checkConnection = async () => {
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     debugger;
//     try {
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${userId ?? cookies.userId}`,
//         { cache: "no-store" }
//       );
//       const data = await res.json();
//       console.log("connection data ",data);
//       setGcalStatus({
//         connected: !!data.connected,
//         email: data.email,
//         name: data.name,
//         tools: data.tools || [],
//       });
//       setConnectedTools(data.tools || []);
//       if (data.connected) setCallPublishAssistant(true);
//     } catch {
//       setGcalStatus({ connected: false, tools: [] });
//       setConnectedTools([]);
//     }
//   };

//   const handleConnect = async (action: TabAction) => {
//     const tool = TOOL_DB_MAP[action];
//     if (!assistantPublished || !userVerified) return;
//     if (action === "check") setLoadingCheck(true);
//     if (action === "create") setLoadingCreate(true);
//     debugger;

//     if (!gcalStatus?.connected) {
//       openConsentWindow(tool);
//       return;
//     }
//     const inBlockConnectedTools = connectedTools.map(x => x.tool);

//     if (!inBlockConnectedTools.includes(tool)) {
//       try {
//         const res = await fetch(
//           `/voicebot/dashboard/api/google/add-tool?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//           { method: "POST" }
//         );
//         const data = await res.json();
//         console.log("add tool result ",data);
//         if (data.success) {
//           setConnectedTools(data.tools || []);
//           setGcalStatus((prev) =>
//             prev ? { ...prev, tools: data.tools || [] } : prev
//           );
//           await checkConnection();
//         } else {
//           message.error("Failed to connect tool. Try again.");
//         }
//       } catch (err) {
//         message.error("Failed to connect tool. Try again.");
//       }
//     }
//     else if(connectedTools.find((x)=> x.tool === tool && x.publish === false)){
//         // Update database: set publish:false for this tool

//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: true }) }
//       );
//       const data = await res.json();
//       if (data.result) {
//         message.success(data.message);
//       } else {
//         message.error("Failed to disconnect tool. Try again.");
//       }
//     }

//     setLoadingCheck(false);
//     setLoadingCreate(false);
//   };

//   // Disconnect handler
//   const handleDisconnect = async (action: TabAction) => {
//     const tool = TOOL_DB_MAP[action];
//     setDisconnecting(action);
//     try {
//       // Remove toolId from model.toolIds and update context
//       const toolIdToRemove = TOOL_ID_MAP[tool];
//       const previousToolsId: string[] = Array.isArray(voicebotDetails?.model?.toolIds)
//         ? [...voicebotDetails.model.toolIds]
//         : [];
//       const updatedToolIds = previousToolsId.filter((id) => id !== toolIdToRemove);
//       voiceBotContextData?.updateState?.("model.toolIds", updatedToolIds);

//       if (triggerPublishMethod) {
//         await triggerPublishMethod(true);
//       }

//       // Update database: set publish:false for this tool
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: false }) }
//       );
//       const data = await res.json();
//       if (data.result) {
//         await checkConnection();
//         message.success(data.message);
//       } else {
//         message.error("Failed to disconnect tool. Try again.");
//       }
//     } catch (e) {
//       message.error("Failed to disconnect tool. Try again.");
//     }
//     setDisconnecting(null);
//   };

//   useEffect(() => {
//     debugger;
//     async function _triggerFromParent() {
//       if (triggerPublishMethod) await triggerPublishMethod(true);
//     }
//     if (callPublishAssistant) {
//       if (
//         (Array.isArray(voicebotDetails?.model?.toolIds) &&
//           voicebotDetails.model.toolIds.length !== 2) ||
//         !("toolIds" in (voicebotDetails.model))
//       ) {
//         if (gcalStatus !== null && "tools" in gcalStatus) {
//           for (const elements of gcalStatus?.tools!) {
//             const previousToolsId = voicebotDetails.model.toolIds || [];
//             if (elements.tool == TOOL_DB_MAP.check && !elements.publish) {
//               previousToolsId.push("aa5dd6b5-e511-4400-ab5b-cdcff7279488");
//               voiceBotContextData?.updateState?.("model.toolIds", [
//                 ...previousToolsId
//               ]);
//               _triggerFromParent();
//               executeAfterToolPublish(TOOL_DB_MAP.check, true);
//               // checkConnection();
//             }
//             else if (elements.tool == TOOL_DB_MAP.create && !elements.publish) {
//               previousToolsId.push("b29826a9-3941-498e-b6e7-3d083bb42bf0");
//               voiceBotContextData?.updateState?.("model.toolIds", [
//                 ...previousToolsId
//               ]);
//               _triggerFromParent();
//               executeAfterToolPublish(TOOL_DB_MAP.create, true);
//               // checkConnection();
//             }
//           }
//         }
//       }
//       setCallPublishAssistant(false);
//     }
//   // eslint-disable-next-line
//   }, [callPublishAssistant]);

//   async function executeAfterToolPublish(tool: string, publishValue: boolean) {
//     debugger;
//     const res = await fetch(
//       `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//       { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: publishValue }) }
//     );
//     const responseData = await res.json();
//     console.log("executeAfterToolPublish your response data ", responseData);
//   }

//   const openConsentWindow = (tool: string) => {
//     if (!assistantId || !(userId ?? cookies.userId)) {
//       message.error(
//         "Invalid Request, User and Assistant should be verified!",
//         3
//       );
//       return;
//     }
//     const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`;
//     const width = 500,
//       height = 600;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;
//     const popup = window.open(
//       authUrl,
//       "google_oauth",
//       `width=${width},height=${height},left=${left},top=${top}`
//     );
//     setPopupRef(popup);
//   };

//   useEffect(() => {
//     if (!popupRef) return;
//     const poll = setInterval(() => {
//       if (popupRef.closed) {
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//         setPopupRef(null);
//         message.warning(
//           "You haven’t connected your Google Calendar yet. Please verify your account to activate Google Calendar features."
//         );
//         clearInterval(poll);
//       }
//     }, 500);
//     return () => clearInterval(poll);
//   }, [popupRef]);

//   useEffect(() => {
//     const onMessage = async (event: MessageEvent) => {
//       if (
//         event.data === "google-oauth-success" ||
//         event.data === "google-oauth-error"
//       ) {
//         setPopupRef(null); // close polling
//         if (assistantPublished && userVerified) await checkConnection();
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//       }
//     };
//     window.addEventListener("message", onMessage);
//     return () => window.removeEventListener("message", onMessage);
//   // eslint-disable-next-line
//   }, [userId, assistantId, assistantPublished, userVerified]);

//   // UI rendering
//   const renderToolCard = (
//     action: TabAction,
//     title: string,
//     loading: boolean
//   ) => {
//     // FIX: Check for both tool name and publish: true
//     const isConnected = connectedTools.some(
//       x => x.tool === TOOL_DB_MAP[action] && x.publish
//     );
//     return (
//       <div className="gcal-tool-card">
//         <div className="title-wrapper">
//           <div className="gcal-tool-title">{title}</div>
//           {isConnected && (
//             <Button
//               className="gcal-disconnect-btn"
//               type="text"
//               size="small"
//               danger
//               loading={disconnecting === action}
//               onClick={() => handleDisconnect(action)}
//             >
//               Disconnect
//             </Button>
//           )}
//         </div>

//         <div className="gcal-tool-label">{TOOL_LABEL_MAP[action]}</div>
//         {loading ? (
//           <div className="gcal-tool-loading">
//             <Spin size="small" />
//           </div>
//         ) : !isConnected ? (
//           <Button
//             className="gcal-connect-btn"
//             style={{ width: "100%" }}
//             size="large"
//             onClick={() => handleConnect(action)}
//           >
//             Connect to Google Calendar
//           </Button>
//         ) : (
//           <div className="gcal-connected-box">
//             <div className="gcal-connected-pill">
//               {gcalStatus?.name
//                 ? `${gcalStatus.name}'s Google Calendar connected`
//                 : "Google Calendar Connected"}
//             </div>
//             {gcalStatus?.email && (
//               <div className="gcal-connected-email">
//                 Authorized as: {gcalStatus.email}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   // --- UPDATED NOTE CARD STARTS HERE ---
//   const renderNoteCard = () => (
//     <div className="gcal-note-card">
//       <div className="gcal-note-title">How does Google Calendar integration work?</div>
//       <ol style={{ marginBottom: 8 }}>
//         <li style={{ marginBottom: 8 }}>
//           <b>Connect your Google Calendar for <span style={{ color: '#3863f7' }}>each tool separately</span>:</b><br />
//           - Click <b>Connect to Google Calendar</b> under <b>Check availability</b>.<br />
//           - Click <b>Connect to Google Calendar</b> under <b>Create event</b>.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>Both connections are required for full functionality.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Check if your time slot is free:</b><br />
//           - Add <code>google_calendar_check_availability_tool</code> in your system prompt.<br />
//           - The assistant first checks your calendar for availability.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>If busy, you’ll get suggestions for other slots.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Book your appointment:</b><br />
//           - Add <code>google_calendar_tool_event_create</code> in your system prompt.<br />
//           - Once you confirm a free slot, the assistant books it in your calendar.<br />
//         </li>
//       </ol>
//       <div style={{
//         background: '#f5f8ff', border: '1.5px solid #dde3f7', borderRadius: 8,
//         padding: '14px 18px', marginTop: 12, width: '100%', color: '#4956a4', fontSize: 15
//       }}>
//         <b>Tip:</b> Always connect both tools and check availability before booking.
//         <span style={{ color: '#276ef1', fontWeight: 500 }}> No event will be created unless both tools are connected and the slot is confirmed.</span>
//       </div>
//       <div style={{ marginTop: 18, color: '#888db2', fontSize: 14 }}>
//         <b>Example:</b> <span style={{ color: '#222' }}>“Book me a dentist appointment for September 1st at 10am.”</span><br />
//         <span style={{ color: '#888db2' }}>Assistant: Checks availability → Confirms with you → Books the event if free.</span>
//       </div>
//     </div>
//   );
//   // --- UPDATED NOTE CARD ENDS HERE ---

//   const renderStatusAlert = () => {
//     if (!assistantPublished) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-published">
//           <div>
//             <Image
//               src={googleCalendarAPI}
//               alt="Google Calendar"
//               width={54}
//               height={54}
//               style={{ opacity: 0.55, marginBottom: 14 }}
//             />
//             <br />
//             You haven't published your assistant yet.
//             <br />
//             <span className="gcal-status-alert__highlight">
//               Please Publish it first to use Google Calendar features.
//             </span>
//           </div>
//         </div>
//       );
//     }
//     if (!userVerified) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-verified">
//           <Image
//             src={googleCalendarAPI}
//             alt="Google Calendar"
//             width={54}
//             height={54}
//             style={{ opacity: 0.55, marginBottom: 14 }}
//           />
//           <br />
//           You are not logged in.
//           <br />
//           <span className="gcal-status-alert__highlight">
//             Please Login to continue.
//           </span>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="gcal-main-layout">
//       <div className="gcal-tools-area">
//         {!assistantPublished || !userVerified ? (
//           renderStatusAlert()
//         ) : (
//           <>
//             <div className="gcal-tool-cards-row">
//               {renderToolCard("check", "Check availability", loadingCheck)}
//               {renderToolCard("create", "Create event", loadingCreate)}
//             </div>
//             {renderNoteCard()}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GCalendar;

// import React, { useState, useEffect, useContext } from "react";
// import { Button, Spin, message } from "antd";
// import { useCookies } from "react-cookie";
// import Image from "next/image";
// import googleCalendarAPI from "../../../../../../../public/Google_Calendar.png";
// import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
// import "./g-calendar.scss";

// interface GCalendarProps {
//   userId?: string;
//   assistantId?: string;
//   assistantPublished?: boolean;
//   triggerPublishMethod?: (value: boolean) => Promise<void>;
// }

// type TabAction = "check" | "create";

// interface GoogleConsentStatus {
//   connected: boolean;
//   email?: string;
//   name?: string;
//   tools?: ToolsType[];
// }

// type ToolsType = {
//   tool: string;
//   publish: boolean;
// };

// const TOOL_DB_MAP: Record<TabAction, string> = {
//   check: "check-availability",
//   create: "create-event",
// };

// const TOOL_LABEL_MAP: Record<TabAction, string> = {
//   check: "Tool name: google_calendar_check_availability_tool",
//   create: "Tool name: google_calendar_tool_event_create",
// };

// const TOOL_ID_MAP: Record<string, string> = {
//   "check-availability": "aa5dd6b5-e511-4400-ab5b-cdcff7279488",
//   "create-event": "b29826a9-3941-498e-b6e7-3d083bb42bf0",
// };

// const GCalendar: React.FC<GCalendarProps> = ({
//   userId,
//   assistantId,
//   assistantPublished,
//   triggerPublishMethod,
// }) => {
//   const [cookies] = useCookies(["userId"]);
//   const userVerified = !!(userId || cookies.userId);
//   const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
//   const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
//   const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
//   const [connectedTools, setConnectedTools] = useState<ToolsType[]>([]);
//   const [callPublishAssistant, setCallPublishAssistant] = useState<boolean>(false);
//   const [popupRef, setPopupRef] = useState<Window | null>(null);
//   const [disconnecting, setDisconnecting] = useState<TabAction | null>(null);

//   const voiceBotContextData: any = useContext(CreateVoiceBotContext);
//   const voicebotDetails = voiceBotContextData?.state ?? {};
//   console.log("assistant data from G-Calendar ",voicebotDetails);

//   useEffect(() => {
//     if (assistantPublished && userVerified) {
//       checkConnection();
//     }
//   // eslint-disable-next-line
//   }, [assistantPublished, userVerified, assistantId, userId]);

//   const checkConnection = async () => {
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     try {
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${userId ?? cookies.userId}`,
//         { cache: "no-store" }
//       );
//       const data = await res.json();
//       setGcalStatus({
//         connected: !!data.connected,
//         email: data.email,
//         name: data.name,
//         tools: data.tools || [],
//       });
//       setConnectedTools(data.tools || []);
//       if (data.connected) setCallPublishAssistant(true);
//     } catch {
//       setGcalStatus({ connected: false, tools: [] });
//       setConnectedTools([]);
//     }
//   };

// const handleConnect = async (action: TabAction) => {
//   const tool = TOOL_DB_MAP[action];
//   if (!assistantPublished || !userVerified) return;
//   if (action === "check") setLoadingCheck(true);
//   if (action === "create") setLoadingCreate(true);

//   if (!gcalStatus?.connected) {
//     openConsentWindow(tool);
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     return;
//   }

//   const toolObj = connectedTools.find(x => x.tool === tool);

//   if (!toolObj) {
//     // If not present, check if another tool is published
//     const anotherPublished = connectedTools.some(x => x.publish && x.tool !== tool);
//     if (anotherPublished) {
//       // Add this tool via API
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: true }) }
//       );
//       const data = await res.json();
//       if (data.result) {
//         message.success(data.message);
//         await checkConnection();
//       } else {
//         message.error(data.message || "Failed to connect tool. Try again.");
//       }
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     } else {
//       // Need OAuth
//       openConsentWindow(tool);
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     }
//   }

//   if (toolObj.publish) {
//     // Already connected
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     return;
//   }

//   // If tool exists with publish: false, reconnect via API if another tool is still published
//   const anotherPublished = connectedTools.some(x => x.publish && x.tool !== tool);
//   if (anotherPublished) {
//     const res = await fetch(
//       `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//       { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: true }) }
//     );
//     const data = await res.json();
//     if (data.result) {
//       message.success(data.message);
//       await checkConnection();
//     } else {
//       message.error(data.message || "Failed to reconnect tool. Try again.");
//     }
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     return;
//   } else {
//     // Need OAuth
//     openConsentWindow(tool);
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     return;
//   }
// };

// // ...rest of your component code...

//   // Disconnect handler
//   const handleDisconnect = async (action: TabAction) => {
//     const tool = TOOL_DB_MAP[action];
//     setDisconnecting(action);
//     try {
//       // Remove toolId from model.toolIds and update context
//       const toolIdToRemove = TOOL_ID_MAP[tool];
//       const previousToolsId: string[] = Array.isArray(voicebotDetails?.model?.toolIds)
//         ? [...voicebotDetails.model.toolIds]
//         : [];
//       const updatedToolIds = previousToolsId.filter((id) => id !== toolIdToRemove);
//       voiceBotContextData?.updateState?.("model.toolIds", updatedToolIds);

//       if (triggerPublishMethod) {
//         await triggerPublishMethod(true);
//       }

//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         {
//           method: "PUT",
//           body: JSON.stringify({ toolName: tool })
//         }
//       );
//       const data = await res.json();
//       if (data.result) {
//         await checkConnection();
//         message.success(data.message);
//       } else {
//         message.error("Failed to disconnect tool. Try again.");
//       }
//     } catch (e) {
//       message.error("Failed to disconnect tool. Try again.");
//     }
//     setDisconnecting(null);
//   };

//   useEffect(() => {
//     async function _triggerFromParent() {
//       if (triggerPublishMethod) await triggerPublishMethod(true);
//     }
//     if (callPublishAssistant) {
//       if (
//         (Array.isArray(voicebotDetails?.model?.toolIds) &&
//           voicebotDetails.model.toolIds.length !== 2) ||
//         !("toolIds" in (voicebotDetails.model))
//       ) {
//         if (gcalStatus !== null && "tools" in gcalStatus) {
//           for (const elements of gcalStatus?.tools!) {
//             const previousToolsId = voicebotDetails.model.toolIds || [];
//             if (elements.tool == TOOL_DB_MAP.check && !elements.publish) {
//               previousToolsId.push("aa5dd6b5-e511-4400-ab5b-cdcff7279488");
//               voiceBotContextData?.updateState?.("model.toolIds", [
//                 ...previousToolsId
//               ]);
//               _triggerFromParent();
//               executeAfterToolPublish(TOOL_DB_MAP.check, true);
//             }
//             else if (elements.tool == TOOL_DB_MAP.create && !elements.publish) {
//               previousToolsId.push("b29826a9-3941-498e-b6e7-3d083bb42bf0");
//               voiceBotContextData?.updateState?.("model.toolIds", [
//                 ...previousToolsId
//               ]);
//               _triggerFromParent();
//               executeAfterToolPublish(TOOL_DB_MAP.create, true);
//             }
//           }
//         }
//       }
//       setCallPublishAssistant(false);
//     }
//   // eslint-disable-next-line
//   }, [callPublishAssistant]);

//   async function executeAfterToolPublish(tool: string, publishValue: boolean) {
//     const res = await fetch(
//       `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//       { method: "PUT", body: JSON.stringify({ toolName: tool }) }
//     );
//     const responseData = await res.json();
//     console.log("executeAfterToolPublish your response data ", responseData);
//   }

//   const openConsentWindow = (tool: string) => {
//     if (!assistantId || !(userId ?? cookies.userId)) {
//       message.error(
//         "Invalid Request, User and Assistant should be verified!",
//         3
//       );
//       return;
//     }
//     const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`;
//     const width = 500,
//       height = 600;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;
//     const popup = window.open(
//       authUrl,
//       "google_oauth",
//       `width=${width},height=${height},left=${left},top=${top}`
//     );
//     setPopupRef(popup);
//   };

//   useEffect(() => {
//     if (!popupRef) return;
//     const poll = setInterval(() => {
//       if (popupRef.closed) {
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//         setPopupRef(null);
//         message.warning(
//           "You haven’t connected your Google Calendar yet. Please verify your account to activate Google Calendar features."
//         );
//         clearInterval(poll);
//       }
//     }, 500);
//     return () => clearInterval(poll);
//   }, [popupRef]);

//   useEffect(() => {
//     const onMessage = async (event: MessageEvent) => {
//       if (
//         event.data === "google-oauth-success" ||
//         event.data === "google-oauth-error"
//       ) {
//         setPopupRef(null); // close polling
//         if (assistantPublished && userVerified) await checkConnection();
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//       }
//     };
//     window.addEventListener("message", onMessage);
//     return () => window.removeEventListener("message", onMessage);
//   // eslint-disable-next-line
//   }, [userId, assistantId, assistantPublished, userVerified]);

//   // UI rendering
//   const renderToolCard = (
//     action: TabAction,
//     title: string,
//     loading: boolean
//   ) => {
//     // Check for both tool name and publish: true
//     const isConnected = connectedTools.some(
//       x => x.tool === TOOL_DB_MAP[action] && x.publish
//     );
//     return (
//       <div className="gcal-tool-card">
//         <div className="title-wrapper">
//           <div className="gcal-tool-title">{title}</div>
//           {isConnected && (
//             <Button
//               className="gcal-disconnect-btn"
//               type="text"
//               size="small"
//               danger
//               loading={disconnecting === action}
//               onClick={() => handleDisconnect(action)}
//             >
//               Disconnect
//             </Button>
//           )}
//         </div>

//         <div className="gcal-tool-label">{TOOL_LABEL_MAP[action]}</div>
//         {loading ? (
//           <div className="gcal-tool-loading">
//             <Spin size="small" />
//           </div>
//         ) : !isConnected ? (
//           <Button
//             className="gcal-connect-btn"
//             style={{ width: "100%" }}
//             size="large"
//             onClick={() => handleConnect(action)}
//           >
//             Connect to Google Calendar
//           </Button>
//         ) : (
//           <div className="gcal-connected-box">
//             <div className="gcal-connected-pill">
//               {gcalStatus?.name
//                 ? `${gcalStatus.name}'s Google Calendar connected`
//                 : "Google Calendar Connected"}
//             </div>
//             {gcalStatus?.email && (
//               <div className="gcal-connected-email">
//                 Authorized as: {gcalStatus.email}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   // --- UPDATED NOTE CARD STARTS HERE ---
//   const renderNoteCard = () => (
//     <div className="gcal-note-card">
//       <div className="gcal-note-title">How does Google Calendar integration work?</div>
//       <ol style={{ marginBottom: 8 }}>
//         <li style={{ marginBottom: 8 }}>
//           <b>Connect your Google Calendar for <span style={{ color: '#3863f7' }}>each tool separately</span>:</b><br />
//           - Click <b>Connect to Google Calendar</b> under <b>Check availability</b>.<br />
//           - Click <b>Connect to Google Calendar</b> under <b>Create event</b>.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>Both connections are required for full functionality.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Check if your time slot is free:</b><br />
//           - Add <code>google_calendar_check_availability_tool</code> in your system prompt.<br />
//           - The assistant first checks your calendar for availability.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>If busy, you’ll get suggestions for other slots.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Book your appointment:</b><br />
//           - Add <code>google_calendar_tool_event_create</code> in your system prompt.<br />
//           - Once you confirm a free slot, the assistant books it in your calendar.<br />
//         </li>
//       </ol>
//       <div style={{
//         background: '#f5f8ff', border: '1.5px solid #dde3f7', borderRadius: 8,
//         padding: '14px 18px', marginTop: 12, width: '100%', color: '#4956a4', fontSize: 15
//       }}>
//         <b>Tip:</b> Always connect both tools and check availability before booking.
//         <span style={{ color: '#276ef1', fontWeight: 500 }}> No event will be created unless both tools are connected and the slot is confirmed.</span>
//       </div>
//       <div style={{ marginTop: 18, color: '#888db2', fontSize: 14 }}>
//         <b>Example:</b> <span style={{ color: '#222' }}>“Book me a dentist appointment for September 1st at 10am.”</span><br />
//         <span style={{ color: '#888db2' }}>Assistant: Checks availability → Confirms with you → Books the event if free.</span>
//       </div>
//     </div>
//   );
//   // --- UPDATED NOTE CARD ENDS HERE ---

//   const renderStatusAlert = () => {
//     if (!assistantPublished) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-published">
//           <div>
//             <Image
//               src={googleCalendarAPI}
//               alt="Google Calendar"
//               width={54}
//               height={54}
//               style={{ opacity: 0.55, marginBottom: 14 }}
//             />
//             <br />
//             You haven't published your assistant yet.
//             <br />
//             <span className="gcal-status-alert__highlight">
//               Please Publish it first to use Google Calendar features.
//             </span>
//           </div>
//         </div>
//       );
//     }
//     if (!userVerified) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-verified">
//           <Image
//             src={googleCalendarAPI}
//             alt="Google Calendar"
//             width={54}
//             height={54}
//             style={{ opacity: 0.55, marginBottom: 14 }}
//           />
//           <br />
//           You are not logged in.
//           <br />
//           <span className="gcal-status-alert__highlight">
//             Please Login to continue.
//           </span>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="gcal-main-layout">
//       <div className="gcal-tools-area">
//         {!assistantPublished || !userVerified ? (
//           renderStatusAlert()
//         ) : (
//           <>
//             <div className="gcal-tool-cards-row">
//               {renderToolCard("check", "Check availability", loadingCheck)}
//               {renderToolCard("create", "Create event", loadingCreate)}
//             </div>
//             {renderNoteCard()}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GCalendar;

// import React, { useState, useEffect, useContext } from "react";
// import { Button, Spin, message } from "antd";
// import { useCookies } from "react-cookie";
// import Image from "next/image";
// import googleCalendarAPI from "../../../../../../../public/Google_Calendar.png";
// import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
// import "./g-calendar.scss";

// interface GCalendarProps {
//   userId?: string;
//   assistantId?: string;
//   assistantPublished?: boolean;
//   triggerPublishMethod?: (value: boolean) => Promise<void>;
// }

// type TabAction = "check" | "create";

// interface GoogleConsentStatus {
//   connected: boolean;
//   email?: string;
//   name?: string;
//   tools?: ToolsType[];
// }

// type ToolsType = {
//   tool: string;
//   publish: boolean;
// };

// const TOOL_DB_MAP: Record<TabAction, string> = {
//   check: "check-availability",
//   create: "create-event",
// };

// const TOOL_LABEL_MAP: Record<TabAction, string> = {
//   check: "Tool name: google_calendar_check_availability_tool",
//   create: "Tool name: google_calendar_tool_event_create",
// };

// const TOOL_ID_MAP: Record<string, string> = {
//   "check-availability": "aa5dd6b5-e511-4400-ab5b-cdcff7279488",
//   "create-event": "b29826a9-3941-498e-b6e7-3d083bb42bf0",
// };

// const GCalendar: React.FC<GCalendarProps> = ({
//   userId,
//   assistantId,
//   assistantPublished,
//   triggerPublishMethod,
// }) => {
//   const [cookies] = useCookies(["userId"]);
//   const userVerified = !!(userId || cookies.userId);
//   const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(null);
//   const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
//   const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
//   const [connectedTools, setConnectedTools] = useState<ToolsType[]>([]);
//   const [popupRef, setPopupRef] = useState<Window | null>(null);
//   const [disconnecting, setDisconnecting] = useState<TabAction | null>(null);

//   const voiceBotContextData: any = useContext(CreateVoiceBotContext);
//   const voicebotDetails = voiceBotContextData?.state ?? {};
//   console.log("assistant details:",voicebotDetails);

//   // Helper to update model.toolIds in voicebotDetails context
//   const updateVoicebotToolIds = (tools: ToolsType[]) => {
//     // Only include ids for tools that are actually published (connected)
//     const publishedToolIds = tools
//       .filter(t => t.publish)
//       .map(t => TOOL_ID_MAP[t.tool]);
//     voiceBotContextData?.updateState?.("model.toolIds", publishedToolIds);
//   };

//   useEffect(() => {
//     if (assistantPublished && userVerified) {
//       checkConnection();
//     }
//     // eslint-disable-next-line
//   }, [assistantPublished, userVerified, assistantId, userId]);

//   const checkConnection = async () => {
//     setLoadingCheck(false);
//     setLoadingCreate(false);
//     try {
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${userId ?? cookies.userId}`,
//         { cache: "no-store" }
//       );
//       const data = await res.json();
//       setGcalStatus({
//         connected: !!data.connected,
//         email: data.email,
//         name: data.name,
//         tools: data.tools || [],
//       });
//       setConnectedTools(data.tools || []);
//       updateVoicebotToolIds(data.tools || []);
//     } catch {
//       setGcalStatus({ connected: false, tools: [] });
//       setConnectedTools([]);
//       updateVoicebotToolIds([]);
//     }
//   };

//   const handleConnect = async (action: TabAction) => {
//     const tool = TOOL_DB_MAP[action];
//     if (!assistantPublished || !userVerified) return;
//     if (action === "check") setLoadingCheck(true);
//     if (action === "create") setLoadingCreate(true);

//     if (!gcalStatus?.connected) {
//       openConsentWindow(tool);
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     }

//     const toolObj = connectedTools.find(x => x.tool === tool);

//     if (!toolObj) {
//       const anotherPublished = connectedTools.some(x => x.publish && x.tool !== tool);
//       if (anotherPublished) {
//         // Add tool via API
//         const res = await fetch(
//           `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//           { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: true }) }
//         );
//         const data = await res.json();
//         if (data.result) {
//           await checkConnection();
//           message.success(data.message);
//         } else {
//           message.error(data.message || "Failed to connect tool. Try again.");
//         }
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//         return;
//       } else {
//         openConsentWindow(tool);
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//         return;
//       }
//     }

//     if (toolObj.publish) {
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     }

//     const anotherPublished = connectedTools.some(x => x.publish && x.tool !== tool);
//     if (anotherPublished) {
//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         { method: "PUT", body: JSON.stringify({ toolName: tool, publishValue: true }) }
//       );
//       const data = await res.json();
//       if (data.result) {
//         await checkConnection();
//         message.success(data.message);
//       } else {
//         message.error(data.message || "Failed to reconnect tool. Try again.");
//       }
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     } else {
//       openConsentWindow(tool);
//       setLoadingCheck(false);
//       setLoadingCreate(false);
//       return;
//     }
//   };

//   const handleDisconnect = async (action: TabAction) => {
//     const tool = TOOL_DB_MAP[action];
//     setDisconnecting(action);
//     try {
//       if (triggerPublishMethod) {
//         await triggerPublishMethod(true);
//       }

//       const res = await fetch(
//         `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`,
//         {
//           method: "PUT",
//           body: JSON.stringify({ toolName: tool, publishValue: false })
//         }
//       );
//       const data = await res.json();
//       if (data.result) {
//         await checkConnection();
//         message.success(data.message);
//       } else {
//         message.error("Failed to disconnect tool. Try again.");
//       }
//     } catch (e) {
//       message.error("Failed to disconnect tool. Try again.");
//     }
//     setDisconnecting(null);
//   };

//   const openConsentWindow = (tool: string) => {
//     if (!assistantId || !(userId ?? cookies.userId)) {
//       message.error(
//         "Invalid Request, User and Assistant should be verified!",
//         3
//       );
//       return;
//     }
//     const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${userId ?? cookies.userId}&tool=${tool}`;
//     const width = 500, height = 600;
//     const left = window.screenX + (window.outerWidth - width) / 2;
//     const top = window.screenY + (window.outerHeight - height) / 2;
//     const popup = window.open(
//       authUrl,
//       "google_oauth",
//       `width=${width},height=${height},left=${left},top=${top}`
//     );
//     setPopupRef(popup);
//   };

//   useEffect(() => {
//     if (!popupRef) return;
//     const poll = setInterval(() => {
//       if (popupRef.closed) {
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//         setPopupRef(null);
//         message.warning(
//           "You haven’t connected your Google Calendar yet. Please verify your account to activate Google Calendar features."
//         );
//         clearInterval(poll);
//       }
//     }, 500);
//     return () => clearInterval(poll);
//   }, [popupRef]);

//   useEffect(() => {
//     const onMessage = async (event: MessageEvent) => {
//       if (
//         event.data === "google-oauth-success" ||
//         event.data === "google-oauth-error"
//       ) {
//         setPopupRef(null);
//         if (assistantPublished && userVerified) await checkConnection();
//         setLoadingCheck(false);
//         setLoadingCreate(false);
//       }
//     };
//     window.addEventListener("message", onMessage);
//     return () => window.removeEventListener("message", onMessage);
//     // eslint-disable-next-line
//   }, [userId, assistantId, assistantPublished, userVerified]);

//   // UI rendering
//   const renderToolCard = (
//     action: TabAction,
//     title: string,
//     loading: boolean
//   ) => {
//     const isConnected = connectedTools.some(
//       x => x.tool === TOOL_DB_MAP[action] && x.publish
//     );
//     return (
//       <div className="gcal-tool-card">
//         <div className="title-wrapper">
//           <div className="gcal-tool-title">{title}</div>
//           {isConnected && (
//             <Button
//               className="gcal-disconnect-btn"
//               type="text"
//               size="small"
//               danger
//               loading={disconnecting === action}
//               onClick={() => handleDisconnect(action)}
//             >
//               Disconnect
//             </Button>
//           )}
//         </div>
//         <div className="gcal-tool-label">{TOOL_LABEL_MAP[action]}</div>
//         {loading ? (
//           <div className="gcal-tool-loading">
//             <Spin size="small" />
//           </div>
//         ) : !isConnected ? (
//           <Button
//             className="gcal-connect-btn"
//             style={{ width: "100%" }}
//             size="large"
//             onClick={() => handleConnect(action)}
//           >
//             Connect to Google Calendar
//           </Button>
//         ) : (
//           <div className="gcal-connected-box">
//             <div className="gcal-connected-pill">
//               {gcalStatus?.name
//                 ? `${gcalStatus.name}'s Google Calendar connected`
//                 : "Google Calendar Connected"}
//             </div>
//             {gcalStatus?.email && (
//               <div className="gcal-connected-email">
//                 Authorized as: {gcalStatus.email}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderNoteCard = () => (
//     <div className="gcal-note-card">
//       <div className="gcal-note-title">How does Google Calendar integration work?</div>
//       <ol style={{ marginBottom: 8 }}>
//         <li style={{ marginBottom: 8 }}>
//           <b>Connect your Google Calendar for <span style={{ color: '#3863f7' }}>each tool separately</span>:</b><br />
//           - Click <b>Connect to Google Calendar</b> under <b>Check availability</b>.<br />
//           - Click <b>Connect to Google Calendar</b> under <b>Create event</b>.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>Both connections are required for full functionality.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Check if your time slot is free:</b><br />
//           - Add <code>google_calendar_check_availability_tool</code> in your system prompt.<br />
//           - The assistant first checks your calendar for availability.<br />
//           <span style={{ color: '#7b7b9d', fontSize: 14 }}>If busy, you’ll get suggestions for other slots.</span>
//         </li>
//         <li style={{ marginBottom: 8 }}>
//           <b>Book your appointment:</b><br />
//           - Add <code>google_calendar_tool_event_create</code> in your system prompt.<br />
//           - Once you confirm a free slot, the assistant books it in your calendar.<br />
//         </li>
//       </ol>
//       <div style={{
//         background: '#f5f8ff', border: '1.5px solid #dde3f7', borderRadius: 8,
//         padding: '14px 18px', marginTop: 12, width: '100%', color: '#4956a4', fontSize: 15
//       }}>
//         <b>Tip:</b> Always connect both tools and check availability before booking.
//         <span style={{ color: '#276ef1', fontWeight: 500 }}> No event will be created unless both tools are connected and the slot is confirmed.</span>
//       </div>
//       <div style={{ marginTop: 18, color: '#888db2', fontSize: 14 }}>
//         <b>Example:</b> <span style={{ color: '#222' }}>“Book me a dentist appointment for September 1st at 10am.”</span><br />
//         <span style={{ color: '#888db2' }}>Assistant: Checks availability → Confirms with you → Books the event if free.</span>
//       </div>
//     </div>
//   );

//   const renderStatusAlert = () => {
//     if (!assistantPublished) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-published">
//           <div>
//             <Image
//               src={googleCalendarAPI}
//               alt="Google Calendar"
//               width={54}
//               height={54}
//               style={{ opacity: 0.55, marginBottom: 14 }}
//             />
//             <br />
//             You haven't published your assistant yet.
//             <br />
//             <span className="gcal-status-alert__highlight">
//               Please Publish it first to use Google Calendar features.
//             </span>
//           </div>
//         </div>
//       );
//     }
//     if (!userVerified) {
//       return (
//         <div className="gcal-status-alert gcal-status-alert--not-verified">
//           <Image
//             src={googleCalendarAPI}
//             alt="Google Calendar"
//             width={54}
//             height={54}
//             style={{ opacity: 0.55, marginBottom: 14 }}
//           />
//           <br />
//           You are not logged in.
//           <br />
//           <span className="gcal-status-alert__highlight">
//             Please Login to continue.
//           </span>
//         </div>
//       );
//     }
//     return null;
//   };

//   return (
//     <div className="gcal-main-layout">
//       <div className="gcal-tools-area">
//         {!assistantPublished || !userVerified ? (
//           renderStatusAlert()
//         ) : (
//           <>
//             <div className="gcal-tool-cards-row">
//               {renderToolCard("check", "Check availability", loadingCheck)}
//               {renderToolCard("create", "Create event", loadingCreate)}
//             </div>
//             {renderNoteCard()}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GCalendar;

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
  triggerPublishMethod?: (value: boolean) => Promise<void>;
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
  const [gcalStatus, setGcalStatus] = useState<GoogleConsentStatus | null>(
    null
  );
  const [loadingCheck, setLoadingCheck] = useState<boolean>(false);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const [connectedTools, setConnectedTools] = useState<ToolsType[]>([]);
  const [popupRef, setPopupRef] = useState<Window | null>(null);
  const [disconnecting, setDisconnecting] = useState<TabAction | null>(null);

  // Auto-publish state
  const [callPublishAssistant, setCallPublishAssistant] =
    useState<boolean>(false);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData?.state ?? {};
  console.log("voicebot details:",voicebotDetails);

  // Helper to update model.toolIds in voicebotDetails context
  const updateVoicebotToolIds = (tools: ToolsType[]) => {
    const publishedToolIds = tools
      .filter((t: ToolsType) => t.publish)
      .map((t: ToolsType) => TOOL_ID_MAP[t.tool]);
    voiceBotContextData?.updateState?.("model.toolIds", publishedToolIds);
  };

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
        `/voicebot/dashboard/api/google/status?assistantId=${assistantId}&userId=${
          userId ?? cookies.userId
        }`,
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
      updateVoicebotToolIds(data.tools || []);
      // If both tools are connected, trigger auto-publish
      if (
        data.connected &&
        Array.isArray(data.tools) &&
        (data.tools as ToolsType[]).filter((t: ToolsType) => t.publish)
          .length === 2
      ) {
        setCallPublishAssistant(true);
      }
    } catch {
      setGcalStatus({ connected: false, tools: [] });
      setConnectedTools([]);
      updateVoicebotToolIds([]);
    }
  };

  // --- AUTO PUBLISH EFFECT ---
  useEffect(() => {
    // Mark the effect function as async to use await inside
    async function autoPublishEffect() {
      async function _triggerFromParent() {
        if (triggerPublishMethod) await triggerPublishMethod(true);
      }
      async function executeAfterToolPublish(
        tool: string,
        publishValue: boolean
      ) {
        const res = await fetch(
          `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${
            userId ?? cookies.userId
          }&tool=${tool}`,
          {
            method: "PUT",
            body: JSON.stringify({ toolName: tool, publishValue }),
          }
        );
        await res.json();
      }
      if (
        callPublishAssistant &&
        assistantPublished &&
        Array.isArray(connectedTools) &&
        connectedTools.filter((t: ToolsType) => t.publish).length === 2
      ) {
        // Only update if both tools connected and context toolIds not yet full
        const modelToolIds = Array.isArray(voicebotDetails?.model?.toolIds)
          ? voicebotDetails.model.toolIds
          : [];
        if (modelToolIds.length !== 2) {
          for (const tool of connectedTools) {
            if (
              (tool.tool === TOOL_DB_MAP.check ||
                tool.tool === TOOL_DB_MAP.create) &&
              tool.publish
            ) {
              if (!modelToolIds.includes(TOOL_ID_MAP[tool.tool])) {
                const newToolIds = [...modelToolIds, TOOL_ID_MAP[tool.tool]];
                voiceBotContextData?.updateState?.("model.toolIds", newToolIds);
                await _triggerFromParent();
                await executeAfterToolPublish(tool.tool, true);
              }
            }
          }
        }
        setCallPublishAssistant(false);
      }
    }
    autoPublishEffect();
    // eslint-disable-next-line
  }, [callPublishAssistant]);

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

    const toolObj = connectedTools.find((x) => x.tool === tool);

    if (!toolObj) {
      const anotherPublished = connectedTools.some(
        (x) => x.publish && x.tool !== tool
      );
      if (anotherPublished) {
        const res = await fetch(
          `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${
            userId ?? cookies.userId
          }&tool=${tool}`,
          {
            method: "PUT",
            body: JSON.stringify({ toolName: tool, publishValue: true }),
          }
        );
        const data = await res.json();
        if (data.result) {
          await checkConnection();
          message.success(data.message);
        } else {
          message.error(data.message || "Failed to connect tool. Try again.");
        }
        setLoadingCheck(false);
        setLoadingCreate(false);
        return;
      } else {
        openConsentWindow(tool);
        setLoadingCheck(false);
        setLoadingCreate(false);
        return;
      }
    }

    if (toolObj.publish) {
      setLoadingCheck(false);
      setLoadingCreate(false);
      return;
    }

    const anotherPublished = connectedTools.some(
      (x) => x.publish && x.tool !== tool
    );
    if (anotherPublished) {
      const res = await fetch(
        `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${
          userId ?? cookies.userId
        }&tool=${tool}`,
        {
          method: "PUT",
          body: JSON.stringify({ toolName: tool, publishValue: true }),
        }
      );
      const data = await res.json();
      if (data.result) {
        await checkConnection();
        message.success(data.message);
      } else {
        message.error(data.message || "Failed to reconnect tool. Try again.");
      }
      setLoadingCheck(false);
      setLoadingCreate(false);
      return;
    } else {
      openConsentWindow(tool);
      setLoadingCheck(false);
      setLoadingCreate(false);
      return;
    }
  };

  const handleDisconnect = async (action: TabAction) => {
    const tool = TOOL_DB_MAP[action];
    setDisconnecting(action);
    try {
      const toolIdToRemove = TOOL_ID_MAP[tool];
      const previousToolsId: string[] = Array.isArray(
        voicebotDetails?.model?.toolIds
      )
        ? [...voicebotDetails.model.toolIds]
        : [];
      const updatedToolIds = previousToolsId.filter(
        (id) => id !== toolIdToRemove
      );
      voiceBotContextData?.updateState?.("model.toolIds", updatedToolIds);

      if (triggerPublishMethod) {
        await triggerPublishMethod(true);
      }

      const res = await fetch(
        `/voicebot/dashboard/api/google/calendar/tools?assistantId=${assistantId}&userId=${
          userId ?? cookies.userId
        }&tool=${tool}`,
        {
          method: "PUT",
          body: JSON.stringify({ toolName: tool, publishValue: false }),
        }
      );
      const data = await res.json();
      if (data.result) {
        await checkConnection();
        message.success(data.message);
      } else {
        message.error("Failed to disconnect tool. Try again.");
      }
    } catch (e) {
      message.error("Failed to disconnect tool. Try again.");
    }
    setDisconnecting(null);
  };

  const openConsentWindow = (tool: string) => {
    if (!assistantId || !(userId ?? cookies.userId)) {
      message.error(
        "Invalid Request, User and Assistant should be verified!",
        3
      );
      return;
    }
    const authUrl = `/voicebot/dashboard/api/google/calendar?assistantId=${assistantId}&userId=${
      userId ?? cookies.userId
    }&tool=${tool}`;
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
        setPopupRef(null);
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
    const isConnected = connectedTools.some(
      (x: ToolsType) => x.tool === TOOL_DB_MAP[action] && x.publish
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

  const renderNoteCard = () => (
    <div className="gcal-note-card">
      <div className="gcal-note-title">
        How does Google Calendar integration work?
      </div>
      <ol style={{ marginBottom: 8 }}>
        <li style={{ marginBottom: 8 }}>
          <b>
            Connect your Google Calendar for{" "}
            <span style={{ color: "#3863f7" }}>each tool separately</span>:
          </b>
          <br />- Click <b>Connect to Google Calendar</b> under{" "}
          <b>Check availability</b>.<br />- Click{" "}
          <b>Connect to Google Calendar</b> under <b>Create event</b>.<br />
          <span style={{ color: "#7b7b9d", fontSize: 14 }}>
            Both connections are required for full functionality.
          </span>
        </li>
        <li style={{ marginBottom: 8 }}>
          <b>Check if your time slot is free:</b>
          <br />- Add <code>google_calendar_check_availability_tool</code> in
          your system prompt.
          <br />
          - The assistant first checks your calendar for availability.
          <br />
          <span style={{ color: "#7b7b9d", fontSize: 14 }}>
            If busy, you’ll get suggestions for other slots.
          </span>
        </li>
        <li style={{ marginBottom: 8 }}>
          <b>Book your appointment:</b>
          <br />- Add <code>google_calendar_tool_event_create</code> in your
          system prompt.
          <br />
          - Once you confirm a free slot, the assistant books it in your
          calendar.
          <br />
        </li>
      </ol>
      <div
        style={{
          background: "#f5f8ff",
          border: "1.5px solid #dde3f7",
          borderRadius: 8,
          padding: "14px 18px",
          marginTop: 12,
          width: "100%",
          color: "#4956a4",
          fontSize: 15,
        }}
      >
        <b>Tip:</b> Always connect both tools and check availability before
        booking.
        <span style={{ color: "#276ef1", fontWeight: 500 }}>
          {" "}
          No event will be created unless both tools are connected and the slot
          is confirmed.
        </span>
      </div>
      <div style={{ marginTop: 18, color: "#888db2", fontSize: 14 }}>
        <b>Example:</b>{" "}
        <span style={{ color: "#222" }}>
          “Book me a dentist appointment for September 1st at 10am.”
        </span>
        <br />
        <span style={{ color: "#888db2" }}>
          Assistant: Checks availability → Confirms with you → Books the event
          if free.
        </span>
      </div>
    </div>
  );

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
