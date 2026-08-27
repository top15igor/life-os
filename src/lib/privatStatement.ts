import JSZip from "jszip";
import { classifyScope } from "./financeScope";

// Выписка ПриватБанка для ЛИЧНЫХ карт — файлом (.xlsx или .csv из Приват24).
// Открытого API для физлиц у Привата нет, поэтому путь как с MoneyOK:
// выгрузил файл → загрузил сюда. Колонки находим ПО ЗАГОЛОВКАМ (укр/рус),
// лишние строки сверху («Виписка з Ваших карток…») пропускаются сами.
//
// Сумму берём в валюте ТРАНЗАКЦИИ (как с Monobank): трата за границей — это
// евро/кроны, а не гривна со счёта. Знак «суммы в валюте карты» даёт тип.

export type PrivatStRow = {
  ext_id: string; day: string; time: string | null; kind: "income" | "expense"; amount: number;
  currency: string; category: string | null; note: string | null; scope: string;
};

// ---- xlsx → строки ячеек ---------------------------------------------------

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

function xmlCellText(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .trim();
}

export async function xlsxRows(buf: Buffer): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buf);
  let shared: string[] = [];
  const sharedFile = zip.file("xl/sharedStrings.xml");
  if (sharedFile) {
    const xml = await sharedFile.async("string");
    shared = [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => xmlCellText(m[1]));
  }
  const sheets = Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
  const rows: string[][] = [];
  for (const name of sheets.slice(0, 2)) {
    const xml = await zip.file(name)!.async("string");
    for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells: string[] = [];
      for (const c of row[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = c[1] || "";
        const isShared = /t="s"/.test(attrs);
        const inline = (c[2].match(/<is>([\s\S]*?)<\/is>/) || [])[1];
        const v = (c[2].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (inline !== undefined) cells.push(xmlCellText(inline));
        else if (v === undefined) cells.push("");
        else cells.push(isShared ? (shared[Number(v)] ?? "") : xmlCellText(v));
      }
      rows.push(cells);
      if (rows.length >= 20000) break;
    }
  }
  return rows;
}

// ---- csv → строки ячеек ----------------------------------------------------

export function csvRows(text: string): string[][] {
  const head = text.split(/\r?\n/).find((l) => l.trim()) || "";
  const delim = (head.match(/;/g)?.length || 0) >= (head.match(/,/g)?.length || 0) ? ";" : ",";
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { cur.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      cur.push(field); field = "";
      if (cur.some((c) => c.trim())) rows.push(cur);
      cur = [];
    } else field += ch;
  }
  cur.push(field);
  if (cur.some((c) => c.trim())) rows.push(cur);
  return rows;
}

// ---- разбор выписки --------------------------------------------------------

const norm = (s: string) => String(s || "").toLowerCase().replace(/ё/g, "е").trim();

// Категории Привата → наши статьи (по подстрокам, укр/рус).
const CAT_MAP: [RegExp, string][] = [
  [/продукт/i, "food"],
  [/кафе|ресторан|фаст|їж|еда/i, "cafe"],
  [/транспорт|такс[иі]|азс|палив|авто|парк[оі]вк/i, "transport"],
  [/комун|звязок|зв'язок|связь|мобил|мобіл|интернет|інтернет/i, "bills"],
  [/здоров|аптек|медиц/i, "health"],
  [/розваг|развлеч|кіно|кино|игр|ігр/i, "fun"],
  [/одяг|одежд|взутт|обув|покупк|магазин|маркетплейс/i, "shopping"],
  [/подорож|путешеств|готел|отел|авіа|авиа|квитк/i, "travel"],
  [/освіт|образован|навчан/i, "education"],
  [/подарун|подарок|подарк/i, "gifts"],
];

function amountOf(raw: string): number | null {
  const s = String(raw || "").replace(/\s| /g, "").replace(",", ".");
  if (!s) return null;
  const v = Number(s);
  return isFinite(v) ? v : null;
}

function dayOf(raw: string): string | null {
  const s = String(raw || "").trim();
  const dm = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dm) return `${dm[3]}-${dm[2]}-${dm[1]}`;
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Excel хранит даты числом дней с 1899-12-30.
  const n = Number(s);
  if (isFinite(n) && n > 20000 && n < 80000) {
    return new Date(EXCEL_EPOCH + Math.round(n) * 86400000).toISOString().slice(0, 10);
  }
  return null;
}

