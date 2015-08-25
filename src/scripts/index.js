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

	container = document.getElementById('interactive-captains-knock-charts');

	dataUrl = document.location.host.indexOf(':8000') === -1 ?
		ABC.News.utilities.getResHost() + '/res/sites/news-projects/interactive-captains-knock-charts/1.0.0/data/cumulative-runs.csv' :
		'/data/cumulative-runs.csv';

	margin = {
		top: 10,
		right: 25,
		bottom: 20,
		left: 12
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
		.orient('right');

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
		var players, labels;

		players = {};

		data.forEach(function(d) {
			var key;
			for (key in d) {
				if (key !== 'inning' && d[key] !== '' && typeof d[key] !== 'undefined') {
					players[key] = players[key] || [{inning:0, runs: 0}];
					players[key].push({inning: +d['inning']+1, runs: +d[key]});
				}
			}
		});

		series = d3.entries(players);

		series.forEach(function(d){
			d.totalRuns = d3.max(d.value, function(d){return d.runs;});
			d.totalInnings = d3.max(d.value, function(d){return d.inning;});
		});

		x.domain([0,d3.max(series, function(d){return d3.max(d.value, function(d){return d.inning;});})]);
		y.domain([d3.max(series, function(d){return d3.max(d.value, function(d){return d.runs;});}),0]);

		yAxis.tickSize(width, 0);

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
				.attr('y', -12)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Cumulative runs");


		svg.selectAll('.y.axis .tick text').attr('transform', 'translate('+ -width + ',-10)');

		svg.selectAll('.line').data(series, lineKey)
			.enter().append('g').attr('class', function(d){
				return 'line ' + slugify(d.key);
			}).append('path')
				.datum(function(d){return d.value;})
				.attr("d", line);

		svg.selectAll('.line').each(function(d){
			if (d.key === 'Michael Clarke') {

				this.parentNode.appendChild(this);
			}
		});

		// Draw labels
		labels = svg.selectAll(".line-label").data(series, lineKey)
			.enter().append("text")
				.attr("class", function(d){
					return 'line-label ' + slugify(d.key);
				})
				.attr('text-anchor', function(d) {
					if (d.key === 'Ricky Ponting') {
						return 'end';
					}

					return 'middle';
				})
				.text(function(d) { return d.key; })
				.attr("x", labelX)
				.attr("y", labelY)
				.attr("fill", "black");

		labels.each(function(d) {
			d.labelSize = [this.getBBox().width,this.getBBox().height];
		});
	});

	function labelX(d) {
		var natural = x(d.totalInnings);
		if (d.key === 'Ricky Ponting') {
			return natural - 10;
		}
		return natural;
	}

	function labelY(d) {
		var natural = y(d.totalRuns)-5;
		if (d.key === 'Ricky Ponting') {
			return natural + 5;
		}
		if (d.key === 'Donald Bradman') {
			return natural - 5;
		}
		if (d.key === 'Ian Chappell') {
			return natural - 5;
		}
		if (d.key === 'Allan Border') {
			return natural - 5;
		}
		return natural;
	}

	function lineKey(d) {
		return d.key;
	}

	d3.select(window).on('resize', function(){

		var update;

		width = $(container).innerWidth() - margin.left - margin.right;
		height = width * (9/16);

		x.range([0, width]);
		y.range([0, height]);
		yAxis.tickSize(width, 0);

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

		svg.selectAll('.y.axis .tick text').attr('transform', 'translate('+ -width + ',-10)');

		update = svg.selectAll('.line').data(series, lineKey);
		update.select('path')
			.datum(function(d){return d.value;})
			.attr('d', line);
		update.exit().remove();

		d3.select('.x.axis .label').attr('x', width);

		svg.selectAll(".line-label")
			.attr("x", labelX)
			.attr("y", labelY)
			.attr("fill", "black");
	});

}
