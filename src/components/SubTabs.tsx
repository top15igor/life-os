import Link from "next/link";

export default function SubTabs({ base, active, tabs }: { base: string; active: string; tabs: { key: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 18, borderBottom: "1px solid var(--border)" }}>
      {tabs.map((tb) => {
        const on = tb.key === active;
        return (
          <Link
            key={tb.key}
            href={`${base}?tab=${tb.key}`}
            style={{
              fontSize: 13.5,
              padding: "8px 14px",
              color: on ? "var(--accent)" : "var(--text-2)",
              fontWeight: on ? 500 : 400,
              borderBottom: on ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tb.label}
          </Link>
        );
      })}
    </div>
  );
}
