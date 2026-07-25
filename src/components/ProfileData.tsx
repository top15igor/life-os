// Блок «Твои данные» (экспорт, Obsidian, открытый код). Вынесен на
// отдельную страницу /profile/data, чтобы профиль оставался компактным.

const STR: Record<string, { hint: string; exportBtn: string; obsidianBtn: string; obsidianHint: string; openCode: string; privacyLink: string }> = {
  ru: { hint: "Всё, что ты доверил LIFE OS — записи, финансы, книги, здоровье, настроение, путешествия, память — одним файлом, в любой момент. А код LIFE OS открыт: можешь сам проверить, что мы делаем с данными.", exportBtn: "Скачать все мои данные", obsidianBtn: "Скачать для Obsidian (Markdown)", obsidianHint: "Хочешь хранить всё у себя? Скачай дневник папкой Markdown-файлов и открой в Obsidian — данные станут полностью твоими, без зависимости от нас.", openCode: "Открытый код на GitHub", privacyLink: "Приватность: как мы обращаемся с данными" },
  en: { hint: "Everything you've trusted to LIFE OS — entries, finance, books, health, mood, travel, memories — in one file, anytime. And the LIFE OS code is open: check for yourself what we do with data.", exportBtn: "Download all my data", obsidianBtn: "Download for Obsidian (Markdown)", obsidianHint: "Want to keep everything yourself? Download your diary as a folder of Markdown files and open it in Obsidian — your data becomes fully yours.", openCode: "Open source on GitHub", privacyLink: "Privacy: how we treat your data" },
  uk: { hint: "Усе, що ти довірив LIFE OS — записи, фінанси, книги, здоров'я, настрій, подорожі, пам'ять — одним файлом, будь-коли. А код LIFE OS відкритий: можеш сам перевірити, що ми робимо з даними.", exportBtn: "Завантажити всі мої дані", obsidianBtn: "Завантажити для Obsidian (Markdown)", obsidianHint: "Хочеш зберігати все в себе? Завантаж щоденник текою Markdown-файлів і відкрий в Obsidian — дані стануть повністю твоїми.", openCode: "Відкритий код на GitHub", privacyLink: "Приватність: як ми поводимося з даними" },
  fr: { hint: "Tout ce que tu as confié à LIFE OS — entrées, finances, livres, santé, humeur, voyages, souvenirs — en un fichier, quand tu veux. Et le code de LIFE OS est ouvert : vérifie toi-même ce qu'on fait des données.", exportBtn: "Télécharger toutes mes données", obsidianBtn: "Télécharger pour Obsidian (Markdown)", obsidianHint: "Tu veux tout garder chez toi ? Télécharge ton journal en dossier de fichiers Markdown et ouvre-le dans Obsidian — tes données t'appartiennent entièrement.", openCode: "Code source sur GitHub", privacyLink: "Confidentialité : comment nous traitons tes données" },
  es: { hint: "Todo lo que has confiado a LIFE OS — entradas, finanzas, libros, salud, ánimo, viajes, recuerdos — en un solo archivo, cuando quieras. Y el código de LIFE OS es abierto: puedes comprobar tú mismo qué hacemos con los datos.", exportBtn: "Descargar todos mis datos", obsidianBtn: "Descargar para Obsidian (Markdown)", obsidianHint: "¿Quieres guardarlo todo tú mismo? Descarga tu diario como una carpeta de archivos Markdown y ábrelo en Obsidian — tus datos pasan a ser completamente tuyos, sin depender de nosotros.", openCode: "Código abierto en GitHub", privacyLink: "Privacidad: cómo tratamos tus datos" },
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
      <a href="https://github.com/top15igor/life-os" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none", marginBottom: 9 }}>
        <i className="ti ti-brand-github" style={{ fontSize: 16 }} />{s.openCode}
      </a>
      <a href="/privacy" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 13.5, textDecoration: "none" }}>
        <i className="ti ti-lock" style={{ fontSize: 16 }} />{s.privacyLink}
      </a>
    </div>
  );
}
