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

    return new Response(JSON.stringify(products), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("error in find products", error);
    return new Response(JSON.stringify({ error: error }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
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

    return new Response(JSON.stringify(products), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log("error in get products", error);
    return new Response(JSON.stringify({ error: error }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
