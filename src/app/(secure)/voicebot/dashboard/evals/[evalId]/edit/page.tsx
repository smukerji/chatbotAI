
"use client";
import { useEffect, useState } from "react";
import { Spin, message } from "antd";
import CreateEvaluationForm from "../../create-evaluation/CreateEvaluationForm";

interface EditEvalPageProps {
  params: {
    evalId: string;
  };
}

export default function EditEvalPage({ params }: EditEvalPageProps) {
  const { evalId } = params;
  
  const [evalData, setEvalData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvalData();
  }, [evalId]);

  const fetchEvalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/voicebot/dashboard/api/evals/${evalId}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch evaluation");
      }

      console.log("Fetched eval data:", data.eval);

      // Transform VAPI data to match the form's expected format
      const transformedData = transformVAPIDataToFormData(data.eval);
      
      setEvalData(transformedData);
    } catch (err: any) {
      console.error("Error fetching eval:", err);
      setError(err.message || "Failed to load evaluation");
      message.error(err.message || "Failed to load evaluation");
    } finally {
      setLoading(false);
    }
  };


  const transformVAPIDataToFormData = (vapiEval: any) => {
    // Extract basic info
    const formData: any = {
      evalId: vapiEval.id,
      name: vapiEval.localName || vapiEval.name || "",
      description: vapiEval.localDescription || vapiEval.description || "",
      assistantMongoId: vapiEval.assistantMongoId || "",
      vapiAssistantId: vapiEval.assistantId || vapiEval.vapiAssistantId || "",
      provider: "openai", // Default, you might want to extract this from assistant config
      model: "gpt-4o", // Default, you might want to extract this from assistant config
      selectedAssistant: "viff", // Default
      messages: [],
    };

    // Transform messages to form's turn format
    if (vapiEval.messages && Array.isArray(vapiEval.messages)) {
      formData.messages = vapiEval.messages.map((msg: any, index: number) => {
        const baseTurn: any = {
          id: index + 1,
          type: msg.role === "tool" ? "tool-response" : msg.role,
          content: msg.content || "",
        };

        // Handle assistant messages with judgePlan (evaluation mode)
        if (msg.role === "assistant" && msg.judgePlan) {
          baseTurn.mode = "evaluation";
          
          // Extract tool calls from judgePlan
          if (msg.judgePlan.toolCalls && Array.isArray(msg.judgePlan.toolCalls)) {
            baseTurn.toolCalls = msg.judgePlan.toolCalls.map((tc: any) => ({
              name: tc.name || "",
              args: Object.entries(tc.arguments || {}).map(([key, value]) => ({
                key,
                value: String(value),
              })),
            }));
          } else {
            baseTurn.toolCalls = [];
          }

          // If judgePlan has content, use it
          if (msg.judgePlan.content) {
            baseTurn.content = msg.judgePlan.content;
          }
        } else if (msg.role === "assistant") {
          // Regular mock assistant message
          baseTurn.mode = "mock";
          baseTurn.toolCalls = [];
        }

        return baseTurn;
      });
    }

    console.log("Transformed form data:", formData);
    return formData;
  };

  if (loading) {
    return (
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "400px" 
        }}
      >
        <Spin size="large" tip="Loading evaluation..." />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "400px",
          gap: "16px"
        }}
      >
        <p style={{ fontSize: "16px", color: "#ff4d4f" }}>
          Error: {error}
        </p>
        <button 
          onClick={fetchEvalData}
          style={{
            padding: "8px 16px",
            borderRadius: "4px",
            border: "1px solid #d9d9d9",
            background: "#fff",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!evalData) {
    return (
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "400px" 
        }}
      >
        <p>No evaluation data found</p>
      </div>
    );
  }

  return <CreateEvaluationForm mode="edit" initialData={evalData} />;
}