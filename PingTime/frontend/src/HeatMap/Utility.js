import * as d3 from "d3";

/**
 * Returns the weekly interval for a given date
 * @param {Date} date - The input date
 * @returns {Object} Object with startDate and endDate of the week
 */
export function getIntervalloSettimanale(date) {
  var intervallo = {};
  var giorno = date.getDay();

  if (giorno !== 1) {
    const inizioIntervallo = d3.utcMonday.floor(date).setHours(0);
    const fineIntervallo = d3.utcDay.offset(inizioIntervallo, 6).setHours(24);
    intervallo.inizio = inizioIntervallo;
    intervallo.fine = fineIntervallo;
    return intervallo;
  } else {
    var inizioIntervallo = new Date(date).setHours(0);
    inizioIntervallo = new Date(inizioIntervallo).setMinutes(0);
    inizioIntervallo = new Date(inizioIntervallo).setSeconds(0);
    const fineIntervallo = d3.utcDay.offset(inizioIntervallo, 6).setHours(24);
    intervallo.inizio = inizioIntervallo;
    intervallo.fine = fineIntervallo;
    return intervallo;
  }
}

export function getIntervalloMensile(date) {
  var intervallo = {};
  const mese = date.getMonth();
  var anno = date.getFullYear();
  var contatore = 1;
  if (new Date(Date.UTC(anno, mese, contatore)).getDay === 6) {
    intervallo.inizio = new Date(Date.UTC(anno, mese, 1, 0, 0, 0));
  } else {
    intervallo.inizio = d3.utcMonday.floor(new Date(Date.UTC(anno, mese, contatore, 0, 0, 0)));
  }
  intervallo.fine = d3.utcDay.floor(d3.utcMonday.ceil(new Date(Date.UTC(anno, mese + 1, 0, 0, 0, 0))));
  intervallo.ticks = d3.utcDay.range(d3.utcDay.offset(intervallo.inizio, 0), d3.utcDay.offset(d3.utcMonday.ceil(new Date(Date.UTC(anno, mese + 1, 0, 0, 0, 0))), 1), 7);
  return intervallo;
}

export function getIntervalloAnnuale(date) {
  var intervallo = {};
  var anno = date.getFullYear();
  intervallo.inizio = new Date(Date.UTC(anno, 0, 1));
  intervallo.fine = new Date(Date.UTC(anno, 11, 31));
  return intervallo;
}

export function getGiornoDaSettimana(numeroSettimana, numeroGiono, anno) {
  const startOfYear = new Date(anno, 0, 1);
  const firstMonday = d3.utcMonday.ceil(startOfYear);
  const weekStart = d3.utcWeek.offset(firstMonday, numeroSettimana - 2);
  return d3.utcDay.offset(weekStart, numeroGiono - 1);
}

