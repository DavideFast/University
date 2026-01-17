function outputCSV(res, data, tableName) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${tableName}_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv"`);

  // BOM UTF-8 (Excel)
  res.write("\uFEFF");

  if (!data.length) {
    res.end("No data available\n");
    return;
  }

  const headers = Object.keys(data[0]);
  res.write(headers.join(",") + "\n");

  for (const row of data) {
    res.write(headers.map((h) => row[h]).join(",") + "\n");
  }

  res.end();
}

export function registerGetCalendarioRawAPI(req, res, db) {
  const format = (req.query.format ?? "json").toLowerCase();

  if (!["json", "csv"].includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
  }

  // equivalente di: WHERE gruppo = 1
  const data = db.data.exam_Calendario
    .filter((r) => r.gruppo === 1)
    .map((r) => ({
      anno: r.anno,
      settimana: r.settimana,
      fascia_oraria: r.fascia_oraria,
      alias: r.alias,
      gruppo: r.gruppo,
      effettivo: r.effettivo,
      assente: r.assente,
    }));

  if (format === "csv") {
    return outputCSV(res, data, "pingtime_Calendario");
  }

  res.json(data);
}
