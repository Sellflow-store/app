interface Props {
  title: string;
  content: string;
}

/** Dokumenty są zwykłym tekstem (generowanym albo wpisanym ręcznie), ale mają
 *  przewidywalny szkielet: linia „§1. Tytuł" zaczyna paragraf, wszystko inne to
 *  treść. Wyciągamy z tego nagłówki, żeby regulamin dało się skanować wzrokiem,
 *  a nie tylko czytać od góry do dołu. Tekst spoza tego wzorca renderuje się
 *  jak dotąd — akapitami. */
function blocks(content: string) {
  const lines = content.split("\n");
  const out: { kind: "title" | "heading" | "body"; text: string }[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    if (t.startsWith("§")) {
      out.push({ kind: "heading", text: t });
      return;
    }
    // Pierwsza linia wygenerowanego dokumentu to jego pełna nazwa wersalikami —
    // nad nią stoi już h1 strony, więc podajemy ją ciszej, jako nadtytuł.
    if (i === 0 && t === t.toUpperCase() && t.length > 8) {
      out.push({ kind: "title", text: t });
      return;
    }
    const prev = out[out.length - 1];
    if (prev?.kind === "body") prev.text += `\n${t}`;
    else out.push({ kind: "body", text: t });
  });
  return out;
}

export default function LegalDocument({ title, content }: Props) {
  const parsed = content.trim() ? blocks(content) : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">{title}</h1>
      {parsed.length > 0 ? (
        <div className="text-sm text-ink-2 font-light leading-relaxed">
          {parsed.map((b, i) =>
            b.kind === "heading" ? (
              <h2 key={i} className="text-base font-semibold text-ink mt-8 mb-2 first:mt-0">
                {b.text}
              </h2>
            ) : b.kind === "title" ? (
              <p key={i} className="text-xs uppercase tracking-wide text-ink-2/60 mb-8">
                {b.text}
              </p>
            ) : (
              <p key={i} className="whitespace-pre-line mb-2">
                {b.text}
              </p>
            )
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-2/70 font-light">
          Dokument jest w przygotowaniu. Wkrótce pojawi się w tym miejscu.
        </p>
      )}
    </div>
  );
}
