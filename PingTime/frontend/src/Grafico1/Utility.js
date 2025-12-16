import * as d3 from "d3";

/**
 * Returns the weekly interval for a given date
 * @param {Date} date - The input date
 * @returns {Object} Object with startDate and endDate of the week
 */
export function getIntervalloSettimanale(date) {
    var intervallo={};

    console.log("------------------------------");
    var giorno = (date).getDay();
    console.log(giorno);

    
    if(giorno !== 1){
        const inizioIntervallo = d3.utcMonday.floor(date);
        const fineIntervallo = d3.utcDay.offset(inizioIntervallo,6);
        intervallo.inizio = inizioIntervallo;
        intervallo.fine = fineIntervallo;
        console.log(intervallo);
        return intervallo;
    }
    else{
        const inizioIntervallo = date;
        const fineIntervallo = d3.utcDay.offset(inizioIntervallo,6);
        intervallo.inizio = inizioIntervallo;
        intervallo.fine = fineIntervallo;
        console.log(intervallo);
        return intervallo
    }
}