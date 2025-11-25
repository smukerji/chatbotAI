"use client";
import React, { useState, useContext } from "react";
import { Table, Button, Input, message, Pagination, Modal, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import "./evals.scss";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";

// Table item interface
interface EvalTableItem {
  key: string;
  name: string;
  description: string;
  evalTurns: number;
  totalTurns: number;
  createdAt: string;
}

// Static dummy data
const DUMMY_EVALS: EvalTableItem[] = [
  {
    key: "1",
    name: "Welcome",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "2",
    name: "Check out guidance",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "3",
    name: "Welcome",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 16, 2025 3:30 AM",
  },
  // Add more rows as needed for testing
];

// Add new interface for runs table
interface RunTableItem {
  key: string;
  evalName: string;
  assistantName: string;
  status: "Success" | "Failed";
  duration: string;
  totalTurns: number;
  evalTurns: number;
  runAt: string;
}

// Static dummy data for runs
const DUMMY_RUNS: RunTableItem[] = [
  {
    key: "1",
    evalName: "Welcome",
    assistantName: "Tifi",
    status: "Success",
    duration: "30s",
    totalTurns: 1,
    evalTurns: 1,
    runAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "2",
    evalName: "Check out guidance",
    assistantName: "Tifi",
    status: "Failed",
    duration: "30s",
    totalTurns: 1,
    evalTurns: 1,
    runAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "3",
    evalName: "Welcome",
    assistantName: "Tifi",
    status: "Failed",
    duration: "30s",
    totalTurns: 1,
    evalTurns: 1,
    runAt: "Nov 19, 2025 6:10 AM",
  },
  {
    key: "4",
    evalName: "Welcome",
    assistantName: "Tifi",
    status: "Success",
    duration: "30s",
    totalTurns: 1,
    evalTurns: 1,
    runAt: "Nov 17, 2025 4:45 AM",
  },
  // Add more runs data...
];

export default function Evals() {
  const router = useRouter();
  const contextData = useContext<any>(CreateVoiceBotContext); // Context for future use!
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<EvalTableItem | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState("gpt-4o");
  const [selectedRun, setSelectedRun] = useState<RunTableItem | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const pageSize = 2;

  // Assistant options
  const assistantOptions = [
    {
      value: "gpt-4o",
      label: "Vifi (GPT-4o)",
      icon: "/svgs/chat-gpt-icon.svg",
    },
    { value: "gpt-4", label: "GPT-4", icon: "/svgs/assistant.svg" },
    { value: "gemini-pro", label: "Gemini Pro", icon: "/svgs/assistant.svg" },
    { value: "claude-3", label: "Claude 3", icon: "/svgs/assistant.svg" },
  ];

  // Created table columns (existing)
  const createdColumns: ColumnsType<EvalTableItem> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Eval Turns",
      dataIndex: "evalTurns",
      key: "evalTurns",
      sorter: (a, b) => a.evalTurns - b.evalTurns,
    },
    {
      title: "Total Turns",
      dataIndex: "totalTurns",
      key: "totalTurns",
      sorter: (a, b) => a.totalTurns - b.totalTurns,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: EvalTableItem) => (
        <Button
          type="link"
          className="test-button"
          icon={
            <Image
              src="/svgs/play.svg"
              alt="Play"
              width={22}
              height={22}
              style={{ verticalAlign: "middle" }}
            />
          }
          onClick={() => {
            setSelectedEval(record);
            setIsModalOpen(true);
          }}
        >
          Test
        </Button>
      ),
    },
  ];

  // Runs table columns (new)
  const runsColumns: ColumnsType<RunTableItem> = [
    {
      title: "Eval Name",
      dataIndex: "evalName",
      key: "evalName",
      sorter: (a, b) => a.evalName.localeCompare(b.evalName),
    },
    {
      title: "Assistant Name",
      dataIndex: "assistantName",
      key: "assistantName",
      sorter: (a, b) => a.assistantName.localeCompare(b.assistantName),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`status-badge ${status.toLowerCase()}`}
          style={{
            color: status === "Success" ? "#4D72F5" : "#f00000",
            fontWeight: 500,
          }}
        >
          {status}
        </span>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Total Turns",
      dataIndex: "totalTurns",
      key: "totalTurns",
      // sorter: (a, b) => a.totalTurns - b.totalTurns,
    },
    {
      title: "Eval Turns",
      dataIndex: "evalTurns",
      key: "evalTurns",
      // sorter: (a, b) => a.evalTurns - b.evalTurns,
    },
    {
      title: "Run At",
      dataIndex: "runAt",
      key: "runAt",
      sorter: (a, b) =>
        new Date(a.runAt).getTime() - new Date(b.runAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: RunTableItem) => (
        <Button
          type="link"
          className="view-details-button"
          icon={
            <Image
              src="/svgs/blue-eye.svg"
              alt="View"
              width={18}
              height={18}
              style={{ verticalAlign: "middle" }}
            />
          }
          onClick={() => {
            setSelectedRun(record);
            setIsViewDetailsOpen(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const [evals] = useState<EvalTableItem[]>(DUMMY_EVALS);
  const [runs] = useState<RunTableItem[]>(DUMMY_RUNS);

  // Get current data and columns based on active tab
  const getCurrentData = () => {
    const sourceData = activeTab === "created" ? evals : runs;
    return sourceData.filter((d) => {
      if (activeTab === "created") {
        const item = d as EvalTableItem;
        return (
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase())
        );
      } else {
        const item = d as RunTableItem;
        return (
          item.evalName.toLowerCase().includes(search.toLowerCase()) ||
          item.assistantName.toLowerCase().includes(search.toLowerCase())
        );
      }
    });
  };

  const getCurrentColumns = (): ColumnsType<EvalTableItem | RunTableItem> => {
    if (activeTab === "created") {
      return createdColumns as ColumnsType<EvalTableItem | RunTableItem>;
    }
    return runsColumns as ColumnsType<EvalTableItem | RunTableItem>;
  };

  const filteredData = getCurrentData();

  // Paginate data manually
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  // Reset pagination when switching tabs
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="evals-content">
      <div className="evals-header">
        <div className="toggle-switcher">
          <button
            className={`toggle-btn ${activeTab === "created" ? "active" : ""}`}
            onClick={() => setActiveTab("created")}
          >
            Created
          </button>
          <button
            className={`toggle-btn ${activeTab === "runs" ? "active" : ""}`}
            onClick={() => setActiveTab("runs")}
          >
            Runs
          </button>
        </div>

        <Input
          placeholder="Search evaluations by name or description"
          prefix={
            <Image
              src="/svgs/search-normal.svg"
              alt="Search"
              width={18}
              height={18}
            />
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="evals-search"
          allowClear
        />
        <Button
          type="primary"
          className="create-eval-btn"
          onClick={() => {
            router.push("/voicebot/dashboard/evals/create-evaluation");
          }}
        >
          <span className="plus-icon">+</span> Create Evaluation
        </Button>
      </div>
      <Table
        columns={getCurrentColumns()}
        dataSource={paginatedData}
        rowSelection={activeTab === "created" ? rowSelection : undefined}
        pagination={false}
        className="evals-table"
        locale={{
          emptyText: `No ${activeTab} found for this assistant.`,
        }}
      />

      {/* Run Evaluation Modal */}
      {isModalOpen && (
        <div className="evals-modal-overlay">
          <div className="evals-modal">
            <div className="modal-header">
              <div>
                <h3>Run Evaluation</h3>
                <div className="modal-subtitle">
                  Select an assistant to run{" "}
                  <span className="eval-name">"{selectedEval?.name}"</span>
                </div>
              </div>
              <Image
                src="/svgs/close-circle.svg"
                width={18}
                height={18}
                alt="Close"
                className="close-button"
                onClick={() => setIsModalOpen(false)}
              />
            </div>

            <div className="modal-section">
              <div className="section-label" style={{ marginBottom: "5px" }}>
                Assistant
              </div>
              <Select
                value={selectedAssistant}
                onChange={setSelectedAssistant}
                className="assistant-select"
                suffixIcon={
                  <img
                    src="/svgs/arrow-down-black.svg"
                    alt="Arrow Down"
                    width={20}
                    height={20}
                  />
                }
                options={assistantOptions.map((option) => ({
                  value: option.value,
                  label: (
                    <div className="assistant-option">
                      <Image
                        src={option.icon}
                        alt="Assistant"
                        width={20}
                        height={20}
                      />
                      <span>{option.label}</span>
                    </div>
                  ),
                }))}
              />
            </div>

            <div
              className="modal-section model-section-down"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div className="section-label">Assistant Variables</div>
              <button className="add-button">+ Add</button>
            </div>

            <div className="modal-section">
              <div className="checkbox-option">
                <input type="checkbox" id="navigate-checkbox" defaultChecked />
                <label htmlFor="navigate-checkbox">
                  Navigate to runs page after completion
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="run-button">
                <Image
                  src="/svgs/play-white.svg"
                  alt="Run"
                  width={16}
                  height={16}
                />
                Run
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredData.length}
          onChange={setCurrentPage}
          showSizeChanger={false}
          className="evals-pagination"
        />
      </div>

      {/* View Details Modal */}
      {isViewDetailsOpen && selectedRun && (
        <div
          className="view-details-modal-overlay"
          onClick={() => setIsViewDetailsOpen(false)}
        >
          <div
            className="view-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="header-content">
                <h3>Eval Run Details</h3>
                <p className="modal-subtitle">
                  View the conversation transcript and evaluation results
                </p>
              </div>
              <div
                className="close-button"
                onClick={() => setIsViewDetailsOpen(false)}
              >
                ✕
              </div>
            </div>

            <div className="details-section">
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span
                  className={`status-badge ${selectedRun.status.toLowerCase()}`}
                >
                  {selectedRun.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration</span>
                <p className="detail-value">{selectedRun.duration}</p>
              </div>
              <div className="detail-row">
                <span className="detail-label">Started At</span>
                <p className="detail-value">{selectedRun.runAt}</p>
              </div>
            </div>

            <h4 className="conversation-section-heading">
              Conversation Transcript
            </h4>
            <div className="conversation-section">
              <div className="conversation-container">
                <div className="message user-message">
                  <p className="message-sender">User</p>
                  <p className="message-content">What's your name?</p>
                </div>
                <div className="message assistant-message">
                  <p className="message-sender">Assistant</p>
                  <p className="message-content">
                    I'm sorry, but based on the provided context, I don't have
                    the information to answer your question.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
