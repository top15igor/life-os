import Link from "next/link";

// Ссылка «← Профиль» вверху подстраниц профиля.
const L: Record<string, string> = { ru: "Профиль", en: "Profile", uk: "Профіль", fr: "Profil" };

export default function BackLink({ locale, href = "/profile" }: { locale: string; href?: string }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
      <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{L[locale] || L.ru}
    </Link>
  );
}
