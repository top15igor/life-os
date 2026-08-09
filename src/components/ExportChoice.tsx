"use client";

import { useEffect, useState } from "react";

// Выбор, что забирать: только записи или записи вместе с файлами.
//
// Раньше кнопка была одна и молчала о размере. Если у человека четыреста фото,
// он нажимал и ждал непонятно чего. Теперь до нажатия видно: сколько файлов,
// сколько весят, на сколько частей разобьётся — и можно выбрать лёгкий вариант.

type Est = { count: number; bytes: number; parts: number };

// Вес человеческими словами, в единицах его языка.
function humanSize(bytes: number, locale: string): string {
  const u = locale === "ru" || locale === "uk" ? ["КБ", "МБ", "ГБ"] : ["KB", "MB", "GB"];
  const mb = bytes / (1024 * 1024);
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} ${u[0]}`;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} ${u[1]}`;
  return `${(mb / 1024).toFixed(1)} ${u[2]}`;
}

const STR: Record<string, Record<string, string>> = {
  ru: {
    onlyTitle: "Только записи",
    onlyHint: "Один файл JSON: дневник, финансы, книги, здоровье — весь текст. Файлы приложены ссылками, они живут 7 дней.",
    withTitle: "Записи и файлы",
    withHint: "Архив ZIP: то же самое плюс сами фото, документы и голосовые. Ничего не протухает.",
    counting: "Считаю, сколько весят файлы…",
    none: "Файлов пока нет — забирать нечего, кроме записей.",
    weigh: "Файлов: {n}, вес {size}",
    oneGo: "Скачается одним архивом.",
    manyGo: "Скачается частями — их {p}. Жми кнопки по очереди, каждая даёт свой архив.",
    download: "Скачать",
    part: "Часть {i} из {p}",
    slow: "Большой архив собирается минуту-другую — не закрывай вкладку.",
    failed: "Не получилось посчитать файлы. Записи всё равно можно забрать.",
  },
  en: {
    onlyTitle: "Entries only",
    onlyHint: "A single JSON file: diary, finance, books, health — all the text. Files are attached as links that live 7 days.",
    withTitle: "Entries and files",
    withHint: "A ZIP archive: the same plus the actual photos, documents and voice notes. Nothing expires.",
    counting: "Measuring your files…",
    none: "No files yet — there's nothing to take besides the entries.",
    weigh: "Files: {n}, {size}",
    oneGo: "Comes as one archive.",
    manyGo: "Comes in {p} parts. Press the buttons one by one, each gives its own archive.",
    download: "Download",
    part: "Part {i} of {p}",
    slow: "A big archive takes a minute or two — keep the tab open.",
    failed: "Couldn't measure the files. You can still take the entries.",
  },
};

function t(locale: string, key: string, vars?: Record<string, any>): string {
  const dict = STR[locale] || STR.ru;
  let s = dict[key] || STR.ru[key] || key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

const BTN: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "11px",
  borderRadius: 11,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: "none",
};

export default function ExportChoice({ locale }: { locale: string }) {
  const L = (k: string, v?: Record<string, any>) => t(locale, k, v);
  const [mode, setMode] = useState<"only" | "with">("only");
  const [est, setEst] = useState<Est | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  // Считаем вес один раз, когда человек впервые заглянул в вариант с файлами.
  useEffect(() => {
    if (mode !== "with" || est || state === "loading") return;
    setState("loading");
    fetch("/api/export/estimate")
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) {
          setEst(j);
          setState("idle");
        } else setState("error");
      })
      .catch(() => setState("error"));
  }, [mode, est, state]);

  const card = (key: "only" | "with", title: string, hint: string) => {
    const on = mode === key;
    return (
      <button
        type="button"
        onClick={() => setMode(key)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "11px 13px",
          borderRadius: 11,
          marginBottom: 8,
          cursor: "pointer",
          border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
          background: on ? "var(--accent-bg)" : "var(--surface)",
          color: "var(--text)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}>
          <i className={`ti ti-${on ? "circle-check-filled" : "circle"}`} style={{ fontSize: 17, color: on ? "var(--accent)" : "var(--text-3)" }} />
          {title}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 4, paddingLeft: 25 }}>{hint}</div>
      </button>
    );
  };

  const parts = est?.parts || 1;

  return (
    <div>
      {card("only", L("onlyTitle"), L("onlyHint"))}
      {card("with", L("withTitle"), L("withHint"))}

      {mode === "only" ? (
        <a href="/api/export" style={{ ...BTN, background: "var(--accent)", color: "#fff", marginTop: 4 }}>
          <i className="ti ti-download" style={{ fontSize: 17 }} />
          {L("download")}
        </a>
      ) : (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 9, lineHeight: 1.5 }}>
            {state === "loading" && L("counting")}
            {state === "error" && L("failed")}
            {state === "idle" && est && (est.count === 0 ? L("none") : `${L("weigh", { n: est.count, size: humanSize(est.bytes, locale) })} · ${parts > 1 ? L("manyGo", { p: parts }) : L("oneGo")}`)}
          </div>

          {est && est.count > 0 && parts === 1 && (
            <a href="/api/export?files=1" style={{ ...BTN, background: "var(--accent)", color: "#fff" }}>
              <i className="ti ti-file-zip" style={{ fontSize: 17 }} />
              {L("download")}
            </a>
          )}

          {est && parts > 1 &&
            Array.from({ length: parts }, (_, i) => (
              <a
                key={i}
                href={`/api/export?files=1&part=${i + 1}`}
                style={{ ...BTN, border: "1px solid var(--accent)", background: i === 0 ? "var(--accent)" : "var(--accent-bg)", color: i === 0 ? "#fff" : "var(--accent-text)", marginBottom: 7 }}
              >
                <i className="ti ti-file-zip" style={{ fontSize: 16 }} />
                {L("part", { i: i + 1, p: parts })}
              </a>
            ))}

          {est && est.count === 0 && (
            <a href="/api/export" style={{ ...BTN, background: "var(--accent)", color: "#fff" }}>
              <i className="ti ti-download" style={{ fontSize: 17 }} />
              {L("download")}
            </a>
          )}

          {est && est.count > 0 && <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6, lineHeight: 1.45 }}>{L("slow")}</div>}
        </div>
      )}
    </div>
  );
}
