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

      console.log(" Fetching eval with ID:", evalId);

      const response = await fetch(`/voicebot/dashboard/api/evals/${evalId}`);
      const data = await response.json();

      console.log(" Raw API response:", JSON.stringify(data, null, 2));

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch evaluation");
      }

      console.log(" Fetched eval data:", data.eval);
      console.log(" Messages array:", data.eval?.messages);

      // Transform VAPI data to match the form's expected format
      const transformedData = transformVAPIDataToFormData(data.eval);
      
      console.log(" Transformed data for form:", JSON.stringify(transformedData, null, 2));
      
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
    console.log("===  TRANSFORMATION START ===");
    console.log("Input:", vapiEval);
    
    // Extract basic info
    const formData: any = {
      evalId: vapiEval.id,
      name: vapiEval.localName || vapiEval.name || "",
      description: vapiEval.localDescription || vapiEval.description || "",
      assistantMongoId: vapiEval.assistantMongoId || "",
      vapiAssistantId: vapiEval.assistantId || vapiEval.vapiAssistantId || "",
      provider: "openai",
      model: "gpt-4o",
      messages: [],
    };

    console.log(" Basic info extracted:", formData);

    // Transform messages to form's turn format
    if (!vapiEval.messages) {
      console.error(" NO MESSAGES FOUND in vapiEval!");
      return formData;
    }

    if (!Array.isArray(vapiEval.messages)) {
      console.error(" Messages is not an array:", typeof vapiEval.messages);
      return formData;
    }

    console.log(`Processing ${vapiEval.messages.length} messages`);
      
    formData.messages = vapiEval.messages.map((msg: any, index: number) => {
      console.log(`\n--- Message ${index + 1}/${vapiEval.messages.length} ---`);
      console.log("Role:", msg.role);
      console.log("Content:", msg.content);
      console.log("Has judgePlan:", !!msg.judgePlan);
      
      const baseTurn: any = {
        id: index + 1,
        type: msg.role === "tool" ? "tool-response" : msg.role,
        content: msg.content || "",
      };

      // Handle assistant messages with judgePlan (evaluation mode)
      if (msg.role === "assistant" && msg.judgePlan) {
        console.log("EVALUATION MODE - judgePlan:", JSON.stringify(msg.judgePlan, null, 2));
        
        baseTurn.mode = "evaluation";
        
        const judgePlan = msg.judgePlan;
        baseTurn.evaluationApproach = {
          type: judgePlan.type || "exact"
        };

        console.log("Approach type:", baseTurn.evaluationApproach.type);

        // Handle EXACT approach
        if (judgePlan.type === "exact") {
          baseTurn.content = judgePlan.content || "";
          console.log("✓ Exact content:", baseTurn.content);
        } 
        // Handle REGEX approach
        else if (judgePlan.type === "regex") {
          // CRITICAL: VAPI stores regex pattern in judgePlan.content
          baseTurn.evaluationApproach.regexPattern = judgePlan.content || "";
          baseTurn.content = ""; // Clear display content
          console.log("✓ Regex pattern:", baseTurn.evaluationApproach.regexPattern);
        }
      // Handle LLM-as-a-judge approach
else if (judgePlan.type === "llm-as-a-judge" || judgePlan.type === "ai") {
  console.log("Processing LLM-as-a-judge from VAPI");
  
  baseTurn.evaluationApproach.type = "llm-as-a-judge";
  
  // Extract from model.messages if it exists
  if (judgePlan.model && judgePlan.model.messages && judgePlan.model.messages.length > 0) {
    const systemMessage = judgePlan.model.messages.find((m: any) => m.role === "system");
    if (systemMessage && systemMessage.content) {
      // Try to parse the system prompt back into structured criteria
      const content = systemMessage.content;
      
      // Extract pass criteria
      const passMatch = content.match(/Pass criteria:\n([\s\S]*?)(?:\n\nFail criteria|\n\nOutput format|$)/);
      if (passMatch) {
        baseTurn.evaluationApproach.passCriteria = passMatch[1].trim();
      }
      
      // Extract fail criteria
     const failMatch = content.match(/Fail criteria.*?:\n([\s\S]*?)(?:\n\nOutput format|$)/);
      if (failMatch) {
        baseTurn.evaluationApproach.failCriteria = failMatch[1].trim();
      }
      
      // Check for context inclusion
      baseTurn.evaluationApproach.includeContext = content.includes("{{messages}}");
      
      // Store the full custom prompt
      baseTurn.evaluationApproach.customPrompt = content;
    }
    
    // Store provider and model info for display
    baseTurn.evaluationApproach.provider = judgePlan.model.provider || "openai";
    baseTurn.evaluationApproach.modelName = judgePlan.model.model || "gpt-4o";
  }
  
  baseTurn.content = "";
  console.log("✓ LLM judge configuration loaded");
}

        // Extract tool calls from judgePlan
        if (judgePlan.toolCalls && Array.isArray(judgePlan.toolCalls)) {
          console.log(`Found ${judgePlan.toolCalls.length} tool calls`);
          
          baseTurn.toolCalls = judgePlan.toolCalls.map((tc: any, tcIndex: number) => {
            console.log(` Tool ${tcIndex + 1}: ${tc.name}`);
            console.log(` Arguments:`, tc.arguments);
            
            const args: Array<{ key: string; value: string }> = [];
            
            if (tc.arguments && typeof tc.arguments === 'object') {
              Object.entries(tc.arguments).forEach(([key, value]) => {
                args.push({ key, value: String(value) });
                console.log(`    - ${key}: ${value}`);
              });
            }

            return {
              name: tc.name || "",
              args: args.length > 0 ? args : [{ key: "", value: "" }],
            };
          });
          
          console.log("✓ Tool calls transformed:", baseTurn.toolCalls);
        } else {
          baseTurn.toolCalls = [];
          console.log("✓ No tool calls");
        }
      } 
      // Handle regular mock assistant messages
      else if (msg.role === "assistant") {
        console.log("MOCK MODE");
        baseTurn.mode = "mock";
        baseTurn.toolCalls = [];
        baseTurn.content = msg.content || "";
      }

      console.log("Transformed turn:", JSON.stringify(baseTurn, null, 2));
      return baseTurn;
    });

    console.log("=== TRANSFORMATION COMPLETE ===");
    console.log("Total messages transformed:", formData.messages.length);
    console.log("Final formData:", JSON.stringify(formData, null, 2));
    
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

  console.log("Rendering CreateEvaluationForm with:", evalData);

  return <CreateEvaluationForm mode="edit" initialData={evalData} />;
}