export function projection(presenze) {
  return presenze.map((p) => ({
    inizio: p.ora_inizio,
    fine: p.ora_fine,
    giorno: p.giorno,
    giorno_numerico: getDay(p.giorno),
    settimana: p.settimana,
    anno: p.anno,
    day: getDayFromWeekNumberDayNumberYear(p.settimana, getDay(p.giorno) - 1, p.anno),
    id: p.alias,
  }));
}
function getDay(giorno) {
  if (giorno === "Domenica") return 0;
  if (giorno === "Lunedì") return 1;
  if (giorno === "Martedì") return 2;
  if (giorno === "Mercoledì") return 3;
  if (giorno === "Giovedì") return 4;
  if (giorno === "Venerdì") return 5;
  if (giorno === "Sabato") return 6;
}

function getDayFromWeekNumberDayNumberYear(weekNumber, dayNumber, year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (weekNumber - 1) * 7 + (dayNumber - 1);
  const targetDate = new Date(firstDayOfYear);
  targetDate.setDate(firstDayOfYear.getDate() + daysOffset);
  return targetDate.toISOString().split("T")[0];
}
