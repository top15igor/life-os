import { getHeirView } from "@/lib/heirs";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

const T: Record<string, any> = {
  ru: {
    notFound: "Ссылка не найдена или больше не действует.",
    sealedKicker: "Книга жизни",
    sealedTitle: (owner: string) => `История ${owner} ждёт своего часа`,
    sealedText: (heir: string) => `${heir}, эта книга оставлена для тебя. Она откроется, когда придёт время — и тогда ты прочитаешь жизнь такой, какой её прожили и запомнили.`,
    sealedFoot: "Собрано в LIFE OS — по одной записи в день.",
    forYou: (rel: string | null) => rel ? `Для ${rel}` : "Для тебя",
    dedication: "Посвящение",
    letterClose: "Письмо тем, кто остаётся",
    letterSelf: "Письмо самому себе",
    story: "История жизни",
    empty: "Главы книги ещё собираются. Но её страницы — здесь, в каждом прожитом дне.",
  },
  en: {
    notFound: "This link was not found or is no longer valid.",
    sealedKicker: "Book of Life",
    sealedTitle: (owner: string) => `${owner}'s story is waiting for its time`,
    sealedText: (heir: string) => `${heir}, this book was left for you. It will open when the time comes — and then you'll read a life as it was lived and remembered.`,
    sealedFoot: "Gathered in LIFE OS — one entry a day.",
    forYou: (rel: string | null) => rel ? `For ${rel}` : "For you",
    dedication: "Dedication",
    letterClose: "A letter to those who remain",
    letterSelf: "A letter to myself",
    story: "Life story",
    empty: "The chapters are still being gathered. But its pages are here, in every day lived.",
  },
};

const STYLE = `
.hr-wrap{max-width:720px;margin:0 auto;padding:0 22px}
.hr-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:60px 22px}
.hr-kicker{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.hr-seal-emoji{font-size:44px}
.hr-h1{font-family:var(--font-serif,Georgia,serif);font-weight:600;font-size:clamp(26px,5vw,40px);line-height:1.1;letter-spacing:-.01em;margin:0;text-wrap:balance;max-width:18ch}
.hr-sub{font-size:16px;color:var(--text-2);line-height:1.6;max-width:52ch;margin:0}
.hr-foot{font-size:12.5px;color:var(--text-3);margin-top:18px}
.hr-hero{padding:70px 0 30px;text-align:center;border-bottom:1px solid var(--border)}
.hr-for{display:inline-block;font-size:12.5px;color:var(--text-2);background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:5px 14px;margin-bottom:18px}
.hr-sec{margin:34px 0}
.hr-sec .lab{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.hr-letter{font-family:var(--font-serif,Georgia,serif);font-size:17px;line-height:1.85;color:var(--text);white-space:pre-wrap}
.hr-ded{font-family:var(--font-serif,Georgia,serif);font-style:italic;font-size:18px;line-height:1.7;color:var(--text);text-align:center;max-width:46ch;margin:0 auto}
.hr-chap{margin:26px 0}
.hr-chap h3{font-family:var(--font-serif,Georgia,serif);font-weight:600;font-size:22px;margin:0 0 10px;letter-spacing:-.01em}
.hr-chap p{font-family:var(--font-serif,Georgia,serif);font-size:16.5px;line-height:1.85;color:var(--text);white-space:pre-wrap;margin:0}
.hr-rule{height:1px;background:var(--border);margin:30px 0}
.hr-close{text-align:center;color:var(--text-3);font-size:13px;padding:40px 0 70px}
`;

export default async function HeirPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const locale = await getLocale();
  const s = T[locale] || T.ru;
  const v = await getHeirView(token);

  if (!("ok" in v) || !v.ok) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
        <div className="hr-center"><div className="hr-sub">{s.notFound}</div></div>
      </div>
    );
  }

  if (!v.released) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
        <div className="hr-center">
          <div className="hr-seal-emoji">🕯️</div>
          <div className="hr-kicker">{s.sealedKicker}</div>
          <h1 className="hr-h1">{s.sealedTitle(v.ownerName)}</h1>
          <p className="hr-sub">{s.sealedText(v.heirName)}</p>
          <div className="hr-foot">🪷 {s.sealedFoot}</div>
        </div>
      </div>
    );
  }

  const b = v.book!;
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="hr-wrap">
        <header className="hr-hero">
          <div className="hr-for">{s.forYou(v.relation)} · {v.heirName}</div>
          <div className="hr-kicker">{s.sealedKicker}</div>
          <h1 className="hr-h1">{v.ownerName}</h1>
        </header>

        <main>
          {b.dedication && (
            <div className="hr-sec"><div className="hr-ded">«{b.dedication}»</div></div>
          )}
          {b.letterClose && (
            <div className="hr-sec"><div className="lab">{s.letterClose}</div><div className="hr-letter">{b.letterClose}</div></div>
          )}

          {b.chapters.length > 0 ? (
            <div className="hr-sec">
              <div className="lab">{s.story}</div>
              {b.chapters.map((c, i) => (
                <div className="hr-chap" key={i}>
                  {c.title && <h3>{c.title}</h3>}
                  <p>{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="hr-sec"><p className="hr-sub" style={{ textAlign: "center", margin: "0 auto" }}>{s.empty}</p></div>
          )}

          {b.letterSelf && (
            <>
              <div className="hr-rule" />
              <div className="hr-sec"><div className="lab">{s.letterSelf}</div><div className="hr-letter">{b.letterSelf}</div></div>
            </>
          )}
        </main>

        <footer className="hr-close">🪷 LIFE OS · {s.sealedFoot}</footer>
      </div>
    </div>
  );
}
