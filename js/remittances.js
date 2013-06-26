
if ( $(window).width() < 1200){
	var visWidth = 1000;
	var leftPosition = 0;
}
else { 
	//var visWidth = $(window).width() * .65;
	var visWidth = $(window).height()* 1.20;
	var leftPosition = $(window).width()/2-visWidth/2;
}

var r1 = visWidth / 2,
    r0 = r1 - 163;

var chord = d3.layout.chord()
    .padding(.014)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

var arc = d3.svg.arc()
    .innerRadius(r0)
    .outerRadius(r0 + 20);

d3.select("#chart").style("left",leftPosition+"px");

var svg = d3.select("#chart").append("svg")
	.attr("class","chart")
    .attr("width", visWidth)
    .attr("height", visWidth)
  .append("g")
    .attr("transform", "translate(" + r1 + "," + r1 + ")"); 

var continentColors = {'Africa':'#E55722','Americas':'#8CBF42','Asia':'#FFBE0B','Europe':'#305666','Oceania':'#c96fb7'};

var tooltipdiv = d3.select("body")
    .append("div")
    .attr("class", "tooltip");  
    
var showAll = d3.select(".showAll").on('click',showAll);

var indexByName = {},
  nameByIndex = {},
  matrix = [],
  n = 0,
  country_regions =[],
  sortedMatrix =[],
  transposedMatrix =[],
  sortedNameByIndex =[],
  sortedIndexByName =[],
  sortedReceivedTotals =[],
  sortedSentTotals =[],
  newIndex=[],
  colorByIndex =[];

var activeIndex = 'sent';

//progress
var width = 960,
	height = 600,
	twoPi = 2 * Math.PI,
	progress = 0,
	formatPercent = d3.format(".0%");

var progressBack = d3.select("body").append('div').attr('class','progressBack');

//progressBack.append('img').attr('src',"loading.gif");
progressBack.append('text').text('LOADING');

d3.text("country_continents_2012.csv", function(imports){
	country_regions = d3.csv.parse(imports);

	d3.text("remittances_2012.csv", function(imports) {
		var csv_values = d3.csv.parseRows(imports);

	// reading data
		for (var i = 1; i< csv_values.length; i ++){
			matrix[i-1]=[];
			var name = csv_values[i][0];
			nameByIndex[i-1] = name;
			indexByName[name] = i-1;
			for (var j = 1 ; j < csv_values[i].length; j ++){
				if (!csv_values[i][j]) csv_values[i][j] = 0;
				var value = csv_values[i][j].toString().replace(',','');
				matrix[i-1][j-1] = parseFloat(value);
			}
		}
		
	//sorting matrix according to continent name
	
		var k = 0;
		// first find out new index
		for (var j = 0; j< country_regions.length; j++){
			//var found = false;
			for (var i = 0; i< matrix.length; i++){	
				if (country_regions[j].country == nameByIndex[i]){
					newIndex.push(i);
					sortedIndexByName[country_regions[j].country] = k;
					sortedNameByIndex[k] = country_regions[j].country;
					colorByIndex[k] = continentColors[country_regions[j].continent];
					k ++;
					//found = true;			
				};
			};
			//if (!found) console.log ("not found ", country_regions[j].country);
		};
	//creating rearranged matrix
		for (var i = 0; i< matrix.length; i++){	
			sortedMatrix[i] = [];
			sortedSentTotals[i] = 0;
			for (var j = 0; j< matrix[i].length; j++){
				var newI = newIndex[i];
				var newJ = newIndex[j];
				sortedMatrix[i][j] = matrix[newI][newJ];
				sortedSentTotals[i] += matrix[newI][newJ];
			};
		};
	
	//transposing matrix for remittances received and received totals calculation
		for (var i = 0; i< sortedMatrix.length; i++){	
			transposedMatrix[i] = [];
			sortedReceivedTotals[i] = 0;
			for (var j = 0; j< sortedMatrix[i].length; j++){
				transposedMatrix[i][j] = sortedMatrix[j][i];
				sortedReceivedTotals[i] += sortedMatrix[j][i];
			};
			//if (sortedSentTotals[i] === 0 && sortedReceivedTotals[i] === 0) console.log(sortedNameByIndex[i]); //countries with 0 sent and received remittances are manually removed from the csv file
		};	 
		
	//menu items: switch between sent/received
		d3.select("#sent").on("click", function(){
			showAll.style("visibility", "hidden");
			d3.select("#received").classed('active',false);
			d3.select(this).classed('active',true);
			d3.select(".countryInfo").style("visibility","hidden");
			activeIndex = 'sent';
			createVis(sortedMatrix);
	
		});
		d3.select("#received").on("click", function(){
			showAll.style("visibility", "hidden");
			d3.select("#sent").classed('active',false);
			d3.select(this).classed('active',true);
			d3.select(".countryInfo").style("visibility","hidden");
			activeIndex = 'received';
			createVis(transposedMatrix);
		});
		
		createVis(sortedMatrix);		
	});
});
function createVis(matrix) {
	
	progressBack.style('display','none');
	
	chord.matrix(matrix)

	d3.selectAll('g.group').remove();
	d3.selectAll('g.node').remove();
	d3.selectAll("path.link").remove();

	var g = svg.selectAll("g.group")
	  .data(chord.groups)
	 .enter().append("g")
	  .attr("class", "group")
	
	g.append("path") //arc
	  .attr("class","arc")
	  .style("fill", function(d) { return colorByIndex[d.index]; })
	  .style("stroke", function(d) { return colorByIndex[d.index]; })
	  .attr("id", function(d) { return "arc-" + d.index; })
	  .attr("d", arc)

	g.append("svg:g")
	  .attr("class", "node")
	  .attr("id", function(d) { return "node-" + d.index; })
	  .append("svg:text")
	  .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
	  .attr("dy", ".35em")
	  .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
	  .attr("transform", function(d) {
		return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			+ "translate(" + (r0 + 26) + ")"
			+ (d.angle > Math.PI ? "rotate(180)" : "");
	  })
	  .text(function(d) { return sortedNameByIndex[d.index]; })
	  .on("click", highlight);

	var path = svg.selectAll("path.link") //lines between countries
		.data(chord.chords)
	  .enter().append("svg:path")
	  	.each(function(d){d._color = colorByIndex[d.target.index]})
		.attr("class", function(d) { return "link source-" + d.source.index + " target-" + d.target.index; })
		.attr("d",d3.svg.chord().radius(r0))
		.style("fill", function(d){ return d._color; })
      	.style("stroke", function(d){ return d._color; })
      	
      	
      	
};

