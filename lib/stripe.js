function encodeStripeParams(params, prefix) {
  const pairs = [];

  Object.entries(params).forEach(([key, value]) => {
    const field = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        pairs.push(...encodeStripeParams(item, `${field}[${index}]`));
      });
      return;
    }
    if (typeof value === 'object') {
      pairs.push(...encodeStripeParams(value, field));
      return;
    }
    pairs.push([field, String(value)]);
  });

  return pairs;
}

export async function createStripeCheckoutSession({ secretKey, origin, order, service, customerEmail, currency }) {
  const amount = Math.round(Number(order.amount || 0) * 100);
  if (!secretKey || amount <= 0) return null;

  const body = new URLSearchParams();
  encodeStripeParams({
    mode: 'payment',
    customer_email: customerEmail,
    success_url: `${origin}/thank-you?orderId=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard/orders/${order._id}`,
    client_reference_id: order._id.toString(),
    metadata: {
      orderId: order._id.toString(),
      serviceId: service._id.toString(),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: service.title,
          },
        },
      },
    ],
  }).forEach(([key, value]) => body.append(key, value));

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to create Stripe checkout session');
  }

  return data;
}
