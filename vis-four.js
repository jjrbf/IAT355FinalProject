(async function runApp() {
    const config = {
      width: 900,
      height: 400,
      margin: { top: 40, right: 50, bottom: 70, left: 100 },
      dataPathUniversities: "datasets/bc_universities_2022_23_tuition.csv",
      dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
      svgSelector: "#vis4Container",
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
        name: d["Name"],
        university: d.Agency,
        salary: parseFloat(d["Remuneration"]) || 0,
      }));
  
    const avgSalaries = universities.map((uni) => {
      const uniSalaries = filteredDataSalaries
        .filter((d) => d.university === uni)
        .map((d) => d.salary);
  
      return {
        Institution: uni,
        avgSalary: d3.mean(uniSalaries) || 0,
      };
    });
  
    const topUBCSalaryPerson = filteredDataSalaries
      .filter((d) => d.university === "University of British Columbia (UBC)")
      .reduce((prev, current) =>
        prev.salary > current.salary ? prev : current
      );
  
    const topSalaries = universities.map((uni) => {
      return filteredDataSalaries
        .filter((d) => d.university === uni)
        .reduce((prev, current) => (prev.salary > current.salary ? prev : current));
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
  
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat(d3.format("$,.0f")));
  
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-15)");
  
    function drawBaseChart() {
      // Plot all dots
      svg
        .selectAll(".dot")
        .data(filteredDataSalaries)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.university) + xScale.bandwidth() / 2)
        .attr("cy", (d) => yScale(d.salary))
        .attr("r", 5)
        .attr("fill", "steelblue");
  
      // Plot top salary dots
      svg
        .selectAll(".top-dot")
        .data(topSalaries)
        .join("circle")
        .attr("class", "top-dot")
        .attr("cx", (d) => xScale(d.university) + xScale.bandwidth() / 2)
        .attr("cy", (d) => yScale(d.salary))
        .attr("r", 7)
        .attr("fill", "orange")
        .attr("stroke", "black");
  
      // Plot average salary line
      svg
        .selectAll(".avg-line")
        .data(avgSalaries)
        .join("line")
        .attr("class", "avg-line")
        .attr("x1", (d) => xScale(d.Institution))
        .attr("x2", (d) => xScale(d.Institution) + xScale.bandwidth())
        .attr("y1", (d) => yScale(d.avgSalary))
        .attr("y2", (d) => yScale(d.avgSalary))
        .attr("stroke", "red")
        .attr("stroke-width", 2);
    }
  
    function addHoverEffect() {
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px");
  
      const showTooltip = (event, d) => {
        const universityData = avgSalaries.find((u) => u.Institution === d.university);
        const topUniversitySalary = topSalaries.find((t) => t.university === d.university);
  
        const avgFactor = universityData
          ? (d.salary / universityData.avgSalary).toFixed(2)
          : "N/A";
        const topFactor = topUniversitySalary
          ? (d.salary / topUniversitySalary.salary).toFixed(2)
          : "N/A";
        const ubcFactor = topUBCSalaryPerson
          ? (d.salary / topUBCSalaryPerson.salary).toFixed(2)
          : "N/A";
  
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br>
            <strong>Salary:</strong> ${d3.format("$,.0f")(d.salary)}<br>
            <strong>Compared to:</strong><br>
            - Univ. Avg: ${avgFactor}x<br>
            - Univ. Top: ${topFactor}x<br>
            - UBC Top: ${ubcFactor}x`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      };
  
      const hideTooltip = () => tooltip.style("opacity", 0);
  
      svg.selectAll(".dot").on("mouseover", showTooltip).on("mouseout", hideTooltip);
  
      svg.selectAll(".top-dot")
        .on("mouseover", (event, d) => showTooltip(event, d))
        .on("mouseout", hideTooltip);
    }
  
    function handleSearch() {
        const searchInput = document.getElementById("vis4faculty");
      
        searchInput.addEventListener("input", (event) => {
          const searchText = event.target.value.toLowerCase();
      
          // Reset styles for all elements first
          svg.selectAll(".dot").attr("r", 5).attr("fill", "steelblue");
          svg.selectAll(".top-dot").attr("fill", "orange");
          svg.selectAll(".avg-line").attr("fill", "red");
      
          if (searchText === "") {
            return; // Exit if search text is cleared
          }
      
          const matchedPerson = filteredDataSalaries.find((d) =>
            d.name.toLowerCase().includes(searchText)
          );
      
          if (!matchedPerson) {
            return; // Exit if no match is found
          }
      
          // Gray out everything else
          svg.selectAll(".dot, .top-dot, .avg-line").attr("fill", "grey");
      
          // Highlight the matched person
          svg
            .selectAll(".dot")
            .filter((d) => d.name === matchedPerson.name)
            .attr("fill", "green")
            .attr("r", 8)
            .raise(); // Bring to the front
      
          // Highlight the matched person's university's top salary
          const matchedUniversityTop = topSalaries.find(
            (t) => t.university === matchedPerson.university
          );
          svg
            .selectAll(".top-dot")
            .filter((d) => d.name === matchedUniversityTop.name)
            .attr("fill", "orange")
            .raise();
      
          // Highlight the matched person's university average
          svg
            .selectAll(".avg-line")
            .filter((d) => d.Institution === matchedPerson.university)
            .attr("fill", "red");
      
          // Highlight UBC top salary
          svg
            .selectAll(".top-dot")
            .filter((d) => d.name === topUBCSalaryPerson.name)
            .attr("fill", "orange")
            .raise();
        });
      }
      
  
    drawBaseChart();
    addHoverEffect();
    handleSearch();
  })();
  