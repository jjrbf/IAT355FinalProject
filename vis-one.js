(async function runApp() {
  const config = {
    width: 900,
    height: 400,
    margin: { top: 40, right: 200, bottom: 40, left: 210 },
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

  const datasetSalaries = await d3.csv(
    config.dataPathSalaries,
    d3.autoType
  );

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

  // DRAWING

  const svg = d3
    .select(config.svgSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  const xScale = d3
    .scaleLinear()
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleBand()
    .domain(universities)
    .range([margin.top, height - margin.bottom])
    .padding(0.5);

    function drawTuitionChart() {
      // Clear existing elements
      svg.selectAll("*").remove();
    
      // Update scales
      xScale.domain([0, d3.max(filteredDataUniversities, (d) => d.totalRevenue)]);
    
      // Bars
      svg
        .selectAll("rect")
        .data(filteredDataUniversities)
        .join("rect")
        .attr("x", xScale(0))
        .attr("y", (d) => yScale(d.Institutions))
        .attr("width", (d) => xScale(d.totalRevenue) - xScale(0))
        .attr("height", yScale.bandwidth())
        .attr("fill", (d) => {
          // Assign ubc a special color so it stands out
          if (d.Institutions.includes("UBC")) return "#c6c6f4";
          return "#D9D9D9";
        });
    
      // Institution logos
      svg
        .selectAll(".logo")
        .data(filteredDataUniversities)
        .join("image")
        .attr("class", "logo")
        .attr("x", (d) => xScale(d.totalRevenue) - 30) // Position inside the bar
        .attr("y", (d) => yScale(d.Institutions) + yScale.bandwidth() / 4)
        .attr("width", 25)
        .attr("height", 25)
        .attr("href", (d) => {
          // Map logos
          if (d.Institutions.includes("UBC")) return "images/ubc-logo.png";
          if (d.Institutions.includes("SFU")) return "images/sfu-logo.png";
          if (d.Institutions.includes("BCIT")) return "images/bcit-logo.png";
          if (d.Institutions.includes("University of Victoria")) return "images/uvic-logo.png";
          return null;
        });
    
      // Calculation labels
      svg
        .selectAll(".calculation-label")
        .data(filteredDataUniversities)
        .join("text")
        .attr("class", "calculation-label")
        .attr("x", (d) => xScale(d.totalRevenue) + 10)
        .attr("y", (d) => yScale(d.Institutions) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .each(function(d) {
          // Separate totalRevenue from the rest of the calculation
          const totalRevenueText = d3.format("$,.0f")(d.totalRevenue);
          const studentCountText = d3.format(",")(d.totalStudents);
          const tuitionFeesText = d3.format("$,.0f")(d.tuitionFees);
    
          // Create two spans: one for the totalRevenue and another for the formula
          const formulaText = `${studentCountText} × ${tuitionFeesText}`;
    
          // totalRevenue
          d3.select(this)
            .append("tspan")
            .attr("x", xScale(d.totalRevenue) + 10) // Align with the bar
            .attr("dy", 0) // No vertical offset for the first part
            .attr("fill", "black")
            .text(totalRevenueText);

          // Add "=" sign
          d3.select(this)
          .append("tspan")
          .attr("x", xScale(d.totalRevenue) + 10 + d3.select(this).node().getComputedTextLength()) // Position after the first part
          .attr("dy", 0) // Same vertical alignment as the first part
          .attr("fill", "grey")
          .text(" = ");
    
          // calculation formula, in grey
          d3.select(this)
            .append("tspan")
            .attr("x", xScale(d.totalRevenue) + 10 + d3.select(this).node().getComputedTextLength()) // Position after the first part
            .attr("fill", "grey")
            .text(formulaText);
        });
    
      // Axes
      svg
        .append("g")
        .call(
          d3.axisBottom(xScale)
            .ticks(10, "s")
            .tickFormat((d) => {
              // Format numbers into abbreviated form (ex. $50k)
              if (d >= 1_000_000) return `$${(d / 1_000_000).toFixed(1)}M`;  // For millions
              if (d >= 1_000) return `$${(d / 1_000).toFixed(1)}k`; // For thousands
              return `$${d3.format(",")(d)}`;  // Default format for values under 1000
            })
        )
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .attr("font-size", "12px");
    
      svg
        .append("g")
        .call(d3.axisLeft(yScale))
        .attr("transform", `translate(${margin.left}, 0)`)
        .attr("font-size", "12px");
    
      // Title and footnotes
      document.getElementById("vis1title").innerHTML = "Approx. Income from Student Tuition";
      document.getElementById("vis1small").innerHTML = "Calculated using number of students in 2022/2023 × 2022/2023 tuition";
    }

  function drawSalaryChart() {
    // Clear existing elements
    svg.selectAll("*").remove();

    // Update scales
    xScale.domain([0, d3.max(avgSalaries, (d) => d.avgSalary)]);

    // Bars
    svg
      .selectAll("rect")
      .data(avgSalaries)
      .join("rect")
      .attr("x", xScale(0))
      .attr("y", (d) => yScale(d.Institution))
      .attr("width", (d) => xScale(d.avgSalary) - xScale(0))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) =>
        d.Institution === "University of British Columbia (UBC)"
          ? "steelblue"
          : "grey"
      );

    // Labels
    svg
      .selectAll(".label")
      .data(avgSalaries)
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => xScale(d.avgSalary) + 5)
      .attr("y", (d) => yScale(d.Institution) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text((d) => `${d3.format("$,.0f")(d.avgSalary)}`)
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

    document.getElementById("vis1title").innerHTML = "Average Staff Compensation";
    document.getElementById("vis1small").innerHTML = "Average of the 2020/2021 salaries of staff whose salary is over $75,000";
  }

  // Draw the default chart
  drawTuitionChart();

  // Attach redraw function globally for external calls
    window.tuitionVis1 = drawTuitionChart;
    window.salaryVis1 = drawSalaryChart;
})();
