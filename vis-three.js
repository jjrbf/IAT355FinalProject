(async function runApp() {
  const config = {
    width: 900,
    height: 500,
    margin: { top: 40, right: 30, bottom: 80, left: 70 },
    dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
    svgSelector: "#vis3Container",
  };

  // const { width, height, margin } = config;
  const { margin } = config;

  const mainContainer = d3.select(config.svgSelector);

  let width = mainContainer.node().getBoundingClientRect().width;
  let containerHeight = mainContainer.node().getBoundingClientRect().height;

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
    .attr("height", containerHeight);

  const xScale = d3
    .scaleBand()
    .domain(universities)
    .range([margin.left, width - margin.right])
    .padding(0.5);

  // Mapping object for university acronyms
  const universityAcronyms = {
    "University of British Columbia (UBC)": "UBC",
    "Simon Fraser University (SFU)": "SFU",
    "BCIT": "BCIT",
    "University of Victoria": "UVic",
    "Kwantlen Polytechnic University": "KPU",
    "Vancouver Community College (VCC)": "VCC",
    "Langara College": "Langara",
    "Douglas College": "Douglas",
    "Justice Institute of B.C.": "JIBC",
    "University of the Fraser Valley": "UFV",
  };

  // Modify the domain of the xScale to use acronyms
  const xScaleAcronym = d3
  .scaleBand()
  .domain(universities.map((uni) => universityAcronyms[uni] || uni))
  .range([margin.left, width - margin.right])
  .padding(0.5);

  const yScale = d3
    .scaleLinear()
    .range([containerHeight - margin.bottom, margin.top]);

  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${containerHeight - margin.bottom})`);

  const yAxisGroup = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`);

  const xAxis = (scale) =>
    d3
      .axisBottom(scale)
      .tickFormat((d) => (d.length > 15 ? d.slice(0, 15) + "..." : d))
      .tickPadding(10);
  const yAxis = d3.axisLeft(yScale);

  // Define arrowhead marker
  svg
    .append("defs")
    .append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 10) // Position the arrowhead at the end of the line
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 Z") // Triangle shape
    .attr("fill", "white");

  function addHoverEffects(selection) {
    selection
      .attr("opacity", 0.3)
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
            `Name: ${d.Name || "Unavailable"}<br>Salary: $${d3.format(",.2f")(
              d.salary
            )}<br>Position: ${d.Position || "Unavailable"}`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.3).attr("stroke", null);
        d3.select("#tooltip").style("opacity", 0);
      });
  }

  function updateAxes(newYDomain, transitionDuration = 1000) {
    yScale.domain(newYDomain);
  
    yAxisGroup.transition().duration(transitionDuration).call(yAxis);
    xAxisGroup.transition().duration(transitionDuration).call(xAxis(xScale).tickFormat((d) => universityAcronyms[d] || d));
  
    svg
      .selectAll(".x-axis text")
      .style("text-anchor", "middle");
  
    // Add hover effect for tooltips on x-axis labels
    addXLabelHoverEffect();
  }

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "#E3F4EF")
    .style("border", "1px solid #ddd")
    .style("padding", "5px")
    .style("font-size", "12px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Update x-axis labels to show tooltip
  function addXLabelHoverEffect() {
    svg
      .selectAll(".x-axis text")
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(d) // Show the full university name
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  }


  function clearElements(classes) {
    classes.forEach((cls) => svg.selectAll(`.${cls}`).remove());
  }

  function drawAverageSalaryLines() {
    clearElements([
      "scatter-point",
      "highlight-point",
      "tooltip",
      "highlight-label",
      "arrow-shaft",
      "annotation-group", "annotation-text",
      "horizontal-cap", "vertical-line",
      "salary-range-text",
    ]);

    const medianDomain = [
      70000,
      d3.max(averageSalaries, (d) => d.averageSalary) + 10000,
    ];
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
      .attr("stroke", "#ACFAD8")
      .attr("stroke-width", 2);

    document.getElementById("vis3main").innerHTML =
      "Let's start off with the average salary for each university...";

    // Highlight UBC average salary
    const ubcAverage = averageSalaries.find(
      (d) => d.Institution === "University of British Columbia (UBC)"
    );

    if (!ubcAverage) {
      console.error("UBC data not found in averageSalaries.");
      return;
    }

    const ubcAverageX = xScale(ubcAverage.Institution) + xScale.bandwidth() / 2;
    const ubcAverageY = yScale(ubcAverage.averageSalary);

    // Add animated label
    const labelXOffset = 100; // Horizontal offset from the line
    const labelYOffset = -10; // Vertical offset from the line

    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", ubcAverageX + labelXOffset)
      .attr("y", ubcAverageY + labelYOffset - 7)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(
        `UBC has an average salary of $${d3.format(",.0f")(
          ubcAverage.averageSalary
        )}.`
      )
      .style("font-size", "14px")
      .style("fill", "white");

    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", ubcAverageX + labelXOffset)
      .attr("y", ubcAverageY + labelYOffset - 7 + 20)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(`We'll find out why it's higher than other universities.`)
      .style("font-size", "14px")
      .style("fill", "white");

    // hide
    d3.select("#vis3ContainerSupplementary").classed("hidden", true);

    // Add arrow shaft
    svg
      .append("line")
      .attr("class", "arrow-shaft")
      .attr("x1", ubcAverageX + labelXOffset - 10) // Adjust for label alignment
      .attr("y1", ubcAverageY + labelYOffset)
      .attr("x2", ubcAverageX + 25) // Point to the UBC average salary line
      .attr("y2", ubcAverageY)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(2000)
      .attr("opacity", 1)
      .attr("marker-end", "url(#arrowhead)");
  }

  function highlightEntryClosestToUBCAverage() {
    clearElements([
      "scatter-point",
      "highlight-point",
      "tooltip",
      "median-line-updated",
      "highlight-label",
      "arrow-shaft",
      "annotation-group", "annotation-text",
      "horizontal-cap", "vertical-line",
      "salary-range-text",
    ]);

    const ubcAverage = filteredDataSalaries.find(
      (d) => d.Name === "Abel-Co, Karen"
    );
    if (!ubcAverage) {
      console.error("Karen Abel-Co's data not found.");
      return;
    }

    const medianDomain = [
      70000,
      d3.max(averageSalaries, (d) => d.averageSalary) + 10000,
    ];
    updateAxes(medianDomain);

    const highlightX = xScale(ubcAverage.Agency) + xScale.bandwidth() / 2;
    const highlightY = yScale(ubcAverage.salary);

    // Highlight the point
    svg
      .append("circle")
      .attr("class", "highlight-point")
      .attr("cx", highlightX)
      .attr("cy", highlightY)
      .attr("r", 8)
      .attr("fill", "#79D0B4");

    // Add animated label
    const labelXOffset = 100; // Horizontal offset from the point
    const labelYOffset = -5; // Vertical offset from the point
    const arrowOffset = 5; // Offset for the arrow from the label

    // Label text
    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", highlightX + labelXOffset)
      .attr("y", highlightY + labelYOffset)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(
        `This is Karen Abel-Co with a salary of $${d3.format(",.0f")(
          ubcAverage.salary
        )}.`
      )
      .style("font-size", "14px")
      .style("fill", "white");

    // Add arrow shaft
    svg
      .append("line")
      .attr("class", "arrow-shaft")
      .attr("x1", highlightX + labelXOffset - arrowOffset)
      .attr("y1", highlightY + labelYOffset - 5) // Adjust for alignment
      .attr("x2", highlightX + 10) // Point to the highlighted point
      .attr("y2", highlightY)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(2000)
      .attr("opacity", 1)
      .attr("marker-end", "url(#arrowhead)"); // Add arrowhead marker

    // Draw and animate median lines
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
      .attr("stroke", "#ACFAD8")
      .attr("stroke-width", 2);

    // hide
    d3.select("#vis3ContainerSupplementary").classed("hidden", true);

    // Text
    document.getElementById("vis3main").innerHTML =
      "But first, let's look closer at the entry closest to the UBC average.";
  }

  function drawAllEntriesWithTooltips() {
    clearElements([
      "highlight-point",
      "highlight-line",
      "tooltip",
      "median-line-updated",
      "highlight-label",
      "arrow-shaft",
      "annotation-group", "annotation-text",
      "horizontal-cap", "vertical-line",
      "salary-range-text",
    ]);

    const medianDomain = [
      70000,
      d3.max(averageSalaries, (d) => d.averageSalary) + 10000,
    ];
    updateAxes(medianDomain);

    const points = svg
      .selectAll(".scatter-point")
      .data(filteredDataSalaries)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.salary))
      .attr("r", 5)
      .attr("fill", "#519FAB")
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
      .attr("stroke", "#ACFAD8")
      .attr("stroke-width", 2);

    // Add arrows and messages for UBC, SFU, UVic
    const institutions = [
      "University of British Columbia (UBC)",
      "Simon Fraser University (SFU)",
      "University of Victoria",
    ];
    institutions.forEach((institution) => {
      const institutionX = xScale(institution) + xScale.bandwidth() / 2; // X position of the institution
      const institutionY = margin.top; // Y position at the top (margin.top)

      // Add the arrow shaft
      svg
        .append("line")
        .attr("class", "arrow-shaft")
        .attr("x1", institutionX + 40)
        .attr("y1", institutionY + 30)
        .attr("x2", institutionX + 10)
        .attr("y2", institutionY - 20) // Adjust to point upwards
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("opacity", 0) // Start invisible
        .transition() // Animate appearance
        .duration(2000)
        .attr("opacity", 1)
        .attr("marker-end", "url(#arrowhead)"); // Add arrowhead marker

      if (institution == "University of Victoria") {
        // Add background rectangle for the message (to improve readability)
        svg
          .append("rect")
          .attr("class", "highlight-label")
          .attr("x", institutionX - 250)
          .attr("y", institutionY + 35)
          .attr("width", 400)
          .attr("height", 85)
          .attr("fill", "rgba(21, 31, 44, 0.8)") // Semi-transparent background
          .attr("opacity", 0) // Start invisible
          .transition() // Animate appearance
          .duration(1000)
          .attr("opacity", 1)
          .attr("rx", 10) // Rounded corners
          .attr("ry", 10); // Rounded corners
        // Add message text
        svg
          .append("text")
          .attr("class", "highlight-label")
          .attr("x", institutionX - 50)
          .attr("y", institutionY + 55) // Position the message just above the arrow
          .attr("opacity", 0) // Start invisible
          .transition() // Animate appearance
          .duration(1000)
          .attr("opacity", 1)
          .text("There seems to be a lot more entries in these universities...")
          .style("font-size", "12px")
          .style("fill", "white")
          .style("text-anchor", "middle"); // Center the text
        // Add message text
        svg
          .append("text")
          .attr("class", "highlight-label")
          .attr("x", institutionX - 50)
          .attr("y", institutionY + 80) // Position the message just above the arrow
          .attr("opacity", 0) // Start invisible
          .transition() // Animate appearance
          .duration(1000)
          .attr("opacity", 1)
          .text(
            "This is because these universities have some very highly paid faculty."
          )
          .style("font-size", "12px")
          .style("fill", "white")
          .style("text-anchor", "middle"); // Center the text
        svg
          .append("text")
          .attr("class", "highlight-label")
          .attr("x", institutionX - 50)
          .attr("y", institutionY + 105) // Position the message just above the arrow
          .attr("opacity", 0) // Start invisible
          .transition() // Animate appearance
          .duration(1000)
          .attr("opacity", 1)
          .text("Let's redraw the chart to have a scale that shows the rest!")
          .style("font-size", "12px")
          .style("fill", "white")
          .style("text-anchor", "middle"); // Center the text
      }
    });

    const defs = svg.append("defs");

    const gradient = defs
      .append("linearGradient")
      .attr("id", "vertical-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#17212E")
      .attr("stop-opacity", 1);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#17212E")
      .attr("stop-opacity", 0);

    // Clear existing rectangles
    svg.selectAll(".cap-rect").remove();

    // Draw the rectangle
    svg
      .append("rect")
      .attr("class", "cap-rect")
      .attr("x", 0)
      .attr("width", width)
      .attr("y", 0)
      .attr("height", margin.top)
      .attr("fill", "url(#vertical-gradient)")
      .raise(); // Ensure rectangle is on top

    // hide
    d3.select("#vis3ContainerSupplementary").classed("hidden", true);

    // Text
    document.getElementById("vis3main").innerHTML =
      "But when we add the rest of the entries, it doesn't fit on the chart...";
  }

  function adjustYScaleForTopUBCSalary() {
    // need to implement hover effects
    clearElements([
      "scatter-point",
      "median-line",
      "highlight-label",
      "arrow-shaft",
      "annotation-group", "annotation-text",
      "horizontal-cap", "vertical-line",
      "salary-range-text",
    ]);

    const salaryDomain = [0, d3.max(filteredDataSalaries, (d) => d.salary)];
    updateAxes(salaryDomain);

    // Filter UBC entries with salary above 500k
    const ubcTopSalaries = filteredDataSalaries.filter(
      (d) =>
        d.Agency === "University of British Columbia (UBC)" && d.salary > 500000
    );

    // Find the top and lowest salary above 500k at UBC
    const topUBC = d3.max(ubcTopSalaries, (d) => d.salary);
    const lowestUBC = d3.min(ubcTopSalaries, (d) => d.salary);

    const points = svg
      .selectAll(".scatter-point")
      .data(filteredDataSalaries)
      .join("circle")
      .attr("class", "scatter-point")
      .attr("cx", (d) => xScale(d.Agency) + xScale.bandwidth() / 2)
      .attr("cy", (d) => yScale(d.salary))
      .attr("r", 5)
      .attr("fill", "#519FAB");

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
      .attr("stroke", "#ACFAD8")
      .attr("stroke-width", 2);

    // Message Position
    const messageX = width / 4 + 50;
    const messageY = containerHeight / 4 - 10;

    // Add the message text
    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", messageX + 10)
      .attr("y", messageY - 15)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(
        "This empty space this text is in is thanks to this difference in top salaries."
      )
      .style("font-size", "14px")
      .style("fill", "white")
      .style("text-anchor", "left"); // Left-align text
    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", messageX + 10)
      .attr("y", messageY + 5)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(
        "Below is the difference in salary between the 9th most-paid UBC faculty"
      )
      .style("font-size", "14px")
      .style("fill", "white")
      .style("text-anchor", "left"); // Left-align text
    svg
      .append("text")
      .attr("class", "highlight-label")
      .attr("x", messageX + 10)
      .attr("y", messageY + 25)
      .attr("opacity", 0) // Start invisible
      .transition() // Animate appearance
      .duration(1000)
      .attr("opacity", 1)
      .text(
        "compared to the top person at each university. It's a 6-figure difference."
      )
      .style("font-size", "14px")
      .style("fill", "white")
      .style("text-anchor", "left"); // Left-align text

    // Bracket-style Arrow pointing to UBC's top and lowest salary above 500k
    svg
      .append("line")
      .attr("class", "highlight-label")
      .attr("x1", xScale("University of British Columbia (UBC)") + 80)
      .attr("y1", messageY)
      .attr("x2", xScale("University of British Columbia (UBC)") + 80)
      .attr("y2", yScale(topUBC))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Lower opacity for initial state
      .transition()
      .duration(2000)
      .attr("opacity", 1);

    svg
      .append("line")
      .attr("class", "highlight-label")
      .attr("x1", xScale("University of British Columbia (UBC)") + 80)
      .attr("y1", messageY)
      .attr("x2", xScale("University of British Columbia (UBC)") + 80)
      .attr("y2", yScale(lowestUBC))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Lower opacity for initial state
      .transition()
      .duration(2000)
      .attr("opacity", 1);

    svg
      .append("line")
      .attr("class", "highlight-label")
      .attr("x1", xScale("University of British Columbia (UBC)") + 80)
      .attr("y1", messageY)
      .attr("x2", messageX)
      .attr("y2", messageY)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Lower opacity for initial state
      .transition()
      .duration(2000)
      .attr("opacity", 1)
      .attr("marker-end", "url(#arrowhead)");

    // Draw a line connecting the top and lowest salary at UBC to form the bracket
    svg
      .append("line")
      .attr("class", "highlight-label")
      .attr("x1", xScale("University of British Columbia (UBC)") + 40) // Create the horizontal line for the bracket
      .attr("y1", yScale(topUBC))
      .attr("x2", xScale("University of British Columbia (UBC)") + 80)
      .attr("y2", yScale(topUBC))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Lower opacity for initial state
      .transition()
      .duration(2000)
      .attr("opacity", 1);

    svg
      .append("line")
      .attr("class", "highlight-label")
      .attr("x1", xScale("University of British Columbia (UBC)") + 40) // Create the horizontal line for the bracket
      .attr("y1", yScale(lowestUBC))
      .attr("x2", xScale("University of British Columbia (UBC)") + 80)
      .attr("y2", yScale(lowestUBC))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0) // Lower opacity for initial state
      .transition()
      .duration(2000)
      .attr("opacity", 1);

    // Add lower opacity arrows for the difference calculations
    const institutions = [
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
    institutions.forEach((institution) => {
      const institutionSalaries = filteredDataSalaries.filter(
        (d) => d.Agency === institution
      );
      const topInstitutionSalary = d3.max(institutionSalaries, (d) => d.salary);

      // Calculate the difference between the top salary of the institution and UBC's lowest salary above 500k
      const salaryDifference = topInstitutionSalary - lowestUBC;

      // Add arrows showing the difference
      svg
        .append("line")
        .attr("class", "highlight-label")
        .attr("x2", xScale(institution) + xScale.bandwidth() / 2)
        .attr("y2", yScale(topInstitutionSalary) - 10)
        .attr("x1", xScale(institution) + xScale.bandwidth() / 2)
        .attr("y1", yScale(lowestUBC))
        .attr("opacity", 0) // Lower opacity for initial state
        .transition()
        .duration(2000)
        .attr("opacity", 1)
        .attr("stroke", "#425856")
        .attr("stroke-width", 1)
        .attr("marker-end", "url(#arrowhead)");

      svg
        .append("line")
        .attr("class", "highlight-label")
        .attr("x2", xScale("University of British Columbia (UBC)") + 80)
        .attr("y2", yScale(lowestUBC))
        .attr("x1", xScale(institution) + xScale.bandwidth() / 2)
        .attr("y1", yScale(lowestUBC))
        .attr("opacity", 0) // Lower opacity for initial state
        .transition()
        .duration(2000)
        .attr("opacity", 1)
        .attr("stroke", "#425856")
        .attr("stroke-width", 1);

      // Add labels showing the difference
      svg
        .append("text")
        .attr("class", "highlight-label")
        .attr("x", xScale(institution) + xScale.bandwidth() / 2 + 10)
        .attr("y", yScale((topInstitutionSalary + lowestUBC) / 2))
        .attr("opacity", 0) // Lower opacity for initial state
        .transition()
        .duration(2000)
        .attr("opacity", 1)
        .text(`${salaryDifference}`)
        .style("font-size", "12px")
        .style("fill", "#425856");
    });

    // hide
    d3.select("#vis3ContainerSupplementary").classed("hidden", true);

    // Text
    document.getElementById("vis3main").innerHTML =
      "We can see the rest of the chart now. Notice how UBC's top salaries TOWER over the rest.";
  }

  const customColors = [
    "#519FAB",
    "#58B7C6",
    "#79D0B4",
    "#8DE8CA",
    "#ACFAD8",
    "#E1F8EE",
    "#519FAB",
    "#58B7C6",
    "#79D0B4",
    "#8DE8CA",
  ];

  // Create a color scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(d3.range(1, 11)) // Match ranks 1 to 10
    .range(customColors);

  function filterToTop10FromEachUniversity() {
    clearElements([
      "scatter-point",
      "highlight-point",
      "tooltip",
      "median-line",
      "median-line-updated",
      "highlight-label",
      "arrow-shaft",
    ]);

    const top10PerUniversity = universities.flatMap((uni) => {
      return filteredDataSalaries
        .filter((d) => d.Agency === uni)
        .sort((a, b) => b.salary - a.salary)
        .slice(0, 10)
        .map((d, i) => ({
          ...d,
          rank: i + 1, // Add rank for stacking
          name: d.Name, // Include Name
          position: d.Position, // Include Position
        }));
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
      .attr("fill", "#519FAB");

    addHoverEffects(points);

    const capLength = 10; // Length of horizontal lines

    d3.group(top10PerUniversity, (d) => d.Agency).forEach((data, agency) => {
      const xPosition = xScale(agency) + xScale.bandwidth() / 2 - 15;
      const [maxSalary, minSalary] = d3.extent(data, (d) => d.salary);
      const salaryRange = maxSalary - minSalary; // Calculate salary range
    
      // --- Add Vertical Lines and Caps ---
      [["vertical-line", xPosition, xPosition, maxSalary, minSalary], // Vertical line
       ["horizontal-cap", xPosition - capLength / 2, xPosition + capLength / 2, maxSalary, maxSalary], // Top cap
       ["horizontal-cap", xPosition - capLength / 2, xPosition + capLength / 2, minSalary, minSalary]  // Bottom cap
      ].forEach(([cls, x1, x2, y1, y2]) => {
        svg.append("line")
          .attr("class", cls)
          .attr("x1", x1).attr("x2", x2)
          .attr("y1", yScale(y1)).attr("y2", yScale(y2))
          .attr("stroke", "#3F5554").attr("stroke-width", 2);
      });
    
      // Salary range text
      svg.append("text")
      .attr("class", "salary-range-text") // Added class for reference
      .attr("x", xPosition) // Center the text above the cap
      .attr("y", yScale(maxSalary) / 0.93) // Place slightly above the top cap
      .attr("fill", "#3F5554")
      .attr("font-size", "12px")
      .attr("text-anchor", "middle") // Center-align the text horizontally
      .text(`$${d3.format(",.0f")(salaryRange)}`) // Display formatted salary range
      .on("mouseover", function (event) {
        d3.select("#tooltip")
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .html(`Salary range for ${agency}`);
      })
      .on("mouseout", () => {
        d3.select("#tooltip").style("opacity", 0);
      });
    });
    
    // --- Add Tooltip Div to Body ---
    const tooltip = d3.select("body").append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "6px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("opacity", 0)
      .style("pointer-events", "none"); // Tooltip does not block interactions

    // --- Add Annotation Group ---
    const annotationGroup = svg.append("g").attr("class", "annotation-group");

    // UBC annotation
    const ubcData = top10PerUniversity.filter(
      (d) => d.Agency === "University of British Columbia (UBC)"
    );
    const ubcTopSalary = d3.max(ubcData, (d) => d.salary);
    const ubcBottomSalary = d3.min(ubcData, (d) => d.salary);
    const ubcX = xScale("University of British Columbia (UBC)") + xScale.bandwidth() / 2;

    // Draw vertical bracket line with animation
    annotationGroup
      .append("line")
      .attr("x1", ubcX + 30)
      .attr("x2", ubcX + 30)
      .attr("y1", yScale(ubcTopSalary)) // Start at top salary
      .attr("y2", yScale(ubcTopSalary)) // Start at same position
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .attr("y2", yScale(ubcBottomSalary)); // Animate to bottom salary

    // Horizontal bracket lines animation
    const bracketLength = 20;

    // Top bracket
    annotationGroup
      .append("line")
      .attr("x1", ubcX + 10)
      .attr("x2", ubcX + 10)
      .attr("y1", yScale(ubcTopSalary))
      .attr("y2", yScale(ubcTopSalary))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .attr("x2", ubcX + 10 + bracketLength);

    // Bottom bracket
    annotationGroup
      .append("line")
      .attr("x1", ubcX + 10)
      .attr("x2", ubcX + 10)
      .attr("y1", yScale(ubcBottomSalary))
      .attr("y2", yScale(ubcBottomSalary))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .transition()
      .duration(1000)
      .attr("x2", ubcX + 10 + bracketLength);

    // Arrow line pointing to text
    annotationGroup
      .append("line")
      .attr("x1", ubcX + 10 + bracketLength)
      .attr("x2", ubcX + 10 + bracketLength)
      .attr("y1", yScale((ubcTopSalary + ubcBottomSalary) / 2))
      .attr("y2", yScale((ubcTopSalary + ubcBottomSalary) / 2))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)")
      .transition()
      .duration(1000)
      .attr("x2", ubcX + 10 + bracketLength + 40);

    // Add annotation text with fade-in animation
    const annotationText = [
      "UBC has the largest range in which their staff are paid.",
      "When compared to other schools, the difference",
      "in how much the top ten employees make is obvious."
    ];

    const lineHeight = 16; // Line spacing
    const annotationX = 220, annotationY = 150; // Positioning

    annotationText.forEach((line, index) => {
      svg.append("text")
        .attr("class", "annotation-text")
        .attr("x", annotationX)
        .attr("y", annotationY + index * lineHeight)
        .style("fill", "white")
        .style("font-size", "14px")
        .style("font-weight", "normal")
        .style("text-anchor", "start")
        .style("opacity", 0) // Start with opacity 0
        .transition()
        .delay(1000) // Delay to align with bracket animation
        .duration(1000)
        .style("opacity", 1) // Fade-in effect
        .text(line);
    });
  

    // Define arrowhead marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "white");

      

    // Create a stacked bar chart in the #vis3ContainerSupplementary
    const container = d3.select("#vis3ContainerSupplementary");
    container.selectAll("*").remove(); // Clear any previous content

    let lastHoveredUniversity = "Simon Fraser University (SFU)"; // Default to SFU

    function updateStackedBarChart(entry) {
      const filteredUniversities = [
        "University of British Columbia (UBC)",
        lastHoveredUniversity,
      ];
      const filteredData = top10PerUniversity.filter((d) =>
        filteredUniversities.includes(d.Agency)
      );

      // Margins
      const margin = { top: 40, right: 30, bottom: 80, left: 70 };
      const supplementaryWidth = container.node().getBoundingClientRect().width;
      const supplementaryHeight = container
        .node()
        .getBoundingClientRect().height;

      const width = supplementaryWidth - margin.left - margin.right;
      const height = supplementaryHeight - margin.top - margin.bottom;

      container.selectAll("*").remove(); // Clear previous content

      const svgSupplementary = container
        .append("svg")
        .attr("width", supplementaryWidth)
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Scales
      const xScaleSupplementary = d3
        .scaleBand()
        .domain(filteredUniversities)
        .range([0, width])
        .padding(0.5);

      const yScaleSupplementary = d3
        .scaleLinear()
        .domain([0, 6000000])
        .range([height, 0]);

      const groupedData = d3.group(filteredData, (d) => d.Agency);

      const stack = d3.stack().keys(d3.range(1, 11));
      const stackedData = stack(
        Array.from(groupedData, ([key, values]) => ({
          Agency: key,
          ...Object.fromEntries(values.map((d) => [d.rank, d.salary])),
        }))
      );

      // Bars
      svgSupplementary
        .selectAll(".bar-group")
        .data(stackedData)
        .join("g")
        .attr("class", "bar-group")
        .attr("fill", (d, i) => colorScale(i + 1))
        .selectAll("rect")
        .data((d) => d)
        .join("rect")
        .attr("x", (d) => xScaleSupplementary(d.data.Agency))
        .attr("y", (d) => yScaleSupplementary(d[1]))
        .attr(
          "height",
          (d) => yScaleSupplementary(d[0]) - yScaleSupplementary(d[1])
        )
        .attr("width", xScaleSupplementary.bandwidth())
        .attr(
          "class",
          (d, i) => `bar-${d.data.Agency.replace(/\s+/g, "-")}-${i + 1}`
        )
        .attr("opacity", 0.8)
        .on("mouseover", function (event, d) {
          // Salary sum for the current stacked segment
          const salarySum = d[1] - d[0];

          // Extract the matching data entry
          const agencyData = groupedData.get(d.data.Agency);
          const matchingEntry = agencyData.find(
            (entry) => entry.salary === salarySum
          );

          // Tooltip content
          const name = matchingEntry ? matchingEntry.Name : "Unavailable";
          const position = matchingEntry
            ? matchingEntry.Position
            : "Unavailable";

          // Highlight the hovered bar by changing its color and opacity
          d3.select(this)
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("stroke-width", 2);

          // Update tooltip content and position
          d3.select("#tooltip")
            .style("opacity", 1)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .html(
              `Name: ${name}<br>Salary: $${d3.format(",.2f")(
                salarySum
              )}<br>Position: ${position != null ? position : "Unavailable"}`
            );
        })
        .on("mouseout", function () {
          // Reset the appearance of the bar when mouse leaves
          d3.select(this)
            .attr("opacity", 0.8)
            .attr("stroke", null)
            .attr("stroke-width", null);

          d3.select("#tooltip").style("opacity", 0); // Hide tooltip
        });

      // Axes
      svgSupplementary
        .append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScaleSupplementary).tickFormat((d) => universityAcronyms[d] || d));

      svgSupplementary.append("g").call(d3.axisLeft(yScaleSupplementary));
    }

    // Hover effect for scatter points
    points
      .on("mouseover", function (event, d) {
        if (d.Agency != "University of British Columbia (UBC)")
          lastHoveredUniversity = d.Agency;
        updateStackedBarChart(d);

        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke", "black")
          .attr("stroke-width", 2);

        d3.select("#tooltip")
          .style("opacity", 1)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`)
          .html(
            `Name: ${d.Name || "Unavailable"}<br>Salary: $${d3.format(",.2f")(
              d.salary
            )}<br>Position: ${d.Position || "Unavailable"}`
          );
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.3).attr("stroke", null);
        d3.select("#tooltip").style("opacity", 0);
      });

    // Initial render
    updateStackedBarChart("Simon Fraser University (SFU)");

    // show
    d3.select("#vis3ContainerSupplementary").classed("hidden", false);

    // Update main text
    document.getElementById("vis3main").innerHTML =
      "Filtering this data for the top 10 highest-paid faculty members shows us something interesting...";
  }

  function clear() {
    clearElements([
      "scatter-point",
      "highlight-point",
      "median-line",
      "tooltip",
      "highlight-label",
      "arrow-shaft",
    ]);
  }

  // Attach functions to global scope
  window.salaryVis3 = drawAverageSalaryLines;
  window.highlightEntryVis3 = highlightEntryClosestToUBCAverage;
  window.allEntriesVis3 = drawAllEntriesWithTooltips;
  window.adjustYScaleVis3 = adjustYScaleForTopUBCSalary;
  window.filterVis3 = filterToTop10FromEachUniversity;
  window.clearVis3 = clear;

  // Draw initial chart
  drawAverageSalaryLines();
})();
