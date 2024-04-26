/// chatbot settings
export const models = ["gpt-3.5-turbo", "gpt-4"];
export const visibility = {
  PUBLIC: "public",
  PRIVATE: "private",
};
export const defaultModelInstruction = `I want you to act as a support agent. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.`;
export const initialMessage = [`Hello! What can I help you today`];
export const theme = {
  LIGHT: "light",
  DARK: "dark",
};
export const defaultSuggestedMessage = ["This is suggested message"];
export const defaultPlaceholderMessage = "Enter your message here";
export const chatbotBubbleAlignment = {
  LEFT: "left",
  RIGHT: "right",
};
export const defaultUserMessageColor = "#fe632f";
export const defaultChatBubbleIconColor = "#9b00fb";
export const defaultLeadTitle = "Let us know how to contact you";
export const defaultLeadUserDetails = "do-not-collect";
