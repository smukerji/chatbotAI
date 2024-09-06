// Function to format date
function formatDate(timestamp: number) {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Function to transform the data source
export function transformDataSource(subscriptions: any[]) {
  return subscriptions?.map((subscription) => {
    const totalAmount = subscription.data.reduce(
      (total: number, item: any) => total + item.amount,
      0
    );
    const firstItem = subscription.data[0];

    // Parent row
    const parentRow = {
      key: subscription.latest_invoice, // Unique key for row
      paymentId: subscription.latest_invoice,
      price: totalAmount / 100, // Assuming the amount is in cents, convert to dollars
      status: firstItem.active ? "Active" : "Inactive",
      date: formatDate(firstItem.created),
      children: subscription.data.map((item: any, index: number) => ({
        key: `${subscription.latest_invoice}-${index}`,
        paymentId: item.name, // Name of the plan
        price: item.amount / 100, // Convert amount to dollars
        status: "", // Empty for children
        date: "", // Empty for children
      })),
    };

    return parentRow;
  });
}
