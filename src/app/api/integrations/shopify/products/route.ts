// function to find the products
export async function POST(_request: any) {
  const data = await _request.json();
  const { product_name, chatbotId } = data;
  /// check the availability from the third part api
  try {
    /// get the integrations access keys for the chatbot
    const integrationData = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api/integrations/${chatbotId}`,
      {
        method: "GET",
        next: { revalidate: 0 },
      }
    );
    const data = await integrationData.json();

    const shop = data?.shopify?.store;
    const accessToken = data?.shopify?.token;

    const query = `
                    {
                        products(first: 5, query: "${product_name}") {
                            edges {
                            node {
                                id
                                title
                                description
                                priceRange {
                                minVariantPrice {
                                    amount
                                    currencyCode
                                }
                                maxVariantPrice {
                                    amount
                                    currencyCode
                                }
                                }
                                images(first: 5) {
                                edges {
                                    node {
                                    url
                                    altText
                                    }
                                }
                                }
                            }
                            }
                        }
                        }

                `;

    const response = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken, // Include access token
        },
        body: JSON.stringify({ query }),
      }
    );

    const responseData = await response.json();

    /// shopify answers HTTP 200 with an `errors` array for auth failures,
    /// revoked tokens, missing scopes and malformed queries. `data` is null in
    /// that case, the optional chaining below short-circuits to undefined, and
    /// this route used to reply with an empty 200 - indistinguishable from
    /// "the store has no such product". Surface it instead.
    if (responseData?.errors) {
      console.error(
        "[shopify/find_product] GraphQL errors:",
        JSON.stringify(responseData.errors).slice(0, 500)
      );
      return new Response(
        JSON.stringify({
          error: "shopify query failed",
          detail: responseData.errors,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    /// prepare the data

    const products = responseData?.data?.products?.edges?.map(
      (product: any) => {
        return {
          id: product.node.id,
          title: product.node.title,
          description: product.node.description,
          price: product.node.priceRange.minVariantPrice.amount,
          currency: product.node.priceRange.minVariantPrice.currencyCode,
          images: product.node.images.edges.map((image: any) => {
            return {
              url: image.node.url,
              altText: image.node.altText,
            };
          }),
        };
      }
    );

    /// `products` is undefined when the shape is unexpected; an explicit empty
    /// array keeps "no matches" distinct from "something went wrong".
    return new Response(JSON.stringify(products ?? []), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    /// an Error instance serialises to {}, so the old body carried no
    /// information at all. Send the message, and a status the caller can see.
    console.error("[shopify/find_product] request failed:", error);
    return new Response(
      JSON.stringify({
        error: "shopify request failed",
        detail: (error as Error)?.message ?? String(error),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

/// get products from the shopify store
export async function GET(_request: any) {
  const params: any = _request.nextUrl.searchParams;
  const chatbotId = params.get("chatbotId");

  try {
    /// get the integrations access keys for the chatbot
    const integrationData = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api/integrations/${chatbotId}`,
      {
        method: "GET",
        next: { revalidate: 0 },
      }
    );
    const data = await integrationData.json();

    const shop = data?.shopify?.store;
    const accessToken = data?.shopify?.token;

    const query = `
                    {
                        products(first: 50) {
                            edges {
                            node {
                                id
                                title
                                description
                                priceRange {
                                minVariantPrice {
                                    amount
                                    currencyCode
                                }
                                maxVariantPrice {
                                    amount
                                    currencyCode
                                }
                                }
                                images(first: 5) {
                                edges {
                                    node {
                                    url
                                    altText
                                    }
                                }
                                }
                            }
                            }
                        }
                        }

                `;

    const response = await fetch(
      `https://${shop}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken, // Include access token
        },
        body: JSON.stringify({ query }),
      }
    );

    const responseData = await response.json();

    /// see the note in POST above - a GraphQL error here is HTTP 200 with a
    /// null `data`, which otherwise reads as "this store sells nothing".
    if (responseData?.errors) {
      console.error(
        "[shopify/get_products] GraphQL errors:",
        JSON.stringify(responseData.errors).slice(0, 500)
      );
      return new Response(
        JSON.stringify({
          error: "shopify query failed",
          detail: responseData.errors,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    /// prepare the data
    const products = responseData?.data?.products?.edges?.map(
      (product: any) => {
        return {
          id: product.node.id,
          title: product.node.title,
          description: product.node.description,
          price: product.node.priceRange.minVariantPrice.amount,
          currency: product.node.priceRange.minVariantPrice.currencyCode,
          images: product.node.images.edges.map((image: any) => {
            return {
              url: image.node.url,
              altText: image.node.altText,
            };
          }),
        };
      }
    );

    /// `products` is undefined when the shape is unexpected; an explicit empty
    /// array keeps "no matches" distinct from "something went wrong".
    return new Response(JSON.stringify(products ?? []), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[shopify/get_products] request failed:", error);
    return new Response(
      JSON.stringify({
        error: "shopify request failed",
        detail: (error as Error)?.message ?? String(error),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
