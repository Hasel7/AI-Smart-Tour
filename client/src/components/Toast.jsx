import { createContext, useContext, useState, useCallback, useEffect } from "react";

/* ── Context ── */
const ToastContext = createContext(null);

/* ── Provider ── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);

    // Start leave animation slightly before removing
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
      );
    }, duration - 350);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

/* ── Hook ── */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.showToast;
};

/* ── Icons ── */
const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.06-1.061l-4.5 4.5-2.25-2.25a.75.75 0 0 0-1.06 1.061l2.78 2.78a.75.75 0 0 0 1.06 0l5.03-5.03Z" clipRule="evenodd" />
  </svg>
);

const ErrorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5A.75.75 0 0 0 12 9Z" clipRule="evenodd" />
  </svg>
);

/* ── Toast styles ── */
const STYLES = {
  success: {
    wrap: "bg-[#1a2e1f] border border-green-700/50 text-green-300",
    icon: "text-green-400",
    bar: "bg-green-500",
    Icon: SuccessIcon,
  },
  error: {
    wrap: "bg-[#2e1a1a] border border-red-700/50 text-red-300",
    icon: "text-red-400",
    bar: "bg-red-500",
    Icon: ErrorIcon,
  },
  info: {
    wrap: "bg-[#1a1f2e] border border-blue-700/50 text-blue-200",
    icon: "text-blue-400",
    bar: "bg-blue-500",
    Icon: InfoIcon,
  },
};

/* ── Container ── */
const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-28 left-0 right-0 z-9999 flex flex-col items-center space-y-3 px-4 pointer-events-none">
      {toasts.map((toast) => {
        const s = STYLES[toast.type] || STYLES.success;
        const { Icon } = s;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl px-4 py-3.5 flex items-center space-x-3 font-['Inter',sans-serif] ${s.wrap}`}
            style={{
              animation: toast.leaving
                ? "toastSlideOut 0.32s ease-in forwards"
                : "toastSlideIn 0.32s ease-out forwards",
            }}
          >
            <span className={s.icon}>
              <Icon />
            </span>
            <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
};
