// Landing the native app's Google-login WebView redirects to. The app intercepts
// this URL (reads ?token=…) and closes the WebView before this renders — this is
// just a graceful fallback if it's ever opened directly.
export default function AppDonePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f1115",
        color: "#f2f3f5",
        fontFamily: "-apple-system, system-ui, sans-serif",
        fontSize: 18,
      }}
    >
      Готово — можно вернуться в приложение.
    </div>
  );
}
