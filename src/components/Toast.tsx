interface ToastProps {
  message: string;
}

// Simple success toast — green pill, checkmark icon, fixed at the bottom
// of the viewport. Matches the Figma "Success Toast" mockup.
export function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "linear-gradient(180deg, #58d146 0%, #37b524 100%)",
        color: "#ffffff",
        fontFamily: "'Segoe UI','Helvetica Neue',Arial,sans-serif",
        fontSize: 15,
        fontWeight: 600,
        padding: "14px 22px",
        borderRadius: 999,
        boxShadow: "0 12px 24px rgba(55, 181, 36, 0.32)",
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      {message}
    </div>
  );
}
