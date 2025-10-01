// import { NextRequest, NextResponse } from "next/server";
// import clientPromise from "@/db";
// import { ObjectId } from "mongodb";
// import moment from "moment";
// import OpenAI from "openai";

// // MongoDB-based message queue
// class MongoMessageQueue {
//   private db: any;
//   private queueCollection: string = 'message_queue';

//   constructor(db: any) {
//     this.db = db;
//     this.ensureIndexes();
//   }

//   private async ensureIndexes() {
//     const collection = this.db.collection(this.queueCollection);

//     // Index for efficient dequeue operations
//     await collection.createIndex({
//       status: 1,
//       priority: -1,
//       createdAt: 1
//     });

//     // Index for cleanup operations
//     await collection.createIndex({
//       status: 1,
//       processingStartedAt: 1
//     });

//     // TTL index for automatic cleanup of completed messages
//     await collection.createIndex({
//       completedAt: 1
//     }, {
//       expireAfterSeconds: 86400 // 24 hours
//     });
//   }

//   // Enqueue message
//   async enqueue(message: QueuedMessage, priority: number = 0): Promise<void> {
//     const queueItem = {
//       _id: new ObjectId(),
//       messageId: message.id,
//       status: 'pending',
//       priority,
//       attempts: 0,
//       maxAttempts: 3,
//       data: message,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     await this.db.collection(this.queueCollection).insertOne(queueItem);

//     logWithTimestamp(`Message queued`, {
//       messageId: message.id,
//       queueId: queueItem._id.toString()
//     });
//   }

//   // Dequeue next available message
//   async dequeue(workerId: string): Promise<QueuedMessage | null> {
//     const collection = this.db.collection(this.queueCollection);

//     // Find and update in one atomic operation
//     const result = await collection.findOneAndUpdate(
//       {
//         status: 'pending',
//         attempts: { $lt: 3 }
//       },
//       {
//         $set: {
//           status: 'processing',
//           workerId,
//           processingStartedAt: new Date(),
//           updatedAt: new Date()
//         },
//         $inc: { attempts: 1 }
//       },
//       {
//         sort: { priority: -1, createdAt: 1 }, // Priority then FIFO
//         returnDocument: 'after'
//       }
//     );

//     if (!result.value) return null;

//     logWithTimestamp(`Message dequeued`, {
//       queueId: result.value._id.toString(),
//       messageId: result.value.messageId,
//       worker: workerId,
//       attempt: result.value.attempts
//     });

//     return result.value.data as QueuedMessage;
//   }

//   // Mark message as completed
//   async markCompleted(messageId: string, workerId: string): Promise<void> {
//     await this.db.collection(this.queueCollection).updateOne(
//       { messageId, workerId },
//       {
//         $set: {
//           status: 'completed',
//           completedAt: new Date(),
//           updatedAt: new Date()
//         }
//       }
//     );

//     logWithTimestamp(`Message completed`, { messageId, worker: workerId });
//   }

//   // Mark message as failed
//   async markFailed(messageId: string, workerId: string, error: string): Promise<void> {
//     await this.db.collection(this.queueCollection).updateOne(
//       { messageId, workerId },
//       {
//         $set: {
//           status: 'failed',
//           error,
//           failedAt: new Date(),
//           updatedAt: new Date()
//         }
//       }
//     );

//     logError(`Message failed`, { messageId, worker: workerId, error });
//   }

//   // Get queue statistics
//   async getStats(): Promise<QueueStats> {
//     const collection = this.db.collection(this.queueCollection);

//     const [pending, processing, completed, failed] = await Promise.all([
//       collection.countDocuments({ status: 'pending' }),
//       collection.countDocuments({ status: 'processing' }),
//       collection.countDocuments({ status: 'completed' }),
//       collection.countDocuments({ status: 'failed' })
//     ]);

//     return { pending, processing, completed, failed };
//   }

//   // Cleanup stale processing messages (worker crashed)
//   async cleanupStaleMessages(staleTimeoutMs: number = 5 * 60 * 1000): Promise<number> {
//     const staleTime = new Date(Date.now() - staleTimeoutMs);

//     const result = await this.db.collection(this.queueCollection).updateMany(
//       {
//         status: 'processing',
//         processingStartedAt: { $lt: staleTime }
//       },
//       {
//         $set: {
//           status: 'pending',
//           workerId: null,
//           processingStartedAt: null,
//           updatedAt: new Date()
//         }
//       }
//     );

//     if (result.modifiedCount > 0) {
//       logWithTimestamp(`Cleaned up ${result.modifiedCount} stale messages`);
//     }

