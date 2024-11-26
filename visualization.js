import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function runApp() {
    const config = {
      width: 900,
      height: 400,
      margin: { top: 40, right: 200, bottom: 40, left: 200 },
      dataPathUniversities:
        "./datasets/bc_universities_2022_23 - university_stats_2023_24.csv",
      svgSelector: "#vis1Container",
    };
  
    const { width, height, margin } = config;
  
    // Load and preprocess data
    const datasetUniversities = await d3.csv(
      config.dataPathUniversities,
      d3.autoType
    );
  
    const universities = [
      "University of British Columbia (UBC)",
      "Simon Fraser University (SFU)",
      "BCIT",
      "University of Victoria",
    ];
    const filteredData = datasetUniversities
    .filter((d) => universities.includes(d.Institutions))
    .map((d) => ({
      ...d,
      tuitionPerStudent:
        parseFloat(d["2022/23 Tuition For Each Student"].replace(/,/g, "")) || 0,
      totalStudents:
        parseFloat(d["2022/23 Total Students"].replace(/,/g, "")) || 0,
      tuitionFees:
        parseFloat(d["2022/23 Tuition Fees"].replace(/,/g, "")) || 0,
    }))
    .map((d) => ({
      ...d,
      totalRevenue: d.totalStudents * d.tuitionFees, // Calculate the total revenue
    }));

  const svg = d3
    .select(config.svgSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  // Define Scales
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.tuitionPerStudent)])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleBand()
    .domain(universities) // Use the predefined order
    .range([margin.top, height - margin.bottom])
    .padding(0.5); // Reduce bar height by increasing padding

  // Bars
  svg
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", xScale(0))
    .attr("y", (d) => yScale(d.Institutions))
    .attr("width", (d) => xScale(d.tuitionPerStudent) - xScale(0))
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) =>
      d.Institutions === "University of British Columbia (UBC)"
        ? "steelblue" // Highlight UBC
        : "grey"
    );

  // Labels
  svg
    .selectAll(".label")
    .data(filteredData)
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.tuitionPerStudent) + 5) // Position slightly to the right of the bar
    .attr("y", (d) => yScale(d.Institutions) + yScale.bandwidth() / 2) // Center vertically
    .attr("dy", "0.35em") // Align text vertically
    .text((d) =>
      `${d3.format("$,.0f")(d.totalRevenue)} = ${d3.format(",")(d.totalStudents)} × ${d3.format("$,.0f")(d.tuitionFees)}`
    ) // Display the calculation
    .attr("fill", "black")
    .attr("font-size", "12px");

  // Axes
  svg
    .append("g")
    .call(d3.axisBottom(xScale).ticks(10, "s"))
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
})();