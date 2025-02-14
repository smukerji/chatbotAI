import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import dotenv from "dotenv";
dotenv.config();

export const functionCallHandler = async (
  call: RequiredActionFunctionToolCall,
  chatbotId: string,
  userID: string,
  messages: any
): Promise<any> => {
  try {
    /// get the function name and arguments
    const functionName = call?.function?.name;
    const args = JSON.parse(call.function.arguments);
    /// shopify example
    if (functionName === "find_product") {
      /// get the product name and return the product details
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/integrations/shopify/products`,
        {
          body: JSON.stringify({
            product_name: args.query,
            chatbotId: chatbotId,
          }),
          method: "POST",
        }
      );

      if (response.ok) {
        return JSON.stringify({ success: true, data: await response.json() });
      }
    } else if (functionName === "get_customer_orders") {
      /// get the customer orders and return the orders
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/api/integrations/shopify/orders`,
        {
          body: JSON.stringify({
            email: args.email,
            chatbotId: chatbotId,
          }),
          method: "POST",
        }
      );

      if (response.ok) {
        return JSON.stringify({ success: true, data: await response.json() });
      }
    } else if (functionName === "get_products") {
      /// get product recommendation / suggestion
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/shopify/products?chatbotId=${chatbotId}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        return JSON.stringify({ success: true, data: await response.json() });
      }
    } else if (functionName === "get_reference") {
      /// answer user query based on the embedding data
      /// get similarity search
      const response: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
        {
          method: "POST",
          body: JSON.stringify({
            userQuery: args.userQuery,
            chatbotId: chatbotId,
            messages,
            userId: userID,
          }),
        }
      );
      /// parse the response and extract the similarity results
      const respText = await response.text();
      const similaritySearchResults = respText;

      return JSON.stringify({
        success: true,
        data: similaritySearchResults,
      });
    } else {
      return JSON.stringify({
        success: false,
        message: "This functionality will be available soon",
      });
    }
  } catch (error) {
    console.log("Error while handling function call", error);
    return JSON.stringify({
      success: false,
      message: "Error while proccesing your request",
    });
  }
};
