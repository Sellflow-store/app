// Grupowanie tysięcy zawsze ("8 430,00 zł"): polska norma domyślnie pomija
// separator w liczbach czterocyfrowych, a w kolumnach i kafelkach kwot to
// utrudnia porównywanie.
const PLN = new Intl.NumberFormat("pl-PL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

export function formatPln(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return `${PLN.format(n)} zł`;
}
