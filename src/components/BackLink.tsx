import Link from "next/link";

// Ссылка «← назад» вверху подстраниц. По умолчанию ведёт на «Профиль».
const L: Record<string, string> = { ru: "Профиль", en: "Profile", uk: "Профіль", fr: "Profil", es: "Perfil" };

export default function BackLink({ locale, href = "/profile", label }: { locale: string; href?: string; label?: string }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-2)", textDecoration: "none", marginBottom: 14 }}>
      <i className="ti ti-chevron-left" style={{ fontSize: 16 }} />{label || L[locale] || L.ru}
    </Link>
  );
}
