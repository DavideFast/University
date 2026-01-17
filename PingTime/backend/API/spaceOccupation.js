import { projection } from "./select.js";
import { innerJoinFlat } from "./join.js";

export function registerSpaceOccupationAPI(req, res, db) {
  const { startWeek, endWeek } = req.query;

  if (!startWeek || !endWeek) {
    return res.status(400).json({ error: "startWeek e endWeek obbligatori" });
  }
  // Converto in numeri
  const [startYear, startWeekNum] = startWeek.split("_").map(Number);
  const [endYear, endWeekNum] = endWeek.split("_").map(Number);

  if ([startYear, startWeekNum, endYear, endWeekNum].some(isNaN)) {
    return res.status(400).json({ error: "startWeek e endWeek devono essere nel formato YYYY_WW" });
  }

  const presenze = db.data.exam_Calendario;
  const lezioni = db.data.pingtime_Fascia_Oraria;

  // Filtra presenze tra settimana start e end
  const joined = innerJoinFlat({
    left: presenze,
    right: lezioni,
    leftKey: "fascia_oraria",
    rightKey: "id",
  });

  const filtered = projection(joined).filter((p) => {
    const weekValue = p.anno * 100 + p.settimana; // es: 202545
    const startValue = startYear * 100 + startWeekNum;
    const endValue = endYear * 100 + endWeekNum;
    return weekValue >= startValue && weekValue <= endValue;
  });

  return filtered;
}
