export function registerAdjMatrixAPI(req, db) {
  console.log("hello from adjMatrix API");
  const interval = req.query.interval ?? "W";
  const index = req.query.index ? Number(req.query.index) : null;
  const year = req.query.year ? Number(req.query.year) : null;
  console.log(interval, index, year);

  // Validazioni (come PHP)
  if (interval !== "W") {
    return res.status(400).json({ error: "Invalid interval. Allowed: W" });
  }

  if (index !== null && Number.isNaN(index)) {
    return res.status(400).json({ error: "Invalid index. Must be numeric." });
  }

  if (year !== null && Number.isNaN(year)) {
    return res.status(400).json({ error: "Invalid year. Must be numeric." });
  }

  // Filtri fissi
  let rows = db.data.exam_Calendario.filter((r) => r.gruppo === 1 && r.effettivo === 1 && r.assente === 0);
  console.log(db.data);
  // Filtri dinamici
  if (index !== null) {
    rows = rows.filter((r) => r.settimana === index);
  }

  if (year !== null) {
    rows = rows.filter((r) => r.anno === year);
  }

  /**
   * Ricostruzione della JOIN:
   * stessa fascia_oraria + settimana
   * alias diversi
   * alias1 > alias2 (evita duplicati)
   */
  const edgeMap = new Map();

  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a1 = rows[i];
      const a2 = rows[j];

      if (a1.fascia_oraria === a2.fascia_oraria && a1.settimana === a2.settimana && a1.alias !== a2.alias) {
        const [src, dst] = a1.alias > a2.alias ? [a1.alias, a2.alias] : [a2.alias, a1.alias];

        const key = `${src}|${dst}`;
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      }
    }
  }

  // Output finale
  const result = Array.from(edgeMap.entries())
    .map(([key, weight]) => {
      const [src, dst] = key.split("|");
      return { src, dst, weight };
    })
    .sort((a, b) => b.weight - a.weight || a.src.localeCompare(b.src) || a.dst.localeCompare(b.dst));

  return result;
}
