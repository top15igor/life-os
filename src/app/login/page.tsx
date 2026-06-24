export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.e === "1";
  const from = sp.from || "/";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 340, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} />
          <span style={{ fontSize: 18, fontWeight: 500 }}>LIFE OS</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}>
          Личный дневник · вход по паролю
        </div>

        <form action="/api/login" method="post">
          <input type="hidden" name="from" value={from} />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            autoFocus
            required
            style={{
              width: "100%", height: 42, padding: "0 13px", fontSize: 15,
              borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg)", color: "var(--text)", marginBottom: 12,
            }}
          />
          {error && (
            <div style={{ fontSize: 12.5, color: "var(--health)", marginBottom: 12 }}>
              Неверный пароль, попробуй ещё раз.
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%", height: 42, fontSize: 15, fontWeight: 500, cursor: "pointer",
              borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff",
            }}
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
