(async function runApp() {
    const config = {
      width: 900,
      height: 400,
      margin: { top: 40, right: 50, bottom: 70, left: 100 },
      dataPathUniversities: "datasets/bc_universities_2022_23_tuition.csv",
      dataPathSalaries: "datasets/public_sector_salary-fy20_21-universities.csv",
      svgSelector: "#vis2Container",
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
      "Kwantlen Polytechnic University",
      "Vancouver Community College (VCC)",
      "Langara College",
      "Douglas College",
      "Justice Institute of B.C.",
      "University of the Fraser Valley",
      // "Camosun College",
      // "Capilano University",
      // "Coast Mountain College",
      // "College of New Caledonia",
      // "College of the Rockies",
      // "North Island College",
      // "Royal Roads University",
      // "Selkirk College",
      // "Thompson Rivers University",
      // "University of Northern B.C.",
      // "University of the Fraser Valley",
      // "University of Victoria",
      // "Vancouver Island University",
    ];
  
    const filteredDataUniversities = datasetUniversities
      .filter((d) => universities.includes(d.Institutions))
      .map((d) => ({
        ...d,
        tuitionPerStudent: parseFloat(d["tuitionPerStudent"]) || 0,
      }));
  
    const filteredDataSalaries = datasetSalaries
      .filter((d) => universities.includes(d.Agency))
      .map((d) => ({
        ...d,
        salary: parseFloat(d["Remuneration"]) || 0,
      }));
  
    const avgSalaries = universities.map((uni) => {
      const uniSalaries = filteredDataSalaries
        .filter((d) => d.Agency === uni)
        .map((d) => d.salary);
  
      return {
        Institution: uni,
        avgSalary: d3.mean(uniSalaries) || 0,
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
  
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left}, 0)`);
  
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`);
  
    function transitionBars(data, key, yScale) {
      svg
        .selectAll("rect")
        .data(data)
        .join("rect")
        .transition()
        .duration(750)
        .attr("x", (d) => xScale(d.Institutions || d.Institution))
        .attr("y", (d) => yScale(d[key]))
        .attr("width", xScale.bandwidth())
        .attr("height", (d) => height - margin.bottom - yScale(d[key]))
        .attr("fill", (d) =>
          (d.Institutions || d.Institution) ===
          "University of British Columbia (UBC)"
            ? "steelblue"
            : "grey"
        );
    }
  
    function addHoverEffect(data, key, ubcValue) {
      svg
        .selectAll("rect")
        .on("mouseover", function (event, d) {
          svg.selectAll(".label").style("opacity", 0); // Hide all labels
          d3.select(this).attr("fill", "orange"); // Highlight the hovered bar
  
          const difference = d[key] - ubcValue;
  
          svg
            .append("text")
            .attr("class", "hover-label")
            .attr("x", xScale(d.Institutions || d.Institution) + xScale.bandwidth() / 2)
            .attr("y", yScale(d[key]) - 10)
            .attr("text-anchor", "middle")
            .text(d3.format("+,.2s")(difference))
            .attr("fill", "black")
            .attr("font-size", "12px");
        })
        .on("mouseout", function () {
          svg.selectAll(".label").style("opacity", 1); // Restore all labels
          d3.select(this).attr("fill", (d) =>
            (d.Institutions || d.Institution) ===
            "University of British Columbia (UBC)"
              ? "steelblue"
              : "grey"
          );
          svg.select(".hover-label").remove(); // Remove the hover label
        });
    }
  
    function drawTuitionChart() {
      yScale.domain([
        0,
        d3.max(filteredDataUniversities, (d) => d.tuitionPerStudent),
      ]);
  
      transitionBars(filteredDataUniversities, "tuitionPerStudent", yScale);
  
      svg
        .selectAll(".label")
        .data(filteredDataUniversities)
        .join("text")
        .attr("class", "label")
        .transition()
        .duration(750)
        .attr("x", (d) => xScale(d.Institutions) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d.tuitionPerStudent) - 10)
        .text((d) => d3.format("$.2s")(d.tuitionPerStudent))
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-size", "12px");
  
      svg
        .select(".y-axis")
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));
  
      svg
        .select(".x-axis")
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .text((d) => d.length > 15 ? `${d.slice(0, 15)}...` : d)
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-15)");
  
      const ubcValue = filteredDataUniversities.find(
        (d) => d.Institutions === "University of British Columbia (UBC)"
      ).tuitionPerStudent;
  
      addHoverEffect(filteredDataUniversities, "tuitionPerStudent", ubcValue);
  
      document.getElementById("vis2title").innerHTML =
        "Approx. Income from Student Tuition";
      document.getElementById("vis2subtitle").innerHTML =
        "Across all of BC's post-secondary institutions with publicly available data";
    }
  
    function drawSalaryChart() {
      yScale.domain([0, d3.max(avgSalaries, (d) => d.avgSalary)]);
  
      transitionBars(avgSalaries, "avgSalary", yScale);
  
      svg
        .selectAll(".label")
        .data(avgSalaries)
        .join("text")
        .attr("class", "label")
        .transition()
        .duration(750)
        .attr("x", (d) => xScale(d.Institution) + xScale.bandwidth() / 2)
        .attr("y", (d) => yScale(d.avgSalary) - 10)
        .text((d) => d3.format("$,.2f")(d.avgSalary))
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-size", "12px");
  
      svg
        .select(".y-axis")
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale));
  
      svg
        .select(".x-axis")
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .text((d) => d.length > 15 ? `${d.slice(0, 15)}...` : d)
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-15)");
  
      const ubcValue = avgSalaries.find(
        (d) => d.Institution === "University of British Columbia (UBC)"
      ).avgSalary;
  
      addHoverEffect(avgSalaries, "avgSalary", ubcValue);
  
      document.getElementById("vis2title").innerHTML = "Average Staff Compensation";
      document.getElementById("vis2subtitle").innerHTML =
        "Average of the 2020/2021 salaries of staff whose salary is over $75,000";
    }
  
    drawTuitionChart();
  
    window.tuitionVis2 = drawTuitionChart;
    window.salaryVis2 = drawSalaryChart;
  })();
  