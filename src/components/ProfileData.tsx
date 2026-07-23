// Блок «Твои данные» (экспорт, Obsidian, открытый код). Вынесен на
// отдельную страницу /profile/data, чтобы профиль оставался компактным.

const STR: Record<string, { hint: string; exportBtn: string; obsidianBtn: string; obsidianHint: string; openCode: string }> = {
  ru: { hint: "Все твои записи в одном файле — забери в любой момент. А код LIFE OS открыт: можешь сам проверить, что мы делаем с данными.", exportBtn: "Скачать мои данные", obsidianBtn: "Скачать для Obsidian (Markdown)", obsidianHint: "Хочешь хранить всё у себя? Скачай дневник папкой Markdown-файлов и открой в Obsidian — данные станут полностью твоими, без зависимости от нас.", openCode: "Открытый код на GitHub" },
  en: { hint: "All your entries in one file — take them anytime. And the LIFE OS code is open: check for yourself what we do with data.", exportBtn: "Download my data", obsidianBtn: "Download for Obsidian (Markdown)", obsidianHint: "Want to keep everything yourself? Download your diary as a folder of Markdown files and open it in Obsidian — your data becomes fully yours.", openCode: "Open source on GitHub" },
  uk: { hint: "Усі твої записи в одному файлі — забери будь-коли. А код LIFE OS відкритий: можеш сам перевірити, що ми робимо з даними.", exportBtn: "Завантажити мої дані", obsidianBtn: "Завантажити для Obsidian (Markdown)", obsidianHint: "Хочеш зберігати все в себе? Завантаж щоденник текою Markdown-файлів і відкрий в Obsidian — дані стануть повністю твоїми.", openCode: "Відкритий код на GitHub" },
  fr: { hint: "Toutes tes entrées en un fichier — récupère-les quand tu veux. Et le code de LIFE OS est ouvert : vérifie toi-même ce qu'on fait des données.", exportBtn: "Télécharger mes données", obsidianBtn: "Télécharger pour Obsidian (Markdown)", obsidianHint: "Tu veux tout garder chez toi ? Télécharge ton journal en dossier de fichiers Markdown et ouvre-le dans Obsidian — tes données t'appartiennent entièrement.", openCode: "Code source sur GitHub" },
  es: { hint: "Todas tus entradas en un solo archivo — llévatelas cuando quieras. Y el código de LIFE OS es abierto: puedes comprobar tú mismo qué hacemos con los datos.", exportBtn: "Descargar mis datos", obsidianBtn: "Descargar para Obsidian (Markdown)", obsidianHint: "¿Quieres guardarlo todo tú mismo? Descarga tu diario como una carpeta de archivos Markdown y ábrelo en Obsidian — tus datos pasan a ser completamente tuyos, sin depender de nosotros.", openCode: "Código abierto en GitHub" },
};

export default function ProfileData({ locale }: { locale: string }) {
  const s = STR[locale] || STR.ru;
  return (
    <div className="card">
      <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.55 }}>{s.hint}</div>
      <a href="/api/export" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", borderRadius: 11, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none", marginBottom: 9 }}>
        <i className="ti ti-download" style={{ fontSize: 17 }} />{s.exportBtn}
      </a>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, margin: "4px 0 9px", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <i className="ti ti-folder-share" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />{s.obsidianHint}
      </div>
      <a href="/api/export-obsidian" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--accent)", background: "var(--accent-bg)", color: "var(--accent-text)", fontSize: 13.5, fontWeight: 500, textDecoration: "none", marginBottom: 9 }}>
        <i className="ti ti-folder-down" style={{ fontSize: 16 }} />{s.obsidianBtn}
      </a>
      <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
        <i className="ti ti-brand-github" style={{ fontSize: 16 }} />{s.openCode}
      </a>
    </div>
  );
}
