/*!
 * interactive-captains-knock-charts
 *
 * @version development
 * @author Simon Elvery <(none)>
 */

var templates, checkExist, slugify;

slugify = require('slugify');

templates = require('./templates.js')(require('handlebars/runtime'));

var checkExist = setInterval(function() {
	if (typeof d3 !== 'undefined') {
		init();
		clearInterval(checkExist);
	}
}, 10);

function init() {
	var container, svg, margin, x, y, xAxis, yAxis, width, height, line, dataUrl, series;

	// d3 labeler extenstion
	require('./labeler');

	container = document.getElementById('interactive-captains-knock-charts');

	dataUrl = document.location.host.indexOf(':8000') === -1 ?
		'/res/sites/news-projects/interactive-captains-knock-charts/data/cumulative-runs.csv' :
		'/data/cumulative-runs.csv';

	margin = {
		top: 20,
		right: 20,
		bottom: 20,
		left: 50
	};

	width = $(container).innerWidth() - margin.left - margin.right;
	height = width * (9/16);

	x = d3.scale.linear()
		.range([0, width]);

	y = d3.scale.linear()
		.range([0, height]);

	xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom');

	yAxis = d3.svg.axis()
		.scale(y)
		.orient('left');

	line = d3.svg.line()
		.x(function(d) {return x(d.inning);})
		.y(function(d) {return y(d.runs);});

	svg = d3.select(container).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr('class', 'chart')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.csv(dataUrl, function(err, data){
		var players;

		players = {};

		data.forEach(function(d) {
			var key;
			for (key in d) {
				if (key !== 'inning' && d[key] !== '') {
					players[key] = players[key] || [{inning:0, runs: 0}];
					players[key].push({inning: +d['inning']+1, runs: +d[key]});
				}
			}
		});

		series = d3.entries(players);

		x.domain([0,d3.max(series, function(d){return d3.max(d.value, function(d){return d.inning;});})]);
		y.domain([d3.max(series, function(d){return d3.max(d.value, function(d){return d.runs;});}),0]);

		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, '+height +')')
			.call(xAxis)
			.append('text')
				.attr('y', -6)
				.attr('x', width)
				.attr('class', 'label')
				.style('text-anchor', 'end')
				.text('Innings');

		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis)
			.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 6)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Cumulative runs");

		svg.selectAll('.line').data(series, lineKey)
			.enter().append('g').attr('class', function(d){
				return 'line ' + slugify(d.key);
			}).append('path')
				.datum(function(d){return d.value;})
				.attr("d", line);

		// var labels = d3.labeler()
		// 	.label(series.map(function(d){
		// 		return {
		// 			x: d3.max(d.value.runs),
		// 			y: d3.max(d.value.inning),
		// 		}
		// 	}))
		// 	.anchor(anchor_array)
		// 	.width(width)
		// 	.height(height)
		// 	.start(nsweeps);

	});

	function lineKey(d) {
		return d.key;
	}

	d3.select(window).on('resize', function(){

		var update;

		width = $(container).innerWidth() - margin.left - margin.right;
		height = width * (9/16);

		x.range([0, width]);
		y.range([0, height]);

		d3.select('.x.axis')
			.attr('transform', 'translate(0, '+height +')')
			.call(xAxis);

		d3.select('.y.axis')
			.call(yAxis);

		svg = d3.select(container).select("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.select('.chart')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		update = svg.selectAll('.line').data(series, lineKey);
		update.select('path')
			.datum(function(d){return d.value;})
			.attr('d', line);
		update.exit().remove();

		d3.select('.x.axis .label').attr('x', width);
	});

}
