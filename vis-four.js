(async function runApp() {
  const config = {
    width: 900,
    height: 500,
    margin: { top: 20, right: 30, bottom: 20, left: 50 },
    dataPathUniversities: "datasets/bc_universities_2022_23_tuition.csv",
    dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
    svgSelector: "#vis4Container",
  };

  // const { width, height, margin } = config;
  const { margin } = config;

  const mainContainer = d3.select(config.svgSelector);

  let width = mainContainer.node().getBoundingClientRect().width;
  let height = mainContainer.node().getBoundingClientRect().height;

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
      name: d["Name"],
      university: d.Agency,
      salary: parseFloat(d["Remuneration"]) || 0,
    }));

  // Calculate university averages and top salaries
  const universityStats = universities.map((uni) => {
    const salaries = filteredDataSalaries
      .filter((d) => d.university === uni)
      .map((d) => d.salary);

    return {
      university: uni,
      avgSalary: d3.mean(salaries),
      topSalary: d3.max(salaries),
    };
  });

  const topPersonsByInstitution = {};

  universities.forEach((institution) => {
    const institutionSalaries = filteredDataSalaries.filter(
      (d) => d.university === institution
    );

    // Find the highest-paid individual for this institution
    const topPerson = d3.max(institutionSalaries, (d) => d.salary);

    // Store the top person's name
    const topPersonData = institutionSalaries.find(
      (d) => d.salary === topPerson
    );
    if (topPersonData) {
      topPersonsByInstitution[institution] = topPersonData.name; // Save top person's name
    }
  });

  // Extract UBC's top salary for reference
  const ubcTopSalary = universityStats.find(
    (stat) => stat.university === "University of British Columbia (UBC)"
  ).topSalary;

  const svg = d3
    .select(config.svgSelector)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xScale = d3
    .scaleBand()
    .domain(universities)
    .range([margin.left, width - margin.right])
    .padding(0.5);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredDataSalaries, (d) => d.salary)])
    .range([height - margin.bottom, margin.top]);

  // Axes
  svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d3.format("$,.0f")).ticks(6))
    .selectAll("text")
    .style("fill", "#fff");

  // svg
  //   .append("g")
  //   .attr("class", "x-axis")
  //   .attr("transform", `translate(0, ${height - margin.bottom})`)
  //   .call(d3.axisBottom(xScale))
  //   .selectAll("text")
  //   .attr("text-anchor", "end")
  //   .attr("transform", "rotate(-15)")
  //   .style("fill", "#fff");

  svg.selectAll(".domain, .tick line").style("stroke", "#555");

  // Draw dots
  const dots = svg
    .selectAll(".dot")
    .data(filteredDataSalaries)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", (d) => xScale(d.university) + xScale.bandwidth() / 2)
    .attr("cy", (d) => yScale(d.salary))
    .attr("r", 5)
    .attr("fill", "#58B7C6")
    .attr("opacity", 0.4);

  // Draw median lines
  svg
    .selectAll(".median-line")
    .data(universityStats)
    .join("line")
    .attr("class", "median-line")
    .attr("x1", (d) => xScale(d.university))
    .attr("x2", (d) => xScale(d.university) + xScale.bandwidth())
    .attr("y1", (d) => yScale(d.avgSalary))
    .attr("y2", (d) => yScale(d.avgSalary))
    .attr("stroke", "#A5F3FC")
    .attr("stroke-width", 2)
    .attr("opacity", 0.5); // Adjust transparency of median lines

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background-color", "#1c2834")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.3)")
    .style("visibility", "hidden")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", "14px");

  // CODE TO CHANGE ALL TO ACRONYMS (need to comment out current x-axis first)

  // Mapping object for university acronyms
  const universityAcronyms = {
    "University of British Columbia (UBC)": "UBC",
    "Simon Fraser University (SFU)": "SFU",
    BCIT: "BCIT",
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

  // Modify the axis labels
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat((d) => universityAcronyms[d] || d))
    .selectAll("text")
    .attr("text-anchor", "middle")
    .style("fill", "#fff");

  const xAxisTooltip = d3
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
  svg
    .selectAll(".x-axis text")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      xAxisTooltip
        .style("opacity", 1)
        .html(d) // Show the full university name
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mousemove", (event) => {
      xAxisTooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => {
      xAxisTooltip.style("opacity", 0);
    });

  // Handle hover behavior
  dots
    .on("mouseover", function (event, d) {
      const selectedDot = d3.select(this);

      // Change appearance of the hovered point
      selectedDot
        .attr("fill", "#519FAB")
        .attr("stroke", "black")
        .attr("stroke-width", 2);

      // Find stats for the individual's university
      const uniStats = universityStats.find(
        (stat) => stat.university === d.university
      );

      // Calculate comparison ratios
      const comparedToAvg = (d.salary / uniStats.avgSalary).toFixed(2);
      const comparedToTop = (d.salary / uniStats.topSalary).toFixed(2);
      const comparedToUBCTop = (d.salary / ubcTopSalary).toFixed(2);

      // Update tooltip content
      tooltip
        .html(
          `<strong>${d.name}</strong><br>
           Salary: ${d3.format("$,.0f")(d.salary)}<br><br>
           Compared to: <br>
           Institution Average: ${comparedToAvg}x<br>
           Institution Top Salaries: ${comparedToTop}x<br>
           UBC Top Salaries: ${comparedToUBCTop}x`
        )
        .style("visibility", "visible")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", function () {
      const selectedDot = d3.select(this);
      
      selectedDot.attr("fill", "#58B7C6").attr("stroke", "none");

      tooltip.style("visibility", "hidden");
    });

  // Search functionality for the pre-existing HTML input
  const htmlSearchBar = d3.select("#vis4faculty");
  const inputContainer = d3.select("#inputContainer");
  inputContainer.attr("style", `height: ${height}px`)
  const searchEntries = d3.select("#searchEntries"); // Container for the filtered results

