export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const sp = await searchParams;
  const error = sp.e === "1";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 360, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <i className="ti ti-flower" style={{ fontSize: 22, color: "var(--accent)" }} />
          <span style={{ fontSize: 18, fontWeight: 500 }}>LIFE OS</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 18 }}>
          Личный дневник жизни
        </div>

        {error && (
          <div style={{ fontSize: 12.5, color: "var(--health)", marginBottom: 12 }}>
            Ссылка недействительна. Открой бота и получи новую.
          </div>
        )}

        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)" }}>
          Вход — по личной ссылке из Telegram-бота:
          <ol style={{ paddingLeft: 18, margin: "10px 0 0", color: "var(--text-2)" }}>
            <li style={{ marginBottom: 6 }}>Открой бота <b style={{ color: "var(--text)" }}>LIFE OS</b> в Telegram.</li>
            <li style={{ marginBottom: 6 }}>Отправь команду <code style={{ background: "var(--surface-2)", padding: "1px 6px", borderRadius: 5 }}>/start</code>.</li>
            <li>Нажми на присланную <b style={{ color: "var(--text)" }}>личную ссылку</b> — и ты внутри.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