export function getScorrimentoX(event, posPrecedente, inizioFinestra, fineFinestra, vista) {
  //Definisco alcune variabili per comodità
  const spostamentoAvanti = 1; //Math.ceil(event.subject.x - event.x) / 100;
  const spostamentoIndietro = 1; //Math.ceil(event.x - event.subject.x) / 100;

  if (event.x < posPrecedente /*event.x < event.subject.x*/) {
    if (vista === 1) {
      //Solo 24 celle
      //Non c'è bisogno di spostare la finestra
    }
    if (vista === 2) {
      //Solo 48 celle
      if (fineFinestra < 49) {
        if (fineFinestra + spostamentoAvanti < 48) {
          inizioFinestra = inizioFinestra + spostamentoAvanti;
          fineFinestra = fineFinestra + spostamentoAvanti;
        } else if (fineFinestra < 49) {
          inizioFinestra = inizioFinestra + 1;
          fineFinestra = fineFinestra + 1;
        }
      }
    }

    if (vista === 3) {
      //Solo 96 celle
      if (fineFinestra < 97) {
        if (fineFinestra + spostamentoAvanti < 96) {
          inizioFinestra = inizioFinestra + spostamentoAvanti * 2;
          fineFinestra = fineFinestra + spostamentoAvanti * 2;
        } else if (fineFinestra < 97) {
          inizioFinestra = inizioFinestra + 1;
          fineFinestra = fineFinestra + 1;
        }
      }
    }

    if (vista === 4) {
      //Solo 144 celle
      if (fineFinestra < 145) {
        if (fineFinestra + spostamentoAvanti < 144) {
          inizioFinestra = inizioFinestra + spostamentoAvanti * 3;
          fineFinestra = fineFinestra + spostamentoAvanti * 3;
        } else if (fineFinestra < 145) {
          inizioFinestra = inizioFinestra + 1;
          fineFinestra = fineFinestra + 1;
        }
      }
    }

    if (vista === 5) {
      //Solo 288 celle
      if (fineFinestra < 289) {
        if (fineFinestra + spostamentoAvanti < 289) {
          inizioFinestra = inizioFinestra + spostamentoAvanti * 6;
          fineFinestra = fineFinestra + spostamentoAvanti * 6;
        } else if (fineFinestra < 289) {
          inizioFinestra = inizioFinestra + 1;
          fineFinestra = fineFinestra + 1;
        }
      }
    }
  } else if (posPrecedente < event.x) {
    if (vista === 1) {
      //Non posso spostare la finestra
    }
    if (vista === 2)
      if (inizioFinestra > 0) {
        if (fineFinestra - spostamentoIndietro > 0) {
          inizioFinestra = inizioFinestra - spostamentoIndietro;
          fineFinestra = fineFinestra - spostamentoIndietro;
        } else if (fineFinestra >= spostamentoIndietro) {
          inizioFinestra = inizioFinestra - 1;
          fineFinestra = fineFinestra - 1;
        }
      }
    if (vista === 3)
      if (inizioFinestra > 0) {
        if (fineFinestra - spostamentoIndietro > 0) {
          inizioFinestra = inizioFinestra - spostamentoIndietro * 2;
          fineFinestra = fineFinestra - spostamentoIndietro * 2;
        } else if (fineFinestra >= spostamentoIndietro * 2) {
          inizioFinestra = inizioFinestra - 1;
          fineFinestra = fineFinestra - 1;
        }
      }
    if (vista === 4)
      if (inizioFinestra > 0) {
        if (fineFinestra - spostamentoIndietro > 0) {
          inizioFinestra = inizioFinestra - spostamentoIndietro * 3;
          fineFinestra = fineFinestra - spostamentoIndietro * 3;
        } else if (fineFinestra >= spostamentoIndietro * 3) {
          inizioFinestra = inizioFinestra - 1;
          fineFinestra = fineFinestra - 1;
        }
      }
    if (vista === 5)
      if (inizioFinestra > 0) {
        if (fineFinestra - spostamentoIndietro > 0) {
          inizioFinestra = inizioFinestra - spostamentoIndietro * 6;
          fineFinestra = fineFinestra - spostamentoIndietro * 6;
        } else if (fineFinestra >= spostamentoIndietro * 6) {
          inizioFinestra = inizioFinestra - 1;
          fineFinestra = fineFinestra - 1;
        }
      }
  }
  return { inizio: inizioFinestra, fine: fineFinestra };
}

