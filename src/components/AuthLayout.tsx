import { Outlet } from "react-router-dom";

// Wraps the small centered-card pages (login, mobile/smart-id forms,
// settings) in the flex-centering shell that styles.css's `.auth-shell`
// expects — kept out of a global `body` rule so it can't affect the
// long dashboard/document pages sharing the same SPA.
export function AuthLayout() {
  return (
    <div className="auth-shell">
      <Outlet />
    </div>
  );
}
