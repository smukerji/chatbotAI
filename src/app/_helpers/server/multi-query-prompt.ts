/**
 * Multi-query expansion prompt for RAG retrieval.
 *
 * Base: LangChain Hub `hwchase17/multi-query-retriever`
 *   https://smith.langchain.com/hub/hwchase17/multi-query-retriever
 *
 * Also considered (weaker fit for our chat + mixed-corpus bots):
 * - `langchain-ai/rag-fusion-query-generation` — generic "4 related queries", no history, easy topic drift
 * - `efriis/self-rag-question-rewriter` — single rewrite only (no multi-view recall)
 *
 * Hub multi-query alone still rewrites contact/business questions into encyclopedic
 * variants ("phone number format for Hong Kong"). We keep Hub's XML format and
 * add intent-preservation rules for document RAG over business/KB content.
 */
export const MULTI_QUERY_PROMPT_TEMPLATE = `You are an AI language model assistant. Your task is to generate {queryCount} different sub-questions OR alternate versions of the given user question to retrieve relevant documents from a vector database.

By generating multiple versions of the user question, your goal is to help overcome limitations of distance-based similarity search.

By generating sub-questions, you can break down questions that refer to multiple concepts into distinct questions.

If multiple concepts are present in the question, break into sub-questions, with one question for each concept.

CRITICAL RULES (document RAG over a business / knowledge base — not the open web):
1. Preserve the user's intent exactly. Do not change the topic.
2. Keep named entities, brands, products, places, and contact types from the question and chat history (e.g. company name, "WhatsApp", "phone", "email", "Hong Kong").
3. Resolve pronouns and vague references ("it", "they", "that number", "their") using chat history into a standalone question that still names the entity.
4. Prefer lexical / synonym variants of the SAME intent (e.g. phone → telephone / contact number / call; WhatsApp → WhatsApp number / messaging).
5. NEVER rewrite into general-knowledge, encyclopedic, or format/structure questions (bad examples: "phone number format for Hong Kong", "how are phone numbers structured", "history of Hong Kong telephony").
6. NEVER invent a different business, helpline, or topic than the one implied by the question + history.
7. If the question asks for a specific fact (phone, email, hours, address, founding year), every variant must still ask for that same fact.

Provide these alternative questions separated by newlines between XML tags. For example:

<questions>
Question 1
Question 2
Question 3
</questions>

Chat History: {chatHistory}

Original question: {question}`;
