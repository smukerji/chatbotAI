// import userSchemaClientPromise from "@/userSchemaDb";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";

export const functionCallHandler = async (
  call: RequiredActionFunctionToolCall,
  chatbotId: string,
  userID: string,
  messages: any,
  WEB_SEARCH: boolean
): Promise<any> => {
  try {
    /// get the function name and arguments

    WEB_SEARCH = false;

    const functionName = call?.function?.name;
    const args = JSON.parse(call.function.arguments);

    console.log(
      "Function Name: >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>",
      args.userQuery
    );

    // if (WEB_SEARCH === true) {
    // 	console.log('webData>>>>>>>>>>>>>>>>>>>>>>>>>>', 'webData');

    // 	const sonarResponse = await fetch(
    // 		`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/perplexity/sonar`,
    // 		{
    // 			method: 'POST',
    // 			body: JSON.stringify({
    // 				userQuery: args.userQuery,
    // 			}),
    // 		}
    // 	);
    // 	const webData = await sonarResponse.json();

    // 	return JSON.stringify({
    // 		success: true,
    // 		data: webData.message,
    // 		sources: webData.sources,
    // 	});
    // }

    /// shopify example
    if (functionName === "find_product") {
      /// get the product name and return the product details
      const response = await fetch("/api/integrations/shopify/products", {
        body: JSON.stringify({
          product_name: args.query,
          chatbotId: chatbotId,
        }),
        method: "POST",
      });

      if (response.ok) {
        return JSON.stringify({
          success: true,
          data: await response.json(),
        });
      }
    } else if (functionName === "get_customer_orders") {
      /// get the customer orders and return the orders
      const response = await fetch("/api/integrations/shopify/orders", {
        body: JSON.stringify({
          email: args.email,
          chatbotId: chatbotId,
        }),
        method: "POST",
      });

      if (response.ok) {
        return JSON.stringify({
          success: true,
          data: await response.json(),
        });
      }
    } else if (functionName === "get_products") {
      /// get product recommendation / suggestion
      const response = await fetch(
        `/api/integrations/shopify/products?chatbotId=${chatbotId}`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        return JSON.stringify({
          success: true,
          data: await response.json(),
        });
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
    } else if (functionName === "get_db_data") {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/get-db-data`,
        {
          method: "POST",
          body: JSON.stringify({
            collection: args.collection,
            filter: JSON.parse(args.filter),
            projection: JSON.parse(args.projection),
          }),
        }
      );
      const dbData = await response.json();
      console.log("DB Data", dbData);
      return JSON.stringify({
        success: true,
        data: dbData,
      });
      // {"collection":"FSI_2023_DOWNLOAD.xlsx_table_1","filter":{"S1: Demographic Pressures":{"$gt":"9"}}}
      /// get the data from the database based on the filter
      // const db = (await userSchemaClientPromise!).db();
      // const collection = db.collection(args.collection);
      // const filter = JSON.parse(args.filter);
      // const projection = JSON.parse(args.projection);
      // const data = await collection.find(filter, { projection }).toArray();
      // return JSON.stringify({
      //   success: true,
      //   data: JSON.stringify(data),
      // });
    } else if (functionName === "ask_relevant_followup_questions") {
      return JSON.stringify({
        success: true,
      });
    } else if (functionName === "get_search_results") {
      const sonarResponse = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/perplexity/sonar`,
        {
          method: "POST",
          body: JSON.stringify({
            userQuery: args.userQuery,
          }),
        }
      );
      const webData = await sonarResponse.json();

      return JSON.stringify({
        success: true,
        data: webData.message,
        sources: webData.sources,
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
