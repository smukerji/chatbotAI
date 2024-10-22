/// assistant type
export enum AssistantType {
  QNA_AGENT_DATA = "qna-agent-data",
  SALES_AGENT_SHOPIFY = "sales-agent-shopify",
  CUSTOMER_SUPPORT_AGENT_BOOKING = "customer-support-agent-booking",
}

/// system prompts and tools for assistant
export function getSystemInstruction(type: string) {
  switch (type) {
    case AssistantType.SALES_AGENT_SHOPIFY:
      return `
                You are a helpful shopping assistant tasked with matching customers with the right products on Shopify.

                Utilize the available functions effectively to assist customers: 
                - Use "find_product" to search for specific products.
                - Retrieve a customer's past orders using "get_customer_orders" with their email address.
                - Retrieve products list using "get_products". 

                Provide responses in HTML format, ensuring instructions are clear. Include product images using "<img>" tags when available.

                # Steps

                1. Assess customer needs based on their inquiry.
                2. Use "find_product" to locate products that meet the customer's request.
                3. If relevant, access past purchase information using "get_customer_orders" to refine recommendations.
                4. Use "get_products" to suggest additional products for the customer to consider.
                5. Structure your response in HTML format, utilizing tags like "<p>" for instructions and "<img>" for images.
                6. Embed product images with "<img>" tags if image links are available.

                # Output Format

                - HTML format: Include detailed instructions and embed images.
                - Use appropriate HTML tags such as "<p>" for instructions and "<img>" for images.

                # Examples

                **Example Start**

                **Input:**
                Customer inquiry about running shoes.

                **Output:**
                <p>Hello! Based on your interest, I found some great running shoes for you:</p>
                <div>Product 1: Running Shoe A <img src="https://example.com/imageA.jpg" alt="Running Shoe A"></div>
                <div>Product 2: Running Shoe B <img src="https://example.com/imageB.jpg" alt="Running Shoe B"></div>
                <p>You can view more details and make a purchase through our store link. If you need further assistance, feel free to ask!</p>
                **Example End**

                # Notes

                - Ensure the HTML is well-structured for clarity and comprehension.
                - Always include images where available to enhance the shopping experience.
                - Focus on clear instructions and relevant product recommendations based on customer's needs and order history.
      `;
    case "fallback":
      return "I'm sorry, I'm still learning. Could you please rephrase your question?";
    case "goodbye":
      return "Goodbye! Have a great day!";
    default:
      return "Hello! What can I help you with today?";
  }
}

type FunctionParameter = {
  type: "object";
  properties: {
    [key: string]: {
      type: string;
      description: string;
      enum?: string[];
    };
  };
  required: string[];
};

type FunctionDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: FunctionParameter;
    strict?: boolean;
  };
};

type FunctionsArray = FunctionDefinition[];

export function getAssistantTools(type: string): FunctionsArray {
  switch (type) {
    case AssistantType.SALES_AGENT_SHOPIFY:
      return [
        {
          type: "function",
          function: {
            name: "find_product",
            description:
              "This function will find the product with the given product details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the product",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_customer_orders",
            description:
              "This function will get all the customer order based on the email id.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The email of customer",
                },
              },
              required: [],
            },
          },
        },

        {
          type: "function",
          function: {
            name: "get_products",
            description:
              "This function will get the product to suggest/recommed products to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
      ];
    case "rate-limit-time":
      return [];
    case "rate-limit-count":
      return [];
    default:
      return [];
  }
}
