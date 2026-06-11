interface Props {
  title: string;
  content: string;
}

export default function LegalDocument({ title, content }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">{title}</h1>
      {content.trim() ? (
        <div className="text-sm text-ink-2 font-light leading-relaxed whitespace-pre-line">
          {content}
        </div>
      ) : (
        <p className="text-sm text-ink-2/70 font-light">
          Dokument jest w przygotowaniu. Wkrótce pojawi się w tym miejscu.
        </p>
      )}
    </div>
  );
}
