"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import EnquiryForm from "./EnquiryForm";
import styles from "./meridianTheme.module.css";

const ConsultationModalContext = createContext(() => {});

export function useConsultationModal() {
  return useContext(ConsultationModalContext);
}

export default function PublicShell({ children }) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeModal]);

  return (
    <ConsultationModalContext.Provider value={openModal}>
      {children}
      <div
        className={`${styles.shell} ${styles.modalOverlay} ${open ? styles.modalOverlayOpen : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}
      >
        <div className={styles.modal}>
          <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Close">
            &times;
          </button>
          <h3>Request a Consultation</h3>
          <p className={styles.msub}>Share a few details and our team will follow up directly.</p>
          <EnquiryForm source="modal" />
        </div>
      </div>
    </ConsultationModalContext.Provider>
  );
}
