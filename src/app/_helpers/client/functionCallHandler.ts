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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/shopify/products`,
        {
          body: JSON.stringify({
            product_name: args.query,
            chatbotId: chatbotId,
          }),
          method: "POST",
        }
      );

      if (response.ok) {
        return JSON.stringify({
          success: true,
          data: [
            {
              source: "shopify store",
              content: await response.json(),
            },
          ],
        });
      }
    } else if (functionName === "get_customer_orders") {
      /// get the customer orders and return the orders
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/shopify/orders`,
        {
          body: JSON.stringify({
            email: args.email,
            chatbotId: chatbotId,
          }),
          method: "POST",
        }
      );

      if (response.ok) {
        return JSON.stringify({
          success: true,
          data: [
            {
              source: "shopify store",
              content: await response.json(),
            },
          ],
        });
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
        return JSON.stringify({
          success: true,
          data: [
            {
              source: "shopify store",
              content: await response.json(),
            },
          ],
        });
      }
    } else if (functionName === "get_reference") {
      /// answer user query based on the embedding data
      /// get similarity search

      const startedAt = Date.now();
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
      const elapsedMs = Date.now() - startedAt;

      /// without this check a non-2xx body (504 html page, or the 500 json the
      /// route now returns) was parsed and handed back as success:true, so the
      /// model received an error payload as if it were retrieved context
      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        console.error(
          `[get_reference] /api/pinecone failed: HTTP ${response.status} after ${elapsedMs}ms`,
          raw.slice(0, 500)
        );
        return JSON.stringify({
          success: false,
          message: `retrieval failed (HTTP ${response.status})`,
          detail: raw.slice(0, 300),
        });
      }

      /// parse the response and extract the similarity results
      const similaritySearchResults = await response.json();

      console.log(
        `[get_reference] ok in ${elapsedMs}ms — chunks:`,
        Array.isArray(similaritySearchResults)
          ? similaritySearchResults.length
          : typeof similaritySearchResults
      );
      /// an empty array is a valid response but means the model gets no
      /// context, which reads to the user as "I couldn't retrieve information"
      if (
        Array.isArray(similaritySearchResults) &&
        similaritySearchResults.length === 0
      ) {
        console.warn(
          "[get_reference] retrieval returned ZERO chunks — the model will answer without context"
        );
      }

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
            filter: args.filter,
            projection: args.projection,
          }),
        }
      );
      const dbData = await response.text();
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

    // -----------------------------------------------------------------------
    // BOOKING AGENT — create_booking
    // -----------------------------------------------------------------------
    } else if (functionName === "create_booking") {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbotId,
            userId: userID,
            customerName: args.customerName,
            customerEmail: args.customerEmail,
            customerPhone: args.customerPhone,
            serviceType: args.serviceType,
            dateTime: args.dateTime,
            // timezone comes from chatbot settings, not from user
            // pass it through if the model somehow set it, otherwise
            // the bookings route will fall back to chatbot-settings
            timezone: args.timezone ?? null,
            notes: args.notes ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.conflict) {
          return JSON.stringify({
            success: false,
            conflict: true,
            message:
              "The requested time slot is already booked. Please ask the customer to choose a different date or time.",
          });
        }
        return JSON.stringify({
          success: false,
          message: data.error ?? "Failed to create booking. Please try again.",
        });
      }

      return JSON.stringify({
        success: true,
        bookingId: data.bookingId,
        serviceType: data.serviceType,
        dateTime: data.dateTime,
        timezone: data.timezone,
        message: `Booking confirmed! ID: ${data.bookingId}. A confirmation email has been sent to the customer.`,
      });

    // -----------------------------------------------------------------------
    // BOOKING AGENT — update_booking
    // -----------------------------------------------------------------------
    } else if (functionName === "update_booking") {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/bookings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbotId,
            bookingId: args.bookingId,
            customerEmail: args.customerEmail,
            newDateTime: args.newDateTime ?? null,
            newTimezone: args.newTimezone ?? null,
            newServiceType: args.newServiceType ?? null,
            notes: args.notes ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.conflict) {
          return JSON.stringify({
            success: false,
            conflict: true,
            message:
              "The new time slot is already booked. Please ask the customer to choose a different date or time.",
          });
        }
        return JSON.stringify({
          success: false,
          message:
            data.error ??
            "Could not update the booking. Please check the booking ID and email.",
        });
      }

      return JSON.stringify({
        success: true,
        bookingId: data.bookingId,
        message: `Booking ${data.bookingId} has been updated successfully.`,
      });

    // -----------------------------------------------------------------------
    // BOOKING AGENT — delete_booking
    // -----------------------------------------------------------------------
    } else if (functionName === "delete_booking") {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/bookings`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatbotId,
            bookingId: args.bookingId,
            customerEmail: args.customerEmail,
            reason: args.reason ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return JSON.stringify({
          success: false,
          message:
            data.error ??
            "Could not cancel the booking. Please check the booking ID and email.",
        });
      }

      return JSON.stringify({
        success: true,
        bookingId: data.bookingId,
        message: `Booking ${data.bookingId} has been cancelled successfully.`,
      });

    } else {
      return JSON.stringify({
        success: false,
        message: "This functionality will be available soon",
      });
    }
  } catch (error: any) {
    /// include which function and what actually went wrong — the previous
    /// generic message made a network failure, a 500 and a json parse error
    /// all look identical from the model's side
    console.error(
      `[functionCallHandler] "${call?.function?.name}" threw:`,
      error?.name,
      "-",
      error?.message,
      error
    );
    return JSON.stringify({
      success: false,
      function: call?.function?.name,
      message: "Error while proccesing your request",
      detail: `${error?.name ?? "Error"}: ${error?.message ?? String(error)}`,
    });
  }
};
