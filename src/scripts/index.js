/*!
 * interactive-captains-knock-charts
 *
 * @version development
 * @author Simon Elvery <(none)>
 */

var templates, checkExist, slugify, hints;

slugify = require('slugify');
hints = require('component-interaction-hints');

templates = require('./templates.js')(require('handlebars/runtime'));

var colours = {
	"Tony Abbott": '#4978BC',
	"John Howard": '#4978BC',
	"Paul Keating": '#BE4848',
	"Julia Gillard": '#BE4848',
	"Kevin Rudd '07": '#BE4848',
	"Kevin Rudd '13": '#BE4848',
};

var checkExist = setInterval(function() {
	if (typeof d3 !== 'undefined') {
		init();
		clearInterval(checkExist);
	}
}, 10);

function init() {
	var container, svg, margin, x, y, xAxis, yAxis, width, height, line, dataUrl, series;

	container = document.getElementById('interactive-days-in-power');

	hints.Hint(container, {
		text: 'Hover or tap',
		className: 'chart-hint',
		icon: 'tap',
		auto: true
	}).show();

	dataUrl = require('component-interactive-base-path')('interactive-days-in-power') + 'data/days-in-power.csv';

	margin = {
		top: 10,
		right: 0,
		bottom: 20,
		left: 40
	};

	width = $(container).innerWidth() - margin.left - margin.right;
	height = width * (9/25);

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
		.interpolate('cardinal')
		.x(function(d) {return x(d.days);})
		.y(function(d) {return y(d.satisfaction);});

	svg = d3.select(container).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr('class', 'chart')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	d3.csv(dataUrl, function(err, data){
		var starts, players, labels;

		players = {};

		starts = require('../data/start.json');

		data.forEach(function(d) {
			var days, start = new Date(starts[d.pm]);
			players[d.pm] = players[d.pm] || [];
			days = ((new Date(d.date))-start) / 1000 / 60 / 60 / 24;
			if (days < 1500) {
				players[d.pm].push({
					days: days,
					satisfaction: (d.satisfied-d.dissatisfied)/100
				});
			}
		});

		series = d3.entries(players);

		series.forEach(function(d){
			d.total = d3.max(d.value, function(d){return d.runs;});
			d.totalDays = d3.max(d.value, function(d){return d.inning;});
		});

		x.domain([0,d3.max(series, function(d){return d3.max(d.value, function(d){return d.days;});})]);
		y.domain([d3.max(series, function(d){return d3.max(d.value, function(d){return d.satisfaction;});}),d3.min(series, function(d){return d3.min(d.value, function(d){return d.satisfaction;});})]);

		yAxis.tickSize(width, 0).tickFormat(d3.format(".0%"));

		svg.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate(0, '+height +')')
			.call(xAxis)
			.append('text')
				.attr('y', -6)
				.attr('x', width)
				.attr('class', 'label')
				.style('text-anchor', 'end')
				.text('Days in power');

		svg.append('g')
			.attr('class', 'y axis')
			.call(yAxis)
			.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', 4)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("Net satisfaction");


		svg.selectAll('.y.axis .tick text,.y.axis .tick line').attr('transform', 'translate('+ width + ',-10)');

		svg.append('g').attr('class', 'lines').selectAll('.line').data(series, lineKey)
			.enter().append('g')
				.attr('class', function(d){
					return 'line ' + slugify(d.key);
				})
				.attr('stroke', function(d){
					return (d.key === 'Tony Abbott' || d.key === 'Kevin Rudd \'07') ? colours[d.key] : 'rgb(204, 204, 204)';
				})
				.append('path')
					.datum(function(d){return d.value;})
					.attr("d", line);

		svg.selectAll('.line').each(function(d){
			if (d.key === 'Tony Abbott') {
				this.parentNode.appendChild(this);
			}
		}).on('mouseenter', updateActivePlayer).on('mouseleave', updateActivePlayer);

		// Draw labels
		labels = svg.append('g').attr('class', 'lines-labels').selectAll(".line-label").data(series, lineKey)
			.enter().append('g').append("text")
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
				.attr("fill", "rgba(0,0,0,1)");

		labels.each(function(d) {
			d.labelSize = [this.getBBox().width,this.getBBox().height];
		});

		labels.on('mouseenter', updateActivePlayer);
		labels.on('mouseleave', updateActivePlayer);
	});

	function updateActivePlayer(d){

		svg.selectAll('.line').transition().delay(100).attr('stroke', function(dd){
			var selected = (d.key === dd.key && d3.event.type === 'mouseenter');
			if (selected) {
				this.parentNode.appendChild(this);
			}

			return (selected) ? colours[dd.key] : (dd.key === 'Tony Abbott' || (dd.key === 'Kevin Rudd \'07' && d3.event.type === 'mouseleave')) ? colours[dd.key] : 'rgb(204, 204, 204)';
		});

		svg.selectAll('.line-label').transition().delay(100)
			.attr('fill', function(dd){
				return (d.key === dd.key || d3.event.type === 'mouseleave' || dd.key === 'Tony Abbott') ? 'rgba	(0,0,0,1)' : 'rgba(0,0,0,0)';
			});

		// Keep Clarkey on top
		svg.selectAll('.line').each(function(d){
			if (d.key === 'Tony Abbott') {
				this.parentNode.appendChild(this);
			}
		});
	}

	function labelX(d) {
		var natural = x(d.value[d.value.length-1].days);
		if (d.key === 'John Howard') {
			return natural - 45;
		}
		if (d.key === 'Paul Keating') {
			return natural - 40;
		}
		if (d.key === 'Kevin Rudd \'13') {
			return natural + 10;
		}
		return natural;
	}

	function labelY(d) {
		var natural = y(d.value[d.value.length-1].satisfaction);
		if (d.key === 'Kevin Rudd \'13' || d.key === 'Kevin Rudd \'07' || d.key === 'Julia Gillard' || d.key === 'Tony Abbott') {
			return natural + 12;
		}
		if (d.key === 'Paul Keating') {
			return natural + 25;
		}
		if (d.key === 'John Howard') {
			return natural - 25;
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
