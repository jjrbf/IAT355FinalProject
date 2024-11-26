// Set up the dimensions of the chart
const margin = { top: 50, right: 40, bottom: 150, left: 70 };
const width = 1000 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

// Create the SVG container for the chart
const svg = d3.select("#vis3").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load and process the data
d3.csv("datasets/bc_universities_2022_23_tuition.csv").then(data => {
  data.forEach(d => {
    d.tuition = +d.tuition; // Convert tuition to a number
  });

  // // Sort the data by tuition in ascending order
  // data.sort((a, b) => d3.ascending(a.tuition, b.tuition));

  // Set the x and y scales
  const x = d3.scaleBand()
    .range([0, width]) // Bars spread horizontally
    .padding(0.1) // Padding between bars
    .domain(data.map(d => d.Institutions)); // Map institutions to x positions

  const y = d3.scaleLinear()
    .range([height, 0]) // Vertical scale for tuition
    .domain([0, d3.max(data, d => d.tuition)]); // From 0 to the max tuition

  // Create the x and y axes
  const xAxis = d3.axisBottom(x)
    .tickSize(0); // Remove tick lines

  const yAxis = d3.axisLeft(y)
    .ticks(10)
    .tickSize(-width) // Add grid lines
    .tickPadding(10);

  // Create the bars for the chart
  svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.Institutions)) // Horizontal position
    .attr("y", d => y(d.tuition)) // Vertical position (starts at the top)
    .attr("width", x.bandwidth()) // Width of each bar
    .attr("height", d => height - y(d.tuition)) // Height of the bar
    .attr("fill", "#96a5b9");

  // Add the x-axis to the chart
  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`) // Position at the bottom
    .call(xAxis)
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-45)") // Rotate labels for readability
    .style("font-size", "10px");

  // Add the y-axis to the chart
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .selectAll("path")
    .style("stroke-width", "1.75px");
});