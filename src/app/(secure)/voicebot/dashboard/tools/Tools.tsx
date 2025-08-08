import React, { useState } from "react";
import Image from "next/image";
import GCalendar from "./google-calendar/GCalendar";
import "./Tools.scss"; // Import the sidebar styles

interface ToolsProps {
  userId: string;
  assistantId: string;
  assistantPublished: boolean;
  triggerPublishMethod: (fromKnowledge?: boolean) => Promise<void>;
}

const TOOL_LIST = [
  {
    key: "google-calendar",
    label: "Google Calendar",
    icon: "/Google_Calendar.png", // public path!
    component: GCalendar,
  },
  // Extendable: add more tools here
];

const Tools: React.FC<ToolsProps> = (props) => {
  const [selectedTool, setSelectedTool] = useState(TOOL_LIST[0].key);

  const renderSidebar = () => (
    <div className="tools-sidebar">
      {TOOL_LIST.map((tool) => (
        <button
          key={tool.key}
          className={
            "tools-sidebar-card" +
            (selectedTool === tool.key ? " tools-sidebar-card--selected" : "")
          }
          onClick={() => setSelectedTool(tool.key)}
          type="button"
        >
          <Image src={tool.icon} alt={tool.label} width={32} height={32} />
          <span className="tools-sidebar-label">{tool.label}</span>
        </button>
      ))}
    </div>
  );

  const renderRightPanel = () => {
    const ToolComponent = TOOL_LIST.find((t) => t.key === selectedTool)?.component;
    return ToolComponent ? <ToolComponent {...props} /> : null;
  };

  return (
    <div className="tools-main-layout">
      {renderSidebar()}
      <div className="tools-content">{renderRightPanel()}</div>
    </div>
  );
};

export default Tools;