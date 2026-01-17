export function registeredGeneralStatsAPI(req, res, db) {
  const interval = req.query.interval ?? "W";
  const week = Number(req.query.weeknumber ?? getWeekNumber(new Date()));
  const month = Number(req.query.monthnumber ?? new Date().getMonth() + 1);
  const year = Number(req.query.year ?? new Date().getFullYear());

  let current, previous;

  if (interval === "W") {
    const prevWeek = week === 1 ? 52 : week - 1;
    const prevYear = week === 1 ? year - 1 : year;

    current = getWeekStats(week, year, db);
    previous = getWeekStats(prevWeek, prevYear, db);
  }

  if (interval === "M") {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    current = getMonthStats(month, year, db);
    previous = getMonthStats(prevMonth, prevYear, db);
  }

  if (interval === "Y") {
    current = getYearStats(year, db);
    previous = getYearStats(year - 1, db);
  }

  res.json({ current, previous });
}
const GROUP_ID = 1;

// ---------- Helpers ----------
const dayIndex = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
  Lunedì: 0,
  Martedì: 1,
  Mercoledì: 2,
  Giovedì: 3,
  Venerdì: 4,
  Sabato: 5,
  Domenica: 6,
};

function getDateFromWeek(year, week, day) {
  const jan4 = new Date(year, 0, 4);
  const start = new Date(jan4);
  start.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1));
  const date = new Date(start);
  date.setDate(start.getDate() + (week - 1) * 7 + (dayIndex[day] ?? 0));
  return date;
}

function countLog(group, filterFn, db) {
  console.log("Momentaneamente disabilitato il calcolo delle variazioni nei log");
  //return db.data.pingtime_log.filter((l) => l.group_id === group && ["add_athlete_to_slot", "remove_athlete_from_slot"].includes(l.request_type) && filterFn(new Date(l.date_time))).length;
}

// ---------- WEEK ----------
function getWeekStats(week, year, db) {
  const rows = db.data.exam_Calendario.filter((r) => r.gruppo === GROUP_ID && r.settimana === week && r.anno === year);

  let presenze = 0,
    assenze = 0,
    cancellazioni = 0;

  for (const r of rows) {
    if (r.effettivo === 1 && r.assente === 0) presenze++;
    else if (r.effettivo === 1 && r.assente === 1) assenze++;
    else if (r.effettivo === 0 && r.assente === 1) cancellazioni++;
  }

  const distinctSlots = new Map();
  rows.forEach((r) => {
    const key = `${r.fascia_oraria}|${r.settimana}|${r.anno}`;
    if (!distinctSlots.has(key)) {
      const slot = db.data.pingtime_Fascia_Oraria.find((f) => f.id === r.fascia_oraria);
      distinctSlots.set(key, slot?.posti_disponibili ?? 0);
    }
  });

  const posti_totali = [...distinctSlots.values()].reduce((a, b) => a + b, 0);

  const variazioni = countLog(GROUP_ID, (d) => d.getFullYear() === year && getWeekNumber(d) === week, db);

  return { presenze, assenze, cancellazioni, posti_totali, variazioni };
}

// ---------- MONTH ----------
function getMonthStats(month, year, db) {
  const rows = db.data.exam_Calendario.filter((r) => r.gruppo === GROUP_ID && r.anno === year);

  let presenze = 0,
    assenze = 0,
    cancellazioni = 0;
  const slotMap = new Map();

  for (const r of rows) {
    const fascia = db.data.pingtime_Fascia_Oraria.find((f) => f.id === r.fascia_oraria);
    if (!fascia) continue;

    const date = getDateFromWeek(year, r.settimana, fascia.giorno);
    if (date.getMonth() + 1 !== month) continue;

    if (r.effettivo === 1 && r.assente === 0) presenze++;
    else if (r.effettivo === 1 && r.assente === 1) assenze++;
    else if (r.effettivo === 0 && r.assente === 1) cancellazioni++;

    const key = `${r.fascia_oraria}|${r.settimana}`;
    slotMap.set(key, fascia.posti_disponibili);
  }

  const posti_totali = [...slotMap.values()].reduce((a, b) => a + b, 0);

  const variazioni = countLog(GROUP_ID, (d) => d.getFullYear() === year && d.getMonth() + 1 === month, db);

  return { presenze, assenze, cancellazioni, posti_totali, variazioni };
}

// ---------- YEAR ----------
function getYearStats(year, db) {
  const rows = db.data.exam_Calendario.filter((r) => r.gruppo === GROUP_ID && r.anno === year);

  let presenze = 0,
    assenze = 0,
    cancellazioni = 0;
  const slotMap = new Map();

  for (const r of rows) {
    if (r.effettivo === 1 && r.assente === 0) presenze++;
    else if (r.effettivo === 1 && r.assente === 1) assenze++;
    else if (r.effettivo === 0 && r.assente === 1) cancellazioni++;

    const fascia = db.data.pingtime_Fascia_Oraria.find((f) => f.id === r.fascia_oraria);
    if (!fascia) continue;

    const key = `${r.fascia_oraria}|${r.settimana}`;
    slotMap.set(key, fascia.posti_disponibili);
  }

  const posti_totali = [...slotMap.values()].reduce((a, b) => a + b, 0);

  const variazioni = countLog(GROUP_ID, (d) => d.getFullYear() === year, db);

  return { presenze, assenze, cancellazioni, posti_totali, variazioni };
}

// ISO week number
function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
