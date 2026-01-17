import logo from "./logo.svg";
import "./App.css";

import { useEffect } from "react";
import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

// Helper function to get current week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Helper function to get the ISO week year (can differ from calendar year at year boundaries)
function getWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

// Helper function to get the date range (Monday to Sunday) for a given ISO week number and year
function getWeekDateRange(weekNumber, weekYear) {
  // Find January 4th of the week's year (always in week 1 per ISO)
  const jan4 = new Date(weekYear, 0, 4);
  // Get the Monday of week 1
  const dayOfWeek = jan4.getDay() || 7; // Convert Sunday (0) to 7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

  // Calculate Monday of the target week
  const mondayOfTargetWeek = new Date(mondayOfWeek1);
  mondayOfTargetWeek.setDate(mondayOfWeek1.getDate() + (weekNumber - 1) * 7);

  // Calculate Sunday of the target week
  const sundayOfTargetWeek = new Date(mondayOfTargetWeek);
  sundayOfTargetWeek.setDate(mondayOfTargetWeek.getDate() + 6);

  // Format dates as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const yr = date.getFullYear();
    return `${day}/${month}/${yr}`;
  };

  return `${formatDate(mondayOfTargetWeek)} - ${formatDate(sundayOfTargetWeek)}`;
}

// Helper function to get weeks in a specific month with their corresponding ISO week year
function getWeeksInMonth(calendarYear, month) {
  const weeksMap = new Map(); // key: "weekYear-weekNum", value: {week, weekYear}
  const firstDay = new Date(calendarYear, month - 1, 1);
  const lastDay = new Date(calendarYear, month, 0);

  // Iterate through all days of the month and collect unique week numbers with their year
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const weekNum = getWeekNumber(currentDate);
    const weekYear = getWeekYear(currentDate);
    const key = `${weekYear}-${weekNum}`;
    if (!weeksMap.has(key)) {
      weeksMap.set(key, { week: weekNum, weekYear: weekYear });
    }
  }

  // Convert to array and sort by weekYear then week number
  return Array.from(weeksMap.values()).sort((a, b) => {
    if (a.weekYear !== b.weekYear) return a.weekYear - b.weekYear;
    return a.week - b.week;
  });
}