function highlight(d) {
	reset();
	d3.select(".showAll").style("visibility","visible");
	if (activeIndex =='received') d3.select(".countryInfo").style("visibility","visible") .html("<strong>"+ sortedNameByIndex[d.index]+"</strong>"+ '<br />Received: '+ sortedReceivedTotals[d.index]  +' million USD<br />Sent: '+sortedSentTotals[d.index]+' million USD');
	else d3.select(".countryInfo").style("visibility","visible") .html("<strong>"+ sortedNameByIndex[d.index]+"</strong>"+ '<br />Sent: '+sortedSentTotals[d.index] + ' million USD<br />Received: '+sortedReceivedTotals[d.index]+' million USD');

	d3.select(this).classed("selected",true);
	svg.selectAll("path.link.source-" + d.index)
		.classed("source", true)
		.style("visibility","visible")     
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		.each(updateNodes("target", true));
}

function mouseover(d){ //for links between countries
	d3.select(this).classed("selectedLink",true);
	showTooltip(sortedNameByIndex[d.source.index],sortedNameByIndex[d.target.index],d.source.value); 
}

function mouseout(d){
	d3.select(this).style("fill", d._color).style("stroke",d._color);
	d3.select(this).classed("selectedLink",false);
	tooltipdiv.style("visibility", "hidden");
}

function reset(){
	svg.selectAll("g.node text")
 	 	.classed("selected", false);

	svg.selectAll("path.link")
		.classed("source", false)
		.style("visibility","hidden")
		.on("mouseover", null)
		.on("mouseout", null)
		.each(updateNodes("target", false));
	
	tooltipdiv.style("visibility", "hidden");
}

function showAll(){
	svg.selectAll("g.node text")
 	 	.classed("selected", false);

	svg.selectAll("path.link")
		.classed("source", false)
		.style("visibility","visible")
		.on("mouseover", null)
		.on("mouseout", null)
		.each(updateNodes("target", false));

	d3.select(".countryInfo").style("visibility","hidden");
	showAll.style("visibility", "hidden");
	tooltipdiv.style("visibility", "hidden");
}

function updateNodes(name, value) {
   return function(d) {
    if (value) {
    	this.parentNode.appendChild(this);
    	svg.select("#node-" + d[name].index).classed(name, value) //selecting target nodes
			.on('mouseover', function(){showTooltip(sortedNameByIndex[d.source.index],sortedNameByIndex[d.target.index],d.source.value);})
			.on('mouseout', function(){tooltipdiv.style("visibility", "hidden"); })	
		svg.select("#arc-" + d[name].index).classed(name, value) //selecting target arcs
			.on('mouseover', function(){showTooltip(sortedNameByIndex[d.source.index],sortedNameByIndex[d.target.index],d.source.value);})
			.on('mouseout', function(){tooltipdiv.style("visibility", "hidden"); })	
	}
	else {
		svg.select("#node-" + d[name].index).classed(name, value).on('mouseover','').on('mouseout','');
		svg.select("#arc-" + d[name].index).classed(name, value).on('mouseover','').on('mouseout','');
	}
  };
}

function showTooltip(from, to, amount){
	var tooltipText = (activeIndex == "sent")? "<span>from <strong>" + from +"</strong> to <strong>"+ to + "</strong>: "+ amount +" million USD</span>":
	"<span>from <strong>" + to +"</strong> to <strong>"+ from + "</strong>: "+ amount +" million USD</span>";
	tooltipdiv.html(tooltipText)
		.style("top", d3.event.pageY - 10 + "px")
		.style("left", d3.event.pageX + 10 + "px")
		.style("visibility", "visible");  
}

$('#toggle').click(function(ev) { 
    $('#description').toggle(); 
    $(this).html(($('#toggle').text() == 'Show description') ? 'Hide description' : 'Show description');
 })


