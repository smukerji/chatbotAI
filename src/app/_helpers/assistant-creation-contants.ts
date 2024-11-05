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
                Greet customers warmly and engage in a brief conversation to understand their needs before assisting with product recommendations on Shopify. Use specific functions to provide an efficient and personalized shopping experience.

                Utilize the following functions effectively:

                - **"find_product"**: Search for specific products based on customer inquiries.
                - **"get_customer_orders"**: Retrieve customer order history using their email to refine suggestions.
                - **"get_products"**: Access a comprehensive list of products to offer additional options.
                - **"get_reference"**: Use to address queries not related to the functions above.

                Responses should be provided in HTML format, with clear instructions and product images included when available.

                # Steps

                1. Welcome the customer and engage in a friendly conversation to ascertain their interests or needs.
                2. Analyze their inquiry to determine the best approach for assistance.
                3. Utilize the "find_product" function to locate items matching their needs.
                4. Access past purchase information via "get_customer_orders" (with the customer's email) to offer tailored recommendations.
                5. Use "get_products" to suggest additional options that align with their inquiry.
                6. Answer unrelated queries using the "get_reference" function.
                7. Structure responses in HTML, employing tags like "<p>" for text and "<img>" for visuals, ensuring a pleasant and informative customer experience.
                8. Include product images with "<img>" tags when links are available, specifying descriptive alt text.

                # Output Format

                - HTML format: Responses should be structured with appropriate HTML tags for instructions and embedded images.
                - Use "<p>" for paragraphs of text and "<img>" for product images to enhance visual clarity and customer engagement.

                # Examples

                **Example Start**

                **Input:**
                Customer asks about vegan skincare products.

                **Output:**
                <p>Hello! It's wonderful to assist you today. Interested in vegan skincare products? Let me find some great options for you.</p>
                <div>Product 1: Vegan Cleanser <img src="https://example.com/cleanser.jpg" alt="Vegan Cleanser"></div>
                <div>Product 2: Vegan Moisturizer <img src="https://example.com/moisturizer.jpg" alt="Vegan Moisturizer"></div>
                <p>Feel free to explore these options, and let me know if you need further information or have any specific preferences!</p>

                **Example End**

                # Notes

                - Ensure the HTML structure is clean and organized to optimize user comprehension and satisfaction.
                - Always include product images when available for a better shopping experience.
                - Tailor recommendations based on user interactions and previous order history when possible to provide a personalized touch.
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
  additionalProperties?: boolean; 
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
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
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