//     return result.modifiedCount;
//   }

//   // Retry failed messages (manual retry)
//   async retryFailedMessages(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
//     const cutoffTime = new Date(Date.now() - maxAge);

//     const result = await this.db.collection(this.queueCollection).updateMany(
//       {
//         status: 'failed',
//         failedAt: { $gt: cutoffTime },
//         attempts: { $lt: 3 }
//       },
//       {
//         $set: {
//           status: 'pending',
//           workerId: null,
//           error: null,
//           failedAt: null,
//           processingStartedAt: null,
//           updatedAt: new Date()
//         }
//       }
//     );

//     logWithTimestamp(`Retried ${result.modifiedCount} failed messages`);
//     return result.modifiedCount;
//   }
// }

// // Worker class for MongoDB queue
// class MongoMessageWorker {
//   private queue: MongoMessageQueue;
//   private db: any;
//   private isRunning: boolean = false;
//   private workerId: string;
//   private processingInterval: NodeJS.Timeout | null = null;

//   constructor(workerId: string) {
//     this.workerId = workerId;
//   }

//   async start(): Promise<void> {
//     if (this.isRunning) return;

//     this.isRunning = true;
//     this.db = (await clientPromise!).db();
//     this.queue = new MongoMessageQueue(this.db);

//     logWithTimestamp(`MongoDB Worker ${this.workerId} started`);

//     // Start processing loop
//     this.startProcessingLoop();

//     // Start cleanup routine
//     this.startCleanupRoutine();
//   }

//   async stop(): Promise<void> {
//     this.isRunning = false;

//     if (this.processingInterval) {
//       clearInterval(this.processingInterval);
//       this.processingInterval = null;
//     }

//     logWithTimestamp(`MongoDB Worker ${this.workerId} stopped`);
//   }

//   private startProcessingLoop(): void {
//     this.processingInterval = setInterval(async () => {
//       if (!this.isRunning) return;

//       try {
//         await this.processNextMessage();
//       } catch (error) {
//         logError(`Worker ${this.workerId} processing error`, error);
//       }
//     }, 1000); // Check for new messages every second
//   }

//   private async processNextMessage(): Promise<void> {
//     const message = await this.queue.dequeue(this.workerId);
//     if (!message) return; // No messages available

//     const startTime = Date.now();

//     try {
//       // Acquire conversation-level lock
//       const phoneKey = message.userPhoneNumber.replace(/^\+/, '');
//       const lockKey = `lock:${message.userID}:${message.whatsAppDetailsResult.chatbotId}:${phoneKey}`;

//       const lockAcquired = await this.acquireLock(lockKey, 30);
//       if (!lockAcquired) {
//         // Lock failed, message will be retried later due to stale cleanup
//         logWithTimestamp(`Failed to acquire lock for ${message.id}, will retry later`);
//         return;
//       }

//       try {
//         // Process the message
//         await this.processMessage(message);

//         // Mark as completed
//         await this.queue.markCompleted(message.id, this.workerId);

//         const processingTime = Date.now() - startTime;
//         logWithTimestamp(`Message processed successfully in ${processingTime}ms`, {
//           messageId: message.id,
//           worker: this.workerId
//         });

//       } finally {
//         await this.releaseLock(lockKey);
//       }

//     } catch (error: any) {
//       const processingTime = Date.now() - startTime;
//       logError(`Message processing failed after ${processingTime}ms`, error);

//       // Mark as failed
//       await this.queue.markFailed(message.id, this.workerId, error.message);

//       // Try to send error message to user
//       try {
//         await this.sendErrorMessage(message);
//       } catch (notificationError) {
//         logError("Failed to send error notification", notificationError);
//       }
//     }
//   }

//   private async acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {
//     const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

//     try {
//       await this.db.collection('worker_locks').insertOne({
//         _id: lockKey,
//         workerId: this.workerId,
//         expiresAt,
//         createdAt: new Date()
//       });

//       // Create TTL index for automatic cleanup
//       await this.db.collection('worker_locks').createIndex(
//         { expiresAt: 1 },
//         { expireAfterSeconds: 0 }
//       );

//       return true;
//     } catch (error: any) {
//       if (error.code === 11000) { // Duplicate key
//         return false;
//       }
//       throw error;
//     }
//   }

//   private async releaseLock(lockKey: string): Promise<void> {
//     await this.db.collection('worker_locks').deleteOne({
//       _id: lockKey,
//       workerId: this.workerId
//     });
//   }

//   private async processMessage(message: QueuedMessage): Promise<void> {
//     // Load conversation context
//     const context = await this.loadConversationContext(message);

