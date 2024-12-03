(async function runApp() {
    const config = {
      width: 900,
      height: 400,
      margin: { top: 40, right: 50, bottom: 70, left: 100 },
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
        .attr("height", height)
        .style("border", "1px solid black");
  
      // Filter UBC data
      const ubcData = datasetExpenses.find((d) => d.University === "UBC");
      if (!ubcData) {
        console.error("UBC data not found in the dataset.");
        return;
      }
  
      // Prepare data for pie chart
      const expenseCategories = [
        "SalariesAndBenefits",
        "Supplies",
        "ScholarshipsAndBursaries",
        "CostOfGoodsAndUtilities",
        "ProfessionalFees",
        "TravelAndInterest",
      ];
  
      const pieData = expenseCategories.map((category) => ({
        category,
        value: ubcData[category],
      }));
  
      const radius = Math.min(width, height) / 2 - margin.top;
  
      // Create a pie generator
      const pie = d3
        .pie()
        .value((d) => d.value)
        .sort(null);
  
      const arc = d3
        .arc()
        .innerRadius(0)
        .outerRadius(radius);
  
      const colorScale = d3
        .scaleOrdinal()
        .domain(expenseCategories)
        .range(d3.schemeCategory10);
  
      // Center the pie chart
      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${width / 2}, ${height / 2})`
        );
  
      // Draw pie chart
      const arcs = g
        .selectAll("arc")
        .data(pie(pieData))
        .enter()
        .append("g")
        .attr("class", "arc");
  
      arcs
        .append("path")
        .attr("d", arc)
        .attr("fill", (d) => colorScale(d.data.category));
  
      // Add labels
      arcs
        .append("text")
        .attr("transform", (d) => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text((d) => d.data.category)
        .style("font-size", "12px")
        .style("fill", "white");
  
      // Add a title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .text("UBC Expense Distribution")
        .style("font-size", "16px")
        .style("font-weight", "bold");
    }
  
    drawExpensesChart();
  
    window.expensesVis = drawExpensesChart;
  })();