// Стабильный короткий хэш — у выписки нет id операции, дедуп по содержимому.
function hashOf(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function parsePrivatStatement(rows: string[][]): { rows: PrivatStRow[]; total: number; skipped: number } {
  // Ищем строку заголовков: в ней есть «дата» и «сума/сумма».
  let headIdx = -1;
  let head: string[] = [];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const h = rows[i].map(norm);
    if (h.some((c) => c.includes("дата")) && h.some((c) => c.includes("сум"))) { headIdx = i; head = h; break; }
  }
  if (headIdx < 0) return { rows: [], total: rows.length, skipped: rows.length };

  const col = (...needles: string[]) => head.findIndex((c) => needles.some((n) => c.includes(n)));
  const cDate = col("дата");
  const cTime = col("час", "время");
  const cCat = col("категор");
  const cCard = col("картк", "карта");
  const cDesc = col("опис", "описан");
  // «Сумма в валюте карты» и «… в валюте транзакции» — обе колонки называются
  // через «сум», различаем по хвосту.
  // «Сума в валюті картки» тоже содержит слово «валют» — колонки валют ищем
  // строго среди заголовков БЕЗ слова «сум».
  const cAmtCard = head.findIndex((c) => c.includes("сум") && (c.includes("картк") || c.includes("карты")));
  const cCurCard = head.findIndex((c) => c.includes("валют") && !c.includes("сум") && (c.includes("картк") || c.includes("карты")));
  const cAmtTx = head.findIndex((c) => c.includes("сум") && c.includes("транзакц"));
  const cCurTx = head.findIndex((c) => c.includes("валют") && !c.includes("сум") && c.includes("транзакц"));

  const out: PrivatStRow[] = [];
  let skipped = 0;
  const dataRows = rows.slice(headIdx + 1);
  for (const r of dataRows) {
    const day = cDate >= 0 ? dayOf(r[cDate]) : null;
    const signed = amountOf(cAmtCard >= 0 ? r[cAmtCard] : "");
    if (!day || signed == null || signed === 0) { skipped++; continue; }
    const kind: "income" | "expense" = signed < 0 ? "expense" : "income";
    const txAmt = amountOf(cAmtTx >= 0 ? r[cAmtTx] : "");
    const txCur = String((cCurTx >= 0 ? r[cCurTx] : "") || "").toUpperCase().trim();
    const cardCur = String((cCurCard >= 0 ? r[cCurCard] : "") || "UAH").toUpperCase().trim() || "UAH";
    const useTx = txAmt != null && txAmt !== 0 && /^[A-Z]{3}$/.test(txCur);
    const amount = Math.abs(useTx ? (txAmt as number) : signed);
    const currency = useTx ? txCur : cardCur;
    const desc = String((cDesc >= 0 ? r[cDesc] : "") || "").replace(/\s+/g, " ").trim();
    const pbCat = String((cCat >= 0 ? r[cCat] : "") || "").trim();
    const note = (desc || pbCat || null)?.slice(0, 200) || null;
    let category: string | null = null;
    for (const [re, slug] of CAT_MAP) if (re.test(pbCat) || re.test(desc)) { category = slug; break; }
    const isTransfer = /перекази|переказ|перевод/i.test(pbCat) || classifyScope({ note, category }) === "transfer";
    const time = String((cTime >= 0 ? r[cTime] : "") || "").trim();
    const card = String((cCard >= 0 ? r[cCard] : "") || "").trim();
    const tm = time.match(/(\d{1,2}):(\d{2})/);
    out.push({
      ext_id: `pbst:${hashOf([day, time, signed, cardCur, desc, card].join("|"))}`,
      day, time: tm ? `${tm[1].padStart(2, "0")}:${tm[2]}` : null, kind, amount, currency,
      category: isTransfer ? null : category,
      note,
      scope: isTransfer ? "transfer" : "personal",
    });
  }
  return { rows: out, total: dataRows.length, skipped };
}

// Текст CSV: приват иногда выгружает в windows-1251 — переигрываем декодирование.
export function decodeStatementText(buf: Buffer): string {
  let text = buf.toString("utf8");
  const bad = (text.match(/�/g) || []).length;
  if (bad > 5) {
    try { text = new TextDecoder("windows-1251").decode(buf); } catch { /* остаёмся на utf8 */ }
  }
  return text.replace(/^﻿/, "");
}
