import React, { useContext, useState } from "react";
import {
  Button,
  Input,
  Select,
  Card,
  Typography,
  Form,
  message,
  Modal,
} from "antd";
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
interface EvaluationApproach {
  type: "exact" | "regex" | "llm-as-a-judge";
  regexPattern?: string;
  passCriteria?: string;
  failCriteria?: string;
  includeContext?: boolean;
  customPrompt?: string;
  provider?: string;
  modelName?: string;
  model?: {
    provider: string;
    model: string;
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
}

interface Turn {
  id: number;
  type: TurnType;
  content: string;
  mode?: AssistantMode;
  toolCalls?: ToolCall[];
  toolCallInput?: ToolCall | null;
  evaluationApproach?: EvaluationApproach;
}

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
    {
      id: 3,
      type: "assistant",
      content: "",
      mode: "mock",
      toolCalls: [],
      evaluationApproach: { type: "exact" }, // Default
    },
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
    testPassed: boolean;
    conversation: Array<{
      role: "user" | "assistant";
      content: string;
      toolCalls?: any[];
      judge?: {
        status: "pass" | "fail";
        failureReason?: string;
      };
    }>;
  }>({
    status: "idle",
    testPassed: false,
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
      console.log("📝 Loading initial data in edit mode:", initialData);

      setEvalName(initialData.name || "");
      setEvalDesc(initialData.description || "");

      // FIX: Set provider and model FIRST before the models useEffect runs
      if (initialData.provider) {
        setProvider(initialData.provider);
        console.log("Set provider to:", initialData.provider);
      }
      if (initialData.model) {
        setModel(initialData.model);
        console.log("Set model to:", initialData.model);
      }

      // Transform messages to turns
      if (initialData.messages && Array.isArray(initialData.messages)) {
        console.log("📨 Processing messages:", initialData.messages);

        const transformedTurns = initialData.messages.map((msg: any) => {
          console.log("Processing message:", msg);

          return {
            id: msg.id,
            type: msg.type,
            content: msg.content || "",
            mode: msg.mode,
            toolCalls: msg.toolCalls || [],
            toolCallInput: null,
            evaluationApproach: msg.evaluationApproach,
          };
        });

        console.log("✓ Transformed turns:", transformedTurns);
        setTurns(transformedTurns);

        const maxId = Math.max(...transformedTurns.map((t: any) => t.id), 0);
        setNextId(maxId + 1);

        console.log("✓ Set nextId to:", maxId + 1);
      } else {
        console.error("❌ No messages array found or it's not an array");
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

        if (list.length && mode !== "edit") {
          const first = list[0];
          if (!provider) setProvider(first.id);
          if (!model && first.models.length) {
            setModel(first.models[0].id);
          }
        }
      } catch (err: any) {
        console.error("Error loading models", err);
        message.error(err.message || "Failed to load models");
      }
    })();
  }, []);

  // Add handler for approach change
  const handleApproachChange = (
    turnIdx: number,
    approachType: "exact" | "regex" | "llm-as-a-judge"
  ) => {
    const newTurns = [...turns];
    if (!newTurns[turnIdx].evaluationApproach) {
      newTurns[turnIdx].evaluationApproach = { type: approachType };
    } else {
      newTurns[turnIdx].evaluationApproach!.type = approachType;
    }

    // Set defaults based on approach type
    if (approachType === "llm-as-a-judge") {
      newTurns[turnIdx].evaluationApproach!.includeContext = true;
    }

    setTurns(newTurns);
  };

  // Add handler for LLM-as-a-judge fields
  const updateLLMJudgeField = (turnIdx: number, field: string, value: any) => {
    const newTurns = [...turns];
    if (!newTurns[turnIdx].evaluationApproach) {
      newTurns[turnIdx].evaluationApproach = { type: "llm-as-a-judge" };
    }
    (newTurns[turnIdx].evaluationApproach as any)[field] = value;
    setTurns(newTurns);
  };

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
      turns.map((turn) => {
        if (turn.id === turnId) {
          const updatedTurn = { ...turn, mode };

          // Initialize evaluationApproach when switching to evaluation mode
          if (mode === "evaluation" && !updatedTurn.evaluationApproach) {
            updatedTurn.evaluationApproach = { type: "exact" };
          }

          return updatedTurn;
        }
        return turn;
      })
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

    console.log("🔧 saveToolCall called for turnIdx:", turnIdx);
    console.log("🔧 Current input:", input);
    console.log("🔧 Current turn before save:", newTurns[turnIdx]);

    // Validate input
    if (!input) {
      console.error("No tool call input found");
      message.error("No tool call input found");
      return;
    }

    if (!input.name?.trim()) {
      console.error("Tool name is empty");
      message.error("Please enter a tool name");
      return;
    }

    // Initialize toolCalls array if it doesn't exist
    if (!newTurns[turnIdx].toolCalls) {
      console.log("Initializing toolCalls array");
      newTurns[turnIdx].toolCalls = [];
    }

    // Create a new tool call object
    const newToolCall: ToolCall = {
      name: input.name.trim(),
      args: (input.args || [])
        .filter((arg) => arg.key.trim() !== "") // Only keep args with non-empty keys
        .map((arg) => ({
          key: arg.key.trim(),
          value: arg.value,
        })),
    };

    console.log("New tool call created:", newToolCall);

    // Add the new tool call
    newTurns[turnIdx].toolCalls = [
      ...(newTurns[turnIdx].toolCalls || []),
      newToolCall,
    ];

    console.log("Tool calls after adding:", newTurns[turnIdx].toolCalls);

    // Reset the tool call input
    newTurns[turnIdx].toolCallInput = null;

    console.log("Turn after save:", newTurns[turnIdx]);

    // Update the state
    setTurns(newTurns);

    console.log("State updated!");
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
    // setProvider("");
    // setModel("");
    // setSelectedAssistant("");
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
      testPassed: false,
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
      const formattedTurns = turns.flatMap((turn) => {
        const formattedTurn: any = {
          role: turn.type === "tool-response" ? "tool" : turn.type,
        };

        // Handle MOCK mode
        if (turn.type === "assistant" && turn.mode === "mock") {
          const messages = [];

          // First message: content only (if there is content)
          if (turn.content && turn.content.trim()) {
            messages.push({
              role: "assistant",
              message: turn.content.trim(),
            });
          }

          // If there are tool calls, add them as a SEPARATE evaluation turn
          if (
            turn.toolCalls &&
            Array.isArray(turn.toolCalls) &&
            turn.toolCalls.length > 0
          ) {
            const toolCallsForJudge = turn.toolCalls.map((toolCall) => {
              const argsObject: Record<string, string> = {};
              if (toolCall.args && Array.isArray(toolCall.args)) {
                toolCall.args.forEach((arg) => {
                  if (arg.key && arg.key.trim()) {
                    argsObject[arg.key] = arg.value || "";
                  }
                });
              }
              return {
                name: toolCall.name || "",
                arguments: argsObject,
              };
            });

            // Add as evaluation turn with judgePlan (NO content, NO tool_calls, ONLY judgePlan)
            messages.push({
              role: "assistant",
              judgePlan: {
                type: "exact",
                toolCalls: toolCallsForJudge,
              },
            });
          }

          // Return array of messages (could be 1 or 2 messages)
          return messages.length > 0
            ? messages
            : [{ role: "assistant", message: "" }];
        }
        // Handle EVALUATION mode
        if (turn.type === "assistant" && turn.mode === "evaluation") {
          const approach = turn.evaluationApproach || { type: "exact" };

          // Build judgePlan based on approach type
          const judgePlan: any = {
            type: approach.type,
          };

          // EXACT approach
          if (approach.type === "exact") {
            if (turn.content && turn.content.trim()) {
              judgePlan.content = turn.content.trim();
            }
          }
          // REGEX approach
          else if (approach.type === "regex") {
            if (approach.regexPattern && approach.regexPattern.trim()) {
              judgePlan.regexPattern = approach.regexPattern.trim();
            }
          }
        
          // LLM-as-a-judge approach
          else if (approach.type === "llm-as-a-judge") {
              ;
            // Build the system prompt for the LLM judge
            let systemPrompt = approach.customPrompt || "";

            // If no custom prompt, build default prompt from criteria
            if (!systemPrompt.trim()) {
              const contextInstruction =
                approach.includeContext !== false
                  ? "Evaluate ONLY the last assistant message: {{messages[-1]}}.\n\nInclude context: {{messages}}\n\n"
                  : "Evaluate the assistant's response.\n\n";

              systemPrompt = `You are an LLM-Judge. ${contextInstruction}Decision rule:\n- PASS if ALL pass criteria are met AND NO fail criteria are triggered.\n- Otherwise FAIL.\n\n`;

              if (approach.passCriteria && approach.passCriteria.trim()) {
                systemPrompt += `Pass criteria:\n${approach.passCriteria.trim()}\n\n`;
              }

              if (approach.failCriteria && approach.failCriteria.trim()) {
                systemPrompt += `Fail criteria (any triggers FAIL):\n${approach.failCriteria.trim()}\n\n`;
              }

              systemPrompt += `Output format: respond with exactly one word: pass or fail`;
            }

            // Store the full model structure
            judgePlan.model = {
              model: model || "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
              ],
              provider:  provider || "openai",
            };
            ;
            // Also store individual fields for re-editing
            judgePlan.passCriteria = approach.passCriteria;
            judgePlan.failCriteria = approach.failCriteria;
            judgePlan.includeConversationContext = approach.includeContext;
            judgePlan.customPrompt = approach.customPrompt;
            judgePlan.provider = provider || "openai";
            judgePlan.modelName =  model || "gpt-4o";
          }
          // Add tool calls to judgePlan for evaluation mode
          if (turn.toolCalls && Array.isArray(turn.toolCalls) && turn.toolCalls.length > 0) {
            judgePlan.toolCalls = turn.toolCalls.map((toolCall) => {
              const argsObject: Record<string, string> = {};

              if (toolCall.args && Array.isArray(toolCall.args)) {
                toolCall.args.forEach((arg) => {
                  if (arg.key && arg.key.trim()) {
                    argsObject[arg.key] = arg.value || "";
                  }
                });
              }

              return {
                name: toolCall.name || "",
                arguments: argsObject,
              };
            });
          }

          formattedTurn.role = "assistant";
          formattedTurn.judgePlan = judgePlan;
          ;
          // Do NOT include message field for evaluation turns
          return formattedTurn;
        }

        // For non-assistant turns (user, system, tool-response)
        formattedTurn.message = turn.content || "";
        return formattedTurn;
      });

      const payload = {
        evalName,
        evalDesc,
        assistantMongoId,
        userId,
        vapiAssistantId,
        turns: formattedTurns,
        provider: provider || "openai", // ADD
        model: model || "gpt-4o", // ADD
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

      // FIX: Use runDetails.results instead of results
      const messages = result.runDetails?.results?.[0]?.messages || [];

      // Keep ALL messages
      const conversation = messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content || "",
        toolCalls: msg.tool_calls || undefined,
        judge: msg.judge
          ? {
              status: msg.judge.status,
              failureReason: msg.judge.failureReason,
            }
          : undefined,
      }));

      // FIX: Check if ALL evaluations passed using runDetails
      const resultsArray = result.runDetails?.results || [];
      const allEvaluationsPassed =
        resultsArray.length > 0 &&
        resultsArray.every((r: any) => r.status === "pass");

      // FIX: Overall test passes if status is "pass"
      const testPassed =
        result.runDetails?.status === "ended" &&
        result.runDetails?.results?.[0]?.status === "pass";

      setTestResults({
        status: "success",
        testPassed,
        conversation,
      });

      setHasRunTest(true);

      // Show appropriate message
      if (testPassed) {
        message.success("✓ Test run completed - All evaluations passed!");
      } else {
        message.warning("✗ Test run completed - Some evaluations failed");
      }
    } catch (error: any) {
      console.error("Test run error:", error);
      setTestResults({
        status: "error",
        testPassed: false,
        conversation: [],
      });
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
                    <Input
                      value={
                        selectedAssistant ||
                        voiceBotContextData?.assistantInfo?.assistantName ||
                        ""
                      }
                      onChange={(e) => setSelectedAssistant(e.target.value)}
                      placeholder="Enter assistant name"
                      style={{ width: "100%" }}
                      readOnly // Make it read-only if you want
                      disabled // Or disabled if it shouldn't be editable
                    />
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

                              {/* Approach dropdown - only in Evaluation mode */}
                              {turn.mode === "evaluation" && (
                                <div className="filter-dropdown">
                                  <span className="label">Approach</span>
                                  <div className="custom-select">
                                    <Select
                                      className="filter-select"
                                      value={
                                        turn.evaluationApproach?.type || "exact"
                                      }
                                      onChange={(value) =>
                                        handleApproachChange(
                                          index,
                                          value as any
                                        )
                                      }
                                      suffixIcon={null}
                                    >
                                      <Select.Option value="exact">
                                        Exact
                                      </Select.Option>
                                      <Select.Option value="regex">
                                        Regex
                                      </Select.Option>
                                      <Select.Option value="llm-as-a-judge">
                                        LLM-as-a-judge
                                      </Select.Option>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="message-actions">
                              <span className="turn-label">
                                Turn {turnNumber}
                              </span>
                              <Image
                                src="/svgs/close-circle.svg"
                                width={20}
                                height={20}
                                alt="Close"
                                onClick={() => removeTurn(turn.id)}
                              />
                            </div>
                          </div>

                          {/* Content area based on mode */}
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
                              {/* EXACT Approach */}
                              {turn.evaluationApproach?.type === "exact" && (
                                <>
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
                                  <div className="evaluation-hint">
                                    Assistant response must match this text
                                    exactly (case-insensitive)
                                  </div>
                                </>
                              )}

                              {/* REGEX Approach */}
                              {turn.evaluationApproach?.type === "regex" && (
                                <>
                                  <div className="regex-section">
                                    <TextArea
                                      className="message-textarea"
                                      placeholder="Enter regex pattern (e.g., /sunny|clear/i)..."
                                      rows={3}
                                      value={
                                        turn.evaluationApproach?.regexPattern ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        updateLLMJudgeField(
                                          index,
                                          "regexPattern",
                                          e.target.value
                                        )
                                      }
                                    />
                                    <div className="evaluation-hint">
                                      Assistant response will be tested against
                                      this regex pattern
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* LLM-as-a-judge Approach */}
                              {turn.evaluationApproach?.type ===
                                "llm-as-a-judge" && (
                                <>
                                  <div className="llm-judge-section">
                                    {/* Mode Toggle: Structured vs Custom */}
                                    <div className="llm-judge-mode-toggle">
                                      <div className="mode-options">
                                        <label className="mode-option">
                                          <input
                                            type="radio"
                                            name={`llm-mode-${index}`}
                                            checked={
                                              !turn.evaluationApproach
                                                ?.customPrompt ||
                                              turn.evaluationApproach
                                                ?.customPrompt === ""
                                            }
                                            onChange={() => {
                                              const newTurns = [...turns];
                                              if (
                                                !newTurns[index]
                                                  .evaluationApproach
                                              ) {
                                                newTurns[
                                                  index
                                                ].evaluationApproach = {
                                                  type: "llm-as-a-judge",
                                                };
                                              }
                                              newTurns[
                                                index
                                              ].evaluationApproach!.customPrompt =
                                                "";
                                              setTurns(newTurns);
                                            }}
                                          />
                                          <span>Use Structured Fields</span>
                                        </label>
                                        <label className="mode-option">
                                          <input
                                            type="radio"
                                            name={`llm-mode-${index}`}
                                            checked={
                                              !!turn.evaluationApproach
                                                ?.customPrompt &&
                                              turn.evaluationApproach
                                                ?.customPrompt !== ""
                                            }
                                            onChange={() => {
                                              const newTurns = [...turns];
                                              if (
                                                !newTurns[index]
                                                  .evaluationApproach
                                              ) {
                                                newTurns[
                                                  index
                                                ].evaluationApproach = {
                                                  type: "llm-as-a-judge",
                                                };
                                              }
                                              // Initialize with a template if switching to custom
                                              if (
                                                !newTurns[index]
                                                  .evaluationApproach!
                                                  .customPrompt
                                              ) {
                                                newTurns[
                                                  index
                                                ].evaluationApproach!.customPrompt =
                                                  'You are an LLM-Judge. Evaluate ONLY the last assistant message in the mock conversation: {{messages[-1]}}.\n\nContext is available in {{messages}}, but your judgment must focus on the last assistant message.\n\nDecision rule:\n- PASS if ALL "pass criteria" are satisfied AND NONE of the "fail criteria" are triggered.\n- Otherwise FAIL.\n\nOutput format: respond with exactly one word: pass or fail\n- No explanations\n- No punctuation\n- No additional text';
                                              }
                                              setTurns(newTurns);
                                            }}
                                          />
                                          <span>Custom AI Judge Prompt</span>
                                        </label>
                                      </div>
                                    </div>

                                    {/* Structured Fields Mode */}
                                    {(!turn.evaluationApproach?.customPrompt ||
                                      turn.evaluationApproach?.customPrompt ===
                                        "") && (
                                      <>
                                        {/* Pass Criteria */}
                                        <div className="criteria-field">
                                          <div className="field-label">
                                            Pass Criteria
                                          </div>
                                          <Input
                                            placeholder="e.g., Response is helpful and answers the question accurately"
                                            value={
                                              turn.evaluationApproach
                                                ?.passCriteria || ""
                                            }
                                            onChange={(e) =>
                                              updateLLMJudgeField(
                                                index,
                                                "passCriteria",
                                                e.target.value
                                              )
                                            }
                                            className="criteria-input"
                                          />
                                          <div className="field-hint">
                                            The assistant message must meet ALL
                                            pass criteria
                                          </div>
                                        </div>

                                        {/* Fail Criteria */}
                                        <div className="criteria-field">
                                          <div className="field-label">
                                            Fail Criteria
                                          </div>
                                          <Input
                                            placeholder="e.g., Response is rude, inappropriate, or off-topic"
                                            value={
                                              turn.evaluationApproach
                                                ?.failCriteria || ""
                                            }
                                            onChange={(e) =>
                                              updateLLMJudgeField(
                                                index,
                                                "failCriteria",
                                                e.target.value
                                              )
                                            }
                                            className="criteria-input"
                                          />
                                          <div className="field-hint">
                                            ANY fail criteria will result in
                                            evaluation failure
                                          </div>
                                        </div>

                                        {/* Include Context Toggle */}
                                        <div className="context-toggle">
                                          <div className="toggle-row">
                                            <div>
                                              <div className="toggle-label">
                                                Include Conversation Context
                                              </div>
                                              <div className="toggle-description">
                                                Provide full conversation
                                                history as context for
                                                evaluation
                                              </div>
                                            </div>
                                            <label className="switch">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  turn.evaluationApproach
                                                    ?.includeContext !== false
                                                }
                                                onChange={(e) =>
                                                  updateLLMJudgeField(
                                                    index,
                                                    "includeContext",
                                                    e.target.checked
                                                  )
                                                }
                                              />
                                              <span className="slider"></span>
                                            </label>
                                          </div>
                                        </div>

                                        {/* Preview System Prompt Button */}
                                        <div className="preview-prompt-section">
                                          <Button
                                            type="link"
                                            size="small"
                                            onClick={() => {
                                              // Generate preview
                                              const contextInstruction =
                                                turn.evaluationApproach
                                                  ?.includeContext !== false
                                                  ? "Evaluate ONLY the last assistant message: {{messages[-1]}}.\n\nInclude context: {{messages}}\n\n"
                                                  : "Evaluate the assistant's response.\n\n";

                                              let preview = `You are an LLM-Judge. ${contextInstruction}Decision rule:\n- PASS if ALL pass criteria are met AND NO fail criteria are triggered.\n- Otherwise FAIL.\n\n`;

                                              if (
                                                turn.evaluationApproach
                                                  ?.passCriteria
                                              ) {
                                                preview += `Pass criteria:\n${turn.evaluationApproach.passCriteria.trim()}\n\n`;
                                              }

                                              if (
                                                turn.evaluationApproach
                                                  ?.failCriteria
                                              ) {
                                                preview += `Fail criteria (any triggers FAIL):\n${turn.evaluationApproach.failCriteria.trim()}\n\n`;
                                              }

                                              preview += `Output format: respond with exactly one word: pass or fail`;

                                              // Use Modal instead of message
                                              const modal = Modal.info({
                                                title: "System Prompt Preview",
                                                content: (
                                                  <div
                                                    style={{
                                                      whiteSpace: "pre-wrap",
                                                      fontFamily:
                                                        "Courier New, monospace",
                                                      fontSize: "13px",
                                                      lineHeight: "1.6",
                                                      backgroundColor:
                                                        "#f5f5f5",
                                                      padding: "16px",
                                                      borderRadius: "8px",
                                                      maxHeight: "400px",
                                                      overflowY: "auto",
                                                      border:
                                                        "1px solid #e6e8ec",
                                                    }}
                                                  >
                                                    {preview}
                                                  </div>
                                                ),
                                                width: 700,
                                                okText: "Close",
                                                maskClosable: true,
                                                onOk() {
                                                  modal.destroy();
                                                },
                                              });
                                            }}
                                            style={{
                                              padding: 0,
                                              height: "auto",
                                            }}
                                          >
                                            ⌄ Preview System Prompt
                                          </Button>
                                        </div>
                                      </>
                                    )}

                                    {/* Custom Prompt Mode */}
                                    {turn.evaluationApproach?.customPrompt &&
                                      turn.evaluationApproach?.customPrompt !==
                                        "" && (
                                        <div className="custom-prompt-section">
                                          <div className="custom-prompt-header">
                                            <span className="field-label">
                                              Custom AI Judge Prompt
                                            </span>
                                          </div>
                                          <TextArea
                                            className="message-textarea custom-prompt-textarea"
                                            placeholder="Write a custom prompt for the AI judge..."
                                            rows={8}
                                            value={
                                              turn.evaluationApproach
                                                ?.customPrompt || ""
                                            }
                                            onChange={(e) =>
                                              updateLLMJudgeField(
                                                index,
                                                "customPrompt",
                                                e.target.value
                                              )
                                            }
                                          />
                                          <div className="field-hint">
                                            Write your own evaluation prompt.
                                            Use {`{{messages[-1]}}`} for the
                                            last assistant message and{" "}
                                            {`{{messages}}`} for full context.
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {/* Only show Tool Calls section if NOT in LLM-as-a-judge evaluation mode */}
                          {!(
                            turn.mode === "evaluation" &&
                            turn.evaluationApproach?.type === "llm-as-a-judge"
                          ) && (
                            <div className="add-toolcall-row">
                              <div className="add-toolcall-row-second">
                                Expected Tool Calls
                              </div>
                              {!turn.toolCallInput && (
                                <button
                                  type="button"
                                  className="toolcall-btn"
                                  onClick={() => startToolCallInput(index)}
                                >
                                  <PlusOutlined style={{ fontSize: 16 }} /> Add
                                  Tool Call
                                </button>
                              )}
                            </div>
                          )}

                          {turn.toolCallInput && (
                            <Card className="expected-toolcalls" size="small">
                              <Input
                                className="tool-call-input"
                                placeholder="Tool name"
                                value={turn.toolCallInput.name}
                                onChange={(e) =>
                                  updateToolCallName(index, e.target.value)
                                }
                              />
                              <div className="arguments-label">Arguments</div>
                              <div className="toolcall-rows">
                                {(turn.toolCallInput.args || []).map(
                                  (arg, idx2) => (
                                    <div className="toolcall-row" key={idx2}>
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
                                  <PlusOutlined style={{ fontSize: 13 }} /> Add
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
                                <div className="toolcall-item" key={callIdx}>
                                  <div className="toolcall-content">
                                    <span className="toolcall-name">
                                      {call.name || "No Tool Name"}
                                    </span>
                                    {call.args &&
                                      Object.keys(call.args).length > 0 && (
                                        <span className="toolcall-args">
                                          {Object.keys(call.args).length} arg
                                          {Object.keys(call.args).length !== 1
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
                  <>
                    {/* Overall test status */}
                    <div
                      style={{
                        marginBottom: "12px",
                        padding: "8px 12px",
                        backgroundColor: testResults.testPassed
                          ? "#f0f9ff"
                          : "#fff1f0",
                        borderRadius: "6px",
                      }}
                    >
                      <span
                        className={`status-badge ${
                          testResults.testPassed ? "Success" : "Failed"
                        }`}
                        style={{
                          fontSize: "13px",
                          padding: "4px 12px",
                          color: testResults.testPassed ? "#4D72F5" : "#f00000",
                          fontWeight: 500,
                        }}
                      >
                        {testResults.testPassed
                          ? "✓ Test Passed"
                          : "✗ Test Failed"}
                      </span>
                    </div>

                    <div className="conversation-history">
                      {testResults.conversation
                        .filter((message) => {
                          // Filter out assistant messages that have no content AND no tool calls AND no judge
                          if (message.role === "assistant") {
                            const hasContent =
                              message.content && message.content.trim() !== "";
                            const hasToolCalls =
                              message.toolCalls && message.toolCalls.length > 0;
                            const hasJudge = message.judge !== undefined;

                            // Keep if it has ANY of these
                            return hasContent || hasToolCalls || hasJudge;
                          }
                          // Keep all user messages
                          return true;
                        })
                        .map((message, index) => {
                          const hasToolCalls =
                            message.toolCalls && message.toolCalls.length > 0;
                          const isEmptyContent =
                            !message.content || message.content.trim() === "";

                          return (
                            <div
                              key={index}
                              className={`message-bubble ${message.role}`}
                            >
                              <div className="message-role">
                                {message.role === "user" ? "User" : "Assistant"}
                              </div>
                              <div className="message-content">
                                {hasToolCalls && isEmptyContent
                                  ? "Tool call initiated"
                                  : message.content || ""}
                              </div>

                              {/* Show evaluation result for assistant messages */}
                              {message.role === "assistant" &&
                                message.judge && (
                                  <div style={{ marginTop: "8px" }}>
                                    <span
                                      className={`status-badge ${
                                        message.judge.status === "pass"
                                          ? "Success"
                                          : "Failed"
                                      }`}
                                      style={{
                                        fontSize: "12px",
                                        padding: "4px 10px",
                                        borderRadius: "4px",
                                        display: "inline-block",
                                        color:
                                          message.judge.status === "pass"
                                            ? "#4D72F5"
                                            : "#f00000",
                                        fontWeight: 500,
                                        backgroundColor:
                                          message.judge.status === "pass"
                                            ? "#f0f9ff"
                                            : "#fff1f0",
                                      }}
                                    >
                                      {message.judge.status === "pass"
                                        ? "✓ Pass"
                                        : "✗ Fail"}
                                    </span>

                                    {/* Show failure reason if failed */}
                                    {message.judge.status === "fail" &&
                                      message.judge.failureReason && (
                                        <div
                                          style={{
                                            marginTop: "6px",
                                            padding: "8px 12px",
                                            backgroundColor: "#fff1f0",
                                            borderLeft: "3px solid #f00000",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            color: "#262626",
                                            lineHeight: "1.5",
                                          }}
                                        >
                                          <strong style={{ color: "#f00000" }}>
                                            Reason:
                                          </strong>{" "}
                                          {message.judge.failureReason}
                                        </div>
                                      )}
                                  </div>
                                )}
                            </div>
                          );
                        })}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
