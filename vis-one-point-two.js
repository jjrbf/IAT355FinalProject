(async function runApp() {
  const config = {
    width: 900,
    height: 400,
    margin: { top: 40, right: 200, bottom: 40, left: 200 },
    dataPathUniversities: "datasets/bc_universities_2022_23_tuition.csv",
    dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
    svgSelector: "#vis1Container",
  };

  const { width, height, margin } = config;

  // Load and preprocess data
  const datasetUniversities = await d3.csv(
    config.dataPathUniversities,
    d3.autoType
  );

  const datasetSalaries = await d3.csv(config.dataPathSalaries, d3.autoType);

  const universities = [
    "University of British Columbia (UBC)",
    "Simon Fraser University (SFU)",
    "BCIT",
    "University of Victoria",
  ];

  // Preprocess university data
  const filteredDataUniversities = datasetUniversities
    .filter((d) => universities.includes(d.Institutions))
    .map((d) => ({
      ...d,
      tuitionPerStudent: parseFloat(d["tuitionPerStudent"]) || 0,
      totalStudents: parseFloat(d["totalStudents"]) || 0,
      tuitionFees: parseFloat(d["tuition"]) || 0,
    }))
    .map((d) => ({
      ...d,
      totalRevenue: d.totalStudents * d.tuitionFees, // Calculate total revenue
    }));

  // Preprocess salary data
  const filteredDataSalaries = datasetSalaries
    .filter((d) => universities.includes(d.Agency))
    .map((d) => ({
      ...d,
      salary: parseFloat(d["Remuneration"]) || 0,
    }));

  // Group salaries by university and calculate average
  const avgSalaries = universities.map((uni) => {
    const uniSalaries = filteredDataSalaries
      .filter((d) => d.Agency === uni)
      .map((d) => d.salary);

    return {
      Institution: uni,
      avgSalary: d3.mean(uniSalaries) || 0, // Calculate average salary
    };
  });

  const svg = d3
    .select(config.svgSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  // Define scales
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredDataUniversities, (d) => d.tuitionPerStudent)])
    .range([margin.left, width - margin.right])

    // salary
    .domain([0, d3.max(avgSalaries, (d) => d.avgSalary)]);

  const yScale = d3
    .scaleBand()
    .domain(universities) // Use university names
    .range([margin.top, height - margin.bottom])
    .padding(0.5); // Padding for visual separation

  // **Step 1: Remove existing rectangles to redraw**
  svg.selectAll("rect").remove();

  // **Step 2: Draw new rectangles for avgSalaries**
  svg
    .selectAll("rect")
    .data(filteredData)
    .join("rect")
    .attr("x", xScale(0)) // Bars start at x-axis origin
    .attr("y", (d) => yScale(d.Institution)) // Use Institution for positioning
    .attr("width", (d) => xScale(d.avgSalary) - xScale(0)) // Width based on avgSalary
    .attr("height", yScale.bandwidth()) // Bar height using yScale bandwidth
    .attr("fill", (d) =>
      d.Institution === "University of British Columbia (UBC)"
        ? "steelblue" // Highlight UBC
        : "grey"
    );

  // salary
  svg
    .selectAll("rect")
    .data(avgSalaries)
    .join("rect")
    .attr("x", xScale(0)) // Bars start at x-axis origin
    .attr("y", (d) => yScale(d.Institution)) // Use Institution for positioning
    .attr("width", (d) => xScale(d.avgSalary) - xScale(0)) // Width based on avgSalary
    .attr("height", yScale.bandwidth()) // Bar height using yScale bandwidth
    .attr("fill", (d) =>
      d.Institution === "University of British Columbia (UBC)"
        ? "steelblue" // Highlight UBC
        : "grey"
    );

  // **Step 3: Add labels for avgSalaries**
  svg
    .selectAll(".label")
    .data(avgSalaries)
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.avgSalary) + 5) // Slightly to the right of the bar
    .attr("y", (d) => yScale(d.Institution) + yScale.bandwidth() / 2) // Centered vertically
    .attr("dy", "0.35em") // Vertical alignment
    .text((d) => `${d3.format("$,.0f")(d.avgSalary)}`) // Display avgSalary
    .attr("fill", "black")
    .attr("font-size", "12px");

  // Redraw x-axis
  svg
    .append("g")
    .call(d3.axisBottom(xScale).ticks(10, "s"))
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  // Redraw y-axis
  svg
    .append("g")
    .call(d3.axisLeft(yScale))
    .attr("transform", `translate(${margin.left}, 0)`);
})();
