import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";

function App4() {
  const [periodo, setPeriodo] = React.useState("W");
  const [atleta, setAtleta] = React.useState("All");
  const [atletiList, setAtletiList] = React.useState([]);
  const [selectedRange, setSelectedRange] = React.useState(null);
  const [stats, setStats] = React.useState(null);

  // Load athletes list from pingtime_Persona.csv
  useEffect(() => {
    d3.csv("data/pingtime_Persona.csv").then(function (data) {
      const aliases = [...new Set(data.map((d) => d.alias))].sort();
      setAtletiList(aliases);
    });
  }, []);

  useEffect(() => {
    // set the dimensions and margins of the graph
    const margin = { top: 80, right: 150, bottom: 80, left: 60 },
      width = 1200 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    d3.select("#barchart1").selectAll("*").remove(); // Clear previous content
    const svg = d3
      .select("#barchart1")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    Promise.all([
      d3.csv("data/pingtime_Calendario.csv"),
      d3.csv("data/pingtime_Persona.csv"),
    ]).then(function ([calendarioData, personaData]) {
      const YEAR = 2025; // TODO: In future, this will be in the CSV

      // Filter data based on selected athlete
      let data = calendarioData;
      if (atleta !== "All") {
        data = calendarioData.filter((d) => d.alias === atleta);
      }

      // Helper function to get date range for a week number
      const getWeekDateRange = (weekNumber, year) => {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysOffset = (weekNumber - 1) * 7;
        const startOfWeek = new Date(
          firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000
        );

        // Adjust to Monday (ISO week starts on Monday)
        const dayOfWeek = startOfWeek.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startOfWeek.setDate(startOfWeek.getDate() + diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          return `${day}/${month}`;
        };

        return `${formatDate(startOfWeek)}-${formatDate(endOfWeek)}`;
      };

      // Helper function to get month from week number
      const getMonthFromWeek = (weekNumber, year) => {
        const firstDayOfYear = new Date(year, 0, 1);
        const daysOffset = (weekNumber - 1) * 7 + 3; // Use middle of week
        const midWeek = new Date(
          firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000
        );
        return midWeek.getMonth() + 1; // Return 1-12
      };

      const monthNames = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre",
      ];

      let displayArray;
      let xLabel;

      if (periodo === "M") {
        // Monthly aggregation
        const weeklyData = d3.rollup(
          data,
          (v) => ({
            presences: v.filter((d) => d.effettivo === "1" && d.assente === "0")
              .length,
            absences: v.filter((d) => d.effettivo === "1" && d.assente === "1")
              .length,
            cancellations: v.filter(
              (d) => d.effettivo === "0" && d.assente === "1"
            ).length,
            month: getMonthFromWeek(+v[0].settimana, YEAR),
          }),
          (d) => d.settimana
        );

        // Aggregate by month
        const monthlyData = d3.rollup(
          Array.from(weeklyData, ([week, counts]) => counts),
          (v) => ({
            presences: d3.sum(v, (d) => d.presences),
            absences: d3.sum(v, (d) => d.absences),
            cancellations: d3.sum(v, (d) => d.cancellations),
          }),
          (d) => d.month
        );

        displayArray = Array.from(monthlyData, ([month, counts]) => ({
          period: month,
          label: monthNames[month - 1],
          presences: counts.presences,
          absences: counts.absences,
          cancellations: counts.cancellations,
        })).sort((a, b) => a.period - b.period);

        xLabel = "Mese";
      } else {
        // Weekly view
        const weeklyData = d3.rollup(
          data,
          (v) => ({
            presences: v.filter((d) => d.effettivo === "1" && d.assente === "0")
              .length,
            absences: v.filter((d) => d.effettivo === "1" && d.assente === "1")
              .length,
            cancellations: v.filter(
              (d) => d.effettivo === "0" && d.assente === "1"
            ).length,
          }),
          (d) => d.settimana
        );

        displayArray = Array.from(weeklyData, ([week, counts]) => ({
          period: +week,
          label: getWeekDateRange(+week, YEAR),
          presences: counts.presences,
          absences: counts.absences,
          cancellations: counts.cancellations,
        })).sort((a, b) => a.period - b.period);

        xLabel = "Settimana";
      }

      // Filter data by selected range
      let filteredArray = displayArray;
      if (selectedRange && selectedRange.length === 2) {
        const [start, end] = selectedRange;
        filteredArray = displayArray.filter(
          (d) => d.period >= start && d.period <= end
        );
      }

      // Calculate statistics for filtered data or all data
      const dataForStats = selectedRange ? filteredArray : displayArray;
      const presenceStats = {
        min: d3.min(dataForStats, (d) => d.presences),
        max: d3.max(dataForStats, (d) => d.presences),
        avg: d3.mean(dataForStats, (d) => d.presences),
      };
      const absenceStats = {
        min: d3.min(dataForStats, (d) => d.absences),
        max: d3.max(dataForStats, (d) => d.absences),
        avg: d3.mean(dataForStats, (d) => d.absences),
      };
      const cancellationStats = {
        min: d3.min(dataForStats, (d) => d.cancellations),
        max: d3.max(dataForStats, (d) => d.cancellations),
        avg: d3.mean(dataForStats, (d) => d.cancellations),
      };
      setStats({
        presences: presenceStats,
        absences: absenceStats,
        cancellations: cancellationStats,
      });

      // Use filteredArray for visualization when selection exists
      const visibleArray = selectedRange ? filteredArray : displayArray;

      // Build X scale with rescaling when selection is active
      const x = d3
        .scaleLinear()
        .domain(d3.extent(visibleArray, (d) => d.period))
        .range([0, width]);

      svg
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(visibleArray.map((d) => d.period))
            .tickFormat((d) => {
              const data = visibleArray.find((w) => w.period === d);
              return data ? data.label : d;
            })
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

      // Add X axis label
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text(xLabel);

      // Build Y scale
      const maxValue = d3.max(visibleArray, (d) =>
        Math.max(d.presences, d.absences, d.cancellations)
      );
      const y = d3.scaleLinear().domain([0, maxValue]).range([height, 0]);

      svg
        .append("g")
        .call(
          d3
            .axisLeft(y)
            .ticks(Math.min(15, maxValue))
            .tickFormat(d3.format("d"))
        );

      // Add Y axis label
      svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Conteggio");

      // Create tooltip - remove any existing tooltips first to avoid duplicates
      d3.selectAll(".d3-tooltip-barchart1").remove();
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "d3-tooltip-barchart1")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("font-size", "12px");

      // Create vertical line for hover
      const verticalLine = svg
        .append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#999")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0)
        .style("pointer-events", "none");

      // Add presences line (green)
      svg
        .append("path")
        .datum(visibleArray)
        .attr("fill", "none")
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 3)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.period))
            .y((d) => y(d.presences))
        );

      // Add presences dots
      svg
        .selectAll(".dot-presences")
        .data(visibleArray)
        .enter()
        .append("circle")
        .attr("class", "dot-presences")
        .attr("cx", (d) => x(d.period))
        .attr("cy", (d) => y(d.presences))
        .attr("r", 5)
        .attr("fill", "#4CAF50")
        .on("mouseover", function (event, d) {
          tooltip.style("opacity", 1);
          d3.select(this).attr("r", 7);
        })
        .on("mousemove", function (event, d) {
          tooltip
            .html(`${d.label}<br/>Presenze: ${d.presences}`)
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
        })
        .on("mouseleave", function () {
          tooltip.style("opacity", 0);
          d3.select(this).attr("r", 5);
        });

      // Add absences line (red)
      svg
        .append("path")
        .datum(visibleArray)
        .attr("fill", "none")
        .attr("stroke", "#F44336")
        .attr("stroke-width", 3)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.period))
            .y((d) => y(d.absences))
        );

      // Add absences dots
      svg
        .selectAll(".dot-absences")
        .data(visibleArray)
        .enter()
        .append("circle")
        .attr("class", "dot-absences")
        .attr("cx", (d) => x(d.period))
        .attr("cy", (d) => y(d.absences))
        .attr("r", 5)
        .attr("fill", "#F44336");

      // Add cancellations line (yellow)
      svg
        .append("path")
        .datum(visibleArray)
        .attr("fill", "none")
        .attr("stroke", "#FFEB3B")
        .attr("stroke-width", 3)
        .attr(
          "d",
          d3
            .line()
            .x((d) => x(d.period))
            .y((d) => y(d.cancellations))
        );

      // Add cancellations dots
      svg
        .selectAll(".dot-cancellations")
        .data(visibleArray)
        .enter()
        .append("circle")
        .attr("class", "dot-cancellations")
        .attr("cx", (d) => x(d.period))
        .attr("cy", (d) => y(d.cancellations))
        .attr("r", 5)
        .attr("fill", "#FFEB3B")
        .attr("stroke", "#FBC02D")
        .attr("stroke-width", 1);
      // Add overlay rectangle for mouse tracking and brush
      const overlayRect = svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all");

      // Create brush for range selection
      const brush = d3
        .brushX()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("end", function (event) {
          if (!event.selection) {
            setSelectedRange(null);
            return;
          }
          const [x0, x1] = event.selection.map(x.invert);
          const minVal = Math.min(...displayArray.map((d) => d.period));
          const maxVal = Math.max(...displayArray.map((d) => d.period));
          const start = Math.max(minVal, Math.round(x0));
          const end = Math.min(maxVal, Math.round(x1));
          setSelectedRange([start, end]);
        });

      const brushGroup = svg.append("g").attr("class", "brush").call(brush);

      // Style the brush
      brushGroup.selectAll(".overlay").style("cursor", "crosshair");

      brushGroup
        .selectAll(".selection")
        .style("fill", "steelblue")
        .style("fill-opacity", 0.3)
        .style("stroke", "steelblue")
        .style("stroke-width", 2);

      // Function to handle mousemove events
      const handleMouseMove = function (event) {
        const [mouseX] = d3.pointer(event);
        const xValue = x.invert(mouseX);

        // Find the closest period in visible array
        const closestData = visibleArray.reduce((prev, curr) => {
          return Math.abs(curr.period - xValue) < Math.abs(prev.period - xValue)
            ? curr
            : prev;
        });

        // Update vertical line position
        verticalLine
          .attr("x1", x(closestData.period))
          .attr("x2", x(closestData.period))
          .style("opacity", 1);

        // Highlight dots at the hovered period
        svg
          .selectAll(".dot-presences, .dot-absences, .dot-cancellations")
          .attr("r", (d) => (d.period === closestData.period ? 7 : 5));

        // Show tooltip with all data
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${closestData.label}</strong><br/>` +
              `<span style="color: #4CAF50;">● Presenze: ${closestData.presences}</span><br/>` +
              `<span style="color: #F44336;">● Assenze: ${closestData.absences}</span><br/>` +
              `<span style="color: #FBC02D;">● Cancellazioni: ${closestData.cancellations}</span>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      };

      // Function to handle mouseleave events
      const handleMouseLeave = function () {
        verticalLine.style("opacity", 0);
        tooltip.style("opacity", 0);
        // Reset all dots to normal size
        svg
          .selectAll(".dot-presences, .dot-absences, .dot-cancellations")
          .attr("r", 5);
      };

      // Add mouse tracking to brush overlay (which captures mouse events)
      brushGroup
        .select(".overlay")
        .on("mousemove", handleMouseMove)
        .on("mouseleave", handleMouseLeave);

      // Add legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

      const legendData = [
        { label: "Presenze", color: "#4CAF50" },
        { label: "Assenze", color: "#F44336" },
        { label: "Cancellazioni", color: "#FFEB3B", stroke: "#FBC02D" },
      ];

      legendData.forEach((item, i) => {
        let visible = true;
        const legendRow = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 25})`)
          .style("cursor", "pointer")
          .on("click", () => {
            visible = !visible;
            const opacity = visible ? 1 : 0.2;
            const className =
              item.label === "Presenze"
                ? ".dot-presences"
                : item.label === "Assenze"
                ? ".dot-absences"
                : ".dot-cancellations";

            // Toggle line visibility
            svg
              .selectAll("path")
              .filter(function () {
                return d3.select(this).attr("stroke") === item.color;
              })
              .style("opacity", visible ? 1 : 0.1);

            // Toggle dots visibility
            svg.selectAll(className).style("opacity", visible ? 1 : 0.1);

            // Update legend opacity
            legendRow.style("opacity", opacity);
          });

        legendRow
          .append("line")
          .attr("x1", 0)
          .attr("x2", 30)
          .attr("y1", 10)
          .attr("y2", 10)
          .attr("stroke", item.color)
          .attr("stroke-width", 3);

        legendRow
          .append("circle")
          .attr("cx", 15)
          .attr("cy", 10)
          .attr("r", 5)
          .attr("fill", item.color)
          .attr("stroke", item.stroke || item.color)
          .attr("stroke-width", 1);

        legendRow
          .append("text")
          .attr("x", 40)
          .attr("y", 10)
          .attr("dy", "0.32em")
          .text(item.label)
          .style("font-size", "14px");
      });

      // Add stats below legend
      const statsStartY = 100;
      const statsGroup = svg
        .append("g")
        .attr("transform", `translate(${width + 20}, ${statsStartY})`);

      // Stats title
      statsGroup
        .append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text(selectedRange ? "Periodo selezionato" : "Dall'inizio")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333");

      // Presenze stats
      statsGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 15)
        .attr("width", 130)
        .attr("height", 55)
        .attr("fill", "#e8f5e9")
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 1)
        .attr("rx", 3);

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 30)
        .text("Presenze")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#4CAF50");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 44)
        .text(`Min: ${presenceStats.min}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 57)
        .text(`Avg: ${presenceStats.avg.toFixed(1)}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      // Assenze stats
      statsGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 75)
        .attr("width", 130)
        .attr("height", 55)
        .attr("fill", "#ffebee")
        .attr("stroke", "#F44336")
        .attr("stroke-width", 1)
        .attr("rx", 3);

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 90)
        .text("Assenze")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#F44336");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 104)
        .text(`Min: ${absenceStats.min}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 117)
        .text(`Avg: ${absenceStats.avg.toFixed(1)}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      // Cancellazioni stats
      statsGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 135)
        .attr("width", 130)
        .attr("height", 55)
        .attr("fill", "#fffde7")
        .attr("stroke", "#FBC02D")
        .attr("stroke-width", 1)
        .attr("rx", 3);

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 150)
        .text("Cancellazioni")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .style("fill", "#FBC02D");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 164)
        .text(`Min: ${cancellationStats.min}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      statsGroup
        .append("text")
        .attr("x", 8)
        .attr("y", 177)
        .text(`Avg: ${cancellationStats.avg.toFixed(1)}`)
        .style("font-size", "10px")
        .style("fill", "#555");

      // Add restore button if range is selected
      if (selectedRange) {
        const buttonGroup = statsGroup
          .append("g")
          .attr("transform", `translate(0, 205)`)
          .style("cursor", "pointer");

        buttonGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 130)
          .attr("height", 35)
          .attr("fill", "#4CAF50")
          .attr("stroke", "#3d8b40")
          .attr("stroke-width", 1.5)
          .attr("rx", 4)
          .on("mouseover", function () {
            d3.select(this).attr("fill", "#45a049");
          })
          .on("mouseleave", function () {
            d3.select(this).attr("fill", "#4CAF50");
          })
          .on("click", () => {
            setSelectedRange(null);
          });

        buttonGroup
          .append("text")
          .attr("x", 65)
          .attr("y", 10)
          .attr("text-anchor", "middle")
          .attr("dy", "0.32em")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "white")
          .style("pointer-events", "none")
          .text("Ripristina");

        buttonGroup
          .append("text")
          .attr("x", 65)
          .attr("y", 25)
          .attr("text-anchor", "middle")
          .attr("dy", "0.32em")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("fill", "white")
          .style("pointer-events", "none")
          .text("visualizzazione");
      }
    });
  }, [periodo, atleta, selectedRange]);

  return (
    <div className={styles.container}>
      <br />
      <br />
      <h2> Weekly Attendance Analysis </h2>
      <br />
      <br />
      <Select
        sx={{ minWidth: "150px", marginRight: "20px" }}
        labelId="barchart1-period-label"
        id="barchart1-period"
        value={periodo}
        label="Granularità"
        onChange={(event) => setPeriodo(event.target.value)}
      >
        <MenuItem value={"W"}>Settimanale</MenuItem>
        <MenuItem value={"M"}>Mensile</MenuItem>
      </Select>
      <Select
        sx={{ minWidth: "200px" }}
        labelId="barchart1-atleta-label"
        id="barchart1-atleta"
        value={atleta}
        label="Atleta"
        onChange={(event) => setAtleta(event.target.value)}
      >
        <MenuItem value={"All"}>All</MenuItem>
        {atletiList.map((alias) => (
          <MenuItem key={alias} value={alias}>
            {alias}
          </MenuItem>
        ))}
      </Select>
      <br />
      <br />
      <p style={{ fontSize: "14px", color: "#666" }}>
        Drag on the chart to select a time range
      </p>
      <svg width={1400} height={700} id="barchart1"></svg>
    </div>
  );
}

export default App4;
