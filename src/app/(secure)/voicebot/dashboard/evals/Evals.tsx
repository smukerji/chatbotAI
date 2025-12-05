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
  const [assistantVariables, setAssistantVariables] = useState<
    Array<{
      key: string;
      value: string;
    }>
  >([]);

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
        const apiRuns = (data.runs || []).map((run: any) => {
          //  FIX: Check if ALL results passed, not just the first one
          const allPassed = Array.isArray(run.results) && 
                           run.results.length > 0 &&
                           run.results.every((r: any) => r.status === "pass");
          
          return {
            key: run.id || run.evalId || Math.random().toString(),
            evalName: evalMap[run.evalId]?.name || "Unknown",
            description: evalMap[run.evalId]?.description || "No description",
            assistantName:
              contextData?.assistantInfo?.assistantName || "Unknown",
            status: allPassed ? "Success" : "Failed", // Use the allPassed logic
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
          };
        });
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
    //  FIX: Check if ALL results passed
    const allPassed = Array.isArray(data.run.results) && 
                     data.run.results.length > 0 &&
                     data.run.results.every((r: any) => r.status === "pass");
    
    const transformedRun = {
      ...data.run,
      status: allPassed ? "Success" : "Failed", //Use the allPassed logic
    };
    setRunDetails(transformedRun);
  }
  setRunDetailsLoading(false);
};

  // Add handlers
  const addVariable = () => {
    setAssistantVariables([...assistantVariables, { key: "", value: "" }]);
  };

  const updateVariable = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newVars = [...assistantVariables];
    newVars[index][field] = value;
    setAssistantVariables(newVars);
  };

  const removeVariable = (index: number) => {
    setAssistantVariables(assistantVariables.filter((_, i) => i !== index));
  };

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

      //  Filter and format variables
      const validVariables = assistantVariables
        .filter((v) => v.key.trim() && v.value.trim())
        .reduce((acc, v) => {
          // Remove {{ }} if user added them
          const cleanKey = v.key.trim().replace(/^\{\{|\}\}$/g, "");
          acc[cleanKey] = v.value.trim();
          return acc;
        }, {} as Record<string, string>);

      const response = await fetch("/voicebot/dashboard/api/evals/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evalId: selectedEval.id,
          evalName: selectedEval.name,
          assistantId: vapiAssistantId,
          assistantMongoId: assistantMongoId,
          userId: userId,
          assistantVariables:
            Object.keys(validVariables).length > 0 ? validVariables : undefined, // ✅ Only send if not empty
        }),
      });

      const data = await response.json();

      if (response.ok && !data.error) {
        message.success("Evaluation run started successfully!");
        setIsModalOpen(false);

        //  Reset variables after successful run
        setAssistantVariables([]);

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
    return (sourceData as Array<any>).filter((d) => {
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

      {activeTab === "runs" && runsLoading ? (
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
                  <span className="eval-name">&quot;{selectedEval?.name}&quot;</span>
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
              <button
                className="add-button"
                onClick={() => {
                  setAssistantVariables([
                    ...assistantVariables,
                    { key: "", value: "" },
                  ]);
                }}
              >
                + Add
              </button>
            </div>
            {/* Variables List in Modal */}
            {assistantVariables.length > 0 && (
              <div className="modal-section" style={{ paddingTop: 0 }}>
                <div className="variables-list">
                  {assistantVariables.map((variable, index) => (
                    <div
                      key={index}
                      className="variable-row"
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginBottom: "12px",
                        alignItems: "center",
                      }}
                    >
                      <Input
                        placeholder="{{variable_name}}"
                        value={variable.key}
                        onChange={(e) => {
                          const newVars = [...assistantVariables];
                          newVars[index].key = e.target.value;
                          setAssistantVariables(newVars);
                        }}
                        style={{ flex: 1 }}
                        size="middle"
                      />
                      <Input
                        placeholder="Enter value"
                        value={variable.value}
                        onChange={(e) => {
                          const newVars = [...assistantVariables];
                          newVars[index].value = e.target.value;
                          setAssistantVariables(newVars);
                        }}
                        style={{ flex: 1 }}
                        size="middle"
                      />
                      <Button
                        danger
                        size="middle"
                        icon={
                          <Image
                            src="/svgs/trash.svg"
                            alt="Delete"
                            width={14}
                            height={14}
                          />
                        }
                        onClick={() => {
                          setAssistantVariables(
                            assistantVariables.filter((_, i) => i !== index)
                          );
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                const results = runDetails?.results || [];

                // Filter out messages with no content unless they have tool calls
                const filteredMessages = messages.filter((msg: any) => {
                  if (msg.content && msg.content.trim() !== "")
                    return true;
                  if (
                    msg.role === "assistant" &&
                    (msg.tool_calls || msg.toolCalls) &&
                    ((msg.tool_calls && msg.tool_calls.length > 0) ||
                      (msg.toolCalls && msg.toolCalls.length > 0))
                  ) {
                    return true;
                  }
                  return false;
                });

                if (filteredMessages.length === 0) {
                  return (
                    <div className="conversation-empty-state">
                      <div className="empty-badge user-badge">
                        <span>User</span>
                      </div>
                      <div className="empty-badge assistant-badge">
                        <span>Assistant</span>
                      </div>
                    </div>
                  );
                }

                //  Track which assistant message we're on for evaluation matching
                let assistantMessageIndex = 0;

                return filteredMessages.map((msg: any, i: number) => {
                  const hasToolCalls =
                    (msg.tool_calls && msg.tool_calls.length > 0) ||
                    (msg.toolCalls && msg.toolCalls.length > 0);
                  const isEmptyContent =
                    !msg.content || msg.content.trim() === "";

                  //  Get the evaluation result for THIS specific assistant message
                  let evalResult = null;
                  if (msg.role === "assistant") {
                    evalResult = results[assistantMessageIndex];
                    assistantMessageIndex++; // Increment for next assistant message
                  }

                  return (
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

                      {msg.role === "assistant" &&
                      hasToolCalls &&
                      isEmptyContent ? (
                        <p className="message-content tool-call-indicator">
                          Tool call initiated
                        </p>
                      ) : (
                        <p className="message-content">
                          {msg.content || ""}
                        </p>
                      )}

                      {/*  Show evaluation status ONLY for assistant messages that have an evaluation */}
                      {msg.role === "assistant" && evalResult && (
                        <div style={{ marginTop: "8px" }}>
                          <span
                            className={`status-badge ${
                              evalResult.status === "pass" ? "Success" : "Failed"
                            }`}
                            style={{
                              fontSize: "12px",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              display: "inline-block",
                              color: evalResult.status === "pass" ? "#4D72F5" : "#f00000",
                              fontWeight: 500,
                              backgroundColor: evalResult.status === "pass" ? "#f0f9ff" : "#fff1f0",
                            }}
                          >
                            {evalResult.status === "pass" ? "✓ Evaluation passed" : "✗ Evaluation failed"}
                          </span>
                          
                          {/*  Show failure reason if evaluation failed */}
                          {evalResult.status === "fail" && evalResult.reason && (
                            <div
                              style={{
                                marginTop: "6px",
                                padding: "8px 12px",
                                backgroundColor: "#fff1f0",
                                borderLeft: "3px solid #f00000",
                                borderRadius: "4px",
                                fontSize: "13px",
                                color: "#262626",
                              }}
                            >
                              <strong style={{ color: "#f00000" }}>Reason:</strong>{" "}
                              {evalResult.reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
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
                  <span className="eval-name">&quot;{itemToDelete?.name}&quot;</span>?
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
