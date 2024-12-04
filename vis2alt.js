(async function runApp() {
  const config = {
    width: 900,
    height: 600,
    margin: { top: 60, right: 50, bottom: 70, left: 100 },
    dataPathExpenses: "datasets/UBCvsSFU_Expenses_2024.csv",
    svgSelector: "#vis2Container",
  };

  const { width, height, margin } = config;

  // Load and preprocess data
  const datasetExpenses = await d3.csv(config.dataPathExpenses, d3.autoType);

  function drawExpensesChart() {
    // Clear existing SVG elements
    const svg = d3
      .select(config.svgSelector)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Filter UBC data
    const ubcData = datasetExpenses.find((d) => d.University === "UBC");
    if (!ubcData) {
      console.error("UBC data not found in the dataset.");
      return;
    }

    // Prepare data for pie chart
    const expenseCategories = [
      { label: "Salaries and Benefits", value: ubcData.SalariesAndBenefits, color: "#519FAB" },
      { label: "Supplies and Sundries", value: ubcData.Supplies, color: "#58B7C6" },
      { label: "Scholarships, Fellowships, and Bursaries", value: ubcData.ScholarshipsAndBursaries, color: "#79D0B4" },
      { label: "Cost of Goods Sold, Utilities, and Other", value: ubcData.CostOfGoodsAndUtilities, color: "#8DE8CA" },
      { label: "Professional and Consulting", value: ubcData.ProfessionalFees, color: "#ACFAD8" },
      { label: "Travel and Interest Cost", value: ubcData.TravelAndInterest, color: "#E1F8EE" },
    ];

    // Calculate total value
    const totalValue = d3.sum(expenseCategories, (d) => d.value);

    const radius = Math.min(width, height) / 2 - margin.top;

    // Create a pie generator
    const pie = d3.pie().value((d) => d.value).sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.6) // Inner radius for the donut chart
      .outerRadius(radius);

    const outerArc = d3
      .arc()
      .innerRadius(radius * 1.2)
      .outerRadius(radius * 1.2); // For positioning labels outside

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Draw pie chart
    const arcs = g
      .selectAll("arc")
      .data(pie(expenseCategories))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 1.1)); // Highlight the slice

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
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc); // Reset slice size

        tooltip.style("opacity", 0);
      });

    // Add labels with percentages outside the slices
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${outerArc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) =>
        (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start"
      )
      .text((d) => `${((d.data.value / totalValue) * 100).toFixed(1)}%`)
      .style("font-size", "12px")
      .style("fill", "#fff");

    // Add central label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .style("fill", "#686E77")
      .text("hover over sections to view details");

    // Tooltip for hover interaction
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("opacity", 0)
      .style("pointer-events", "none");
  }

  drawExpensesChart();

  window.expensesVis = drawExpensesChart;
})();