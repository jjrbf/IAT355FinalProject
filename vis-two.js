(async function runApp() {
  const config = {
    width: 600,
    height: 400,
    margin: { top: 20, right: 0, bottom: 20, left: 0 },
    dataPathExpenses: "datasets/UBCvsSFU_Expenses_2024.csv",
    svgSelector: "#vis2-1Container",
    svgSelector2: "#vis2-2Container",
  };

  const { margin } = config;
  let height = config.height;
  let width = config.width;

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
        { label: "Salaries and Benefits", value: uniData.SalariesAndBenefits, color: "#519FAB" },
        { label: "Supplies and Sundries", value: uniData.Supplies, color: "#58B7C6" },
        { label: "Scholarships, Fellowships, and Bursaries", value: uniData.ScholarshipsAndBursaries, color: "#79D0B4" },
        { label: "Cost of Goods Sold, Utilities, and Other", value: uniData.CostOfGoodsAndUtilities, color: "#8DE8CA" },
        { label: "Professional and Consulting", value: uniData.ProfessionalFees, color: "#ACFAD8" },
        { label: "Travel and Interest Cost", value: uniData.TravelAndInterest, color: "#E1F8EE" },
      ];

      const totalValue = d3.sum(expenseCategories, (d) => d.value);
      if (totalValue === 0) {
        console.error(`No data for ${uni.name}.`);
        return;
      }

      const radius = Math.min(width, height) / 2 - margin.top;

      const pie = d3.pie().value((d) => d.value).sort(null);
      const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);
      const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 1.1);

      const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

      const arcs = g
        .selectAll(".arc")
        .data(pie(expenseCategories))
        .enter()
        .append("g")
        .attr("class", "arc");

      const defaultCategory = expenseCategories[0]; // Highlight `Salaries and Benefits` by default

      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => d.data.color)
        .on("mouseover", function (event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("d", d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 1.1));

          tooltip
            .style("opacity", 1)
            .html(
              `<strong>${d.data.label}</strong><br>Value: $${d3.format(",.0f")(d.data.value)}`
            )
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arc);

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
    });
  }

  function firstStep() {
    height = 400;
    width = 600;
    // hide
    d3.select(config.svgSelector2).classed("hidden", true);
    d3.select("#vis2-2subtitle").classed("hidden", true);
    d3.select("#second-step").classed("hidden", true);

    // show
    d3.select("#vis2title").classed("hidden", false);
    d3.select("#first-step").classed("hidden", false);

    // toggle
    d3.select(".vis2-container").classed("reverse", false);

    drawCharts();
  }

  function secondStep() {
    height = 225;
    width = 400;
    // hide
    d3.select("#vis2title").classed("hidden", true);
    d3.select("#first-step").classed("hidden", true);

    // show
    d3.select(config.svgSelector2).classed("hidden", false);
    d3.select("#vis2-2subtitle").classed("hidden", false);
    d3.select("#second-step").classed("hidden", false);

    // toggle
    d3.select(".vis2-container").classed("reverse", true);
    
    drawCharts();
  }

  drawCharts();

  window.firstStep = firstStep;
  window.secondStep = secondStep;
})();