//     // Store user message
//     await this.storeUserMessage(message, context);

//     // Generate AI response
//     const aiResponse = await this.generateAIResponse(message, context);

//     if (aiResponse) {
//       // Store AI response
//       await this.storeAIResponse(message, aiResponse, context);

//       // Send WhatsApp message
//       await this.sendWhatsAppMessage(message, aiResponse);

//       // Update message count
//       await this.updateMessageCount(message.userID);
//     }
//   }

//   private async loadConversationContext(message: QueuedMessage): Promise<ConversationContext> {
//     const today = moment().utc().format("YYYY-MM-DD");

//     const chatHistory = await this.db.collection("whatsapp-chat-history").findOne({
//       userId: message.userID,
//       chatbotId: message.whatsAppDetailsResult.chatbotId,
//       date: today
//     });

//     const chatbotSettings = await this.db.collection("chatbot-settings").findOne({
//       userId: message.userID,
//       chatbotId: message.whatsAppDetailsResult.chatbotId,
//     });

//     const phoneKey = message.userPhoneNumber.replace(/^\+/, '');
//     const existingMessages = chatHistory?.chats?.[phoneKey]?.messages || [];
//     const useAssistantAPI = message.userChatBotResult?.botType === "bot-v2";

//     return {
//       userID: message.userID,
//       userPhoneNumber: message.userPhoneNumber,
//       chatbotId: message.whatsAppDetailsResult.chatbotId,
//       messages: existingMessages,
//       threadId: chatHistory?.chats?.[phoneKey]?.threadId,
//       assistantId: chatbotSettings?.chatbotId,
//       chatbotSettings,
//       useAssistantAPI
//     };
//   }

//   private async storeUserMessage(message: QueuedMessage, context: ConversationContext): Promise<void> {
//     const userMessage = this.createMessageWithTimestamp("user", message.questionFromWhatsapp);
//     const today = moment().utc().format("YYYY-MM-DD");
//     const phoneKey = message.userPhoneNumber.replace(/^\+/, '');

//     // Ensure document exists
//     await this.db.collection("whatsapp-chat-history").updateOne(
//       {
//         userId: message.userID,
//         chatbotId: message.whatsAppDetailsResult.chatbotId,
//         date: today
//       },
//       {
//         $setOnInsert: {
//           userId: message.userID,
//           chatbotId: message.whatsAppDetailsResult.chatbotId,
//           date: today,
//           createdAt: new Date(),
//           chats: {}
//         },
//         $set: { updatedAt: new Date() }
//       },
//       { upsert: true }
//     );

//     // Check if phone number conversation exists
//     const existingDoc = await this.db.collection("whatsapp-chat-history").findOne({
//       userId: message.userID,
//       chatbotId: message.whatsAppDetailsResult.chatbotId,
//       date: today
//     });

//     if (!existingDoc.chats[phoneKey]) {
//       // Initialize new conversation
//       const newChatData: any = {
//         messages: [userMessage],
//         usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 }
//       };

//       if (context.threadId) {
//         newChatData.threadId = context.threadId;
//         newChatData.assistantId = context.assistantId;
//       }

//       await this.db.collection("whatsapp-chat-history").updateOne(
//         {
//           userId: message.userID,
//           chatbotId: message.whatsAppDetailsResult.chatbotId,
//           date: today
//         },
//         {
//           $set: {
//             [`chats.${phoneKey}`]: newChatData,
//             updatedAt: new Date()
//           }
//         }
//       );
//     } else {
//       // Add to existing conversation
//       await this.db.collection("whatsapp-chat-history").updateOne(
//         {
//           userId: message.userID,
//           chatbotId: message.whatsAppDetailsResult.chatbotId,
//           date: today
//         },
//         {
//           $push: { [`chats.${phoneKey}.messages`]: userMessage },
//           $set: { updatedAt: new Date() }
//         }
//       );
//     }

//     // Add to thread for Assistant API
//     if (context.useAssistantAPI && context.threadId) {
//       try {
//         const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });
//         await openai.beta.threads.messages.create(context.threadId, {
//           role: "user",
//           content: message.questionFromWhatsapp,
//         });
//       } catch (error) {
//         logError("Failed to add message to thread", error);
//       }
//     }
//   }

//   private async generateAIResponse(message: QueuedMessage, context: ConversationContext): Promise<string> {
//     if (context.useAssistantAPI && context.threadId && context.assistantId) {
//       return await this.generateAssistantResponse(context);
//     } else {
//       return await this.generateChatCompletionResponse(message, context);
//     }
//   }