export function getZoomX(event, inizioFinestra, fineFinestra, vista_old, zoomPrecedente, width, arrayX_filtered1, arrayX_filtered2, arrayX_filtered3, arrayX_filtered4, arrayX_filtered5, x) {
  var numero;
  if (vista_old === 1) numero = 24;
  if (vista_old === 2) numero = 48;
  if (vista_old === 3) numero = 96;
  if (vista_old === 4) numero = 144;
  if (vista_old === 5) numero = 288;
  const fasciaValue = event.sourceEvent.target.__data__.fascia;
  var index = 0;
  if (vista_old === 1) index = arrayX_filtered1.findIndex((item) => item === fasciaValue);
  if (vista_old === 2) index = arrayX_filtered2.findIndex((item) => item === fasciaValue);
  if (vista_old === 3) index = arrayX_filtered3.findIndex((item) => item === fasciaValue);
  if (vista_old === 4) index = arrayX_filtered4.findIndex((item) => item === fasciaValue);
  if (vista_old === 5) index = arrayX_filtered5.findIndex((item) => item === fasciaValue);
  var newX = x;
  var vista = vista_old;
  if ((event.transform.k - zoomPrecedente) / event.transform.k > 0.1 && zoomPrecedente !== -1) {
    if (vista === 1) {
      if (index * 2 - 12 > 0) inizioFinestra = index * 2 - 12;
      else inizioFinestra = 0;
      if (index * 2 + 12 < numero * 2) fineFinestra = index * 2 + 12;
      else fineFinestra = numero * 2 - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered2.slice(inizioFinestra, fineFinestra));
      vista = 2;
    } else if (vista === 2) {
      if (index * 2 - 12 > 0) inizioFinestra = index * 2 - 12;
      else inizioFinestra = 0;
      if (index * 2 + 12 < numero * 2) fineFinestra = index * 2 + 12;
      else fineFinestra = numero * 2 - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered3.slice(inizioFinestra, fineFinestra));
      vista = 3;
    } else if (vista === 3) {
      if (Math.floor(index * 1.5) - 12 > 0) inizioFinestra = Math.floor(index * 1.5) - 12;
      else inizioFinestra = 0;
      if (index * 1.5 + 12 < Math.floor(numero * 1.5)) fineFinestra = Math.floor(index * 1.5) + 12;
      else fineFinestra = Math.floor(numero * 1.5) - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered4.slice(inizioFinestra, fineFinestra));
      vista = 4;
    } else if (vista === 4) {
      if (index * 2 - 12 > 0) inizioFinestra = index * 2 - 12;
      else inizioFinestra = 0;
      if (index + 12 < numero * 2) fineFinestra = index * 2 + 12;
      else fineFinestra = numero * 2 - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered5.slice(inizioFinestra, fineFinestra));
      vista = 5;
    } else {
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered5.slice(inizioFinestra, fineFinestra));
      vista = 5;
    }
  } else if (event.transform.k < zoomPrecedente) {
    if (vista === 1) {
      inizioFinestra = 0;
      fineFinestra = 25;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra));
      vista = 1;
    } else if (vista === 2) {
      inizioFinestra = 0;
      fineFinestra = 25;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra));
      vista = 1;
    } else if (vista === 3) {
      if (Math.floor(index / 2) - 12 > 0) inizioFinestra = Math.floor(index / 2) - 12;
      else inizioFinestra = 0;
      if (Math.floor(index / 2) + 12 < Math.floor(numero / 2)) fineFinestra = Math.floor(index / 2) + 12;
      else fineFinestra = Math.floor(numero / 2) - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered2.slice(inizioFinestra, fineFinestra));
      vista = 2;
    } else if (vista === 4) {
      if (Math.floor(index / 1.5) - 12 > 0) inizioFinestra = Math.floor(index / 1.5) - 12;
      else inizioFinestra = 0;
      if (Math.floor(index / 1.5) + 12 < numero) fineFinestra = Math.floor(index / 1.5) + 12;
      else fineFinestra = Math.floor(numero / 1.5) - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered3.slice(inizioFinestra, fineFinestra));
      vista = 3;
    } else if (vista === 5) {
      if (Math.floor(index / 2) - 12 > 0) inizioFinestra = Math.floor(index / 2) - 12;
      else inizioFinestra = 0;
      if (Math.floor(index / 2) + 12 < Math.floor(numero / 2)) fineFinestra = Math.floor(index / 2) + 12;
      else fineFinestra = Math.floor(numero / 2) - 1;
      newX = d3.scaleBand([0, width]).domain(arrayX_filtered4.slice(inizioFinestra, fineFinestra));
      vista = 4;
    }
  }
  return { vista: vista, newX: newX.paddingOuter(0).paddingInner(1), inizioFinestra: inizioFinestra, fineFinestra: fineFinestra };
}

export function zoomY(event, inizioFinestra, fineFinestra, vista) {}

