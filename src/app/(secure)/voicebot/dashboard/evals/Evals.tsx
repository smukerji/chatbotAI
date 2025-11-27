"use client";
import React, { useState, useContext, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  message,
  Pagination,
  Modal,
  Select,
  Spin,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import "./evals.scss";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { redirect, useRouter } from "next/navigation";
import Image from "next/image";
import { useCookies } from "react-cookie";
import { useMemo } from "react";

// Table item interface
interface EvalTableItem {
  key: string;
  id: string;
  name: string;
  description: string;
  evalTurns: number;
  totalTurns: number;
  createdAt: string;
  type: string;
  messages: any[];
}

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

// const DUMMY_RUNS: RunTableItem[] = [
//   {
//     key: "1",
//     evalName: "Welcome",
//     assistantName: "Tifi",
//     status: "Success",
//     duration: "30s",
//     totalTurns: 1,
//     evalTurns: 1,
//     runAt: "Nov 14, 2025 1:42 AM",
//   },
//   {
//     key: "2",
//     evalName: "Check out guidance",
//     assistantName: "Tifi",
//     status: "Failed",
//     duration: "30s",
//     totalTurns: 1,
//     evalTurns: 1,
//     runAt: "Nov 14, 2025 1:42 AM",
//   },
// ];

export default function Evals() {
  const router = useRouter();
  const [cookies] = useCookies(["userId"]);
  const contextData = useContext<any>(CreateVoiceBotContext);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEval, setSelectedEval] = useState<EvalTableItem | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState("gpt-4o");
  const [selectedRun, setSelectedRun] = useState<RunTableItem | null>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  // State for API data
  const [evals, setEvals] = useState<EvalTableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<RunTableItem[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  //  State for running eval
  const [isRunning, setIsRunning] = useState(false);
  const [navigateToRuns, setNavigateToRuns] = useState(true);

  const [runDetails, setRunDetails] = useState<any>(null);
  const [runDetailsLoading, setRunDetailsLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [deleteType, setDeleteType] = useState<"eval" | "run">("eval");
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 10;

  // Get assistant and user IDs
  const assistantMongoId =
    contextData?.assistantMongoId || contextData?.assistantInfo?._id || "";
  const vapiAssistantId =
    contextData?.assistantVapiId ||
    contextData?.assistantInfo?.vapiAssistantId ||
    "";
  const userId = cookies.userId || "";

  // Fetch evals on component mount
  useEffect(() => {
    if (assistantMongoId && userId && activeTab === "created") {
      fetchEvals();
    }
  }, [assistantMongoId, userId, activeTab]);
  const evalMap = useMemo(() => {
    const map: Record<string, EvalTableItem> = {};
    evals.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [evals]);

  useEffect(() => {
    if (activeTab === "runs") {
      setRunsLoading(true);
      fetch(
        `/voicebot/dashboard/api/evals/runs?assistantId=${assistantMongoId}&userId=${userId}`
      )
        .then((res) => res.json())
        .then((data) => {
          const apiRuns = (data.runs || []).map((run: any) => ({
            key: run.id || run.evalId || Math.random().toString(),
            evalName: evalMap[run.evalId]?.name || "Unknown",
            description: evalMap[run.evalId]?.description || "No description",
            assistantName:
              contextData?.assistantInfo?.assistantName || "Unknown",
            status:
              Array.isArray(run.results) && run.results[0]?.status === "pass"
                ? "Success"
                : "Failed",
            duration:
              run.endedAt && run.startedAt
                ? `${Math.ceil(
                    (new Date(run.endedAt).getTime() -
                      new Date(run.startedAt).getTime()) /
                      1000
                  )}s`
                : "N/A",
            totalTurns: run.eval?.messages?.length || 0,
            evalTurns: run.results?.length || 0,
            runAt: run.startedAt
              ? new Date(run.startedAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "N/A",
          }));
          setRuns(apiRuns);
        })
        .catch(() => setRuns([]))
        .finally(() => setRunsLoading(false));
    }
  }, [activeTab, evalMap, assistantMongoId, userId]);

  //  Fetch evals from API
  const fetchEvals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/voicebot/dashboard/api/evals?assistantId=${assistantMongoId}&userId=${userId}`
      );

      const data = await response.json();

      if (response.ok && !data.error) {
        // Transform API data to match table format
        const transformedEvals: EvalTableItem[] = (data.evals || []).map(
          (evalItem: any) => ({
            key: evalItem.id,
            id: evalItem.id,
            name: evalItem.name || "Untitled",
            description: evalItem.description || "No description",
            evalTurns: evalItem.messages?.length || 0,
            totalTurns: evalItem.messages?.length || 0,
            createdAt: evalItem.localCreatedAt || evalItem.createdAt,
            type: evalItem.type,
            messages: evalItem.messages || [],
          })
        );

        setEvals(transformedEvals);
      } else {
        message.error(data.error || "Failed to fetch evaluations");
        setEvals([]);
      }
    } catch (error) {
      console.error("Error fetching evals:", error);
      message.error("Failed to fetch evaluations");
      setEvals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (record: RunTableItem) => {
    setSelectedRun(record);
    setIsViewDetailsOpen(true);
    setRunDetailsLoading(true);
    setRunDetails(null);

    const response = await fetch(
      `/voicebot/dashboard/api/evals/runs/${record.key}`
    );
    const data = await response.json();

    if (!response.ok || data.error) {
      message.error(data.error || "Failed to load run details");
      setRunDetails(null);
    } else {
      const transformedRun = {
        ...data.run,
        status:
          Array.isArray(data.run.results) &&
          data.run.results[0]?.status === "pass"
            ? "Success"
            : "Failed",
      };
      setRunDetails(transformedRun);
    }
    setRunDetailsLoading(false);
  };

  //  Handle Run Evaluation
  const handleRunEvaluation = async () => {
    if (!selectedEval) {
      message.error("No evaluation selected");
      return;
    }

    if (!vapiAssistantId) {
      message.error("Assistant not found. Please select an assistant first.");
      return;
    }

    try {
      setIsRunning(true);

      const response = await fetch("/voicebot/dashboard/api/evals/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evalId: selectedEval.id,
          assistantId: vapiAssistantId,
          assistantMongoId: assistantMongoId,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        message.success("Evaluation run started successfully!");

        // Close the modal
        setIsModalOpen(false);

        // If navigate to runs page is checked, switch to runs tab
        if (navigateToRuns) {
          setActiveTab("runs");
        }
      } else {
        message.error(data.error || "Failed to start evaluation run");
      }
    } catch (error) {
      console.error("Error running evaluation:", error);
      message.error("Failed to start evaluation run");
    } finally {
      setIsRunning(false);
    }
  };
  const handleDeleteEval = async (evalId: string, evalName: string) => {
    setDeleteType("eval");
    setItemToDelete({ id: evalId, name: evalName });
    setDeleteModalOpen(true);
  };

  /**
   * Handle delete run
   */
  const handleDeleteRun = async (runId: string, runName: string) => {
    setDeleteType("run");
    setItemToDelete({ id: runId, name: runName });
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete action
   */
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);

      if (deleteType === "eval") {
        // Delete evaluation
        const response = await fetch(
          `/voicebot/dashboard/api/evals/delete?evalId=${itemToDelete.id}&assistantId=${assistantMongoId}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();

        if (response.ok && !data.error) {
          message.success("Evaluation deleted successfully");
          // Refresh the evals list
          fetchEvals();
          // Clear selection if deleted item was selected
          setSelectedRowKeys((prev) =>
            prev.filter((key) => key !== itemToDelete.id)
          );
        } else {
          message.error(data.error || "Failed to delete evaluation");
        }
      } else {
        // Delete run
        const response = await fetch(
          `/voicebot/dashboard/api/evals/runs/delete?runId=${itemToDelete.id}&assistantId=${assistantMongoId}&userId=${userId}`,
          {
            method: "DELETE",
          }
        );

        const data = await response.json();
        console.log("data:", data);

        if (response.ok && !data.error) {
          message.success("Evaluation run deleted successfully");
          // Refresh the runs list by re-fetching
          setRuns((prev) => prev.filter((run) => run.key !== itemToDelete.id));
        } else {
          message.error(data.error || "Failed to delete evaluation run");
        }
      }

      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting:", error);
      message.error(
        `Failed to delete ${deleteType === "eval" ? "evaluation" : "run"}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  // table columns
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
      render: (date: string) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      },
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: EvalTableItem) => (
        <div style={{ display: "flex", gap: "8px" }}>
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
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEval(record);
              setIsModalOpen(true);
            }}
          >
            Test
          </Button>
          <Button
            type="link"
            danger
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteEval(record.id, record.name);
            }}
          >
            <img
              src="/svgs/trash.svg"
              alt="Delete"
              width={16}
              height={16}
              style={{ marginRight: "4px", verticalAlign: "middle" }}
            />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Runs table columns
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
        <div style={{ display: "flex", gap: "8px" }}>
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
            onClick={() => handleViewDetails(record)}
          >
            View Details
          </Button>
          <Button
            type="link"
            danger
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRun(record.key, record.evalName);
            }}
          >
            <img
              src="/svgs/trash.svg"
              alt="Delete"
              width={16}
              height={16}
              style={{ marginRight: "4px", verticalAlign: "middle" }}
            />
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
  useEffect(() => {
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

      {loading ? (
        <div
          className="loading-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Table
            columns={getCurrentColumns()}
            dataSource={paginatedData}
            loading={activeTab === "runs" ? runsLoading : loading}
            rowSelection={activeTab === "created" ? rowSelection : undefined}
            pagination={false}
            className="evals-table"
            locale={{
              emptyText:
                activeTab === "created" ? (
                  <div
                    style={{
                      padding: "60px 0",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#f5f7ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                      }}
                    ></div>
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: "#1f2933",
                        margin: 0,
                      }}
                    >
                      No evaluations yet
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        margin: 0,
                        maxWidth: 360,
                      }}
                    >
                      Create your first evaluation to start testing how your
                      assistant responds to real conversations.
                    </p>
                    <Button
                      type="primary"
                      style={{ marginTop: 12 }}
                      onClick={() =>
                        router.push(
                          "/voicebot/dashboard/evals/create-evaluation"
                        )
                      }
                    >
                      + Create your first evaluation
                    </Button>
                  </div>
                ) : (
                  `No ${activeTab} found for this assistant.`
                ),
            }}
            // Make rows clickable only on "created" tab
            onRow={(record) =>
              activeTab === "created" && "id" in record
                ? {
                    onClick: () => {
                      router.push(
                        `/voicebot/dashboard/evals/${
                          (record as EvalTableItem).id
                        }/edit`
                      );
                    },
                  }
                : {}
            }
          />

          {filteredData.length > 0 && (
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
          )}
        </>
      )}

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
              <div className="section-label">Assistant</div>
              <div className="assistant-display">
                <div className="assistant-info">
                  <Image
                    src="/svgs/user-octagon.svg"
                    alt="Assistant"
                    width={20}
                    height={20}
                  />
                  <span className="assistant-name">
                    {contextData?.assistantInfo?.assistantName ||
                      "No assistant selected"}
                  </span>
                </div>
              </div>
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
                <input
                  type="checkbox"
                  id="navigate-checkbox"
                  checked={navigateToRuns}
                  onChange={(e) => setNavigateToRuns(e.target.checked)}
                />
                <label htmlFor="navigate-checkbox">
                  Navigate to runs page after completion
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setIsModalOpen(false)}
                disabled={isRunning}
              >
                Cancel
              </button>
              <button
                className="run-button"
                onClick={handleRunEvaluation}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Spin size="small" style={{ marginRight: 8 }} />
                    Running...
                  </>
                ) : (
                  <>
                    <Image
                      src="/svgs/play-white.svg"
                      alt="Run"
                      width={16}
                      height={16}
                    />
                    Run
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewDetailsOpen && (
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

            {runDetailsLoading ? (
              <div
                style={{
                  minHeight: 120,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="small" />
              </div>
            ) : runDetails ? (
              <>
                <div className="details-section">
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${runDetails.status}`}>
                      {runDetails.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Duration</span>
                    <p className="detail-value">
                      {runDetails.endedAt && runDetails.startedAt
                        ? `${Math.ceil(
                            (new Date(runDetails.endedAt).getTime() -
                              new Date(runDetails.startedAt).getTime()) /
                              1000
                          )}s`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Started At</span>
                    <p className="detail-value">
                      {runDetails.startedAt
                        ? new Date(runDetails.startedAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <h4 className="conversation-section-heading">
                  Conversation Transcript
                </h4>
                <div className="conversation-section">
                  <div className="conversation-container">
                    {(() => {
                      const messages = runDetails?.results?.[0]?.messages || [];

                      if (!messages.length) {
                        return (
                          <div className="conversation-empty">
                            <div className="message user-message empty-badge">
                              <span className="message-sender">User</span>
                            </div>
                            <div className="message assistant-message empty-badge">
                              <span className="message-sender">Assistant</span>
                            </div>
                          </div>
                        );
                      }

                      // Normal transcript
                      return messages.map((msg: any, i: number) => (
                        <div
                          key={i}
                          className={`message ${
                            msg.role === "user"
                              ? "user-message"
                              : "assistant-message"
                          }`}
                        >
                          <p className="message-sender">
                            {msg.role === "user" ? "User" : "Assistant"}
                          </p>
                          <p className="message-content">{msg.content}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ minHeight: 120 }}>No data found.</div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="evals-modal-overlay">
          <div className="evals-modal delete-modal">
            <div className="modal-header">
              <div>
                <h3>Delete {deleteType === "eval" ? "Evaluation" : "Run"}?</h3>
                <div className="modal-subtitle">
                  Are you sure you want to delete{" "}
                  <span className="eval-name">"{itemToDelete?.name}"</span>?
                  This action cannot be undone.
                </div>
              </div>
              <Image
                src="/svgs/close-circle.svg"
                width={18}
                height={18}
                alt="Close"
                className="close-button"
                onClick={() => !isDeleting && setDeleteModalOpen(false)}
              />
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  border: "none",
                }}
              >
                {isDeleting ? (
                  <>
                    <Spin size="small" style={{ marginRight: 8 }} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Image
                      src="/svgs/trash-white.svg"
                      alt="Delete"
                      width={16}
                      height={16}
                    />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
