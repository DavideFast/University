import * as d3 from "d3";
import styles from "./Grafico.module.css";
import { use, useEffect } from "react";
import React from "react";
import { MenuItem, Select } from "@mui/material";

const YEAR = 2025;

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

const drawLineChart = (data, interval) => {
  // Set dimensions and margins
  const margin = { top: 100, right: 170, bottom: 80, left: 60 };
  const width = 1400;
  const height = 700;
  const innerWidth = width - (margin.left + margin.right);
  const innerHeight = height - (margin.top + margin.bottom);

  // Create SVG
  d3.select("#line-chart").selectAll("*").remove();
  const svg = d3
    .select("#line-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const innerChart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Convert data to display format with proper labels based on interval
  const displayArray = data
    .map((d) => {
      let label;
      if (interval === "W") {
        label = getWeekDateRange(+d.time, YEAR);
      } else if (interval === "M") {
        const months = [
          "Gen",
          "Feb",
          "Mar",
          "Apr",
          "Mag",
          "Giu",
          "Lug",
          "Ago",
          "Set",
          "Ott",
          "Nov",
          "Dic",
        ];
        label = months[+d.time - 1] || `Mese ${d.time}`;
      } else {
        label = `Anno ${d.time}`;
      }
      return {
        period: +d.time,
        label: label,
        presences: +d.presences,
        absences: +d.absences,
        cancellations: +d.cancellations,
      };
    })
    .sort((a, b) => a.period - b.period);
  console.log(displayArray);
  // Create scales
  const x = d3
    .scaleLinear()
    .domain(d3.extent(displayArray, (d) => d.period))
    .range([0, innerWidth]);

  const maxValue = d3.max(displayArray, (d) =>
    Math.max(d.presences, d.absences, d.cancellations)
  );
  let y = d3.scaleLinear().domain([0, maxValue]).range([innerHeight, 0]);

  // Add X axis
  innerChart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues(displayArray.map((d) => d.period))
        .tickFormat((d) => {
          const data = displayArray.find((w) => w.period === d);
          return data ? data.label : d;
        })
    )
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  // Add X axis label
  const xAxisLabel =
    interval === "W" ? "Settimana" : interval === "M" ? "Mese" : "Anno";
  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 10)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text(xAxisLabel);

  // Add Y axis
  innerChart
    .append("g")
    .attr("class", "y-axis")
    .call(
      d3.axisLeft(y).ticks(Math.min(15, maxValue)).tickFormat(d3.format("d"))
    );

  // Add Y axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left - 50)
    .attr("x", 0 - (margin.top + innerHeight / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Conteggio");

  // Add presences line (green)
  innerChart
    .append("path")
    .datum(displayArray)
    .attr("class", "line-presences")
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
  innerChart
    .selectAll(".dot-presences")
    .data(displayArray)
    .enter()
    .append("circle")
    .attr("class", "dot-presences")
    .attr("cx", (d) => x(d.period))
    .attr("cy", (d) => y(d.presences))
    .attr("r", 5)
    .attr("fill", "#4CAF50");

  // Add absences line (red)
  innerChart
    .append("path")
    .datum(displayArray)
    .attr("class", "line-absences")
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
  innerChart
    .selectAll(".dot-absences")
    .data(displayArray)
    .enter()
    .append("circle")
    .attr("class", "dot-absences")
    .attr("cx", (d) => x(d.period))
    .attr("cy", (d) => y(d.absences))
    .attr("r", 5)
    .attr("fill", "#F44336");

  // Add cancellations line (yellow)
  innerChart
    .append("path")
    .datum(displayArray)
    .attr("class", "line-cancellations")
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
  innerChart
    .selectAll(".dot-cancellations")
    .data(displayArray)
    .enter()
    .append("circle")
    .attr("class", "dot-cancellations")
    .attr("cx", (d) => x(d.period))
    .attr("cy", (d) => y(d.cancellations))
    .attr("r", 5)
    .attr("fill", "#FFEB3B")
    .attr("stroke", "#FBC02D")
    .attr("stroke-width", 1);

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "16px 20px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("font-size", "15px")
    .style("line-height", "1.6");

  // Helper: connect presences dots when exactly two vertical lines are fixed
  const updateConnectionPresences = () => {
    // Remove any existing connections
    innerChart.selectAll(".clicked-connection-presences").remove();
    innerChart.selectAll(".clicked-connection-label-presences").remove();

    const clickedLines = innerChart.selectAll(".clicked-line").nodes();
    if (clickedLines.length < 2) return;

    // Collect and sort periods (adjacent pairs in x/order)
    const periods = clickedLines
      .map((n) => +d3.select(n).attr("data-period"))
      .sort((a, b) => a - b);

    for (let i = 0; i < periods.length - 1; i++) {
      const p1 = periods[i];
      const p2 = periods[i + 1];
      const d1 = displayArray.find((w) => w.period === p1);
      const d2 = displayArray.find((w) => w.period === p2);
      if (!d1 || !d2) continue;

      // Color by slope direction between adjacent presences dots
      const dx = Math.abs(x(p1) - x(p2));
      const dy = y(d1.presences) - y(d2.presences);
      let strokeColor = "#000000"; // neutral
      if (dx !== 0) {
        const slope = dy / dx;
        if (slope > 0) strokeColor = "#4CAF50"; // rising
        else if (slope < 0) strokeColor = "#F44336"; // falling
      }

      innerChart
        .append("line")
        .attr("class", "clicked-connection-presences")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("x1", x(p1))
        .attr("y1", y(d1.presences))
        .attr("x2", x(p2))
        .attr("y2", y(d2.presences))
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "6 4")
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-presences").raise();
        });
      // Add a text box in the middle of the line with % change
      const v1 = d1.presences;
      const v2 = d2.presences;
      const mx = (x(p1) + x(p2)) / 2;
      const my = (y(v1) + y(v2)) / 2;
      let pctStr = "0%";
      if (v1 === 0) {
        if (v2 === 0) pctStr = "0%";
        else pctStr = "+∞%";
      } else {
        const pct = ((v2 - v1) / v1) * 100;
        pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      }
      const label = innerChart
        .append("g")
        .attr("class", "clicked-connection-label-presences")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("transform", `translate(${mx}, ${my})`)
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-presences").raise();
        });
      const text = label
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", strokeColor)
        .text(pctStr);
      const bbox = text.node()
        ? text.node().getBBox()
        : { x: -14, y: -8, width: 28, height: 16 };
      label
        .insert("rect", "text")
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2)
        .attr("width", bbox.width + 8)
        .attr("height", bbox.height + 4)
        .attr("fill", "white")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 1)
        .attr("rx", 3);
    }
    //check if legend item is inactive for presences and hide the connections if so
    const legendItem = d3.selectAll(".legend-group g").filter(function () {
      return (
        d3.select(this).select("text").text() === "Presenze" &&
        d3.select(this).classed("inactive")
      );
    });
    if (!legendItem.empty()) {
      innerChart
        .selectAll(".clicked-connection-presences")
        .style("display", "none");
      innerChart
        .selectAll(".clicked-connection-label-presences")
        .style("display", "none");
    }
  };

  // Helper: connect absences dots across adjacent fixed lines
  const updateConnectionAbsences = () => {
    innerChart.selectAll(".clicked-connection-absences").remove();
    innerChart.selectAll(".clicked-connection-label-absences").remove();

    const clickedLines = innerChart.selectAll(".clicked-line").nodes();
    if (clickedLines.length < 2) return;

    const periods = clickedLines
      .map((n) => +d3.select(n).attr("data-period"))
      .sort((a, b) => a - b);

    for (let i = 0; i < periods.length - 1; i++) {
      const p1 = periods[i];
      const p2 = periods[i + 1];
      const d1 = displayArray.find((w) => w.period === p1);
      const d2 = displayArray.find((w) => w.period === p2);
      if (!d1 || !d2) continue;

      // Color by slope direction between adjacent presences dots
      const dx = Math.abs(x(p1) - x(p2));
      const dy = y(d1.absences) - y(d2.absences);
      let strokeColor = "#000000"; // neutral
      if (dx !== 0) {
        const slope = dy / dx;
        if (slope < 0) strokeColor = "#4CAF50"; // falling, good
        else if (slope > 0) strokeColor = "#F44336"; // rising, bad
      }

      innerChart
        .append("line")
        .attr("class", "clicked-connection-absences")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("x1", x(p1))
        .attr("y1", y(d1.absences))
        .attr("x2", x(p2))
        .attr("y2", y(d2.absences))
        .attr("stroke", "#F44336")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "6 4")
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-absences").raise();
        });

      // Label with % change
      const v1 = d1.absences;
      const v2 = d2.absences;
      const mx = (x(p1) + x(p2)) / 2;
      const my = (y(v1) + y(v2)) / 2;
      let pctStr = "0%";
      if (v1 === 0) {
        if (v2 === 0) pctStr = "0%";
        else pctStr = "+∞%";
      } else {
        const pct = ((v2 - v1) / v1) * 100;
        pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      }
      const label = innerChart
        .append("g")
        .attr("class", "clicked-connection-label-absences")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("transform", `translate(${mx}, ${my})`)
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-absences").raise();
        });
      const text = label
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", strokeColor)
        .text(pctStr);
      const bbox = text.node()
        ? text.node().getBBox()
        : { x: -14, y: -8, width: 28, height: 16 };
      label
        .insert("rect", "text")
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2)
        .attr("width", bbox.width + 8)
        .attr("height", bbox.height + 4)
        .attr("fill", "white")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 1)
        .attr("rx", 3);
    }
    //check if legend item is inactive for presences and hide the connections if so
    const legendItem = d3.selectAll(".legend-group g").filter(function () {
      return (
        d3.select(this).select("text").text() === "Assenze" &&
        d3.select(this).classed("inactive")
      );
    });
    if (!legendItem.empty()) {
      innerChart
        .selectAll(".clicked-connection-absences")
        .style("display", "none");
      innerChart
        .selectAll(".clicked-connection-label-absences")
        .style("display", "none");
    }
  };

  // Helper: connect cancellations dots across adjacent fixed lines
  const updateConnectionCancellations = () => {
    innerChart.selectAll(".clicked-connection-cancellations").remove();
    innerChart.selectAll(".clicked-connection-label-cancellations").remove();

    const clickedLines = innerChart.selectAll(".clicked-line").nodes();
    if (clickedLines.length < 2) return;

    const periods = clickedLines
      .map((n) => +d3.select(n).attr("data-period"))
      .sort((a, b) => a - b);

    for (let i = 0; i < periods.length - 1; i++) {
      const p1 = periods[i];
      const p2 = periods[i + 1];
      const d1 = displayArray.find((w) => w.period === p1);
      const d2 = displayArray.find((w) => w.period === p2);
      if (!d1 || !d2) continue;

      // Color by slope direction between adjacent presences dots
      const dx = Math.abs(x(p1) - x(p2));
      const dy = y(d1.cancellations) - y(d2.cancellations);
      let strokeColor = "#000000"; // neutral
      if (dx !== 0) {
        const slope = dy / dx;
        if (slope < 0) strokeColor = "#4CAF50"; // falling, good
        else if (slope > 0) strokeColor = "#F44336"; // rising, bad
      }

      innerChart
        .append("line")
        .attr("class", "clicked-connection-cancellations")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("x1", x(p1))
        .attr("y1", y(d1.cancellations))
        .attr("x2", x(p2))
        .attr("y2", y(d2.cancellations))
        .attr("stroke", "#FBC02D")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "6 4")
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-cancellations").raise();
        });
      // Label with % change
      const v1 = d1.cancellations;
      const v2 = d2.cancellations;
      const mx = (x(p1) + x(p2)) / 2;
      const my = (y(v1) + y(v2)) / 2;
      let pctStr = "0%";
      if (v1 === 0) {
        if (v2 === 0) pctStr = "0%";
        else pctStr = "+∞%";
      } else {
        const pct = ((v2 - v1) / v1) * 100;
        pctStr = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      }
      const label = innerChart
        .append("g")
        .attr("class", "clicked-connection-label-cancellations")
        .attr("data-period1", p1)
        .attr("data-period2", p2)
        .attr("transform", `translate(${mx}, ${my})`)
        .on("mouseover", function () {
          d3.select(this).raise();
          d3.selectAll(".clicked-connection-label-cancellations").raise();
        });
      const text = label
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", strokeColor)
        .text(pctStr);
      const bbox = text.node()
        ? text.node().getBBox()
        : { x: -14, y: -8, width: 28, height: 16 };
      label
        .insert("rect", "text")
        .attr("x", bbox.x - 4)
        .attr("y", bbox.y - 2)
        .attr("width", bbox.width + 8)
        .attr("height", bbox.height + 4)
        .attr("fill", "white")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 1)
        .attr("rx", 3);
    }

    //check if legend item is inactive for presences and hide the connections if so
    const legendItem = d3.selectAll(".legend-group g").filter(function () {
      return (
        d3.select(this).select("text").text() === "Cancellazioni" &&
        d3.select(this).classed("inactive")
      );
    });
    if (!legendItem.empty()) {
      innerChart
        .selectAll(".clicked-connection-cancellations")
        .style("display", "none");
      innerChart
        .selectAll(".clicked-connection-label-cancellations")
        .style("display", "none");
    }
  };

  // Dim series in the x-range spanned by adjacent fixed lines
  const updateDimRanges = () => {
    // Remove previous overlays
    innerChart.selectAll(".dim-range-overlay").remove();

    const clickedLines = innerChart.selectAll(".clicked-line").nodes();
    if (clickedLines.length < 2) return;

    const periods = clickedLines
      .map((n) => +d3.select(n).attr("data-period"))
      .sort((a, b) => a - b);

    for (let i = 0; i < periods.length - 1; i++) {
      const p1 = periods[i];
      const p2 = periods[i + 1];
      const x1 = x(p1);
      const x2 = x(p2);
      const w = Math.abs(x2 - x1);
      const xMin = Math.min(x1, x2);

      // Overlay a translucent white rect to visually dim graph lines in range
      innerChart
        .append("rect")
        .attr("class", "dim-range-overlay")
        .attr("x", xMin)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", innerHeight)
        .attr("fill", "white")
        .attr("opacity", 0.95) // leaves 0.1 of underlying stroke visible
        .style("pointer-events", "none");
    }
  };

  // Add invisible rects for hover detection with vertical lines
  const hoverGroup = innerChart
    .selectAll(".hover-group")
    .data(displayArray)
    .enter()
    .append("g")
    .attr("class", "hover-group");

  // Add vertical line (hidden by default)
  hoverGroup
    .append("line")
    .attr("class", "vertical-line")
    .attr("x1", (d) => x(d.period))
    .attr("y1", 0)
    .attr("x2", (d) => x(d.period))
    .attr("y2", innerHeight)
    .attr("stroke", "#000")
    .attr("stroke-width", 1)
    .attr("opacity", 0)
    .attr("stroke-dasharray", "4 4")
    .style("pointer-events", "none");

  // Add invisible rect for better hover detection
  const rectWidth =
    displayArray.length > 1
      ? Math.min(60, (innerWidth / displayArray.length) * 0.8)
      : 30;

  hoverGroup
    .append("rect")
    .attr("class", "hover-rect")
    .attr("x", (d) => x(d.period) - rectWidth / 2)
    .attr("y", 0)
    .attr("width", rectWidth)
    .attr("height", innerHeight)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this.parentNode).select(".vertical-line").attr("opacity", 0.5);
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.label}</strong><br/>` +
            `<span style="color: #4CAF50;">● Presenze: ${d.presences}</span><br/>` +
            `<span style="color: #F44336;">● Assenze: ${d.absences}</span><br/>` +
            `<span style="color: #FBC02D;">● Cancellazioni: ${d.cancellations}</span>`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select(this.parentNode).select(".vertical-line").attr("opacity", 0);
      tooltip.style("opacity", 0);
    })
    .on("click", function (event, d) {
      // Prevent adding multiple lines for the same period
      const exists = !innerChart
        .selectAll(".clicked-line")
        .filter(function () {
          return +d3.select(this).attr("data-period") === d.period;
        })
        .empty();
      if (exists) return;

      // Draw a vertical line that persists on click, fix a tooltip on the top
      innerChart
        .append("line")
        .attr("class", "clicked-line")
        .attr("x1", x(d.period))
        .attr("y1", 0)
        .attr("x2", x(d.period))
        .attr("y2", innerHeight)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("data-period", d.period);

      // Add a text box with data at the click point
      const textGroup = innerChart
        .append("g")
        .attr("class", "clicked-text")
        .attr("transform", `translate(${x(d.period)}, -5)`)
        .on("contextmenu", function (event) {
          event.preventDefault();
          //remove this text box on right click and line
          d3.select(this).remove();
          // Remove line if present
          d3.selectAll(".clicked-line")
            .filter(function () {
              return d3.select(this).attr("x1") == x(d.period);
            })
            .remove();
          // Update connection after removal
          updateDimRanges();
          updateConnectionPresences();
          updateConnectionAbsences();
          updateConnectionCancellations();
        });

      // Add background rectangle for text
      textGroup
        .append("rect")
        .attr("class", "text-background")
        .attr("x", -55)
        .attr("y", -63)
        .attr("width", 110)
        .attr("height", 55)
        .attr("fill", "white")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("rx", 3);

      // Add week label
      textGroup
        .append("text")
        .attr("class", "week-label")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(d.label);

      // Add presences
      textGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -36)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#4CAF50")
        .text(`Presenze: ${d.presences}`);

      // Add absences
      textGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -24)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#F44336")
        .text(`Assenze: ${d.absences}`);

      // Add cancellations
      textGroup
        .append("text")
        .attr("x", 0)
        .attr("y", -12)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "#FBC02D")
        .text(`Cancellazioni: ${d.cancellations}`);
      updateDimRanges();
      // Update presences connection if exactly two lines fixed
      updateConnectionPresences();
      // Update absences and cancellations connections
      updateConnectionAbsences();
      updateConnectionCancellations();
    })
    .on("contextmenu", function (event, d) {
      event.preventDefault();
      // Remove line if present
      d3.selectAll(".clicked-line")
        .filter(function () {
          return d3.select(this).attr("x1") == x(d.period);
        })
        .remove();
      // Remove associated text box
      d3.selectAll(".clicked-text")
        .filter(function () {
          const transform = d3.select(this).attr("transform");
          const lineTransform = `translate(${x(d.period)}, -5)`;
          return transform === lineTransform;
        })
        .remove();
      // Update connection after removal
      updateDimRanges();
      updateConnectionPresences();
      updateConnectionAbsences();
      updateConnectionCancellations();
    });

  // Add legend
  const legend = svg
    .append("g")
    .attr("class", "legend-group")
    .attr(
      "transform",
      `translate(${margin.left + innerWidth + 20}, ${
        margin.top + innerHeight / 2
      })`
    );

  // Add a legend title
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -10)
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Legenda");

  const legendData = [
    { label: "Presenze", color: "#4CAF50" },
    { label: "Assenze", color: "#F44336" },
    { label: "Cancellazioni", color: "#FFEB3B", stroke: "#FBC02D" },
  ];

  //draw a rectangle behind the legend title and items.
  const legendBBox = legend.node().getBBox();
  legend
    .insert("rect", "text")
    .attr("x", legendBBox.x - 10)
    .attr("y", legendBBox.y - 10)
    .attr("width", legendBBox.width + 75)
    .attr("height", legendBBox.height + 20 + legendData.length * 25)
    .attr("fill", "#f9f9f9")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("rx", 5);

  // This function checks if a series is active based on legend state
  const isDataShown = (label) =>
    !legend
      .selectAll("g")
      .filter(function () {
        return d3.select(this).select("text").text() === label;
      })
      .classed("inactive");

  const rescaleY = () => {
    const active = {
      presences: isDataShown("Presenze"),
      absences: isDataShown("Assenze"),
      cancellations: isDataShown("Cancellazioni"),
    };

    const values = [];
    displayArray.forEach((d) => {
      if (active.presences) values.push(d.presences);
      if (active.absences) values.push(d.absences);
      if (active.cancellations) values.push(d.cancellations);
    });
    const nextMax = Math.max(1, d3.max(values) || 0);
    y = y.domain([0, nextMax]);

    innerChart
      .select(".y-axis")
      .transition()
      .duration(400)
      .call(
        d3.axisLeft(y).ticks(Math.min(15, nextMax)).tickFormat(d3.format("d"))
      );

    const linePres = d3
      .line()
      .x((d) => x(d.period))
      .y((d) => y(d.presences));
    const lineAbs = d3
      .line()
      .x((d) => x(d.period))
      .y((d) => y(d.absences));
    const lineCanc = d3
      .line()
      .x((d) => x(d.period))
      .y((d) => y(d.cancellations));

    innerChart
      .selectAll(".line-presences")
      .transition()
      .duration(400)
      .attr("d", linePres)
      .style("display", active.presences ? null : "none");
    innerChart
      .selectAll(".line-absences")
      .transition()
      .duration(400)
      .attr("d", lineAbs)
      .style("display", active.absences ? null : "none");
    innerChart
      .selectAll(".line-cancellations")
      .transition()
      .duration(400)
      .attr("d", lineCanc)
      .style("display", active.cancellations ? null : "none");

    innerChart
      .selectAll(".dot-presences")
      .transition()
      .duration(400)
      .attr("cy", (d) => y(d.presences))
      .style("display", active.presences ? null : "none");
    innerChart
      .selectAll(".dot-absences")
      .transition()
      .duration(400)
      .attr("cy", (d) => y(d.absences))
      .style("display", active.absences ? null : "none");
    innerChart
      .selectAll(".dot-cancellations")
      .transition()
      .duration(400)
      .attr("cy", (d) => y(d.cancellations))
      .style("display", active.cancellations ? null : "none");

    const repositionConnections = (lineClass, labelClass, accessor) => {
      innerChart.selectAll(lineClass).each(function () {
        const line = d3.select(this);
        const p1 = +line.attr("data-period1");
        const p2 = +line.attr("data-period2");
        const d1 = displayArray.find((w) => w.period === p1);
        const d2 = displayArray.find((w) => w.period === p2);
        if (!d1 || !d2) return;
        line
          .transition()
          .duration(400)
          .attr("y1", y(accessor(d1)))
          .attr("y2", y(accessor(d2)));
      });

      innerChart.selectAll(labelClass).each(function () {
        const g = d3.select(this);
        const p1 = +g.attr("data-period1");
        const p2 = +g.attr("data-period2");
        const d1 = displayArray.find((w) => w.period === p1);
        const d2 = displayArray.find((w) => w.period === p2);
        if (!d1 || !d2) return;
        const mx = (x(p1) + x(p2)) / 2;
        const my = (y(accessor(d1)) + y(accessor(d2))) / 2;
        g.transition()
          .duration(400)
          .attr("transform", `translate(${mx}, ${my})`);

        const text = g.select("text");
        const rect = g.select("rect");
        if (!text.empty() && rect.node()) {
          const bbox = text.node().getBBox();
          rect
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
        }
      });
    };

    repositionConnections(
      ".clicked-connection-presences",
      ".clicked-connection-label-presences",
      (d) => d.presences
    );
    repositionConnections(
      ".clicked-connection-absences",
      ".clicked-connection-label-absences",
      (d) => d.absences
    );
    repositionConnections(
      ".clicked-connection-cancellations",
      ".clicked-connection-label-cancellations",
      (d) => d.cancellations
    );
  };

  legendData.forEach((item, i) => {
    const legendGroup = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 25})`)
      .style("cursor", "pointer")
      .on("click", function () {
        // Toggle visibility of corresponding line and dots
        const isActive = d3.select(this).classed("inactive");
        d3.select(this).classed("inactive", !isActive);
        const display = isActive ? null : "none";
        if (item.label === "Presenze") {
          innerChart.selectAll(".dot-presences").style("display", display);
          innerChart
            .selectAll("path")
            .filter(function () {
              return d3.select(this).attr("stroke") === "#4CAF50";
            })
            .style("display", display);
          // Also toggle the connection line for presences
          innerChart
            .selectAll(".clicked-connection-presences")
            .style("display", display);
          innerChart
            .selectAll(".clicked-connection-label-presences")
            .style("display", display);
        } else if (item.label === "Assenze") {
          innerChart.selectAll(".dot-absences").style("display", display);
          innerChart
            .selectAll("path")
            .filter(function () {
              return d3.select(this).attr("stroke") === "#F44336";
            })
            .style("display", display);
          innerChart
            .selectAll(".clicked-connection-absences")
            .style("display", display);
          innerChart
            .selectAll(".clicked-connection-label-absences")
            .style("display", display);
        } else if (item.label === "Cancellazioni") {
          innerChart.selectAll(".dot-cancellations").style("display", display);
          innerChart
            .selectAll("path")
            .filter(function () {
              return d3.select(this).attr("stroke") === "#FFEB3B";
            })
            .style("display", display);
          innerChart
            .selectAll(".clicked-connection-cancellations")
            .style("display", display);
          innerChart
            .selectAll(".clicked-connection-label-cancellations")
            .style("display", display);
        }
        // Update opacity of legend item
        d3.select(this).style("opacity", isActive ? 1 : 0.5);
        rescaleY();
      });
    legendGroup
      .append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 10)
      .attr("y2", 10)
      .attr("stroke", item.color)
      .attr("stroke-width", 3);

    legendGroup
      .append("circle")
      .attr("cx", 15)
      .attr("cy", 10)
      .attr("r", 5)
      .attr("fill", item.color)
      .attr("stroke", item.stroke || item.color)
      .attr("stroke-width", 1);

    legendGroup
      .append("text")
      .attr("x", 40)
      .attr("y", 10)
      .attr("dy", "0.32em")
      .text(item.label)
      .style("font-size", "14px");
  });
};

