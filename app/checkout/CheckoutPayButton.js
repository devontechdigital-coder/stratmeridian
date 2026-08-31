"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function CheckoutPayButton({ orderId }) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.checkoutUrl) window.location.href = data.checkoutUrl;
      else toast.error(data.message || "Unable to start checkout");
    } catch {
      toast.error("Unable to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={pay} disabled={loading} className="ud-main-btn w-100 justify-content-center border-0">
      {loading ? "Starting Checkout..." : "Pay with Stripe"} <i className="bi bi-lock-fill" />
    </button>
  );
}
