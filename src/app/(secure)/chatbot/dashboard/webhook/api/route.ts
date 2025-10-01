import { NextRequest, NextResponse } from "next/server";

import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { encodeChat, encode, decode, isWithinTokenLimit } from "gpt-tokenizer";

import moment from "moment";
import OpenAI from "openai";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";

export const maxDuration = 300;

interface WhatsAppChatHistoryType {
  _id?: ObjectId;
  userId: string;
  chatbotId: string;
  chats: {
    [key: string]: {
      messages: {
        role: string;
        content: string;
        timestamp: string; // ISO timestamp for when message was sent/received
        messageTime?: string; // Formatted time for frontend display
      }[];
      usage: {
        completion_tokens: number;
        prompt_tokens: number;
        total_tokens: number;
      };
      // For Assistant API
      threadId?: string;
      assistantId?: string;
    };
  };
  date: string; // Date string in YYYY-MM-DD format
  createdAt?: Date; // When the document was first created
  updatedAt?: Date; // When the document was last updated
}

// Create the OpenAI client instance
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  project: process.env.NEXT_PUBLIC_OPENAI_PROJ_KEY,
  organization: process.env.NEXT_PUBLIC_OPENAI_ORG_KEY,
});

// Enhanced logging utility
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${message}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
};

const logError = (message: string, error: any, step?: number) => {
  const timestamp = new Date().toISOString();
  console.error(
    `[${timestamp}] ERROR${step ? ` at step ${step}` : ""}: ${message}`,
    {
      error: error.message || error,
      stack: error.stack,
    }
  );
};

// Enhanced API call with timeout and retry
const makeAPICallWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
  retries: number = 2
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logError(
      `API call timeout after ${timeoutMs}ms`,
      new Error("Timeout"),
      undefined
    );
  }, timeoutMs);

  const enhancedOptions = {
    ...options,
    signal: controller.signal,
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      logWithTimestamp(`API call attempt ${attempt}/${retries + 1} to ${url}`);

      const response = await fetch(url, enhancedOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logWithTimestamp(`API call successful to ${url}`);
      return response;
    } catch (error: any) {
      logError(`API call attempt ${attempt} failed`, error);

      if (attempt === retries + 1 || error.name === "AbortError") {
        clearTimeout(timeoutId);
        throw error;
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      logWithTimestamp(`Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  clearTimeout(timeoutId);
  throw new Error("All retry attempts failed");
};

const getWhatsAppDetails = async (wa_id: any) => {
  try {
    logWithTimestamp(`Getting WhatsApp details for wa_id: ${wa_id}`);
    const db = (await clientPromise!).db();
    const collection = db.collection("whatsappbot_details");
    const result = await collection.findOne({
      phoneNumberID: wa_id,
      isEnabled: true,
    });

    if (result?.chatbotId) {
      logWithTimestamp(
        `WhatsApp details found for chatbotId: ${result.chatbotId}`
      );
      return result;
    }

    logWithTimestamp(`No WhatsApp details found for wa_id: ${wa_id}`);
    return null;
  } catch (error) {
    logError("Error getting chatbotID", error);
    return "error";
  }
};

const getResponseNumber = (res: any) => {
  const waId = res?.entry?.[0]?.changes?.[0]?.value?.contacts[0]?.wa_id;
  logWithTimestamp(`Extracted response number: ${waId}`);
  return waId;
};

//-----------------------------------------------------------This function will send message to whatsapp
async function sendMessageToWhatsapp(
  phoneNumberId: any,
  recipientPhoneNumber: any,
  accessToken: any,
  message: any
) {
  const version = "v18.0";
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  logWithTimestamp(`Sending WhatsApp message to ${recipientPhoneNumber}`, {
    phoneNumberId,
    messageLength: message?.length || 0,
  });

  const data = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: `${recipientPhoneNumber}`,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await makeAPICallWithTimeout(url, options, 15000);
    logWithTimestamp(
      `WhatsApp message sent successfully to ${recipientPhoneNumber}`
    );
  } catch (error) {
    logError(
      `Failed to send WhatsApp message to ${recipientPhoneNumber}`,
      error
    );
    throw error; // Re-throw to handle upstream
  }
}

// Format HTML/assistant output into WhatsApp-friendly plain text using OpenAI
async function formatMessageForWhatsApp(
  htmlMessage: string,
  model = "gpt-3.5-turbo"
) {
  if (!htmlMessage || htmlMessage.trim().length === 0) return htmlMessage;

  try {
    const systemPrompt = `Format provided content as pre whatsapp messaging style. Output ONLY the converted text without any extra notes.`;

    const payload = {
      model,
      temperature: 0.2,
      top_p: 1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Convert the following content for WhatsApp delivery. Output ONLY the converted text without any extra notes:\n\n${htmlMessage}`,
        },
      ],
    };

    const resp = await makeAPICallWithTimeout(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
        },
        body: JSON.stringify(payload),
      },
      15000,
      1
    );

    const text = await resp.text();
    const parsed = JSON.parse(text || "{}");
    const formatted =
      parsed?.choices?.[0]?.message?.content ||
      parsed?.choices?.[0]?.text ||
      htmlMessage;

    return (formatted as string).trim();
  } catch (error: any) {
    logError("Failed to format message for WhatsApp", error);
    return htmlMessage; // Fallback to original
  }
}