function LineChart() {
  const [interval, setInterval] = React.useState("W");
  const [athlete, setAthlete] = React.useState("All");
  const [playerList, setPlayerList] = React.useState([]);

  useEffect(() => {
    //Load athletes list from API (json containing only array of strings)
    d3.json("https://mrkprojects.altervista.org/dataVis/playerList.php").then(
      (data) => {
        setPlayerList(data);
      }
    );
    // Load data from CSV and draw chart
    d3.csv(
      "https://mrkprojects.altervista.org/dataVis/attendences.php?interval=W"
    ).then((data) => {
      console.log(data);
      drawLineChart(data, "W");
    });
  }, []);

  useEffect(() => {
    // Reload data and redraw chart on interval or athlete change
    d3.csv(
      `https://mrkprojects.altervista.org/dataVis/attendences.php?interval=${interval}${
        athlete !== "All" ? `&athlete=${athlete}` : ""
      }`
    ).then((data) => {
      drawLineChart(data, interval);
    });
  }, [interval, athlete]);

  return (
    <div className={styles.container}>
      <br />
      <br />
      <h2> Weekly Attendance Analysis </h2>
      <br />
      <br />
      <Select
        sx={{ minWidth: "150px", marginRight: "20px" }}
        labelId="linechart1-interval-label"
        id="linechart1-interval"
        value={interval}
        label="Intervallo"
        onChange={(event) => setInterval(event.target.value)}
      >
        <MenuItem value={"W"}>Settimanale</MenuItem>
        <MenuItem value={"M"}>Mensile</MenuItem>
        <MenuItem value={"Y"}>Annuale</MenuItem>
      </Select>
      <Select
        sx={{ minWidth: "200px" }}
        labelId="linechart1-atleta-label"
        id="linechart1-atleta"
        value={athlete}
        label="Atleta"
        onChange={(event) => setAthlete(event.target.value)}
      >
        <MenuItem value={"All"}>All</MenuItem>
        {playerList.map((alias) => (
          <MenuItem key={alias} value={alias}>
            {alias}
          </MenuItem>
        ))}
      </Select>
      <br />
      <br />
      <svg
        viewBox="0 0 1540 780"
        id="line-chart"
        style={{ width: "90%", height: "auto" }}
      ></svg>
    </div>
  );
}

export default LineChart;