export const arrayX = [
  "00:00",
  "00:05",
  "00:10",
  "00:15",
  "00:20",
  "00:25",
  "00:30",
  "00:35",
  "00:40",
  "00:45",
  "00:50",
  "00:55",
  "01:00",
  "01:05",
  "01:10",
  "01:15",
  "01:20",
  "01:25",
  "01:30",
  "01:35",
  "01:40",
  "01:45",
  "01:50",
  "01:55",
  "02:00",
  "02:05",
  "02:10",
  "02:15",
  "02:20",
  "02:25",
  "02:30",
  "02:35",
  "02:40",
  "02:45",
  "02:50",
  "02:55",
  "03:00",
  "03:05",
  "03:10",
  "03:15",
  "03:20",
  "03:25",
  "03:30",
  "03:35",
  "03:40",
  "03:45",
  "03:50",
  "03:55",
  "04:00",
  "04:05",
  "04:10",
  "04:15",
  "04:20",
  "04:25",
  "04:30",
  "04:35",
  "04:40",
  "04:45",
  "04:50",
  "04:55",
  "05:00",
  "05:05",
  "05:10",
  "05:15",
  "05:20",
  "05:25",
  "05:30",
  "05:35",
  "05:40",
  "05:45",
  "05:50",
  "05:55",
  "06:00",
  "06:05",
  "06:10",
  "06:15",
  "06:20",
  "06:25",
  "06:30",
  "06:35",
  "06:40",
  "06:45",
  "06:50",
  "06:55",
  "07:00",
  "07:05",
  "07:10",
  "07:15",
  "07:20",
  "07:25",
  "07:30",
  "07:35",
  "07:40",
  "07:45",
  "07:50",
  "07:55",
  "08:00",
  "08:05",
  "08:10",
  "08:15",
  "08:20",
  "08:25",
  "08:30",
  "08:35",
  "08:40",
  "08:45",
  "08:50",
  "08:55",
  "09:00",
  "09:05",
  "09:10",
  "09:15",
  "09:20",
  "09:25",
  "09:30",
  "09:35",
  "09:40",
  "09:45",
  "09:50",
  "09:55",
  "10:00",
  "10:05",
  "10:10",
  "10:15",
  "10:20",
  "10:25",
  "10:30",
  "10:35",
  "10:40",
  "10:45",
  "10:50",
  "10:55",
  "11:00",
  "11:05",
  "11:10",
  "11:15",
  "11:20",
  "11:25",
  "11:30",
  "11:35",
  "11:40",
  "11:45",
  "11:50",
  "11:55",
  "12:00",
  "12:05",
  "12:10",
  "12:15",
  "12:20",
  "12:25",
  "12:30",
  "12:35",
  "12:40",
  "12:45",
  "12:50",
  "12:55",
  "13:00",
  "13:05",
  "13:10",
  "13:15",
  "13:20",
  "13:25",
  "13:30",
  "13:35",
  "13:40",
  "13:45",
  "13:50",
  "13:55",
  "14:00",
  "14:05",
  "14:10",
  "14:15",
  "14:20",
  "14:25",
  "14:30",
  "14:35",
  "14:40",
  "14:45",
  "14:50",
  "14:55",
  "15:00",
  "15:05",
  "15:10",
  "15:15",
  "15:20",
  "15:25",
  "15:30",
  "15:35",
  "15:40",
  "15:45",
  "15:50",
  "15:55",
  "16:00",
  "16:05",
  "16:10",
  "16:15",
  "16:20",
  "16:25",
  "16:30",
  "16:35",
  "16:40",
  "16:45",
  "16:50",
  "16:55",
  "17:00",
  "17:05",
  "17:10",
  "17:15",
  "17:20",
  "17:25",
  "17:30",
  "17:35",
  "17:40",
  "17:45",
  "17:50",
  "17:55",
  "18:00",
  "18:05",
  "18:10",
  "18:15",
  "18:20",
  "18:25",
  "18:30",
  "18:35",
  "18:40",
  "18:45",
  "18:50",
  "18:55",
  "19:00",
  "19:05",
  "19:10",
  "19:15",
  "19:20",
  "19:25",
  "19:30",
  "19:35",
  "19:40",
  "19:45",
  "19:50",
  "19:55",
  "20:00",
  "20:05",
  "20:10",
  "20:15",
  "20:20",
  "20:25",
  "20:30",
  "20:35",
  "20:40",
  "20:45",
  "20:50",
  "20:55",
  "21:00",
  "21:05",
  "21:10",
  "21:15",
  "21:20",
  "21:25",
  "21:30",
  "21:35",
  "21:40",
  "21:45",
  "21:50",
  "21:55",
  "22:00",
  "22:05",
  "22:10",
  "22:15",
  "22:20",
  "22:25",
  "22:30",
  "22:35",
  "22:40",
  "22:45",
  "22:50",
  "22:55",
  "23:00",
  "23:05",
  "23:10",
  "23:15",
  "23:20",
  "23:25",
  "23:30",
  "23:35",
  "23:40",
  "23:45",
  "23:50",
  "23:55",
  "24:00",
];
