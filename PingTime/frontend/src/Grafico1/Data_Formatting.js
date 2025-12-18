import * as d3 from "d3";
import { getGiornoDaSettimana } from "./Utility";

function creaArrayFascia(db_fasce) {
  db_fasce.sort((a, b) => {
    return a.id - b.id;
  });
  const dimensione_array_fascia = Number(db_fasce[db_fasce.length - 1].id);
  var arrayFascia = new Array(dimensione_array_fascia);
  for (let i = 0; i < db_fasce.length; i++) {
    arrayFascia[db_fasce[i].id] = db_fasce[i] ? db_fasce[i] : null;
  }
  return arrayFascia;
}

function joinFasceOrariePresenze(db_calendario, db_fasce) {
  //Creo un'array di dimensione pari al numero delle fasce
  var join = new Array(db_calendario.length);

  //Copio le informazioni della fascia i-esima nell'array in posizione i-esima
  for (let i = 0; i < db_calendario.length; i++) {
    join[i] = {};
    join[i].inizio = db_fasce[db_calendario[i].fascia_oraria].ora_inizio;
    join[i].fine = db_fasce[db_calendario[i].fascia_oraria].ora_fine;
    join[i].giorno = db_fasce[db_calendario[i].fascia_oraria].giorno;
    if (join[i].giorno === "Domenica") join[i].giorno_numerico = 0;
    if (join[i].giorno === "Lunedì") join[i].giorno_numerico = 1;
    if (join[i].giorno === "Martedì") join[i].giorno_numerico = 2;
    if (join[i].giorno === "Mercoledì") join[i].giorno_numerico = 3;
    if (join[i].giorno === "Giovedì") join[i].giorno_numerico = 4;
    if (join[i].giorno === "Venerdì") join[i].giorno_numerico = 5;
    if (join[i].giorno === "Sabato") join[i].giorno_numerico = 6;
    join[i].day = getGiornoDaSettimana(
      db_calendario[i].settimana,
      join[i].giorno_numerico
    );
  }
  
  //Ordino in ordine cronologico
  join.sort((a, b) => {
    return d3.ascending(a.day, b.day);
  });

  return join;
}

function creaArrayPerGrafico(join, codominio) {
  //Calcola quanti giorni sono presenti sull'asse y visibile
  const giorni = Math.floor((codominio[1] - codominio[0]) / (1000 * 60 * 60 * 24));


  //Crea un array di dimensione pari al numero di tick del dominio per il numero di tick del codominio del grafico
  var arrayFasce = new Array(giorni * 24 * 12); 
  for (let i = 0; i < giorni; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;

      if (j < 120) {
        if (j % 12 === 0)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":00";
        else if (j % 12 === 1) {
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":05";
        } else if (j % 12 === 2)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":10";
        else if (j % 12 === 3)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":15";
        else if (j % 12 === 4)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":20";
        else if (j % 12 === 5)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":25";
        else if (j % 12 === 6)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":30";
        else if (j % 12 === 7)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":35";
        else if (j % 12 === 8)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":40";
        else if (j % 12 === 9)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":45";
        else if (j % 12 === 10)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":50";
        else if (j % 12 === 11)
          arrayFasce[i * 288 + j].fascia = "0" + Math.floor(j / 12) + ":55";
      } else {
        if (j % 12 === 0)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":00";
        else if (j % 12 === 1)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":05";
        else if (j % 12 === 2)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":10";
        else if (j % 12 === 3)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":15";
        else if (j % 12 === 4)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":20";
        else if (j % 12 === 5)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":25";
        else if (j % 12 === 6)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":30";
        else if (j % 12 === 7)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":35";
        else if (j % 12 === 8)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":40";
        else if (j % 12 === 9)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":45";
        else if (j % 12 === 10)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":50";
        else if (j % 12 === 11)
          arrayFasce[i * 288 + j].fascia = Math.floor(j / 12) + ":55";
      }
      if (i === 0)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 6);
      if (i === 1)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 0);
      if (i === 2)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 1);
      if (i === 3)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 2);
      if (i === 4)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 3);
      if (i === 5)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 4);
      if (i === 6)
        arrayFasce[i * 288 + j].giorno = d3.utcDay.offset(codominio[0], 5);
    }

  }
  //Eliminare tutti i dati che hanno codominio fuori dal range
  join = join.filter(
    (item) => item.day >= codominio[0] && item.day < codominio[1]
  );

  arrayFasce.sort((a,b)=>{return d3.ascending(a.giorno,b.giorno)})

  //Per ogni presenza in un certo intervallo orario aggiornare il valore di 1
  for (let i = 0; i < join.length; i++) {
    const inizio = join[i].inizio;
    const fine = join[i].fine;
    const giorno = join[i].giorno_numerico;
    const index_inizio =
      giorno * 284 + (inizio.split(":")[0] * 12 + inizio.split(":")[1] / 5);
    const index_fine =
      giorno * 284 + (fine.split(":")[0] * 12 + fine.split(":")[1] / 5);
    for (let j = index_inizio; j < index_fine; j++) arrayFasce[j].valore += 1;
  }

  console.log(arrayFasce);
  return arrayFasce;
}

export function data_formatting(db_fasce, db_calendario, codominio) {
  console.log(codominio);
  return creaArrayPerGrafico(
    joinFasceOrariePresenze(db_calendario, creaArrayFascia(db_fasce)),
    codominio
  );
}
