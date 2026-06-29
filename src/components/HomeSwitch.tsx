"use client";

import { useState, useEffect } from "react";
import HomeTabs from "./HomeTabs";
import AwarenessHomeV2 from "./AwarenessHomeV2";
import LangMenu from "./LangMenu";
import DesignToggle from "./DesignToggle";

export default function HomeSwitch(props: any) {
  const locale = props.locale;
  const [design, setDesign] = useState<"classic" | "aware">("classic");

  useEffect(() => {
    try { if (localStorage.getItem("lifeos_home_design") === "aware") setDesign("aware"); } catch {}
  }, []);

  function set(d: "classic" | "aware") {
    setDesign(d);
    try { localStorage.setItem("lifeos_home_design", d); } catch {}
  }

  // В классике язык + переключатель дизайна живут в шапке HomeTabs (рядом с «Настроить»).
  // В «Новом» дизайне у HomeTabs нет шапки — показываем компактный ряд сверху.
  if (design === "aware") {
    return (
      <>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <LangMenu current={locale} align="right" />
          <DesignToggle locale={locale} design={design} onSet={set} />
        </div>
        <AwarenessHomeV2 data={props.data} locale={locale} />
      </>
    );
  }
  return <HomeTabs {...props} design={design} onSetDesign={set} />;
}
