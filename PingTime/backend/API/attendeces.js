export function registeredAttendencesAPI(req, res, db) {
  const interval = req.query.interval ?? "W";
  const athlete = req.query.athlete ?? null;

  if (!["W", "M", "Y"].includes(interval)) {
    return res.status(400).send("Invalid interval parameter. Allowed: W, M, Y");
  }

  // headers CSV
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=stats.csv");
  res.write("\uFEFF"); // BOM UTF-8

  // filtro base
  let rows = db.data.exam_Calendario.filter((r) => r.gruppo === 1);

  if (athlete) {
    rows = rows.filter((r) => r.alias === athlete);
  }

  // aggregazione
  const map = new Map();

  for (const row of rows) {
    const fascia = db.data.pingtime_Fascia_Oraria.find((f) => f.id === row.fascia_oraria);

    if (!fascia) continue;

    const date = calculateDate(row.anno, row.settimana, fascia.giorno);
    const timeKey = buildTimeKey(interval, row, date);

    if (!map.has(timeKey)) {
      map.set(timeKey, {
        time: timeKey,
        presences: 0,
        absences: 0,
        cancellations: 0,
      });
    }

    const agg = map.get(timeKey);

    if (row.effettivo === 1 && row.assente === 0) agg.presences++;
    else if (row.effettivo === 1 && row.assente === 1) agg.absences++;
    else if (row.effettivo === 0 && row.assente === 1) agg.cancellations++;
  }

  // CSV output
  res.write("time,presences,absences,cancellations\n");

  [...map.values()]
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach((r) => {
      res.write(`${r.time},${r.presences},${r.absences},${r.cancellations}\n`);
    });

  res.end();
}

// mapping giorni → offset (come CASE SQL)
const dayOffset = {
  Lunedì: 0,
  Martedì: 1,
  Mercoledì: 2,
  Giovedì: 3,
  Venerdì: 4,
  Sabato: 5,
  Domenica: 6,
};

// helper: calcolo data da anno + settimana + giorno
function calculateDate(year, week, dayName) {
  const jan1 = new Date(year, 0, 1);
  const days = (week - 1) * 7 + (dayOffset[dayName] ?? 0);
  const date = new Date(jan1);
  date.setDate(jan1.getDate() + days);
  return date;
}

// helper: format time key
function buildTimeKey(interval, row, date) {
  switch (interval) {
    case "M":
      return `${date.getMonth() + 1}_${row.anno}`;
    case "Y":
      return `${date.getFullYear()}`;
    case "W":
    default:
      return `${row.settimana}_${row.anno}`;
  }
}