// Updated Assistant API helper functions using OpenAI library
async function createThread() {
  logWithTimestamp("Creating new OpenAI thread");

  try {
    const thread = await openai.beta.threads.create();
    logWithTimestamp(`Thread created successfully: ${thread.id}`);
    return thread;
  } catch (error) {
    logError("Failed to create thread", error);
    throw error;
  }
}

async function addMessageToThread(threadId: string, message: string) {
  logWithTimestamp(`Adding message to thread: ${threadId}`, {
    messageLength: message.length,
  });

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });
    logWithTimestamp(`Message added to thread successfully`);
    return threadMessage;
  } catch (error) {
    logError(`Failed to add message to thread ${threadId}`, error);
    throw error;
  }
}

async function runAssistant(
  threadId: string,
  assistantId: string,
  instructions?: string
) {
  logWithTimestamp(`Running assistant ${assistantId} on thread ${threadId}`);

  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // ...(instructions && { instructions }),
    });
    logWithTimestamp(`Assistant run started: ${run.id}`);
    return run;
  } catch (error) {
    logError(`Failed to run assistant ${assistantId}`, error);
    throw error;
  }
}

async function checkRunStatus(threadId: string, runId: string) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    logWithTimestamp(`Run status check: ${run.status}`, {
      runId,
      threadId,
      status: run.status,
    });
    return run;
  } catch (error) {
    logError(`Failed to check run status ${runId}`, error);
    throw error;
  }
}

async function getThreadMessages(threadId: string) {
  logWithTimestamp(`Getting messages from thread: ${threadId}`);

  try {
    const messages = await openai.beta.threads.messages.list(threadId);
    logWithTimestamp(
      `Retrieved ${messages.data?.length || 0} messages from thread`
    );
    return messages;
  } catch (error) {
    logError(`Failed to get messages from thread ${threadId}`, error);
    throw error;
  }
}

async function waitForRunCompletion(
  threadId: string,
  runId: string,
  maxWaitTime = 60000
) {
  const startTime = Date.now();
  let checkCount = 0;
  const maxChecks = Math.floor(maxWaitTime / 2000); // Check every 2 seconds

  logWithTimestamp(`Waiting for run completion: ${runId}`, {
    maxWaitTime,
    maxChecks,
  });

  while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
    checkCount++;

    try {
      const runStatus = await checkRunStatus(threadId, runId);

      logWithTimestamp(`Run status check ${checkCount}/${maxChecks}`, {
        status: runStatus.status,
        elapsed: Date.now() - startTime,
      });

      if (runStatus.status === "completed") {
        logWithTimestamp(
          `Run completed successfully after ${Date.now() - startTime}ms`
        );
        return runStatus;
      } else if (
        runStatus.status === "failed" ||
        runStatus.status === "cancelled" ||
        runStatus.status === "expired"
      ) {
        const errorMessage = `Assistant run ${runStatus.status}: ${
          runStatus.last_error?.message || "Unknown error"
        }`;
        logError(errorMessage, runStatus.last_error || {});
        throw new Error(errorMessage);
      }

      // Progressive wait time (start with 2s, increase to 5s for longer runs)
      const waitTime = checkCount < 5 ? 2000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error: any) {
      if (error.message.includes("Assistant run")) {
        throw error; // Re-throw assistant-specific errors
      }

      logError(`Error checking run status (attempt ${checkCount})`, error);

      // If we're near the end, throw the error
      if (checkCount >= maxChecks - 2) {
        throw error;
      }

      // Otherwise, wait and continue
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const errorMessage = `Assistant run timed out after ${
    Date.now() - startTime
  }ms (${checkCount} checks)`;
  logError(errorMessage, {});
  throw new Error(errorMessage);
}

// Function to handle requires_action status for Assistant API
async function handleRequiredAction(
  threadId: string,
  runId: string,
  chatbotId: string,
  userID: string,
  messages: any[] = []
) {
  logWithTimestamp(`Handling required action for run: ${runId}`);

  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (run.status !== "requires_action") {
      logWithTimestamp(`Run status is ${run.status}, no action required`);
      return run;
    }

    const requiredAction = run.required_action;
    if (!requiredAction || requiredAction.type !== "submit_tool_outputs") {
      logError("Unexpected required action type", { requiredAction });
      throw new Error("Unexpected required action type");
    }

    logWithTimestamp(
      `Processing ${requiredAction.submit_tool_outputs.tool_calls.length} tool calls`
    );

    // Process each tool call using your existing handler
    const toolOutputs = await Promise.all(
      requiredAction.submit_tool_outputs.tool_calls.map(async (toolCall) => {
        logWithTimestamp(`Processing tool call: ${toolCall.function.name}`, {
          toolCallId: toolCall.id,
          functionName: toolCall.function.name,
          arguments: toolCall.function.arguments,
        });

        try {
          // Use your existing functionCallHandler
          const functionOutput = await functionCallHandler(
            toolCall,
            chatbotId,
            userID,
            messages,
            false // WEB_SEARCH parameter
          );

          return {
            tool_call_id: toolCall.id,
            output: functionOutput, // Your handler already returns JSON string
          };
        } catch (error: any) {
          logError(`Error executing function ${toolCall.function.name}`, error);
          return {
            tool_call_id: toolCall.id,
            output: JSON.stringify({
              success: false,
              message: `Function execution failed: ${error?.message}`,
            }),
          };
        }
      })
    );

    // Submit tool outputs
    logWithTimestamp(`Submitting ${toolOutputs.length} tool outputs`);
    const updatedRun = await openai.beta.threads.runs.submitToolOutputs(
      threadId,
      runId,
      {
        tool_outputs: toolOutputs,
      }
    );

    logWithTimestamp(`Tool outputs submitted successfully`);
    return updatedRun;
  } catch (error) {
    logError(`Failed to handle required action for run ${runId}`, error);
    throw error;
  }
}

