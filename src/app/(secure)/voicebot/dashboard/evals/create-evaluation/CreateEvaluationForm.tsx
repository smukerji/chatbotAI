import React, { useContext, useState } from "react";
import { Button, Input, Select, Card, Typography, Form, message } from "antd";
import { LeftOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import "./CreateEvaluationForm.scss";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";

const { TextArea } = Input;
const { Title } = Typography;

type TurnType = "system" | "user" | "assistant" | "tool-response";
type AssistantMode = "mock" | "evaluation";

interface ToolArg {
  key: string;
  value: string;
}

interface ToolCall {
  toolName: string;
  args: Array<{ key: string; value: string }>;
}

interface Turn {
  id: number;
  type: TurnType;
  content: string;
  mode?: AssistantMode;
  toolCalls?: ToolCall[];
  toolCallInput?: ToolCall | null;
}

export default function CreateEvaluationForm() {
  const [cookies] = useCookies(["userId"]);
  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const router = useRouter();

  // Unified fallback logic
  const assistantMongoId =
    voiceBotContextData?.assistantMongoId ||
    voiceBotContextData?.assistantInfo?._id ||
    "";

  const vapiAssistantId =
    voiceBotContextData?.assistantVapiId ||
    voiceBotContextData?.assistantInfo?.vapiAssistantId ||
    "";

  const userId = cookies.userId || "";
  const [activeToggle, setActiveToggle] = useState<"assistant" | "squad">(
    "assistant"
  );
  const [turns, setTurns] = useState<Turn[]>([
    { id: 1, type: "system", content: "" },
    { id: 2, type: "user", content: "" },
    { id: 3, type: "assistant", content: "", mode: "mock", toolCalls: [] },
  ]);
  const [nextId, setNextId] = useState(4);

  const [evalName, setEvalName] = useState("");
  const [evalDesc, setEvalDesc] = useState("");
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState("");

  const [approachMode, setApproachMode] = useState<string | undefined>(
    undefined
  );

  // Test results state
  const [testResults, setTestResults] = useState<{
    status: "idle" | "loading" | "success" | "error";
    conversation: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
  }>({
    status: "idle",
    conversation: [],
  });

  // Track if test has been run - NEW
  const [hasRunTest, setHasRunTest] = useState(false);

  const addTurn = (type: TurnType) => {
    setTurns([
      ...turns,
      {
        id: nextId,
        type,
        content: "",
        mode: type === "assistant" ? "mock" : undefined,
        toolCalls: type === "assistant" ? [] : undefined,
      },
    ]);
    setNextId(nextId + 1);
  };

  const removeTurn = (id: number) => {
    setTurns(turns.filter((turn) => turn.id !== id));
  };

  const setAssistantMode = (turnId: number, mode: AssistantMode) => {
    setTurns(
      turns.map((turn) => (turn.id === turnId ? { ...turn, mode } : turn))
    );
  };

  const getTurnNumber = (index: number) => {
    return turns.slice(0, index + 1).filter((t) => t.type !== "system").length;
  };

  // Tool call handlers
  const startToolCallInput = (turnIdx: number) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = {
      toolName: "",
      args: [{ key: "", value: "" }],
    };
    setTurns(newTurns);
  };

  const updateToolCallName = (turnIdx: number, name: string) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = {
      ...newTurns[turnIdx].toolCallInput!,
      toolName: name,
    };
    setTurns(newTurns);
  };

  const updateToolCallArg = (
    turnIdx: number,
    argIdx: number,
    field: "key" | "value",
    value: string
  ) => {
    const newTurns = [...turns];
    const toolCall = { ...newTurns[turnIdx].toolCallInput! };
    const newArgs = (toolCall.args || []).map((arg, i) =>
      i === argIdx ? { ...arg, [field]: value } : arg
    );
    toolCall.args = newArgs;
    newTurns[turnIdx].toolCallInput = toolCall;
    setTurns(newTurns);
  };

  const addToolCallArg = (turnIdx: number) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = {
      ...newTurns[turnIdx].toolCallInput!,
      args: [
        ...(newTurns[turnIdx].toolCallInput!.args || []),
        { key: "", value: "" },
      ],
    };
    setTurns(newTurns);
  };

  const removeToolCallArg = (turnIdx: number, argIdx: number) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = {
      ...newTurns[turnIdx].toolCallInput!,
      args: newTurns[turnIdx].toolCallInput!.args.filter(
        (_, i) => i !== argIdx
      ),
    };
    setTurns(newTurns);
  };

  const saveToolCall = (turnIdx: number) => {
    const newTurns = [...turns];
    const input = newTurns[turnIdx].toolCallInput;

    // Validate input
    if (!input) {
      console.error("No tool call input found");
      return;
    }

    if (!input.toolName?.trim()) {
      message.error("Please enter a tool name");
      return;
    }

    // Initialize toolCalls array if it doesn't exist
    if (!newTurns[turnIdx].toolCalls) {
      newTurns[turnIdx].toolCalls = [];
    }

    // Create a new tool call object to avoid reference issues
    const newToolCall: ToolCall = {
      toolName: input.toolName.trim(),
      args: (input.args || [])
        .filter((arg) => arg.key.trim() !== "") // Only keep args with non-empty keys
        .map((arg) => ({
          key: arg.key.trim(),
          value: arg.value,
        })),
    };

    // Add the new tool call
    newTurns[turnIdx].toolCalls = [
      ...(newTurns[turnIdx].toolCalls || []),
      newToolCall,
    ];

    // Reset the tool call input
    newTurns[turnIdx].toolCallInput = {
      toolName: "",
      args: [{ key: "", value: "" }],
    };

    // Update the state
    setTurns(newTurns);
    message.success("Tool call saved successfully!");
  };

  const editToolCall = (turnIdx: number, callIdx: number) => {
    const newTurns = [...turns];
    const toolCall = newTurns[turnIdx].toolCalls?.[callIdx];

    if (toolCall) {
      newTurns[turnIdx].toolCallInput = {
        toolName: toolCall.toolName,
        args:
          toolCall.args.length > 0
            ? [...toolCall.args]
            : [{ key: "", value: "" }],
      };
      // Remove the tool call being edited
      newTurns[turnIdx].toolCalls =
        newTurns[turnIdx].toolCalls?.filter((_, i) => i !== callIdx) || [];
      setTurns(newTurns);
    }
  };

  // after submit the form it reset all feilds
  const resetForm = () => {
    setEvalName("");
    setEvalDesc("");
    setProvider("");
    setModel("");
    setSelectedAssistant("");
    setTurns([
      { id: 1, type: "system", content: "" },
      { id: 2, type: "user", content: "" },
      { id: 3, type: "assistant", content: "", mode: "mock", toolCalls: [] },
    ]);
    setNextId(4);
    setActiveToggle("assistant");
    setTestResults({
      status: "idle",
      conversation: [],
    });
    setHasRunTest(false);
  };

  const handleSave = async () => {
    try {
      if (!evalName) {
        message.error("Evaluation name is required.");
        return;
      }

      if (!vapiAssistantId) {
        message.error(
          "VAPI Assistant ID is missing. Please select an assistant first."
        );
        return;
      }
      if (!userId) {
        message.error("User is not authenticated.");
        return;
      }
      if (!assistantMongoId) {
        message.error("Assistant not loaded.");
        return;
      }

      const resp = await fetch("/voicebot/dashboard/api/evals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evalName,
          evalDesc,
          assistantMongoId,
          userId,
          vapiAssistantId,
          turns,
        }),
      });

      const result = await resp.json();
      if (resp.ok && !result.error) {
        message.success("Evaluation created successfully!");
        // Optionally reset form/navigate
        // Reset all form fields after successful save
        resetForm();
      } else {
        throw new Error(result.error || "Failed to create evaluation");
      }
    } catch (err: any) {
      message.error(err.message || "Error saving evaluation.");
    }
  };

  const removeToolCall = (turnIdx: number, callIdx: number) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCalls =
      newTurns[turnIdx].toolCalls?.filter((_, i) => i !== callIdx) || [];
    setTurns(newTurns);
    message.success("Tool call removed");
  };

  const cancelToolCall = (turnIdx: number) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = null;
    setTurns(newTurns);
  };

  // UPDATED: Handle test runs
  const handleTestRun = async () => {
    setTestResults((prev) => ({ ...prev, status: "loading" }));

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Build mock conversation from your form data
      const mockConversation = [];

      // Get first user message
      const userTurn = turns.find((t) => t.type === "user");
      if (userTurn) {
        mockConversation.push({
          role: "user" as const,
          content: userTurn.content || "What's your name?",
        });
      }

      // Get first assistant message
      const assistantTurn = turns.find((t) => t.type === "assistant");
      if (assistantTurn) {
        mockConversation.push({
          role: "assistant" as const,
          content:
            assistantTurn.content ||
            "I'm sorry, but based on the provided context, I don't have the information to answer your question.",
        });
      }

      setTestResults({
        status: "success",
        conversation: mockConversation,
      });

      setHasRunTest(true);
      message.success("Test run completed!");
    } catch (error) {
      setTestResults((prev) => ({ ...prev, status: "error" }));
      message.error("Test run failed");
      console.error("Test run failed:", error);
    }
  };

  return (
    <>
      <div className="eval-header">
        <div className="eval-header-details">
          <Button
            type="text"
            icon={<LeftOutlined />}
            className="back-btn"
            onClick={() => router.back()}
          />
          <Title level={3} className="eval-title">
            Create Evaluation
          </Title>
        </div>
        <Button
          type="primary"
          className="save-btn-floating"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
      <div className="eval-main-layout">
        <div className="eval-content-wrapper">
          <Card className="eval-form-card" bordered={false}>
            <div className="form-content">
              <Form layout="vertical">
                <Form.Item label="Eval name" className="form-group">
                  <Input
                    placeholder="Enter evaluation name"
                    value={evalName}
                    onChange={(e) => setEvalName(e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="Description" className="form-group">
                  <Input
                    placeholder="Describe what this evaluation will test"
                    value={evalDesc}
                    onChange={(e) => setEvalDesc(e.target.value)}
                  />
                </Form.Item>

                <div className="section-title">Evaluator</div>

                <div className="row">
                  <Form.Item label="Provider" className="form-group half">
                    <Select
                      placeholder="Select tool"
                      // value={provider}
                      onChange={setProvider}
                      suffixIcon={
                        <img
                          src="/svgs/arrow-down-black.svg"
                          alt="Arrow Down"
                          width={24}
                          height={24}
                          style={{ marginTop: "10px" }}
                        />
                      }
                    >
                      <Select.Option value="openai">OpenAI</Select.Option>
                      <Select.Option value="azure">Azure</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Model" className="form-group half">
                    <Select
                      placeholder="Select model"
                      // value={model}
                      onChange={setModel}
                      suffixIcon={
                        <img
                          src="/svgs/arrow-down-black.svg"
                          alt="Arrow Down"
                          width={24}
                          height={24}
                          style={{ marginTop: "10px" }}
                        />
                      }
                    >
                      <Select.Option value="gpt-4o">GPT-4o</Select.Option>
                      <Select.Option value="llama-3">Llama 3</Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="section-title">Conversation Turns</div>

                <div className="conversation-section">
                  <div className="toggle-group">
                    <Button
                      type={
                        activeToggle === "assistant" ? "primary" : "default"
                      }
                      className={`toggle ${
                        activeToggle === "assistant" ? "active" : ""
                      }`}
                      onClick={() => setActiveToggle("assistant")}
                    >
                      Assistant
                    </Button>
                    <Button
                      type={activeToggle === "squad" ? "primary" : "default"}
                      className={`toggle ${
                        activeToggle === "squad" ? "active" : ""
                      }`}
                      onClick={() => setActiveToggle("squad")}
                    >
                      Squad
                    </Button>
                  </div>
                  <Form.Item className="form-group select-full">
                    <Select
                      placeholder="Select assistant"
                      // value={selectedAssistant}
                      onChange={setSelectedAssistant}
                      suffixIcon={
                        <img
                          src="/svgs/arrow-down-black.svg"
                          alt="Arrow Down"
                          width={24}
                          height={24}
                          style={{ marginTop: "10px" }}
                        />
                      }
                    >
                      <Select.Option value="viff">Viff (GPT-4o)</Select.Option>
                      <Select.Option value="other-ai">
                        Other AI model
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </div>

                <div className="turns-container">
                  {turns.map((turn, index) => {
                    const turnNumber = getTurnNumber(index);

                    // SYSTEM
                    if (turn.type === "system") {
                      return (
                        <Card
                          key={turn.id}
                          className="message-block system"
                          size="small"
                        >
                          <div className="message-header">
                            <div className="message-label">
                              <div className="role-dropdown-wrapper-system">
                                <img
                                  src="/svgs/code-circle.svg"
                                  alt="Code Circle Icon"
                                  width={16}
                                  height={16}
                                />
                                <span className="label-text">System</span>
                                <span className="badge">Read-only</span>
                              </div>
                            </div>
                          </div>
                          <TextArea
                            className="message-textarea"
                            placeholder="This is a blank template with minimal defaults, you can change the model, temperature, and messages."
                            rows={3}
                            value={turn.content}
                            onChange={(e) => {
                              const newTurns = [...turns];
                              newTurns[index].content = e.target.value;
                              setTurns(newTurns);
                            }}
                          />
                        </Card>
                      );
                    }

                    // USER
                    if (turn.type === "user") {
                      return (
                        <Card
                          key={turn.id}
                          className="message-block user"
                          size="small"
                        >
                          <div className="message-header">
                            <div className="message-label">
                              <div className="role-dropdown-wrapper">
                                <img
                                  className="user-icon"
                                  src="/svgs/user.svg"
                                  alt="User"
                                  width={16}
                                  height={16}
                                />
                                <Select
                                  value="user"
                                  className="role-select user-select"
                                  size="small"
                                  suffixIcon={
                                    <img
                                      src="/svgs/arrow-down-blue.svg"
                                      alt="Arrow Down Blue"
                                      width={12}
                                      height={12}
                                    />
                                  }
                                >
                                  <Select.Option value="user">
                                    User
                                  </Select.Option>
                                </Select>
                              </div>
                            </div>
                            <div className="message-actions">
                              <span className="turn-label">
                                Turn {turnNumber}
                              </span>
                              {/* <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => removeTurn(turn.id)}
                                className="icon-btn"
                              /> */}
                              <Image
                                src="/svgs/close-circle.svg"
                                width={20}
                                height={20}
                                alt="Close"
                                onClick={() => removeTurn(turn.id)}
                              />
                            </div>
                          </div>
                          <TextArea
                            className="message-textarea"
                            placeholder="User message content ..."
                            rows={3}
                            value={turn.content}
                            onChange={(e) => {
                              const newTurns = [...turns];
                              newTurns[index].content = e.target.value;
                              setTurns(newTurns);
                            }}
                          />
                        </Card>
                      );
                    }

                    // ASSISTANT
                    if (turn.type === "assistant") {
                      return (
                        <Card
                          key={turn.id}
                          className="message-block assistant"
                          size="small"
                        >
                          <div className="message-header">
                            <div className="message-label">
                              <div className="role-dropdown-wrapper-assistant">
                                <img
                                  src="/svgs/user-octagon.svg"
                                  alt="Assistant"
                                  width={16}
                                  height={16}
                                />
                                <Select
                                  value="assistant"
                                  className="role-select assistant-select"
                                  size="small"
                                  bordered={false}
                                  suffixIcon={
                                    <img
                                      src="/svgs/arrow-down-eval.svg"
                                      alt="Arrow Down Blue"
                                      width={12}
                                      height={12}
                                    />
                                  }
                                >
                                  <Select.Option value="assistant">
                                    Assistant
                                  </Select.Option>
                                </Select>
                              </div>

                              <div className="turn-mode-toggle">
                                <button
                                  type="button"
                                  className={`mode-btn${
                                    turn.mode === "mock" ? " active" : ""
                                  }`}
                                  onClick={() =>
                                    setAssistantMode(turn.id, "mock")
                                  }
                                >
                                  Mock
                                </button>
                                <button
                                  type="button"
                                  className={`mode-btn${
                                    turn.mode === "evaluation" ? " active" : ""
                                  }`}
                                  onClick={() =>
                                    setAssistantMode(turn.id, "evaluation")
                                  }
                                >
                                  Evaluation
                                </button>
                              </div>
                            </div>
                            {turn.mode !== "mock" && (
                              <div className="filter-dropdown">
                                <span className="label">Approach</span>
                                <div className="custom-select">
                                  <Select
                                    className="filter-select"
                                    placeholder="Select approach"
                                    // value={approachMode}
                                    onChange={setApproachMode}
                                    suffixIcon={null}
                                  >
                                    <Select.Option value="Exact">
                                      Exact
                                    </Select.Option>
                                    <Select.Option value="Broad">
                                      Broad
                                    </Select.Option>
                                  </Select>
                                </div>
                              </div>
                            )}
                            <div className="message-actions">
                              <span className="turn-label">
                                Turn {turnNumber}
                              </span>

                              {/* <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => removeTurn(turn.id)}
                                className="icon-btn"
                              /> */}
                              <Image
                                src="/svgs/close-circle.svg"
                                width={20}
                                height={20}
                                alt="Close"
                                onClick={() => removeTurn(turn.id)}
                              />
                            </div>
                          </div>

                          {turn.mode === "mock" ? (
                            <TextArea
                              className="message-textarea"
                              placeholder="Mock content"
                              rows={3}
                              value={turn.content}
                              onChange={(e) => {
                                const newTurns = [...turns];
                                newTurns[index].content = e.target.value;
                                setTurns(newTurns);
                              }}
                            />
                          ) : (
                            <div className="evaluation-section">
                              <TextArea
                                className="message-textarea"
                                placeholder="Enter exact content to match (case-insensitive)..."
                                rows={3}
                                value={turn.content}
                                onChange={(e) => {
                                  const newTurns = [...turns];
                                  newTurns[index].content = e.target.value;
                                  setTurns(newTurns);
                                }}
                              />
                              {!turn.toolCallInput && (
                                <div className="add-toolcall-row">
                                  <div className="add-toolcall-row-first">
                                    Assistant response must match this text
                                    exactly (case-insensitive)
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginTop: "10px",
                                    }}
                                  >
                                    <div className="add-toolcall-row-second">
                                      Expected Tool Calls
                                    </div>

                                    <button
                                      type="button"
                                      className="toolcall-btn"
                                      onClick={() => startToolCallInput(index)}
                                    >
                                      <PlusOutlined style={{ fontSize: 16 }} />{" "}
                                      Add Tool Call
                                    </button>
                                  </div>
                                </div>
                              )}

                              {turn.toolCallInput && (
                                <Card
                                  className="expected-toolcalls"
                                  size="small"
                                >
                                  <Input
                                    className="tool-call-input"
                                    placeholder="Tool name"
                                    value={turn.toolCallInput.toolName}
                                    onChange={(e) =>
                                      updateToolCallName(index, e.target.value)
                                    }
                                  />
                                  <div className="arguments-label">
                                    Arguments
                                  </div>
                                  <div className="toolcall-rows">
                                    {(turn.toolCallInput.args || []).map(
                                      (arg, idx2) => (
                                        <div
                                          className="toolcall-row"
                                          key={idx2}
                                        >
                                          <Input
                                            className="tool-call-arg"
                                            placeholder="Key"
                                            value={arg.key}
                                            onChange={(e) =>
                                              updateToolCallArg(
                                                index,
                                                idx2,
                                                "key",
                                                e.target.value
                                              )
                                            }
                                          />
                                          <Input
                                            className="tool-call-arg"
                                            placeholder="Value"
                                            value={arg.value}
                                            onChange={(e) =>
                                              updateToolCallArg(
                                                index,
                                                idx2,
                                                "value",
                                                e.target.value
                                              )
                                            }
                                          />
                                          <button
                                            className="delete-arg-btn"
                                            type="button"
                                            onClick={() =>
                                              removeToolCallArg(index, idx2)
                                            }
                                          >
                                            <img
                                              src="/svgs/trash.svg"
                                              alt="Tool Response"
                                              width={16}
                                              height={16}
                                            />
                                          </button>
                                        </div>
                                      )
                                    )}
                                    <button
                                      className="add-arg-btn toolcall-btn"
                                      type="button"
                                      onClick={() => addToolCallArg(index)}
                                    >
                                      <PlusOutlined style={{ fontSize: 13 }} />{" "}
                                      Add
                                    </button>
                                  </div>
                                  <div className="toolcall-footer">
                                    <Button
                                      className="action-btn secondary"
                                      onClick={() => cancelToolCall(index)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="primary"
                                      className="action-btn primary"
                                      onClick={() => saveToolCall(index)}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </Card>
                              )}

                              {turn.toolCalls && turn.toolCalls.length > 0 && (
                                <div className="saved-toolcalls-list">
                                  {turn.toolCalls.map((call, callIdx) => (
                                    <div
                                      className="toolcall-item"
                                      key={callIdx}
                                    >
                                      <div className="toolcall-content">
                                        <span className="toolcall-name">
                                          {call.toolName}
                                        </span>
                                        {call.args && call.args.length > 0 && (
                                          <span className="toolcall-args">
                                            {call.args.length} arg
                                            {call.args.length !== 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </div>
                                      <div className="toolcall-actions">
                                        <button
                                          className="toolcall-action-btn edit-btn"
                                          onClick={() =>
                                            editToolCall(index, callIdx)
                                          }
                                        >
                                          <img
                                            src="/svgs/edit-2.svg"
                                            alt="Edit"
                                            width={16}
                                            height={16}
                                          />
                                        </button>
                                        <button
                                          className="toolcall-action-btn delete-btn"
                                          onClick={() =>
                                            removeToolCall(index, callIdx)
                                          }
                                        >
                                          <img
                                            src="/svgs/trash.svg"
                                            alt="Delete"
                                            width={16}
                                            height={16}
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    }

                    // TOOL RESPONSE
                    if (turn.type === "tool-response") {
                      return (
                        <Card
                          key={turn.id}
                          className="message-block tool-response"
                          size="small"
                        >
                          <div className="message-header">
                            <div className="message-label">
                              <div className="role-dropdown-wrapper-tool-response">
                                <img
                                  src="/svgs/candle-2.svg"
                                  alt="Tool Response"
                                  width={16}
                                  height={16}
                                />
                                <Select
                                  value="tool-response"
                                  className="role-select tool-response-select"
                                  size="small"
                                  bordered={false}
                                  disabled
                                  suffixIcon={
                                    <img
                                      src="/svgs/arrow-down-yellow.svg"
                                      alt="Arrow Down Blue"
                                      width={12}
                                      height={12}
                                    />
                                  }
                                >
                                  <Select.Option value="tool-response">
                                    Tool Response
                                  </Select.Option>
                                </Select>
                              </div>
                            </div>
                            <div className="message-actions">
                              <span className="turn-label">
                                Turn {turnNumber}
                              </span>
                              {/* <Button
                                type="text"
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => removeTurn(turn.id)}
                                className="icon-btn"
                              /> */}
                              <Image
                                src="/svgs/close-circle.svg"
                                width={20}
                                height={20}
                                alt="Close"
                                onClick={() => removeTurn(turn.id)}
                              />
                            </div>
                          </div>
                          <TextArea
                            className="message-textarea"
                            placeholder="Tool message content ..."
                            rows={3}
                            value={turn.content}
                            onChange={(e) => {
                              const newTurns = [...turns];
                              newTurns[index].content = e.target.value;
                              setTurns(newTurns);
                            }}
                          />
                        </Card>
                      );
                    }

                    return null;
                  })}
                </div>

                <div className="button-row">
                  <Button
                    icon={
                      <img
                        src="/svgs/add.svg"
                        alt="Add"
                        style={{
                          width: 24,
                          height: 16,
                          verticalAlign: "middle",
                        }}
                      />
                    }
                    onClick={() => addTurn("user")}
                    className="action-btn"
                  >
                    Add User
                  </Button>
                  <Button
                    icon={
                      <img
                        src="/svgs/add.svg"
                        alt="Add"
                        style={{
                          width: 24,
                          height: 16,
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      />
                    }
                    onClick={() => addTurn("assistant")}
                    className="action-btn"
                  >
                    Add Assistant
                  </Button>
                  <Button
                    icon={
                      <img
                        src="/svgs/add.svg"
                        alt="Add"
                        style={{
                          width: 24,
                          height: 16,
                          verticalAlign: "middle",
                          textAlign: "center",
                        }}
                      />
                    }
                    onClick={() => addTurn("tool-response")}
                    className="action-btn"
                  >
                    Add Tool Response
                  </Button>
                </div>
              </Form>
            </div>
          </Card>

          {/* Sidebar with conditional button */}
          <div className="eval-sidebar">
            <Card title="Test runs" size="small" className="test-runs-card">
              <div className="sidebar-section">
                <div className="sidebar-row">
                  <span>Assistant Variables</span>
                  <img src="/svgs/add.svg" alt="Add" />
                </div>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-row">
                  <span>Result</span>
                  {!hasRunTest ? (
                    <Button
                      type="link"
                      size="small"
                      className="test-link"
                      onClick={handleTestRun}
                      loading={testResults.status === "loading"}
                    >
                      <img src="/svgs/play.svg" alt="Play" />
                      Test
                    </Button>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      className="test-link"
                      onClick={handleTestRun}
                      loading={testResults.status === "loading"}
                    >
                      <img src="/svgs/play.svg" alt="Play" />
                      Re-run
                    </Button>
                  )}
                </div>

                {testResults.status === "success" && hasRunTest && (
                  <div className="conversation-history">
                    {testResults.conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`message-bubble ${message.role}`}
                      >
                        <div className="message-role">
                          {message.role === "user" ? "User" : "Assistant"}
                        </div>
                        <div className="message-content">{message.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