function CardsKPI() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentWeek = getWeekNumber(currentDate);
  const currentWeekYear = getWeekYear(currentDate);

  const [year, setYear] = React.useState(currentYear);
  const [month, setMonth] = React.useState(currentMonth);
  const [week, setWeek] = React.useState(currentWeek);
  const [weekYear, setWeekYear] = React.useState(currentWeekYear); // ISO week year for selected week

  const [periodo, setPeriodo] = React.useState();
  const [spazi, setSpazi] = React.useState(0);
  const [assenze, setAssenze] = React.useState(0);
  const [variazioni, setVariazioni] = React.useState(0);
  const [percentualeRiempimento, setPercentualeRiempimento] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Previous period data for trend comparison
  const [prevSpazi, setPrevSpazi] = React.useState(0);
  const [prevAssenze, setPrevAssenze] = React.useState(0);
  const [prevVariazioni, setPrevVariazioni] = React.useState(0);
  const [prevPercentualeRiempimento, setPrevPercentualeRiempimento] = React.useState(0);

  // Helper function to render trend indicator
  const renderTrend = (current, previous, isPositiveGood = false) => {
    const diff = current - previous;
    if (diff === 0) return " → Nessuna variazione";

    const isPositive = diff > 0;
    // For percentuale riempimento, increase is good. For others, decrease is good.
    const isGoodTrend = isPositiveGood ? isPositive : !isPositive;
    const color = isGoodTrend ? "#4caf50" : "#f44336";
    const arrow = isPositive ? "↑" : "↓";
    const displayValue = isPositive ? `+${diff}` : diff;

    return (
      <span
        style={{
          fontSize: "28px",
          color,
          marginLeft: "10px",
          fontWeight: "bold",
        }}
      >
        {arrow} {displayValue}
      </span>
    );
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setMonth(value);
    // If month is empty, unset week number
    if (value === "") {
      setWeek("");
      setWeekYear("");
    } else {
      // Reset week if current week is not in the selected month
      const weeksInMonth = getWeeksInMonth(year, value);
      const currentWeekExists = weeksInMonth.some((w) => w.week === parseInt(week) && w.weekYear === parseInt(weekYear));
      if (weeksInMonth.length > 0 && week !== "" && !currentWeekExists) {
        setWeek("");
        setWeekYear("");
      }
    }
  };

  // Get available weeks for the selected month
  const availableWeeks = month && month !== "" ? getWeeksInMonth(year, month) : [];

  // Fetch statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine interval and parameters
        let // interval,
          params = {};

        if (week && week !== "" && weekYear && weekYear !== "") {
          // Weekly stats - use weekYear for correct ISO week
          //interval = "W";
          params = {
            interval: "W",
            weeknumber: week,
            year: weekYear,
          };
          setPeriodo(`Settimana ${getWeekDateRange(week, weekYear)}`);
        } else if (month && month !== "") {
          // Monthly stats
          //interval = "M";
          params = {
            interval: "M",
            monthnumber: month,
            year: year,
          };
          setPeriodo(`Mese ${month}, ${year}`);
        } else {
          // Yearly stats
          //interval = "Y";
          params = {
            interval: "Y",
            year: year,
          };
          setPeriodo(`Anno ${year}`);
        }

        // Build query string
        const queryString = new URLSearchParams(params).toString();
        const apiUrl = `${process.env.REACT_APP_GENERAL_STATS}?${queryString}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Update states with current period data
        const currentData = data.current;
        const previousData = data.previous;

        setAssenze(currentData.assenze || 0);
        setSpazi(currentData.posti_totali - currentData.presenze || 0);
        setVariazioni(currentData.variazioni || 0);

        // Set previous period data
        setPrevAssenze(previousData.assenze || 0);
        setPrevSpazi(previousData.posti_totali - previousData.presenze || 0);
        setPrevVariazioni(previousData.variazioni || 0);

        // Calculate fill percentage for current period
        if (currentData.posti_totali > 0) {
          const fillPercent = Math.round((currentData.presenze / currentData.posti_totali) * 100);
          setPercentualeRiempimento(fillPercent);
        } else {
          setPercentualeRiempimento(0);
        }

        // Calculate fill percentage for previous period
        if (previousData.posti_totali > 0) {
          const prevFillPercent = Math.round((previousData.presenze / previousData.posti_totali) * 100);
          setPrevPercentualeRiempimento(prevFillPercent);
        } else {
          setPrevPercentualeRiempimento(0);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [year, month, week, weekYear]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>PingTime - Let's play with us</h3>
        <h3>By Mirko Bruschi - Davide Candellori - Michele Dalmonte</h3>
      </header>
      <h1>TENNIS TAVOLO 2.0</h1>

      <br />
      <div
        className="date-selectors"
        style={{
          display: "flex",
          gap: "20px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TextField
          label="Anno"
          type="number"
          value={year}
          onChange={(e) => {
            const newYear = e.target.value;
            setYear(newYear);
            // Reset week if it's not valid for the new year/month combination
            if (month !== "" && week !== "") {
              const weeksInMonth = getWeeksInMonth(newYear, month);
              const currentWeekExists = weeksInMonth.some((w) => w.week === parseInt(week) && w.weekYear === parseInt(weekYear));
              if (!currentWeekExists) {
                setWeek("");
                setWeekYear("");
              }
            }
          }}
          InputLabelProps={{ shrink: true }}
          style={{ width: "120px" }}
        />
        <TextField label="Mese" type="number" value={month} onChange={handleMonthChange} InputLabelProps={{ shrink: true }} inputProps={{ min: 1, max: 12 }} style={{ width: "120px" }} />
        {month !== "" && availableWeeks.length > 0 && (
          <FormControl style={{ width: "220px" }}>
            <InputLabel id="week-select-label">Settimana</InputLabel>
            <Select
              labelId="week-select-label"
              value={week !== "" && weekYear !== "" ? `${week}-${weekYear}` : "Tutto"}
              label="Settimana"
              onChange={(e) => {
                const value = e.target.value;
                if (value === "Tutto") {
                  setWeek("");
                  setWeekYear("");
                } else {
                  const [selectedWeek, selectedWeekYear] = value.split("-");
                  setWeek(parseInt(selectedWeek));
                  setWeekYear(parseInt(selectedWeekYear));
                }
              }}
            >
              <MenuItem value="Tutto">
                <em>Mostra tutto</em>
              </MenuItem>
              {availableWeeks.map((w) => (
                <MenuItem key={`${w.week}-${w.weekYear}`} value={`${w.week}-${w.weekYear}`}>
                  {getWeekDateRange(w.week, w.weekYear)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      <br />
      {periodo && <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>{periodo}</p>}
      {loading && <p style={{ textAlign: "center" }}>Loading...</p>}
      {error && <p style={{ textAlign: "center", color: "red" }}>Error: {error}</p>}
      <br />
      <div className="container">
        <div className="container-div">
          <InputLabel>Spazi Disponibili</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{spazi}</h1>
          <InputLabel sx={{ color: "#a2a2a2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {prevSpazi}</InputLabel>
          <div className="variazione">
            <InputLabel>{renderTrend(spazi, prevSpazi, false)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Assenze</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{assenze}</h1>
          <InputLabel sx={{ color: "#a2a2a2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {prevAssenze}</InputLabel>
          <div className="variazione">
            <InputLabel>{renderTrend(assenze, prevAssenze, false)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Variazioni</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{variazioni}</h1>
          <InputLabel sx={{ color: "#a2a2a2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {prevVariazioni}</InputLabel>
          <div className="variazione">
            <InputLabel>{renderTrend(variazioni, prevVariazioni, false)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Percentuale Riempimento</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{percentualeRiempimento}%</h1>
          <InputLabel sx={{ color: "#a2a2a2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {prevPercentualeRiempimento}</InputLabel>
          <div className="variazione">
            <InputLabel>{renderTrend(percentualeRiempimento, prevPercentualeRiempimento, true)}</InputLabel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardsKPI;
