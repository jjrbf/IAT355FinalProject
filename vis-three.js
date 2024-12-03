(async function runApp() {
  const config = {
    width: 900,
    height: 500,
    margin: { top: 40, right: 50, bottom: 100, left: 100 },
    dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
    svgSelector: "#vis3Container",
  };

  const { width, height, margin } = config;

  // Load and preprocess data
  const datasetSalaries = await d3.csv(config.dataPathSalaries, d3.autoType);

  const universities = [
    "University of British Columbia (UBC)",
    "Simon Fraser University (SFU)",
    "BCIT",
    "University of Victoria",
    "Kwantlen Polytechnic University",
    "Vancouver Community College (VCC)",
    "Langara College",
    "Douglas College",
    "Justice Institute of B.C.",
    "University of the Fraser Valley",
  ];

  const filteredDataSalaries = datasetSalaries
    .filter((d) => universities.includes(d.Agency))
    .map((d) => ({
      ...d,
      salary: parseFloat(d.Remuneration) || 0,
    }));

  const averageSalaries = universities.map((uni) => {
    const salaries = filteredDataSalaries
      .filter((d) => d.Agency === uni)
      .map((d) => d.salary);
    return {
      Institution: uni,
      averageSalary: d3.mean(salaries) || 0,
    };
  });

  const svg = d3
    .select(config.svgSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("border", "1px solid black");

  const xScale = d3
    .scaleBand()
    .domain(universities)
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);

  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  const yAxisGroup = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`);

  const xAxis = (scale) =>
    d3
      .axisBottom(scale)
      .tickFormat((d) => d.length > 15 ? d.slice(0, 15) + "..." : d)
      .tickPadding(10);
  const yAxis = d3.axisLeft(yScale);

  function updateAxes(newYDomain, transitionDuration = 1000) {
    yScale.domain(newYDomain);

    yAxisGroup.transition().duration(transitionDuration).call(yAxis);
    xAxisGroup.transition().duration(transitionDuration).call(xAxis(xScale));
    svg
      .selectAll(".x-axis text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
  }

  function addHoverEffects(selection) {
    selection
      .attr("opacity", 0.6)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "black")
          .attr("stroke-width", 2);
        d3.select("#tooltip")
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .html(
            `Name: ${d.Name || "Unavailable"}<br>Salary: $${d3.format(
              ",.2f"
            )(d.salary)}<br>Position: ${d.Position || "Unavailable"}`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.6).attr("stroke", null);
        d3.select("#tooltip").style("opacity", 0);
      });
  }  

  function clearElements(classes) {
    classes.forEach((cls) => svg.selectAll(`.${cls}`).remove());
  }

  function drawAverageSalaryLines() {
    clearElements(["scatter-point", "highlight-point", "median-line", "tooltip"]);
  
    const medianDomain = [70000, d3.max(averageSalaries, (d) => d.averageSalary)+10000];
    updateAxes(medianDomain);
  
    svg
      .selectAll(".median-line")
      .data(averageSalaries)
      .join("line")
      .attr("class", "median-line")
      .transition()
      .duration(1000)
      .attr("x1", (d) => xScale(d.Institution))
      .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
      .attr("y1", (d) => yScale(d.averageSalary))
      .attr("y2", (d) => yScale(d.averageSalary))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .raise();
  }
  

  function highlightEntryClosestToUBCAverage() {
    clearElements(["scatter-point", "highlight-point", "tooltip", "median-line-updated"]);
  
    const ubcAverage = filteredDataSalaries.find((d) => d.Name === "Abel-Co, Karen");
    
    // need to implement dynamically getting ubc closest to average only in ubc
    // const ubcAverage = averageSalaries.find((d) => d.Institution === "University of British Columbia (UBC)").averageSalary;
    // const closestEntry = filteredDataSalaries.reduce((prev, curr) =>
    //   Math.abs(curr.salary - ubcAverage) < Math.abs(prev.salary - ubcAverage) ? curr : prev
    // );
  
    const medianDomain = [70000, d3.max(averageSalaries, (d) => d.averageSalary)+10000];
    updateAxes(medianDomain);
  
    svg
      .append("circle")
      .attr("class", "highlight-point")
      .attr("cx", xScale(ubcAverage.Agency) + xScale.bandwidth() / 2)
      .attr("cy", yScale(ubcAverage.salary))
      .attr("r", 8)
      .attr("fill", "blue");
  
    // svg
    //   .append("line")
    //   .attr("class", "highlight-line")
    //   .attr("x1", xScale(closestEntry.Agency) + xScale.bandwidth() / 2)
    //   .attr("x2", xScale("University of British Columbia (UBC)") + xScale.bandwidth() / 2)
    //   .attr("y1", yScale(closestEntry.salary))
    //   .attr("y2", yScale(ubcMedian))
    //   .attr("stroke", "black")
    //   .attr("stroke-dasharray", "4 2")
    //   .attr("stroke-width", 2);
  
    svg
      .selectAll(".median-line")
      .data(averageSalaries)
      .join("line")
      .attr("class", "median-line")
      .transition()
      .duration(1000)
      .attr("x1", (d) => xScale(d.Institution))
      .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
      .attr("y1", (d) => yScale(d.averageSalary))
      .attr("y2", (d) => yScale(d.averageSalary))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .raise();
  }
  
  function drawAllEntriesWithTooltips() {
    clearElements(["highlight-point", "highlight-line", "tooltip", "median-line-updated"]);
  
    // const salaryDomain = [0, d3.max(filteredDataSalaries, (d) => d.salary)];
    // updateAxes(salaryDomain);
  
    const medianDomain = [70000, d3.max(averageSalaries, (d) => d.averageSalary)+10000];
    updateAxes(medianDomain);
  
    const points = svg
      .selectAll(".scatter-point")
      .data(filteredDataSalaries)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.salary))
      .attr("r", 5)
      .attr("fill", "steelblue")
      .lower();
  
    addHoverEffects(points);
  
    svg
      .selectAll(".median-line")
      .data(averageSalaries)
      .join("line")
      .attr("class", "median-line")
      .transition()
      .duration(1000)
      .attr("x1", (d) => xScale(d.Institution))
      .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
      .attr("y1", (d) => yScale(d.averageSalary))
      .attr("y2", (d) => yScale(d.averageSalary))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .raise();
  }
  
  function adjustYScaleForTopUBCSalary() {
    clearElements(["scatter-point", "median-line"]);
  
    // const ubcSalaries = filteredDataSalaries.filter((d) => d.Agency === "University of British Columbia (UBC)");
    // const maxUBCSalary = d3.max(ubcSalaries, (d) => d.salary);
    const salaryDomain = [0, d3.max(filteredDataSalaries, (d) => d.salary)];
    updateAxes(salaryDomain);
  
    const points = svg
      .selectAll(".scatter-point")
      .data(filteredDataSalaries)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.salary))
      .attr("r", 5)
      .attr("fill", "steelblue");
  
    addHoverEffects(points);

    svg
      .selectAll("median-line-updated")
      .data(averageSalaries)
      .join("line")
      .attr("class", "median-line-updated")
      .transition()
      .duration(1000)
      .attr("x1", (d) => xScale(d.Institution))
      .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
      .attr("y1", (d) => yScale(d.averageSalary))
      .attr("y2", (d) => yScale(d.averageSalary))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .raise();
  }
  
  function filterToTop10FromEachUniversity() {
    clearElements(["scatter-point", "highlight-point", "tooltip", "median-line-updated"]);
  
    const top10PerUniversity = universities.flatMap((uni) => {
      return filteredDataSalaries
        .filter((d) => d.Agency === uni)
        .sort((a, b) => b.salary - a.salary)
        .slice(0, 10);
    });
  
    const salaryDomain = [0, d3.max(top10PerUniversity, (d) => d.salary)];
    updateAxes(salaryDomain);
  
    const points = svg
      .selectAll(".scatter-point")
      .data(top10PerUniversity)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.salary))
      .attr("r", 5)
      .attr("fill", "steelblue");
  
    addHoverEffects(points);
  }
  

  // Attach functions to global scope
  window.salaryVis3 = drawAverageSalaryLines;
  window.highlightEntryVis3 = highlightEntryClosestToUBCAverage;
  window.allEntriesVis3 = drawAllEntriesWithTooltips;
  window.adjustYScaleVis3 = adjustYScaleForTopUBCSalary;
  window.filterVis3 = filterToTop10FromEachUniversity;

  // Draw initial chart
  drawAverageSalaryLines();
})();