//   private async generateAssistantResponse(context: ConversationContext): Promise<string> {
//     const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

//     const run = await openai.beta.threads.runs.create(context.threadId!, {
//       assistant_id: context.assistantId!,
//     });

//     // Wait for completion
//     let runStatus = await openai.beta.threads.runs.retrieve(context.threadId!, run.id);
//     let attempts = 0;
//     const maxAttempts = 30;

//     while (runStatus.status === "queued" || runStatus.status === "in_progress") {
//       if (attempts >= maxAttempts) {
//         throw new Error("Assistant run timeout");
//       }
//       await new Promise(resolve => setTimeout(resolve, 2000));
//       runStatus = await openai.beta.threads.runs.retrieve(context.threadId!, run.id);
//       attempts++;
//     }

//     if (runStatus.status === "completed") {
//       const messages = await openai.beta.threads.messages.list(context.threadId!);
//       return messages.data[0]?.content?.[0]?.text?.value || "";
//     } else {
//       throw new Error(`Assistant run failed with status: ${runStatus.status}`);
//     }
//   }

//   private async generateChatCompletionResponse(message: QueuedMessage, context: ConversationContext): Promise<string> {
//     // Get Pinecone context
//     let similaritySearchResults = "";
//     try {
//       const pineconeResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           userQuery: message.questionFromWhatsapp,
//           chatbotId: message.whatsAppDetailsResult.chatbotId,
//           userId: message.userID,
//         }),
//       });
//       similaritySearchResults = await pineconeResponse.text();
//     } catch (error) {
//       logError("Pinecone API failed", error);
//     }

//     const conversationMessages = context.messages
//       .slice(-20)
//       .map(msg => ({ role: msg.role, content: msg.content }));

//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
//       },
//       body: JSON.stringify({
//         model: context.chatbotSettings?.model || "gpt-3.5-turbo",
//         temperature: context.chatbotSettings?.temperature ?? 0,
//         messages: [
//           {
//             role: "system",
//             content: `${context.chatbotSettings?.instruction}\n\ncontext:\n${similaritySearchResults}`
//           },
//           ...conversationMessages,
//           {
//             role: "user",
//             content: `query: ${message.questionFromWhatsapp}`
//           }
//         ],
//       }),
//     });

//     const result = await response.json();
//     return result.choices[0].message.content;
//   }

//   private async storeAIResponse(message: QueuedMessage, aiResponse: string, context: ConversationContext): Promise<void> {
//     const assistantMessage = this.createMessageWithTimestamp("assistant", aiResponse);
//     const today = moment().utc().format("YYYY-MM-DD");
//     const phoneKey = message.userPhoneNumber.replace(/^\+/, '');

//     await this.db.collection("whatsapp-chat-history").updateOne(
//       {
//         userId: message.userID,
//         chatbotId: message.whatsAppDetailsResult.chatbotId,
//         date: today
//       },
//       {
//         $push: { [`chats.${phoneKey}.messages`]: assistantMessage },
//         $set: { updatedAt: new Date() }
//       }
//     );
//   }

//   private async sendWhatsAppMessage(message: QueuedMessage, response: string): Promise<void> {
//     const formattedMessage = await this.formatMessageForWhatsApp(response);

//     const url = `https://graph.facebook.com/v18.0/${message.whatsAppDetailsResult.phoneNumberID}/messages`;
//     const data = {
//       messaging_product: "whatsapp",
//       recipient_type: "individual",
//       to: `+${message.userPhoneNumber}`,
//       type: "text",
//       text: { preview_url: false, body: formattedMessage },
//     };

//     const whatsappResponse = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${message.whatsAppDetailsResult.whatsAppAccessToken}`,
//       },
//       body: JSON.stringify(data),
//     });

//     if (!whatsappResponse.ok) {
//       throw new Error(`WhatsApp API failed: ${whatsappResponse.status} ${whatsappResponse.statusText}`);
//     }
//   }

//   private async sendErrorMessage(message: QueuedMessage): Promise<void> {
//     await this.sendWhatsAppMessage(
//       message,
//       "I'm experiencing technical difficulties. Please try again in a moment."
//     );
//   }

//   private async updateMessageCount(userID: string): Promise<void> {
//     await this.db.collection("user-details").updateOne(
//       { userId: userID },
//       { $inc: { totalMessageCount: 1 } }
//     );
//   }

//   private createMessageWithTimestamp(role: string, content: string) {
//     return {
//       role,
//       content,
//       timestamp: new Date().toISOString(),
//       messageTime: moment().format("YYYY/MM/DD HH:mm:ss")
//     };
//   }

