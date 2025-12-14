export function setFinestra(valore) {
  //20 ore diviso 100;
  return (valore / 9.6) * 0.24 + 0;
}

export function calcola(valore) {
  if (valore < 8) return 1 / 12;
  if (valore < 16) return 1 / 6;
  if (valore < 50) return 0.25;
  if (valore < 75) return 0.5;
  if (valore <= 100) return 1;
  return 1;
}

export function calcolaAmpiezzaTemporale(valore) {
  if (valore < 8) return 2;
  if (valore < 16) return 4;
  if (valore < 50) return 6;
  if (valore < 75) return 12;
  if (valore <= 100) return 24;
}
