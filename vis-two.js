(async function runApp() {
  const config = {
    width: 600,
    height: 400,
    margin: { top: 30, right: 0, bottom: 30, left: 0 },
    dataPathExpenses: "datasets/UBCvsSFU_Expenses_2024.csv",
    svgSelector: "#vis2-1Container",
    svgSelector2: "#vis2-2Container",
  };

  const { margin } = config;

  const mainContainer = d3.select(config.svgSelector);

  let width = mainContainer.node().getBoundingClientRect().width;
  let height = mainContainer.node().getBoundingClientRect().height;
  let ogHeight = height;
  let ogWidth = width;

  // Load and preprocess data
  const datasetExpenses = await d3.csv(config.dataPathExpenses, d3.autoType);

  function drawCharts() {
    const universities = [
      { name: "UBC", selector: config.svgSelector },
      { name: "SFU", selector: config.svgSelector2 },
    ];

    universities.forEach((uni) => {
      const container = d3.select(uni.selector);
      container.selectAll("svg").remove();

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      const uniData = datasetExpenses.find((d) => d.University === uni.name);
      if (!uniData) {
        console.error(`${uni.name} data not found in the dataset.`);
        return;
      }

      const expenseCategories = [
        {
          label: "Salaries and Benefits",
          value: uniData.SalariesAndBenefits,
          color: "#519FAB",
        },
        {
          label: "Supplies and Sundries",
          value: uniData.Supplies,
          color: "#58B7C6",
        },
        {
          label: "Scholarships, Fellowships, and Bursaries",
          value: uniData.ScholarshipsAndBursaries,
          color: "#79D0B4",
        },
        {
          label: "Cost of Goods Sold, Utilities, and Other",
          value: uniData.CostOfGoodsAndUtilities,
          color: "#8DE8CA",
        },
        {
          label: "Professional and Consulting",
          value: uniData.ProfessionalFees,
          color: "#ACFAD8",
        },
        {
          label: "Travel and Interest Cost",
          value: uniData.TravelAndInterest,
          color: "#E1F8EE",
        },
      ];

      const totalValue = d3.sum(expenseCategories, (d) => d.value);
      if (totalValue === 0) {
        console.error(`No data for ${uni.name}.`);
        return;
      }

      const radius = Math.min(width, height) / 2 - margin.top;

      const pie = d3
        .pie()
        .value((d) => d.value)
        .sort(null);
      const arc = d3
        .arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius);
      const arcHover = d3
        .arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 1.1);

      const g = svg
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

      const arcs = g
        .selectAll(".arc")
        .data(pie(expenseCategories))
        .enter()
        .append("g")
        .attr("class", "arc");

      arcs
        .append("path")
        .attr("d", arc)
        .attr("d", (d) =>
          d.data.label === "Salaries and Benefits" ? arcHover(d) : arc(d)
        )
        .attr("fill", (d) => d.data.color)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr(
              "d",
              d3
                .arc()
                .innerRadius(radius * 0.6)
                .outerRadius(radius * 1.1)
            );

          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${d.data.label}</strong><br>Value: $${d3.format(",.0f")(
                d.data.value
              )}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          d3.select(this).transition().duration(200).attr("d", arc);

          tooltip.style("opacity", 0);
        });

      const tooltip = d3
        .select("#tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
        .style("opacity", 0)
        .style("pointer-events", "none");

      // Add central label
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "16px")
        .style("fill", "#686E77")
        .text(uni.name);

      // Annotation for "Salaries and Benefits"
      const salariesSegment = expenseCategories.find(
        (d) => d.label === "Salaries and Benefits"
      );

      const salariesArc = pie(expenseCategories).find(
        (d) => d.data.label === "Salaries and Benefits"
      );

      const annotationPos = arc.centroid(salariesArc);

      // Add arrow
      g.append("line")
        .attr("x1", annotationPos[0])
        .attr("y1", annotationPos[1])
        .attr("x2", annotationPos[0] * 1.2)
        .attr("y2", annotationPos[1] * 1.2)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");

      // Add annotation text
      g.append("text")
        .attr("x", annotationPos[0] * 1.5)
        .attr("y", annotationPos[1] * 1.5)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("fill", "white")
        .selectAll("tspan")
        .data([
          `$${d3.format(",.0f")(salariesSegment.value)}`,
          `in ${salariesSegment.label}`,
        ])
        .enter()
        .append("tspan")
        .attr("x", annotationPos[0] * 1.2) // Align each line horizontally
        .attr("dy", (d, i) => i * 15) // Adjust line spacing (15px between lines)
        .text((d) => d);

      // Define arrow marker
      svg
        .append("defs")
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 5)
        .attr("refY", 5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 L 10 5 L 0 10 z")
        .attr("fill", "white");
    });
  }

  function firstStep() {
    mainContainer.node().getBoundingClientRect().height > ogHeight ? height = mainContainer.node().getBoundingClientRect().height : height = ogHeight;
    mainContainer.node().getBoundingClientRect().width > ogWidth ? width = mainContainer.node().getBoundingClientRect().width : width = ogWidth;
    d3.select(config.svgSelector2).classed("hidden", true);
    d3.select("#vis2-2subtitle").classed("hidden", true);
    d3.select("#second-step").classed("hidden", true);
    d3.select("#vis2title").classed("hidden", false);
    d3.select("#first-step").classed("hidden", false);
    d3.select(".vis2-container").classed("reverse", false);

    drawCharts();
  }

  function secondStep() {
    height = ogHeight/1.5;
    width = ogWidth/2;
    // width = mainContainer.node().getBoundingClientRect().width;
    d3.select("#vis2title").classed("hidden", true);
    d3.select("#first-step").classed("hidden", true);
    d3.select(config.svgSelector2).classed("hidden", false);
    d3.select("#vis2-2subtitle").classed("hidden", false);
    d3.select("#second-step").classed("hidden", false);
    d3.select(".vis2-container").classed("reverse", true);

    drawCharts();
  }

  drawCharts();

  window.firstStep = firstStep;
  window.secondStep = secondStep;
})();