//   private async formatMessageForWhatsApp(message: string): Promise<string> {
//     // Your existing formatting logic
//     return message;
//   }

//   private startCleanupRoutine(): void {
//     const cleanupInterval = setInterval(async () => {
//       if (!this.isRunning) {
//         clearInterval(cleanupInterval);
//         return;
//       }

//       try {
//         await this.queue.cleanupStaleMessages();
//       } catch (error) {
//         logError("Cleanup routine failed", error);
//       }
//     }, 2 * 60 * 1000); // Every 2 minutes
//   }
// }

// // Webhook handler - just enqueues messages
// export async function POST(req: NextRequest) {
//   const startTime = Date.now();

//   try {
//     const res = await req.json();

//     // Fast validation
//     const message = res?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//     if (!message || message.type !== "text") {
//       return new Response("received", { status: 200 });
//     }

//     const questionFromWhatsapp = message.text?.body?.trim();
//     if (!questionFromWhatsapp) {
//       return new Response("received", { status: 200 });
//     }

//     // Quick database lookups
//     const db = (await clientPromise!).db();
//     const businessAccountNumber = res.entry[0].changes[0].value.metadata.phone_number_id;
//     const userPhoneNumber = res.entry[0].changes[0].value.contacts[0].wa_id;

//     const whatsAppDetailsResult = await db.collection("whatsappbot_details").findOne({
//       phoneNumberID: businessAccountNumber,
//       isEnabled: true,
//     });

//     if (!whatsAppDetailsResult) {
//       return new Response("received", { status: 200 });
//     }

//     const userChatBotResult = await db.collection("user-chatbots").findOne({
//       chatbotId: whatsAppDetailsResult.chatbotId,
//     });

//     if (!userChatBotResult) {
//       return new Response("received", { status: 200 });
//     }

//     // Create message for queue
//     const queuedMessage: QueuedMessage = {
//       id: `${businessAccountNumber}:${userPhoneNumber}:${message.id}`,
//       userID: userChatBotResult.userId,
//       userPhoneNumber,
//       questionFromWhatsapp,
//       whatsAppDetailsResult,
//       userChatBotResult,
//       timestamp: startTime
//     };

//     // Enqueue for processing
//     const messageQueue = new MongoMessageQueue(db);
//     await messageQueue.enqueue(queuedMessage);

//     const responseTime = Date.now() - startTime;
//     logWithTimestamp(`Message enqueued in ${responseTime}ms`);

//     return new Response("received", { status: 200 });

//   } catch (error: any) {
//     logError("Webhook handler failed", error);
//     return new Response("received", { status: 200 });
//   }
// }

// // Start MongoDB workers
// export async function startMongoWorkers(workerCount: number = 3): Promise<void> {
//   const workers: MongoMessageWorker[] = [];

//   for (let i = 0; i < workerCount; i++) {
//     const worker = new MongoMessageWorker(`mongo-worker-${i}`);
//     await worker.start();
//     workers.push(worker);
//   }

//   // Graceful shutdown
//   process.on('SIGTERM', async () => {
//     logWithTimestamp('Shutting down MongoDB workers...');
//     await Promise.all(workers.map(worker => worker.stop()));
//     process.exit(0);
//   });
// }

// // Queue monitoring endpoint
// export async function GET(req: NextRequest) {
//   try {
//     const db = (await clientPromise!).db();
//     const queue = new MongoMessageQueue(db);
//     const stats = await queue.getStats();

//     return NextResponse.json({
//       status: 'healthy',
//       stats,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error: any) {
//     return NextResponse.json({
//       status: 'error',
//       error: error.message
//     }, { status: 500 });
//   }
// }

// // Interfaces
// interface QueuedMessage {
//   id: string;
//   userID: string;
//   userPhoneNumber: string;
//   questionFromWhatsapp: string;
//   whatsAppDetailsResult: any;
//   userChatBotResult: any;
//   timestamp: number;
// }

// interface ConversationContext {
//   userID: string;
//   userPhoneNumber: string;
//   chatbotId: string;
//   messages: any[];
//   threadId?: string;
//   assistantId?: string;
//   chatbotSettings: any;
//   useAssistantAPI: boolean;
// }

// interface QueueStats {
//   pending: number;
//   processing: number;
//   completed: number;
//   failed: number;
// }

// const logWithTimestamp = (message: string, data?: any) => {
//   console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
// };

// const logError = (message: string, error: any, step?: number) => {
//   console.error(`[${new Date().toISOString()}] ERROR${step ? ` at step ${step}` : ""}: ${message}`, {
//     error: error.message || error,
//     stack: error.stack,
//   });
// };
