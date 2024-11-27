import { apiHandler } from "@/app/_helpers/server/api/api-handler";

module.exports = apiHandler({
  POST: verify,
});

// function to verify shopify store and token
async function verify(_request: any) {
  const data = await _request.json();
  const { store, token } = data;

  try {
    const response = await fetch(
      `https://${store}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: `
          {
            shop {
              name
            }
          }
        `,
        }),
      }
    );

    const responseData = await response.json();

    if (responseData.errors) {
      throw new Error(responseData.errors[0].message);
    }

    return { message: "Shopify store and token validated successfully" };
  } catch (error: any) {
    throw new Error("Make sure you have entered the correct store and token");
  }
}