async function waitForRunCompletionWithActions(
  threadId: string,
  runId: string,
  chatbotId: string,
  userID: string,
  messages: any[] = [],
  maxWaitTime = 60000
) {
  const startTime = Date.now();
  let checkCount = 0;
  const maxChecks = Math.floor(maxWaitTime / 2000);

  logWithTimestamp(
    `Waiting for run completion with action handling: ${runId}`,
    {
      maxWaitTime,
      maxChecks,
    }
  );

  while (Date.now() - startTime < maxWaitTime && checkCount < maxChecks) {
    checkCount++;

    try {
      const runStatus = await checkRunStatus(threadId, runId);

      logWithTimestamp(`Run status check ${checkCount}/${maxChecks}`, {
        status: runStatus.status,
        elapsed: Date.now() - startTime,
      });

      if (runStatus.status === "completed") {
        logWithTimestamp(
          `Run completed successfully after ${Date.now() - startTime}ms`
        );
        return runStatus;
      } else if (runStatus.status === "requires_action") {
        logWithTimestamp("Run requires action, handling...");

        // Handle the required action using your existing handler
        const updatedRun = await handleRequiredAction(
          threadId,
          runId,
          chatbotId,
          userID,
          messages
        );

        // Continue waiting for completion
        const waitTime = 2000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else if (
        runStatus.status === "failed" ||
        runStatus.status === "cancelled" ||
        runStatus.status === "expired"
      ) {
        const errorMessage = `Assistant run ${runStatus.status}: ${
          runStatus.last_error?.message || "Unknown error"
        }`;
        logError(errorMessage, runStatus.last_error || {});
        throw new Error(errorMessage);
      }

      // Progressive wait time
      const waitTime = checkCount < 5 ? 2000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    } catch (error: any) {
      if (error.message.includes("Assistant run")) {
        throw error;
      }

      logError(`Error checking run status (attempt ${checkCount})`, error);

      if (checkCount >= maxChecks - 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  const errorMessage = `Assistant run timed out after ${
    Date.now() - startTime
  }ms (${checkCount} checks)`;
  logError(errorMessage, {});
  throw new Error(errorMessage);
}

export async function GET(req: NextRequest) {
  let hubMode = req.nextUrl.searchParams.get("hub.mode");
  let hubChallenge = req.nextUrl.searchParams.get("hub.challenge");
  let hubToken = req.nextUrl.searchParams.get("hub.verify_token");

  logWithTimestamp("Webhook verification request", { hubMode, hubToken });

  try {
    const db = (await clientPromise!).db();
    const collection = db?.collection("whatsappbot_details");

    const tokenDetails = await collection?.findOne({
      webhook_verification_token: hubToken,
    });

    if (
      hubMode === "subscribe" &&
      hubToken === tokenDetails?.webhook_verification_token
    ) {
      if (tokenDetails) {
        await collection?.updateOne(
          { webhook_verification_token: hubToken },
          { $set: { isTokenVerified: true } }
        );
        logWithTimestamp("Token verified and updated in database");
      }

      logWithTimestamp("Webhook verified successfully");
      return new Response(hubChallenge);
    }

    logWithTimestamp("Invalid webhook credentials");
    return new Response("Invalid Credentials", { status: 400 });
  } catch (error) {
    logError("Error in webhook verification", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Global Map to track processed messages and prevent duplicates
const processedMessages = new Map<string, number>();
const processingMessages = new Set<string>();

// Circuit breaker to prevent rapid successive failures
const circuitBreaker = new Map<
  string,
  { failureCount: number; lastFailure: number; isOpen: boolean }
>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  processedMessages.forEach((timestamp, key) => {
    if (timestamp < fiveMinutesAgo) {
      processedMessages.delete(key);
    }
  });

  // Reset circuit breakers after 10 minutes
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  circuitBreaker.forEach((state, key) => {
    if (state.lastFailure < tenMinutesAgo) {
      circuitBreaker.delete(key);
    }
  });
}, 5 * 60 * 1000);

// Helper function to check and update circuit breaker
const checkCircuitBreaker = (userKey: string): boolean => {
  const state = circuitBreaker.get(userKey);
  if (!state) return true; // No failures yet, allow processing

  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  // Reset circuit breaker if enough time has passed
  if (state.lastFailure < fiveMinutesAgo) {
    circuitBreaker.delete(userKey);
    return true;
  }

  // Block if too many failures recently
  if (state.failureCount >= 5 && state.isOpen) {
    logWithTimestamp(
      `Circuit breaker OPEN for user: ${userKey}, blocking request`
    );
    return false;
  }

  return true;
};

const recordFailure = (userKey: string) => {
  const now = Date.now();
  const state = circuitBreaker.get(userKey) || {
    failureCount: 0,
    lastFailure: 0,
    isOpen: false,
  };

  state.failureCount += 1;
  state.lastFailure = now;
  state.isOpen = state.failureCount >= 5;

  circuitBreaker.set(userKey, state);

  if (state.isOpen) {
    logWithTimestamp(
      `Circuit breaker OPENED for user: ${userKey} after ${state.failureCount} failures`
    );
  }
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let step = 0;

  try {
    step = 1;
    let res: any = await req.json();
    logWithTimestamp("Received WhatsApp webhook", {
      hasEntry: !!res?.entry,
      entryLength: res?.entry?.length || 0,
    });

    // Enhanced validation to ignore status updates and delivery receipts
    const change = res?.entry?.[0]?.changes?.[0];
    const value = change?.value;

    // Check if this is a status update (delivery receipt, read receipt, etc.)
    if (value?.statuses && value?.statuses?.length > 0) {
      logWithTimestamp("Received status update, ignoring");
      return new Response("received", { status: 200 });
    }

    // Check if this is a message or something else
    const messages = value?.messages;
    if (!messages || messages.length === 0) {
      logWithTimestamp("No messages in webhook, ignoring");
      return new Response("received", { status: 200 });
    }

    const message = messages[0];
    const messageId = message?.id;
    const messageType = message?.type;

    // Only process text messages
    if (messageType !== "text") {
      logWithTimestamp(
        `Received non-text message type: ${messageType}, ignoring`
      );
      return new Response("received", { status: 200 });
    }

    step = 2;
    let questionFromWhatsapp = message?.text?.body;
    const userPhoneNumber = value?.contacts?.[0]?.wa_id;
    const businessAccountNumber = value?.metadata?.phone_number_id;

    logWithTimestamp(`Extracted question from WhatsApp`, {
      hasQuestion: !!questionFromWhatsapp,
      questionLength: questionFromWhatsapp?.length || 0,
      question: questionFromWhatsapp?.substring(0, 100),
      messageId,
      userPhoneNumber,
      businessAccountNumber,
    });

    if (questionFromWhatsapp === "this is a text message") {
      logWithTimestamp("Received test message, ignoring");
      return new Response("received", { status: 200 });
    }

    if (
      questionFromWhatsapp == undefined ||
      questionFromWhatsapp.trim().length <= 0
    ) {
      logWithTimestamp("No valid question received, ignoring");
      return new Response("received", { status: 200 });
    }

    // Create a unique identifier for this message
    const messageKey = `${businessAccountNumber}:${userPhoneNumber}:${messageId}:${questionFromWhatsapp}`;
    const userCircuitKey = `${businessAccountNumber}:${userPhoneNumber}`;

    // Check circuit breaker first
    if (!checkCircuitBreaker(userCircuitKey)) {
      return new Response("received", { status: 200 });
    }

    // Check if we've already processed this exact message
    if (processedMessages.has(messageKey)) {
      const processedTime = processedMessages.get(messageKey);
      const timeSinceProcessed = Date.now() - processedTime!;
      logWithTimestamp(`Duplicate message detected, ignoring`, {
        messageKey: messageKey.substring(0, 50) + "...",
        timeSinceProcessed: `${timeSinceProcessed}ms`,
      });
      return new Response("received", { status: 200 });
    }

    // Check if we're currently processing this message
    if (processingMessages.has(messageKey)) {
      logWithTimestamp(`Message already being processed, ignoring duplicate`, {
        messageKey: messageKey.substring(0, 50) + "...",
      });
      return new Response("received", { status: 200 });
    }

    // Mark message as being processed
    processingMessages.add(messageKey);

    try {
      step = 3;
      logWithTimestamp("Starting WhatsApp operation");
      await whatsAppOperation(res);

      // Mark message as successfully processed
      processedMessages.set(messageKey, Date.now());

      const totalTime = Date.now() - startTime;
      logWithTimestamp(
        `WhatsApp operation completed successfully in ${totalTime}ms`
      );

      return new Response("received", { status: 200 });
    } catch (operationError: any) {
      // Record failure in circuit breaker
      recordFailure(userCircuitKey);
      throw operationError;
    } finally {
      // Always remove from processing set, even if operation fails
      processingMessages.delete(messageKey);
    }
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    logError(`WhatsApp POST handler failed after ${totalTime}ms`, error, step);

    // Still return 200 to WhatsApp to avoid retries
    return new Response("received", { status: 200 });
  }
}

async function whatsAppOperation(res: any) {
  const operationStartTime = Date.now();
  let step = 0;
  let questionFromWhatsapp = "";
  let userPhoneNumber = "";
  let whatsAppDetailsResult: any = null;

  try {
    step = 1;
    questionFromWhatsapp =
      res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;
    const binessAccountNumber =
      res?.entry?.[0]?.changes?.[0]?.value?.metadata["phone_number_id"];

    logWithTimestamp(`Starting WhatsApp operation`, {
      businessAccountNumber: binessAccountNumber,
      questionLength: questionFromWhatsapp?.length || 0,
    });

    step = 2;
    whatsAppDetailsResult = await getWhatsAppDetails(binessAccountNumber);
    userPhoneNumber = getResponseNumber(res);

    if (!whatsAppDetailsResult || whatsAppDetailsResult === "error") {
      logWithTimestamp("No valid WhatsApp details found, exiting");
      return;
    }

    logWithTimestamp(`WhatsApp details retrieved`, {
      chatbotId: whatsAppDetailsResult.chatbotId,
      userPhoneNumber,
      isEnabled: whatsAppDetailsResult.isEnabled,
    });

    // Create a user-specific lock to prevent concurrent processing
    const userLockKey = `${binessAccountNumber}:${userPhoneNumber}`;

    if (processingMessages.has(userLockKey)) {
      logWithTimestamp(
        `User ${userPhoneNumber} is already being processed, skipping`,
        {
          userLockKey: userLockKey.substring(0, 30) + "...",
        }
      );
      return;
    }

    // Add user lock
    processingMessages.add(userLockKey);

    try {
      step = 3;
      const db = (await clientPromise!).db();
      const userChatBotcollections = db.collection("user-chatbots");
      const userChatBotResult = await userChatBotcollections.findOne({
        chatbotId: whatsAppDetailsResult.chatbotId,
      });

      if (!userChatBotResult) {
        logWithTimestamp("No chatbot configuration found");
        return;
      }

      step = 4;
      const userCollection = db?.collection("users");
      const userData = await userCollection.findOne({
        _id: new ObjectId(userChatBotResult.userId),
      });

      const endDate = userData?.endDate;
      const currentDate = new Date();

      logWithTimestamp(`User subscription check`, {
        userId: userChatBotResult.userId,
        endDate: endDate?.toISOString(),
        currentDate: currentDate.toISOString(),
        isExpired: currentDate > endDate,
      });

      if (currentDate > endDate) {
        logWithTimestamp("Subscription expired, sending notification");
        await sendMessageToWhatsapp(
          whatsAppDetailsResult.phoneNumberID,
          "+" + userPhoneNumber,
          whatsAppDetailsResult.whatsAppAccessToken,
          "Your subscription has ended"
        );
        return;
      }

      step = 5;
      if (whatsAppDetailsResult.isEnabled === false) {
        logWithTimestamp("Chatbot disabled, exiting");
        return;
      }

      const userID = userChatBotResult.userId;

      // ========== MOVED: Store user message immediately, before processing AI response ==========
      step = 5.5;
      // Create user message with timestamp immediately when we receive it
      const userMessage = createMessageWithTimestamp(
        "user",
        questionFromWhatsapp
      );

      // Get or create chat history and store user message immediately
      let userChatHistoryCollection = db.collection("whatsapp-chat-history");
      let userChatHistory: WhatsAppChatHistoryType =
        await userChatHistoryCollection.findOne({
          userId: userID,
          date: moment().utc().format("YYYY-MM-DD"),
        });

      // Get chatbot settings to determine which API to use (needed for chat history structure)
      let userChatBotSetting = db.collection("chatbot-settings");
      let userChatBotModel = await userChatBotSetting.findOne({
        userId: userID,
        chatbotId: userChatBotResult.chatbotId,
      });

      const useAssistantAPI = userChatBotResult?.botType === "bot-v2";

      // Store user message immediately, before processing AI response
      if (!userChatHistory) {
        const now = new Date();
        const chatDoc: any = {
          userId: userID,
          chatbotId: whatsAppDetailsResult.chatbotId,
          chats: {
            [`${userPhoneNumber}`]: {
              messages: [userMessage], // Only user message for now
              usage: {
                completion_tokens: 0,
                prompt_tokens: 0,
                total_tokens: 0,
              },
            },
          },
          date: moment().utc().format("YYYY-MM-DD"),
          createdAt: now,
          updatedAt: now,
        };

        // If using Assistant API, attempt to create a thread immediately and add the user message
        if (useAssistantAPI) {
          try {
            const thread = await createThread();
            const threadId = thread?.id;
            if (threadId) {
              // update chat doc with threadId and assistantId
              chatDoc.chats[`${userPhoneNumber}`].threadId = threadId;
              chatDoc.chats[`${userPhoneNumber}`].assistantId =
                userChatBotModel?.chatbotId;

              // Add the user message to the thread so assistant has context
              try {
                await addMessageToThread(threadId, questionFromWhatsapp);
                logWithTimestamp(
                  `User message added to new thread: ${threadId}`
                );
              } catch (err) {
                logError("Failed to add user message to new thread", err);
              }
            }
          } catch (err) {
            logError(
              "Failed to create thread when storing new chat history",
              err
            );
          }
        }

        await userChatHistoryCollection.insertOne(chatDoc);

        logWithTimestamp("Created new chat history with user message");
      } else {
        // Update existing chat history with user message
        if (!userChatHistory.chats[`${userPhoneNumber}`]) {
          userChatHistory.chats[`${userPhoneNumber}`] = {
            messages: [userMessage], // Only user message for now
            usage: {
              completion_tokens: 0,
              prompt_tokens: 0,
              total_tokens: 0,
            },
          };

          // If Assistant API, create a thread and add threadId
          if (useAssistantAPI) {
            try {
              const thread = await createThread();
              const threadId = thread?.id;
              if (threadId) {
                userChatHistory.chats[`${userPhoneNumber}`].threadId = threadId;
                userChatHistory.chats[`${userPhoneNumber}`].assistantId =
                  userChatBotModel?.chatbotId;

                try {
                  await addMessageToThread(threadId, questionFromWhatsapp);
                  logWithTimestamp(
                    `User message added to new thread: ${threadId}`
                  );
                } catch (err) {
                  logError("Failed to add user message to new thread", err);
                }
              }
            } catch (err) {
              logError("Failed to create thread for existing chat entry", err);
            }
          }
        } else {
          // Add user message to existing conversation
          userChatHistory.chats[`${userPhoneNumber}`].messages.push(
            userMessage
          );

          // If using Assistant API and there's no threadId, create one and add the user message
          if (
            useAssistantAPI &&
            !userChatHistory.chats[`${userPhoneNumber}`].threadId
          ) {
            try {
              const thread = await createThread();
              const threadId = thread?.id;
              if (threadId) {
                userChatHistory.chats[`${userPhoneNumber}`].threadId = threadId;
                userChatHistory.chats[`${userPhoneNumber}`].assistantId =
                  userChatBotModel?.chatbotId;

                try {
                  await addMessageToThread(threadId, questionFromWhatsapp);
                  logWithTimestamp(
                    `User message added to created thread: ${threadId}`
                  );
                } catch (err) {
                  logError("Failed to add user message to created thread", err);
                }
              }
            } catch (err) {
              logError(
                "Failed to create thread for existing conversation",
                err
              );
            }
          } else {
            try {
              await addMessageToThread(
                userChatHistory.chats[`${userPhoneNumber}`].threadId!,
                questionFromWhatsapp
              );
              logWithTimestamp(
                `User message added to existing thread: ${
                  userChatHistory.chats[`${userPhoneNumber}`].threadId
                }`
              );
            } catch (err) {
              logError("Failed to add user message to new thread", err);
            }
          }
        }

        // Update in database immediately
        await userChatHistoryCollection.updateOne(
          { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
          {
            $set: {
              chats: userChatHistory.chats,
              updatedAt: new Date(),
            },
          }
        );

        logWithTimestamp("Added user message to existing chat history");
      }
      // ========== END MOVED SECTION ==========

      // New: If the incoming user's phone number already exists in the
      // whatsappbot_details document for this chatbot+user, do not send any
      // WhatsApp messages and return early. This prevents duplicate/outbound
      // notifications to phone numbers that are already registered.
      step = 6;
      try {
        const whatsAppDetailsCollection = db.collection("whatsappbot_details");
        const numberForms = [userPhoneNumber, `+${userPhoneNumber}`];

        const existingNumberDoc = await whatsAppDetailsCollection.findOne({
          chatbotId: whatsAppDetailsResult.chatbotId,
          userId: userID,
          numbers: { $in: numberForms },
        });

        if (existingNumberDoc) {
          logWithTimestamp(
            "Incoming number already present in whatsappbot_details, skipping any outbound messages",
            {
              chatbotId: whatsAppDetailsResult.chatbotId,
              userId: userID,
              userPhoneNumber,
            }
          );
          return; // early return; finally block will still remove user lock
        }
      } catch (err) {
        logError("Error checking existing numbers in whatsappbot_details", err);
        // proceed normally if the check fails (do not block processing)
      }

      step = 7;
      const userDetailsCollection = db?.collection("user-details");
      const userDetailsResult = await userDetailsCollection.findOne({
        userId: userID,
      });

      logWithTimestamp(`User limits check`, {
        totalMessageCount: userDetailsResult?.totalMessageCount || 0,
        messageLimit: userDetailsResult?.messageLimit || 0,
        limitReached:
          (userDetailsResult?.totalMessageCount || 0) >=
          (userDetailsResult?.messageLimit || 0),
      });

      if (
        (userDetailsResult?.totalMessageCount || 0) >=
        (userDetailsResult?.messageLimit || 0)
      ) {
        logWithTimestamp("Message limit reached, sending notification");
        await sendMessageToWhatsapp(
          whatsAppDetailsResult.phoneNumberID,
          "+" + userPhoneNumber,
          whatsAppDetailsResult.whatsAppAccessToken,
          "Your limit reached please upgrade your plan"
        );
        return;
      }

      step = 8;
      // userChatBotModel was already fetched above, so we can use it directly
      if (!userChatBotModel) {
        logWithTimestamp("No chatbot model configuration found");
        return;
      }

      logWithTimestamp(`Chatbot configuration`, {
        model: userChatBotModel?.model,
        botType: userChatBotResult?.botType,
        hasAssistantId: !!userChatBotModel?.chatbotId,
        temperature: userChatBotModel?.temperature,
      });

      step = 9;
      let similaritySearchResults = "";

      // Only call Pinecone for Chat Completion API (bot-v1)
      // Assistant API (bot-v2) will handle context through file uploads or instructions
      if (!useAssistantAPI) {
        logWithTimestamp("Calling Pinecone API for context", {
          chatbotId: whatsAppDetailsResult.chatbotId,
          userId: userID,
          questionLength: questionFromWhatsapp.length,
        });

        const pineconeStartTime = Date.now();
        const response: any = await makeAPICallWithTimeout(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userQuery: questionFromWhatsapp,
              chatbotId: whatsAppDetailsResult.chatbotId,
              userId: userID,
            }),
          },
          45000, // 45 second timeout for Pinecone
          1 // Only 1 retry for Pinecone to avoid loops
        );

        const pineconeTime = Date.now() - pineconeStartTime;
        const respText = await response.text();
        similaritySearchResults = respText;

        logWithTimestamp(`Pinecone API completed in ${pineconeTime}ms`, {
          responseLength: similaritySearchResults?.length || 0,
          responsePreview: similaritySearchResults?.substring(0, 200),
        });
      }

      step = 10;
      let aiResponse: string = "";
      let usage: any = {
        completion_tokens: 0,
        prompt_tokens: 0,
        total_tokens: 0,
      };

      if (useAssistantAPI) {
        // Use Assistant API
        logWithTimestamp("Using Assistant API for response generation");

        let threadId: any;

        // Get fresh chat history to check for threadId
        userChatHistory = await userChatHistoryCollection.findOne({
          userId: userID,
          date: moment().utc().format("YYYY-MM-DD"),
        });

        // Check if we have existing chat history with threadId
        if (userChatHistory?.chats?.[`${userPhoneNumber}`]?.threadId) {
          threadId = userChatHistory.chats[`${userPhoneNumber}`].threadId;
          logWithTimestamp(`Using existing thread: ${threadId}`);
        } else {
          // Create new thread
          const thread = await createThread();
          threadId = thread.id;
          logWithTimestamp(`Created new thread: ${threadId}`);

          // Update the threadId in database immediately
          await userChatHistoryCollection.updateOne(
            { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
            {
              $set: {
                [`chats.${userPhoneNumber}.threadId`]: threadId,
                updatedAt: new Date(),
              },
            }
          );
        }

        const messages1: any = await openai.beta.threads.messages.list(
          threadId
        );

        for (const msg of messages1.data) {
          console.log(
            `${msg.role}: ${extractMessageText(msg)}`,
            "$$$$$$$$$$$$$$$$$$$$$$$$"
          );
        }

        // // Add user message to thread
        // await addMessageToThread(threadId, questionFromWhatsapp);

        // Run the assistant
        const run = await runAssistant(
          threadId,
          userChatBotModel.chatbotId,
          userChatBotModel?.instruction
        );

        // Wait for completion
        await waitForRunCompletionWithActions(
          threadId,
          run.id,
          whatsAppDetailsResult.chatbotId,
          userID,
          userChatHistory?.chats?.[`${userPhoneNumber}`]?.messages || []
        );

  // Get the assistant's response
  const messages: any = await getThreadMessages(threadId);
  // Use safe extractor in case the message shape is different
  aiResponse = extractMessageText(messages.data[0]) || "";

        // Estimate usage for Assistant API
        usage = {
          completion_tokens: encode(aiResponse).length,
          prompt_tokens: encode(questionFromWhatsapp).length,
          total_tokens:
            encode(aiResponse).length + encode(questionFromWhatsapp).length,
        };

        // Now add assistant response to existing chat history
        const assistantMessage = createMessageWithTimestamp(
          "assistant",
          aiResponse
        );

        // Get updated chat history (in case it was modified during processing)
        userChatHistory = await userChatHistoryCollection.findOne({
          userId: userID,
          date: moment().utc().format("YYYY-MM-DD"),
        });

        userChatHistory.chats[`${userPhoneNumber}`].messages.push(
          assistantMessage
        );

        // Update usage
        if (!userChatHistory.chats[`${userPhoneNumber}`]?.usage) {
          userChatHistory.chats[`${userPhoneNumber}`].usage = {
            completion_tokens: 0,
            prompt_tokens: 0,
            total_tokens: 0,
          };
        }
        userChatHistory.chats[`${userPhoneNumber}`].usage.completion_tokens +=
          usage.completion_tokens;
        userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens +=
          usage.prompt_tokens;
        userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens +=
          usage.total_tokens;

        // Update in database with assistant response
        await userChatHistoryCollection.updateOne(
          { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
          {
            $set: {
              chats: userChatHistory.chats,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        // Use Chat Completion API (existing logic with modifications)
        logWithTimestamp("Using Chat Completion API for response generation");

        let conversationMessages: any = [];
        let similarSearchToken = encode(similaritySearchResults).length;
        let instructionTokenLength = encode(
          userChatBotModel?.instruction
        ).length;
        let currentQuestionsTotalTokens = encode(questionFromWhatsapp).length;

        // Get fresh chat history to get all messages including the user message we just stored
        userChatHistory = await userChatHistoryCollection.findOne({
          userId: userID,
          date: moment().utc().format("YYYY-MM-DD"),
        });

        // Handle existing chat history for Chat Completion API
        if (userChatHistory?.chats?.[`${userPhoneNumber}`]) {
          let previousTotalTokens = userChatHistory.chats[`${userPhoneNumber}`]
            .usage.total_tokens as number;
          let totalCountedToken =
            previousTotalTokens +
            currentQuestionsTotalTokens +
            similarSearchToken;

          // Get all messages except the last one (which is the current user message we just added)
          conversationMessages = userChatHistory.chats[
            `${userPhoneNumber}`
          ].messages.slice(0, -1);

          // Token limit management
          const tokenLimits = [
            { model: "gpt-3.5-turbo", tokens: 4000 },
            { model: "gpt-4", tokens: 8000 },
            { model: "gpt-4-turbo", tokens: 128000 },
          ];

          for (const limit of tokenLimits) {
            if (
              limit.model === userChatBotModel.model &&
              totalCountedToken >= limit.tokens
            ) {
              let tokensToRemove = totalCountedToken - limit.tokens;
              let index = 0;
              let tokens = 0;

              while (
                tokens < tokensToRemove &&
                index < conversationMessages.length
              ) {
                tokens += calculateTokens(conversationMessages[index]);
                index++;
              }

              conversationMessages.splice(0, index);
              break;
            }
          }
        }

        // Make OpenAI API call
        const responseOpenAI: any = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: userChatBotModel.model,
              temperature: userChatBotModel?.temperature ?? 0,
              top_p: 1,
              messages: [
                {
                  role: "system",
                  content: `${userChatBotModel?.instruction}

                  context:
               ${similaritySearchResults}`,
                },
                ...cleanMessagesForOpenAI(conversationMessages),
                {
                  role: "user",
                  content: `query: ${questionFromWhatsapp}`,
                },
              ],
            }),
          }
        );

        const openaiBody = JSON.parse(await responseOpenAI.text());
        aiResponse = openaiBody.choices[0].message.content;
        usage = openaiBody.usage;

        // Add assistant response to existing chat history
        const assistantMessage = createMessageWithTimestamp(
          "assistant",
          aiResponse
        );

        // Get fresh chat history again to ensure we have latest data
        userChatHistory = await userChatHistoryCollection.findOne({
          userId: userID,
          date: moment().utc().format("YYYY-MM-DD"),
        });

        // Add assistant message to existing conversation
        userChatHistory.chats[`${userPhoneNumber}`].messages.push(
          assistantMessage
        );

        // Update usage tokens
        let oldTotalTokens =
          userChatHistory.chats[`${userPhoneNumber}`].usage.total_tokens;
        let userEnterToken = currentQuestionsTotalTokens;
        let openAICompletionToken = usage.completion_tokens;
        oldTotalTokens += userEnterToken + openAICompletionToken;

        let oldPromptTokens =
          userChatHistory.chats[`${userPhoneNumber}`].usage.prompt_tokens;
        oldPromptTokens += currentQuestionsTotalTokens;

        userChatHistory.chats[`${userPhoneNumber}`].usage = {
          completion_tokens: usage.completion_tokens,
          prompt_tokens: oldPromptTokens,
          total_tokens: oldTotalTokens,
        };

        // Update in database with assistant response
        await userChatHistoryCollection.updateOne(
          { userId: userID, date: moment().utc().format("YYYY-MM-DD") },
          {
            $set: {
              chats: userChatHistory.chats,
              updatedAt: new Date(),
            },
          }
        );
      }

      // Update message count
      const collections = db?.collection("user-details");
      const result = await collections.findOne({ userId: userID });
      if (result?.totalMessageCount !== undefined && aiResponse) {
        await collections.updateOne(
          { userId: userID },
          { $set: { totalMessageCount: result.totalMessageCount + 1 } }
        );
      }

      step = 12;
      // Send response to WhatsApp (format assistant HTML to WhatsApp-friendly text first)
      if (aiResponse) {
        const formattedMessage = await formatMessageForWhatsApp(aiResponse);
        await sendMessageToWhatsapp(
          whatsAppDetailsResult.phoneNumberID,
          "+" + userPhoneNumber,
          whatsAppDetailsResult.whatsAppAccessToken,
          formattedMessage
        );
      }

      const operationTime = Date.now() - operationStartTime;
      logWithTimestamp(`WhatsApp operation completed in ${operationTime}ms`);
    } finally {
      // Always remove user lock
      processingMessages.delete(userLockKey);
    }
  } catch (error: any) {
    const operationTime = Date.now() - operationStartTime;
    logError(`WhatsApp operation failed after ${operationTime}ms`, error, step);

    // Send error notification to user if we have the details
    if (whatsAppDetailsResult && userPhoneNumber) {
      try {
        await sendMessageToWhatsapp(
          whatsAppDetailsResult.phoneNumberID,
          "+" + userPhoneNumber,
          whatsAppDetailsResult.whatsAppAccessToken,
          "I'm experiencing technical difficulties. Please try again in a moment."
        );
      } catch (notificationError) {
        logError("Failed to send error notification", notificationError);
      }
    }

    throw error; // Re-throw to be handled by caller
  }
}

// Helper function to create message with timestamp
function createMessageWithTimestamp(role: string, content: string) {
  const now = new Date();
  const timestamp = now.toISOString();
  const messageTime = moment(now).format("YYYY/MM/DD HH:mm:ss"); // Format like 2025/08/05 10:10:59

  return {
    role,
    content,
    timestamp,
    messageTime,
  };
}

// Helper function to clean messages for OpenAI API (remove additional parameters)
function cleanMessagesForOpenAI(messages: any[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

// Helper to safely extract text value from OpenAI thread message objects
function extractMessageText(msg: any): string | null {
  try {
    // Newer thread messages may have content as array with types
    // e.g. msg.content[0].text.value OR msg.content[0].text OR msg.content[0].text?.value
    if (!msg) return null;

    // If message has a simple 'content' string
    if (typeof msg.content === "string") return msg.content;

    // If content is array-like
    if (Array.isArray(msg.content) && msg.content.length > 0) {
      const c0 = msg.content[0];
      // nested structure: c0.text.value
      if (c0 && typeof c0 === "object") {
        if (c0.text && typeof c0.text === "object") {
          // prefer .value if present
          if (typeof c0.text.value === "string") return c0.text.value;
          if (typeof c0.text === "string") return c0.text;
        }

        // sometimes content[0] can have a 'text' field directly as string
        if (typeof c0 === "string") return c0;
      }
    }

    // Fallbacks for other shapes
    if (msg?.content?.[0]?.text) {
      const t = msg.content[0].text;
      if (typeof t === "string") return t;
      if (typeof t?.value === "string") return t.value;
    }

    // Try other common fields
    if (msg?.message) return msg.message;

    return null;
  } catch (e) {
    return null;
  }
}

// Token calculation helper (unchanged)
function calculateTokens(conversationMessages: {
  role: string;
  content: string;
  timestamp?: string;
  messageTime?: string;
}) {
  const token = encode(conversationMessages.content).length;
  return token;
}