htmlSearchBar.on("input", (event) => {
  const query = event.target.value.toLowerCase();

  if (query === "") {
    // Clear entries when input is empty
    searchEntries.html("");
    resetVisualization();
    return;
  }

  if (query.length < 3) return; // i dont want to get so many entries

  // Filter dataset based on the search query
  const matchedEntries = filteredDataSalaries.filter((d) =>
    d.name.toLowerCase().includes(query)
  );

  // Populate searchEntries div with filtered results
  searchEntries.html(""); // Clear previous results
  matchedEntries.forEach((entry) => {
    // Append a new entry div
    const entryDiv = searchEntries.append("div").attr("class", "entry");

    const entryInfo = entryDiv
      .append("div")
      .attr("class", "entry-info")
      .style("cursor", "pointer"); // Make clickable

    entryInfo
      .append("div")
      .attr("class", "name")
      .text(entry.name);

    entryInfo
      .append("div")
      .attr("class", "institution")
      .text(entry.university);

    entryDiv.append("div").attr("class", "symbol").text("→");

    // Add click behavior
    entryInfo.on("click", () => {
      setQueriedPerson(entry); // Highlight queried person and update visualization
    });
  });
});

// Function to set the queried person and update the visualization
function setQueriedPerson(entry) {
  const topInstitutionEarner = topPersonsByInstitution[entry.university];

  // Update visibility of dots
  dots.attr("visibility", (d) => {
    if (d.name === entry.name || d.name === "Jia, Dawn") return "visible";
    if (topInstitutionEarner && d.name === topInstitutionEarner) return "visible";
    return "hidden";
  });

  // Update colors
  dots.attr("fill", (d) => {
    if (d.name === "Jia, Dawn") return "#B9CDC7"; // colour for dawn jia
    if (d.name === entry.name) return "#468692";
    if (d.name === topInstitutionEarner) return "#66AD99"; // colour for top earner
    return "#58B7C6";
  });

  // Update colors
  dots.attr("opacity", 1);

  // Update the search bar with the selected name
  htmlSearchBar.property("value", entry.name);
}

// Function to reset visualization
function resetVisualization() {
  dots
    .attr("visibility", "visible")
    .attr("fill", (d) => (d.name === "Jia, Dawn" ? "#B9CDC7" : "#58B7C6"));
    dots.attr("opacity", 0.4);
}

})();
