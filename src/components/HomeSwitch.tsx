"use client";

import { useState, useEffect } from "react";
import HomeTabs from "./HomeTabs";
import AwarenessHomeV2 from "./AwarenessHomeV2";
import LangMenu from "./LangMenu";

const LBL: Record<string, { aware: string; classic: string }> = {
  ru: { aware: "Новый", classic: "Классический" },
  en: { aware: "New", classic: "Classic" },
  uk: { aware: "Новий", classic: "Класичний" },
  fr: { aware: "Nouveau", classic: "Classique" },
};

function pill(active: boolean): any {
  return { fontSize: 12.5, fontWeight: 500, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? "var(--surface)" : "transparent", color: active ? "var(--text)" : "var(--text-2)" };
}

export default function HomeSwitch(props: any) {
  const locale = props.locale;
  const l = LBL[locale] || LBL.ru;
  const [design, setDesign] = useState<"classic" | "aware">("classic");

  useEffect(() => {
    try { if (localStorage.getItem("lifeos_home_design") === "aware") setDesign("aware"); } catch {}
  }, []);

  function set(d: "classic" | "aware") {
    setDesign(d);
    try { localStorage.setItem("lifeos_home_design", d); } catch {}
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <LangMenu current={locale} />
        <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "var(--surface-2)", gap: 2 }}>
          <button onClick={() => set("classic")} style={pill(design === "classic")}>{l.classic}</button>
          <button onClick={() => set("aware")} style={pill(design === "aware")}>✨ {l.aware}</button>
        </div>
      </div>
      {design === "aware" ? <AwarenessHomeV2 data={props.data} locale={locale} /> : <HomeTabs {...props} />}
    </>
  );
}
