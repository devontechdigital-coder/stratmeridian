"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { clearPendingCheckoutDraft, getPendingCheckoutDraft } from "@/lib/pendingCheckoutStore";

function money(amount, currency = "usd") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount || 0));
}

export default function PendingServiceCheckout() {
  const [draft, setDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPendingCheckoutDraft()
      .then((data) => {
        if (!cancelled) setDraft(data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Unable to load checkout details");
      })
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const payNow = async () => {
    if (!draft?.metadata) {
      toast.error("Checkout details are missing");
      return;
    }

    setPaying(true);
    try {
      const payload = new FormData();
      Object.entries(draft.metadata).forEach(([key, value]) => {
        payload.append(key, value ?? "");
      });
      (draft.files || []).forEach((file) => payload.append("documents", file));

      const orderResponse = await fetch("/api/orders", { method: "POST", body: payload });
      const orderData = await orderResponse.json();
      if (!orderData.success) {
        toast.error(orderData.message || "Unable to create order");
        return;
      }

      if (orderData.data?.loginEmail && orderData.data?.orderLoginToken) {
        await signIn("credentials", {
          redirect: false,
          email: orderData.data.loginEmail,
          orderLoginToken: orderData.data.orderLoginToken,
        });
      }

      await clearPendingCheckoutDraft();

      if (!orderData.data?.paymentRequired) {
        window.location.href = `/thank-you?orderId=${orderData.data?.orderId || ""}`;
        return;
      }

      const checkoutResponse = await fetch(`/api/orders/${orderData.data.orderId}/checkout`, { method: "POST" });
      const checkoutData = await checkoutResponse.json();
      if (checkoutData.success && checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        toast.error(checkoutData.message || "Unable to start checkout");
      }
    } catch {
      toast.error("Unable to start checkout");
    } finally {
      setPaying(false);
    }
  };

  if (loadingDraft) {
    return <div className="ud-card mt-4 text-secondary">Loading checkout...</div>;
  }

  if (!draft?.metadata) {
    return (
      <div className="row g-4 justify-content-center mt-2">
        <div className="col-lg-7">
          <div className="ud-card">
            <div className="ud-stat-label">Checkout</div>
            <h1 style={{ color: "#fff" }}>No pending order</h1>
            <p className="text-secondary">Start from a service page to prepare checkout.</p>
            <Link href="/checkout" className="ud-main-btn">Choose Service</Link>
          </div>
        </div>
      </div>
    );
  }

  const { metadata, files = [] } = draft;

  return (
    <div className="row g-4 justify-content-center mt-2">
      <div className="col-lg-7">
        <div className="ud-card">
          <div className="ud-stat-label">Checkout</div>
          <h1 style={{ color: "#fff" }}>Review & Pay</h1>
          <p className="text-secondary">Your order will be created when you click Pay Now.</p>
          <div className="rounded-4 p-4 my-4" style={{ background: "rgba(255,255,255,.04)" }}>
            <Row label="Service" value={metadata.serviceTitle || "Service"} />
            <Row label="Email" value={metadata.email} />
            <Row label="Address" value={metadata.address} />
            <Row label="Documents" value={`${files.length} file${files.length === 1 ? "" : "s"}`} />
            <div className="d-flex justify-content-between align-items-center pt-2">
              <span className="text-white fw-bold">Total</span>
              <strong className="fs-3" style={{ color: "var(--green)" }}>{money(metadata.servicePrice || 0)}</strong>
            </div>
          </div>
          <button type="button" onClick={payNow} disabled={paying} className="ud-main-btn w-100 justify-content-center border-0">
            {paying ? "Creating Order..." : "Pay Now"} <i className="bi bi-lock-fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="d-flex justify-content-between gap-3 border-bottom border-secondary-subtle pb-3 mb-3">
      <span className="text-secondary">{label}</span>
      <strong className="text-white text-end" style={{ overflowWrap: "anywhere" }}>{value || "-"}</strong>
    </div>
  );
}
