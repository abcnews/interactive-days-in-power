/*!
 * interactive-captains-knock-charts
 *
 * @version development
 * @author Simon Elvery <(none)>
 */

var checkExist, slugify;

slugify = require('slugify');

var leaders = require('../data/leaders.json');

var checkExist = setInterval(function() {
	if (typeof d3 !== 'undefined') {
		init();
		clearInterval(checkExist);
	}
}, 10);

function init() {
	var container, svg, margin, x, y, xAxis, yAxis, width, height, line, dataUrl, series, ratio, mobile, heading;

	container = document.getElementById('interactive-days-in-power');

	dataUrl = require('component-interactive-base-path')('interactive-days-in-power') + 'data/days-in-power.csv';

	setSizes();

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

	heading = d3.select(container).append('div');
	heading.append('h3').attr('class', 'chart-analysis-heading');
	heading.append('button')
		.attr('class', 'btn btn-sm btn-default')
		.text('Next')
		.on('click', onClickNext);

	d3.select(container).append('p').attr('class', 'chart-analysis');

	d3.csv(dataUrl, function(err, data){
		var players, labels;

		players = {};

		data.forEach(function(d) {
			var days, start = new Date(leaders[d.pm].start);

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
			.attr('transform', 'translate('+[width,0]+')')
			.call(yAxis)
			.append('text')
				.attr('class', 'y-label')
				.attr('transform', 'rotate(-90)')
				.attr("dy", margin.right-2)
				.style("text-anchor", "end")
				.text("Net satisfaction");

		svg.select('.y.axis .domain').attr('transform', 'translate('+[-width,0]+')');
		svg.selectAll('.y.axis .tick text').attr('transform', 'translate('+ width + ',-10)');

		svg.append('g').attr('class', 'lines').selectAll('.line').data(series, lineKey)
			.enter().append('g')
				.attr('class', function(d){
					return 'line ' + slugify(d.key);
				})
				.attr('stroke', lineStroke)
				.append('path')
					.datum(function(d){return d.value;})
					.attr("d", line);

		svg.selectAll('.line').each(function(d){
			if (d.key === 'Tony Abbott') {
				this.parentNode.appendChild(this);
			}
		});

		// Draw labels
		labels = svg.append('g').attr('class', 'lines-labels').selectAll(".line-label").data(series, lineKey)
			.enter().append('g').append("text")
				.attr("class", function(d){
					return 'line-label ' + slugify(d.key).replace("'", '');
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

		updateAnalysis();
	});

	function labelFill(d) {
		return (d.key === 'Tony Abbott' || d.current || series.every(function(d){ return !d.current; })) ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)';
	}

	function lineStroke(d) {
		return (d.key === 'Tony Abbott' || d.current) ? leaders[d.key].colour : 'rgb(204, 204, 204)';
	}

	function updateAnalysis() {
		var current = series.filter(function(d){
			return !!d.current;
		})[0] || series.filter(function(d){
			return d.key === 'Tony Abbott';
		})[0];

		d3.select('.chart-analysis-heading').text(current.key);
		d3.select('.chart-analysis').text(leaders[current.key].analysis);

	}

	function onClickNext (){
		var current;

		current = series.filter(function(d){
			return d.current;
		});

		if (current.length) {
			current = series.indexOf(current[0]);
			series.forEach(function(d, i){
				d.current = ((current+1) % series.length === i);
			});
		} else {
			series[0].current = true;
		}

		svg.selectAll('.line').each(function(d){
			if (d.current || d.key === 'Tony Abbott') {
				this.parentNode.appendChild(this);
			}
		});

		svg.selectAll('.line').attr('stroke', lineStroke);
		svg.selectAll('.line-label')
			.attr('fill', labelFill)
			.classed('current', isCurrent)
			.attr("x", labelX)
			.attr("y", labelY);

		updateAnalysis();
	}

	function isCurrent(d) {
		return !!d.current;
	}

	function labelX(d) {
		var natural = x(d.value[d.value.length-1].days);
		if (d.key === 'John Howard' || d.key === 'Paul Keating') {
			return natural - this.getBBox().width/2 - ((mobile) ? 0 : 45);
		}
		if (d.key === 'Kevin Rudd \'13') {
			return natural + this.getBBox().width/2;
		}
		return natural;
	}

	function labelY(d) {
		var natural = y(d.value[d.value.length-1].satisfaction);

		if (d.key === 'Julia Gillard' && mobile) {
			return natural + 25;
		}

		if (d.key === 'Kevin Rudd \'13' || d.key === 'Kevin Rudd \'07' || d.key === 'Julia Gillard' || d.key === 'Tony Abbott') {
			return natural + 14;
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

	function setSizes() {

		mobile = $('body').hasClass('platform-mobile');
		ratio = mobile ? 3/4 : 9/25;

		margin = {
			top: 5,
			right: 15,
			bottom: 20,
			left: 0
		};

		width = $(container).innerWidth() - margin.left - margin.right;
		height = width * ratio;
	}

	d3.select(window).on('resize', function(){

		var update;

		setSizes();

		x.range([0, width]);
		y.range([0, height]);

		yAxis.tickSize(width, 0);

		d3.select('.x.axis')
			.attr('transform', 'translate(0, '+height +')')
			.call(xAxis)
			.select('text.label')
				.attr('x', width);

		d3.select('.y.axis')
			.attr('transform', 'translate('+[width,0]+')')
			.call(yAxis)
			.select('text.y-label');

		svg = d3.select(container).select("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.select('.chart')
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.select('.y.axis .domain').attr('transform', 'translate('+[-width,0]+')');
		svg.selectAll('.y.axis .tick text').attr('transform', 'translate('+ width + ',-10)');


		update = svg.selectAll('.line').data(series, lineKey);
		update.select('path')
			.datum(function(d){return d.value;})
			.attr('d', line);
		update.exit().remove();

		d3.select('.x.axis .label').attr('x', width);

		svg.selectAll(".line-label")
			.attr("x", labelX)
			.attr("y", labelY);
	});

}
