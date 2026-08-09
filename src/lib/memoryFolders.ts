// Подпапки «Визуальной памяти»: внутри категории вещи собираются в стопки
// (паспорта → одна папка, чеки → другая). Папку называет AI при разборе фото;
// эта эвристика — запасной разбор для фото без папки (в т.ч. загруженных ДО фичи),
// чтобы группировка работала сразу. Модуль без серверных импортов — годится и
// для клиента (мгновенная группировка), и для бэкфилла на сервере.

type Field = { label?: string; value?: string };

// Возвращает имя папки (в языке владельца — RU) или null, если стопка не нужна.
export function deriveFolder(category: string, title?: string, fields?: Field[]): string | null {
  const hay = [
    title || "",
    ...(fields || []).map((f) => `${f?.label || ""} ${f?.value || ""}`),
  ].join(" ").toLowerCase();

  const has = (re: RegExp) => re.test(hay);

  // Документы и удостоверения — самое полезное для стопок.
  if (has(/загранпаспорт|закордонний паспорт|passport/)) return "Паспорта";
  if (has(/\bпаспорт\b|паспорт гражданина|id[- ]?card|удостоверение личности/)) return "Паспорта";
  if (has(/свидетельств.*рожд|свідоцтв.*народж|birth certificate/)) return "Свидетельства о рождении";
  if (has(/свидетельств.*брак|marriage certificate|свідоцтв.*шлюб/)) return "Свидетельства о браке";
  if (has(/\bсвидетельств|\bсвідоцтв|certificate/)) return "Свидетельства";
  if (has(/ипн|іпн|инн|налог.*код|податк|tax (id|number)|платник податк/)) return "Налоговые (ИНН)";
  if (has(/водительск|water.*licen|driver'?s? licen|посвідчення водія|права/)) return "Водительские права";
  if (has(/виза|visa|вид на жительство|residence permit|permit de séjour/)) return "Визы и ВНЖ";

  // Финансовые бумаги.
  if (has(/\bчек\b|receipt|касов.*чек|фіскальн/)) return "Чеки";
  if (has(/квитанц|invoice|счёт на оплату|payment.*confirmation/)) return "Квитанции";
  if (has(/гаранти|warranty|guarantee/)) return "Гарантии";
  if (has(/договор|contract|соглашение|угода|agreement/)) return "Договоры";
  if (has(/билет|ticket|посадочн|boarding pass/)) return "Билеты";

  // Доступы/безопасность.
  if (has(/ключ восстановлен|recovery key|resetовый|access token|пароль|password|seed|мнемоник/)) return "Коды и доступы";

  // Здоровье/медицина.
  if (has(/анализ|медицин|справка|prescription|рецепт врач|мед.*заключ|диагноз/)) return "Медицина";

  return null;
}
