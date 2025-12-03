import React, { useContext, useState } from "react";
import { Button, Input, Select, Card, Typography, Form, message } from "antd";
import { LeftOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import "./CreateEvaluationForm.scss";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

const { TextArea } = Input;
const { Title } = Typography;

type TurnType = "system" | "user" | "assistant" | "tool-response";
type AssistantMode = "mock" | "evaluation";

interface CreateEvaluationFormProps {
  mode?: "create" | "edit";
  initialData?: any;
}
interface ToolArg {
  key: string;
  value: string;
}

interface ToolCall {
  name: string;
  args: Array<{ key: string; value: string }>;
}
interface CreateEvaluationFormProps {
  mode?: "create" | "edit";
  initialData?: any;
}

interface Turn {
  id: number;
  type: TurnType;
  content: string;
  mode?: AssistantMode;
  toolCalls?: ToolCall[];
  toolCallInput?: ToolCall | null;
}

type ProviderInfo = {
  id: string;
  label: string;
  models: { id: string; label: string }[];
};

export default function CreateEvaluationForm({
  mode = "create",
  initialData,
}: CreateEvaluationFormProps) {
  const [cookies] = useCookies(["userId"]);
  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const router = useRouter();

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
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loadingSystemPrompt, setLoadingSystemPrompt] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  // Add to your state in CreateEvaluationForm
  const [assistantVariables, setAssistantVariables] = useState<
    Array<{
      key: string;
      value: string;
    }>
  >([]);

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

  // sync once context loads
  useEffect(() => {
    if (voiceBotContextData?.assistantInfo?.assistantName) {
      setSelectedAssistant(voiceBotContextData?.assistantInfo?.assistantName);
    }
  }, [voiceBotContextData?.assistantInfo?.assistantName]);

  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("Loading initial data in edit mode:", initialData);

      setEvalName(initialData.name || "");
      setEvalDesc(initialData.description || "");
      setProvider(initialData.provider || "openai");
      setModel(initialData.model || "gpt-4o");

      // Transform messages to turns
      if (initialData.messages && Array.isArray(initialData.messages)) {
        const transformedTurns = initialData.messages.map((msg: any) => {
          const turn: Turn = {
            id: msg.id,
            type: msg.type,
            content: msg.content || "",
            mode: msg.mode,
            toolCalls: msg.toolCalls || [],
            toolCallInput: null,
          };
          return turn;
        });

        setTurns(transformedTurns);
        // Set next ID to be higher than the highest current ID
        const maxId = Math.max(...transformedTurns.map((t: any) => t.id), 0);
        setNextId(maxId + 1);
      }
    }
  }, [mode, initialData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/voicebot/dashboard/api/evals/models");
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to load models");
        }

        const list: ProviderInfo[] = data.providers || [];
        setProviders(list);

        if (list.length) {
          const first = list[0];
          setProvider(first.id);
          if (first.models.length) {
            setModel(first.models[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error loading models", err);
        message.error(err.message || "Failed to load models");
      }
    })();
  }, []);

  // Track if test has been run
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
      name: "",
      args: [{ key: "", value: "" }],
    };
    setTurns(newTurns);
  };

  const updateToolCallName = (turnIdx: number, name: string) => {
    const newTurns = [...turns];
    newTurns[turnIdx].toolCallInput = {
      ...newTurns[turnIdx].toolCallInput!,
      name: name,
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

    if (!input.name?.trim()) {
      message.error("Please enter a tool name");
      return;
    }

    // Initialize toolCalls array if it doesn't exist
    if (!newTurns[turnIdx].toolCalls) {
      newTurns[turnIdx].toolCalls = [];
    }

    // Create a new tool call object to avoid reference issues
    const newToolCall: ToolCall = {
      name: input.name.trim(),
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
      name: "",
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
        name: toolCall.name,
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
  //  Add function to fetch system prompt from VAPI assistant
  const fetchSystemPrompt = async (forceRefresh = false) => {
    if (!vapiAssistantId) {
      console.warn("No VAPI Assistant ID available");
      return;
    }

    try {
      setLoadingSystemPrompt(true);

      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : "";
      const response = await fetch(
        `/voicebot/dashboard/api/assistant/${vapiAssistantId}/system-prompt${cacheBuster}`,
        {
          method: "GET",

          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );

      const data = await response.json();

      if (response.ok && !data.error) {
        setSystemPrompt(data.systemPrompt || "");
        if (forceRefresh) {
          message.success("System prompt refreshed");
        }
      } else {
        console.error("Failed to fetch system prompt:", data.error);
        message.warning("Could not load system prompt from assistant");
      }
    } catch (error) {
      console.error("Error fetching system prompt:", error);
    } finally {
      setLoadingSystemPrompt(false);
    }
  };
  // Add useEffect to fetch system prompt when component loads or vapiAssistantId changes
  useEffect(() => {
    if (vapiAssistantId) {
      fetchSystemPrompt();
    }
  }, [vapiAssistantId]);

  // after submit the form it reset all feilds
  // Update your resetForm function
  const resetForm = () => {
    setEvalName("");
    setEvalDesc("");
    setProvider("");
    setModel("");
    setSelectedAssistant("");
    //  Re-fetch system prompt instead of clearing it
    if (vapiAssistantId) {
      fetchSystemPrompt(true);
    }
    //  Clear assistant variables
    setAssistantVariables([]);
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
  const changeTurnType = (turnIdx: number, newType: TurnType) => {
    const newTurns = [...turns];
    const currentTurn = newTurns[turnIdx];

    // Preserve the content and id, but reset type-specific properties
    newTurns[turnIdx] = {
      id: currentTurn.id,
      type: newType,
      content: currentTurn.content,
      mode: newType === "assistant" ? "mock" : undefined,
      toolCalls: newType === "assistant" ? [] : undefined,
      toolCallInput: undefined,
    };

    setTurns(newTurns);
    message.success(`Turn changed to ${newType}`);
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

      // Transform turns to the format expected by backend
const formattedTurns = turns.map((turn) => {
  const formattedTurn: any = {
    role: turn.type === "tool-response" ? "tool" : turn.type,
    message: turn.content,
  };

  // If assistant turn has tool calls (both mock and evaluation modes)
  if (
    turn.type === "assistant" &&
    turn.toolCalls &&
    turn.toolCalls.length > 0
  ) {
    formattedTurn.tool_calls = turn.toolCalls.map((toolCall) => {
      const argsObject: Record<string, string> = {};
      toolCall.args.forEach((arg) => {
        if (arg.key) {
          argsObject[arg.key] = arg.value;
        }
      });

      return {
        function: {
          name: toolCall.name,
          arguments: JSON.stringify(argsObject),
        },
      };
    });
  }

  return formattedTurn;
});
      const payload = {
        evalName,
        evalDesc,
        assistantMongoId,
        userId,
        vapiAssistantId,
        turns: formattedTurns,
      };

      console.log(
        "Frontend sending payload:",
        JSON.stringify(payload, null, 2)
      );

      // Determine endpoint and method based on mode
      const endpoint =
        mode === "edit" && initialData?.evalId
          ? `/voicebot/dashboard/api/evals/${initialData.evalId}`
          : "/voicebot/dashboard/api/evals";

      const method = mode === "edit" ? "PATCH" : "POST";

      const resp = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await resp.json();

      if (resp.ok && !result.error) {
        message.success(
          mode === "edit"
            ? "Evaluation updated successfully!"
            : "Evaluation created successfully!"
        );

        if (mode === "create") {
          resetForm();
        } else {
          sessionStorage.setItem("activeTab", "evals");
          // In edit mode, navigate back to evals list
          router.push("/voicebot/dashboard?interaction=voicebot&tab=evals");
        }
      } else {
        console.error("API Error Response:", result);
        throw new Error(
          result.error || result.message || `Failed to ${mode} evaluation`
        );
      }
    } catch (err: any) {
      console.error("Save Error:", err);
      message.error(
        err.message ||
          `Error ${mode === "edit" ? "updating" : "saving"} evaluation.`
      );
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

  const handleTestRun = async () => {
    // Validate required fields before testing
    if (!evalName.trim()) {
      message.error("Please enter an evaluation name before testing");
      return;
    }

    if (!vapiAssistantId) {
      message.error("Assistant not found. Please select an assistant first.");
      return;
    }

    // Check if there's at least one user and one assistant turn
    const hasUserTurn = turns.some(
      (t) => t.type === "user" && t.content.trim()
    );
    const hasAssistantTurn = turns.some((t) => t.type === "assistant");

    if (!hasUserTurn || !hasAssistantTurn) {
      message.warning("Please add at least one user and one assistant turn");
      return;
    }

    setTestResults((prev) => ({ ...prev, status: "loading" }));

    try {
      // Transform turns to the format expected by backend
      const formattedTurns = turns.map((turn) => {
        const formattedTurn: any = {
          role: turn.type === "tool-response" ? "tool" : turn.type,
        };

        // Check if this is an assistant evaluation turn with tool calls
        const isAssistantEvalWithTools =
          turn.type === "assistant" &&
          turn.mode === "evaluation" &&
          turn.toolCalls &&
          turn.toolCalls.length > 0;

        // Only add message if:
        // 1. It's NOT an assistant evaluation with tools, OR
        // 2. The content is not empty
        if (
          !isAssistantEvalWithTools ||
          (turn.content && turn.content.trim() !== "")
        ) {
          formattedTurn.message = turn.content;
        }

        // If assistant turn has tool calls, add them
        if (isAssistantEvalWithTools && turn.toolCalls) {
          formattedTurn.tool_calls = turn.toolCalls.map((toolCall) => {
            const argsObject: Record<string, string> = {};
            toolCall.args.forEach((arg) => {
              if (arg.key) {
                argsObject[arg.key] = arg.value;
              }
            });

            return {
              function: {
                name: toolCall.name,
                arguments: JSON.stringify(argsObject),
              },
            };
          });
        }

        return formattedTurn;
      });

      // Call the test API endpoint (doesn't save to database)
      const response = await fetch("/voicebot/dashboard/api/evals/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evalName,
          evalDesc,
          vapiAssistantId,
          turns: formattedTurns,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to run test");
      }

      // Use the conversation from the API response
      const conversation =
        result.conversation && result.conversation.length > 0
          ? result.conversation
          : [
              {
                role: "user" as const,
                content:
                  turns.find((t) => t.type === "user")?.content ||
                  "Test message",
              },
              {
                role: "assistant" as const,
                content:
                  turns.find((t) => t.type === "assistant")?.content ||
                  "I'm sorry, but based on the provided context, I don't have the information to answer your question.",
              },
            ];

      setTestResults({
        status: "success",
        conversation,
      });

      setHasRunTest(true);
      message.success("Test run completed!");
    } catch (error: any) {
      console.error("Test run error:", error);
      setTestResults((prev) => ({ ...prev, status: "error" }));
      message.error(error.message || "Test run failed");
    }
  };

  const currentProvider = providers.find((p) => p.id === provider);

  return (
    <>
      <div className="eval-header">
        <div className="eval-header-details">
          <Button
            type="text"
            icon={<LeftOutlined />}
            className="back-btn"
            onClick={() => {
              sessionStorage.setItem("activeTab", "evals");
              router.push("/voicebot/dashboard?interaction=voicebot&tab=evals");
            }}
          />

          <Title level={3} className="eval-title">
            {mode === "edit" ? "Edit Evaluation" : "Create Evaluation"}
          </Title>
        </div>
        <Button
          type="primary"
          className="save-btn-floating"
          onClick={handleSave}
        >
          {mode === "edit" ? "Update" : "Save"}
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
                      placeholder="Select provider"
                      value={provider || undefined}
                      onChange={(val) => {
                        setProvider(val);
                        const p = providers.find((x) => x.id === val);
                        if (p && p.models.length) {
                          setModel(p.models[0].id); // reset model when provider changes
                        } else {
                          setModel("");
                        }
                      }}
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
                      {providers.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {p.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Model" className="form-group half">
                    <Select
                      placeholder="Select model"
                      value={model || undefined}
                      onChange={(val: string) => setModel(val)}
                      disabled={!currentProvider}
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
                      {currentProvider?.models.map((m) => (
                        <Select.Option key={m.id} value={m.id}>
                          {m.label}
                        </Select.Option>
                      ))}
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
                      value={selectedAssistant || undefined}
                      onChange={(value) => setSelectedAssistant(value)}
                      style={{ width: "100%" }}
                      placeholder="Select assistant"
                    >
                      {voiceBotContextData?.assistantName && (
                        <Select.Option
                          value={
                            voiceBotContextData?.assistantInfo?.assistantName
                          }
                        >
                          {voiceBotContextData?.assistantInfo?.assistantName}
                        </Select.Option>
                      )}
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
                          <Form.Item className="form-group">
                            <TextArea
                              className="message-textarea system-prompt-readonly"
                              placeholder={
                                loadingSystemPrompt
                                  ? "Loading system prompt..."
                                  : "No system prompt configured"
                              }
                              rows={6}
                              value={systemPrompt}
                              readOnly
                              disabled={loadingSystemPrompt}
                              style={{
                                backgroundColor: "#f5f5f5",
                                cursor: "not-allowed",
                                color: "#262626",
                                resize: "vertical",
                              }}
                            />
                          </Form.Item>
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
                                  onChange={(value: TurnType) =>
                                    changeTurnType(index, value)
                                  }
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
                                  <Select.Option value="assistant">
                                    Assistant
                                  </Select.Option>
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
                                  onChange={(value: TurnType) =>
                                    changeTurnType(index, value)
                                  }
                                  suffixIcon={
                                    <img
                                      src="/svgs/arrow-down-eval.svg"
                                      alt="Arrow Down Blue"
                                      width={12}
                                      height={12}
                                    />
                                  }
                                >
                                  <Select.Option value="user">
                                    User
                                  </Select.Option>
                                  <Select.Option value="assistant">
                                    Assistant
                                  </Select.Option>
                                  <Select.Option value="tool-response">
                                    Tool Response
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
                            <>
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

                              {/* Tool Calls Section for Mock Mode */}
                              {!turn.toolCallInput && (
                                <div className="add-toolcall-row">
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginTop: "10px",
                                    }}
                                  >
                                    <div className="add-toolcall-row-second">
                                      Tool Calls
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
                                    value={turn.toolCallInput.name}
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
                                          {call.name || "No Tool Name"}
                                        </span>
                                        {call.args &&
                                          Object.keys(call.args).length > 0 && (
                                            <span className="toolcall-args">
                                              {Object.keys(call.args).length}{" "}
                                              arg
                                              {Object.keys(call.args).length !==
                                              1
                                                ? "s"
                                                : ""}
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
                            </>
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
                                    value={turn.toolCallInput.name}
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
                                          {call.name || "No Tool Name"}
                                        </span>
                                        {call.args &&
                                          Object.keys(call.args).length > 0 && (
                                            <span className="toolcall-args">
                                              {Object.keys(call.args).length}{" "}
                                              arg
                                              {Object.keys(call.args).length !==
                                              1
                                                ? "s"
                                                : ""}
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
                                  disabled={false} // Remove the disabled prop or set to false
                                  onChange={(value: TurnType) =>
                                    changeTurnType(index, value)
                                  }
                                  suffixIcon={
                                    <img
                                      src="/svgs/arrow-down-yellow.svg"
                                      alt="Arrow Down Blue"
                                      width={12}
                                      height={12}
                                    />
                                  }
                                >
                                  <Select.Option value="user">
                                    User
                                  </Select.Option>
                                  <Select.Option value="assistant">
                                    Assistant
                                  </Select.Option>
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
                {/* Variables List */}

                <div className="sidebar-section">
                  <div className="sidebar-row">
                    <span>Assistant Variables</span>
                    <button
                      type="button"
                      onClick={addVariable}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <img src="/svgs/add.svg" alt="Add" />
                    </button>
                  </div>
                  {/* Variables List */}
                  {assistantVariables.length > 0 && (
                    <div
                      className="variables-list"
                      style={{ marginTop: "12px" }}
                    >
                      {assistantVariables.map((variable, index) => (
                        <div
                          key={index}
                          className="variable-row"
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "8px",
                            alignItems: "center",
                          }}
                        >
                          <Input
                            placeholder="{{variable_name}}"
                            value={variable.key}
                            onChange={(e) =>
                              updateVariable(index, "key", e.target.value)
                            }
                            style={{ flex: 1 }}
                            size="small"
                          />
                          <Input
                            placeholder="Enter value"
                            value={variable.value}
                            onChange={(e) =>
                              updateVariable(index, "value", e.target.value)
                            }
                            style={{ flex: 1 }}
                            size="small"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariable(index)}
                            style={{
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <img
                              src="/svgs/trash.svg"
                              alt="Delete"
                              width={14}
                              height={14}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
