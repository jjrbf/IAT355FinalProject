(async function runApp() {
  const config = {
    width: 900,
    height: 600,
    margin: { top: 40, right: 50, bottom: 70, left: 100 },
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

  const medianSalaries = universities.map((uni) => {
    const salaries = filteredDataSalaries
      .filter((d) => d.Agency === uni)
      .map((d) => d.salary);
    return {
      Institution: uni,
      medianSalary: d3.median(salaries) || 0,
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

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredDataSalaries, (d) => d.salary)])
    .range([height - margin.bottom, margin.top]);

  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  const yAxisGroup = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // Add X and Y axis labels
  svg
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom / 2 + 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")

  svg
    .append("text")
    .attr("class", "y-axis-label")
    .attr("x", -height / 2)
    .attr("y", margin.left / 4)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .text("Salary");

  // Rotate the x-axis labels
  svg
    .selectAll(".x-axis text")
    .style("transform", "rotate(-45deg)")
    .style("text-anchor", "end")
    .style("transform-origin", "middle")
    .style("font-size", "12px");

  // Add scatter plot points
  svg
    .selectAll(".scatter-point")
    .data(filteredDataSalaries)
    .join("circle")
    .attr("class", "scatter-point")
    .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d.salary))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .attr("opacity", 0.7)
    .on("mouseover", (event, d) => {
      d3.select("#tooltip")
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 10}px`)
        .html(
          `Name: ${d.Name}<br>Salary: $${d3.format(
            ",.2f"
          )(d.salary)}`
        );
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    });

  // Add median lines
  svg
    .selectAll(".median-line")
    .data(medianSalaries)
    .join("line")
    .attr("class", "median-line")
    .attr("x1", (d) => xScale(d.Institution))
    .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
    .attr("y1", (d) => yScale(d.medianSalary))
    .attr("y2", (d) => yScale(d.medianSalary))
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  // Tooltip
  d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Initial zoom-in on the median lines
  const minY = d3.min(medianSalaries, (d) => yScale(d.medianSalary));
  const maxY = d3.max(medianSalaries, (d) => yScale(d.medianSalary));
  const zoomedHeight = maxY - minY + 50;

  svg.attr(
    "viewBox",
    `${margin.left} ${minY - 25} ${width - margin.left - margin.right} ${zoomedHeight}`
  );

  // Reposition the labels (x and y) relative to the zoom
  svg.select(".x-axis-label").attr("y", height - margin.bottom / 2 + 30);
  svg.select(".y-axis-label").attr("y", margin.left / 4);

  // Zoom Out Button
  d3.select("#zoomOutButton").on("click", () => {
    svg.transition().duration(1000).attr("viewBox", `0 0 ${width} ${height}`);

    yScale.domain([0, d3.max(filteredDataSalaries, (d) => d.salary)]);
    xScale.range([margin.left, width - margin.right]);

    // Update axes after zooming out
    xAxisGroup.transition().duration(1000).call(d3.axisBottom(xScale));
    yAxisGroup.transition().duration(1000).call(d3.axisLeft(yScale));

    // Reposition the axis labels
    svg.select(".x-axis-label").attr("y", height - margin.bottom / 2 + 30);
    svg.select(".y-axis-label").attr("y", margin.left / 4);
  });

  // Zoom In Button
  d3.select("#zoomInButton").on("click", () => {
    const minY = d3.min(medianSalaries, (d) => yScale(d.medianSalary));
    const maxY = d3.max(medianSalaries, (d) => yScale(d.medianSalary));
    const zoomedHeight = maxY - minY + 50;

    svg.transition().duration(1000).attr(
      "viewBox",
      `${margin.left} ${minY - 25} ${width - margin.left - margin.right} ${zoomedHeight}`
    );

    // Zoom back to focus on median lines
    yScale.domain([0, d3.max(filteredDataSalaries, (d) => d.salary)]);
    xScale.range([margin.left, width - margin.right]);

    // Update axes after zooming in
    xAxisGroup.transition().duration(1000).call(d3.axisBottom(xScale));
    yAxisGroup.transition().duration(1000).call(d3.axisLeft(yScale));

    // Reposition the axis labels
    svg.select(".x-axis-label").attr("y", height - margin.bottom / 2 + 30);
    svg.select(".y-axis-label").attr("y", margin.left / 4);
  });
})();


