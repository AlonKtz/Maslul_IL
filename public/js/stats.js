/**
 * Statistics page — four charts drawn with D3 from live database figures.
 *
 * Each chart fetches its own endpoint with jQuery Ajax and then builds the
 * SVG with D3. Nothing is hard-coded: add an event or a car, press Refresh,
 * and the bars change.
 */
(function ($, d3) {
  'use strict';

  var COLOURS = {
    meet: '#2a9d8f',
    race: '#e63946',
    bar: '#f4a261',
    bar2: '#8ecae6',
    text: '#e8edf2',
    muted: '#97a3b0',
    grid: '#2b343d',
  };

  // Removes whatever was drawn before, then gives back a fresh <svg>.
  function freshSvg(selector, height) {
    var container = d3.select(selector);
    container.selectAll('*').remove();

    var width = Math.max(320, container.node().clientWidth);

    return {
      width: width,
      svg: container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', '0 0 ' + width + ' ' + height),
    };
  }

  function message(selector, text) {
    d3.select(selector).selectAll('*').remove();
    d3.select(selector).append('p').attr('class', 'empty').text(text);
  }

  /**
   * Applies a shape's final size, growing into it when that is sensible.
   *
   * The final values are always applied, and the animation is only an
   * enhancement: animations are driven by animation frames, which the browser
   * does not run for a hidden tab. If the bars relied on the animation alone,
   * opening this page in a background tab — or with "reduce motion" turned
   * on — would leave the reader looking at an empty chart.
   */
  function settle(selection, from, to) {
    var reduceMotion = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (document.hidden || reduceMotion) {
      Object.keys(to).forEach(function (key) { selection.attr(key, to[key]); });
      return;
    }

    Object.keys(from).forEach(function (key) { selection.attr(key, from[key]); });

    var moving = selection.transition().duration(650);
    Object.keys(to).forEach(function (key) { moving.attr(key, to[key]); });
  }

  // A single tooltip reused by every chart.
  var tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip');

  function showTip(html, event) {
    tooltip.html(html)
      .style('left', (event.pageX + 12) + 'px')
      .style('top', (event.pageY - 28) + 'px')
      .classed('is-visible', true);
  }
  function hideTip() { tooltip.classed('is-visible', false); }

  // ------------------------------------------------------------------ 1
  // Grouped bar chart: meets and races per month.
  function drawEventsPerMonth(data) {
    var sel = '#chart-events-month';
    if (!data.length) return message(sel, 'No events yet.');

    var height = 300;
    var margin = { top: 20, right: 20, bottom: 46, left: 44 };
    var made = freshSvg(sel, height);
    var innerW = made.width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var g = made.svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x0 = d3.scaleBand().domain(data.map(function (d) { return d.month; }))
      .range([0, innerW]).padding(0.2);
    var x1 = d3.scaleBand().domain(['meet', 'race']).range([0, x0.bandwidth()]).padding(0.08);
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return Math.max(d.meet, d.race); }) || 1])
      .nice()
      .range([innerH, 0]);

    // horizontal grid lines
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))
      .selectAll('line').attr('stroke', COLOURS.grid);

    g.append('g').attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x0))
      .selectAll('text').attr('fill', COLOURS.muted)
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(y).ticks(5))
      .selectAll('text').attr('fill', COLOURS.muted);

    var groups = g.selectAll('.month').data(data).enter().append('g')
      .attr('transform', function (d) { return 'translate(' + x0(d.month) + ',0)'; });

    ['meet', 'race'].forEach(function (key) {
      var bars = groups.append('rect')
        .attr('x', x1(key))
        .attr('width', x1.bandwidth())
        .attr('rx', 3)
        .attr('fill', COLOURS[key])
        .on('mousemove', function (event, d) {
          showTip('<strong>' + d.month + '</strong><br>' + key + 's: ' + d[key], event);
        })
        .on('mouseleave', hideTip);

      settle(bars,
        { y: innerH, height: 0 },
        {
          y: function (d) { return y(d[key]); },
          height: function (d) { return innerH - y(d[key]); },
        });
    });

    // legend
    var legend = made.svg.append('g').attr('transform', 'translate(' + (margin.left) + ',6)');
    [['meet', 'Meets'], ['race', 'Races']].forEach(function (pair, i) {
      var item = legend.append('g').attr('transform', 'translate(' + (i * 84) + ',0)');
      item.append('rect').attr('width', 11).attr('height', 11).attr('rx', 2)
        .attr('fill', COLOURS[pair[0]]);
      item.append('text').attr('x', 16).attr('y', 10)
        .attr('fill', COLOURS.muted).style('font-size', '12px').text(pair[1]);
    });
  }

  // ------------------------------------------------------------------ 2
  // Horizontal bars: cars by make.
  function drawCarsByMake(data) {
    var sel = '#chart-cars-make';
    if (!data.length) return message(sel, 'No cars in any garage yet.');

    var height = Math.max(180, data.length * 30 + 40);
    var margin = { top: 10, right: 40, bottom: 24, left: 110 };
    var made = freshSvg(sel, height);
    var innerW = made.width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var g = made.svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var y = d3.scaleBand().domain(data.map(function (d) { return d.make; }))
      .range([0, innerH]).padding(0.22);
    var x = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.count; }) || 1])
      .nice().range([0, innerW]);

    g.append('g').call(d3.axisLeft(y))
      .selectAll('text').attr('fill', COLOURS.text).style('font-size', '12px');

    g.append('g').attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', COLOURS.muted);

    var bars = g.selectAll('.bar').data(data).enter().append('rect')
      .attr('y', function (d) { return y(d.make); })
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('fill', COLOURS.bar)
      .on('mousemove', function (event, d) {
        showTip('<strong>' + d.make + '</strong><br>' + d.count + ' car' +
          (d.count === 1 ? '' : 's') + '<br>avg ' + d.averageHorsepower + ' hp', event);
      })
      .on('mouseleave', hideTip);

    settle(bars, { width: 0 }, { width: function (d) { return x(d.count); } });

    g.selectAll('.count').data(data).enter().append('text')
      .attr('y', function (d) { return y(d.make) + y.bandwidth() / 2 + 4; })
      .attr('x', function (d) { return x(d.count) + 6; })
      .attr('fill', COLOURS.muted).style('font-size', '12px')
      .text(function (d) { return d.count; });
  }

  // ------------------------------------------------------------------ 3
  // Bars with a second series drawn as dots: count and average price.
  function drawListings(data) {
    var sel = '#chart-listings';
    if (!data.length) return message(sel, 'Nothing listed for sale yet.');

    var height = 300;
    var margin = { top: 20, right: 56, bottom: 74, left: 44 };
    var made = freshSvg(sel, height);
    var innerW = made.width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var g = made.svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleBand().domain(data.map(function (d) { return d.category; }))
      .range([0, innerW]).padding(0.25);
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.count; }) || 1])
      .nice().range([innerH, 0]);
    var yPrice = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.averagePrice; }) || 1])
      .nice().range([innerH, 0]);

    g.append('g').attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x))
      .selectAll('text').attr('fill', COLOURS.muted)
      .attr('transform', 'rotate(-32)').style('text-anchor', 'end').style('font-size', '11px');

    // Counts are whole numbers, so never show half a listing on the axis.
    g.append('g')
      .call(d3.axisLeft(y).ticks(Math.min(5, y.domain()[1])).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', COLOURS.muted);

    g.append('g').attr('transform', 'translate(' + innerW + ',0)')
      .call(d3.axisRight(yPrice).ticks(5).tickFormat(function (v) { return '₪' + (v / 1000) + 'k'; }))
      .selectAll('text').attr('fill', COLOURS.bar2).style('font-size', '10px');

    var bars = g.selectAll('.bar').data(data).enter().append('rect')
      .attr('x', function (d) { return x(d.category); })
      .attr('width', x.bandwidth())
      .attr('rx', 4)
      .attr('fill', COLOURS.bar)
      .on('mousemove', function (event, d) {
        showTip('<strong>' + d.category + '</strong><br>' + d.count + ' listed<br>avg ₪' +
          d.averagePrice.toLocaleString('en-US'), event);
      })
      .on('mouseleave', hideTip);

    settle(bars,
      { y: innerH, height: 0 },
      {
        y: function (d) { return y(d.count); },
        height: function (d) { return innerH - y(d.count); },
      });

    // average price as a line with dots, on the right-hand axis
    var line = d3.line()
      .x(function (d) { return x(d.category) + x.bandwidth() / 2; })
      .y(function (d) { return yPrice(d.averagePrice); });

    g.append('path').datum(data)
      .attr('fill', 'none').attr('stroke', COLOURS.bar2).attr('stroke-width', 2)
      .attr('d', line);

    g.selectAll('.dot').data(data).enter().append('circle')
      .attr('cx', function (d) { return x(d.category) + x.bandwidth() / 2; })
      .attr('cy', function (d) { return yPrice(d.averagePrice); })
      .attr('r', 4).attr('fill', COLOURS.bar2);
  }

  // ------------------------------------------------------------------ 4
  // Events per city.
  function drawCities(data) {
    var sel = '#chart-cities';
    if (!data.length) return message(sel, 'No events yet.');

    var height = 280;
    var margin = { top: 16, right: 20, bottom: 66, left: 44 };
    var made = freshSvg(sel, height);
    var innerW = made.width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var g = made.svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var x = d3.scaleBand().domain(data.map(function (d) { return d.city; }))
      .range([0, innerW]).padding(0.22);
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function (d) { return d.count; }) || 1])
      .nice().range([innerH, 0]);

    g.append('g').attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x))
      .selectAll('text').attr('fill', COLOURS.muted)
      .attr('transform', 'rotate(-38)').style('text-anchor', 'end').style('font-size', '11px');

    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')))
      .selectAll('text').attr('fill', COLOURS.muted);

    var bars = g.selectAll('.bar').data(data).enter().append('rect')
      .attr('x', function (d) { return x(d.city); })
      .attr('width', x.bandwidth())
      .attr('rx', 4)
      .attr('fill', COLOURS.meet)
      .on('mousemove', function (event, d) {
        showTip('<strong>' + d.city + '</strong><br>' + d.count + ' event' +
          (d.count === 1 ? '' : 's') + '<br>' + d.attendees + ' going in total', event);
      })
      .on('mouseleave', hideTip);

    settle(bars,
      { y: innerH, height: 0 },
      {
        y: function (d) { return y(d.count); },
        height: function (d) { return innerH - y(d.count); },
      });
  }

  // ------------------------------------------------------------------ loading
  function loadAll() {
    API.get('/api/stats/summary').done(function (res) {
      $('#summary').html([
        ['members', res.members], ['groups', res.groups], ['events', res.events],
        ['listings', res.listings], ['cars', res.cars], ['messages', res.messages],
      ].map(function (pair) {
        return '<div><strong style="font-size:1.7rem" class="glow">' + pair[1] + '</strong>' +
          '<br><span class="muted small">' + pair[0] + '</span></div>';
      }).join(''));
    });

    API.get('/api/stats/events-per-month')
      .done(function (res) { drawEventsPerMonth(res.data); })
      .fail(function () { message('#chart-events-month', 'Could not load this chart.'); });

    API.get('/api/stats/cars-by-make')
      .done(function (res) { drawCarsByMake(res.data); })
      .fail(function () { message('#chart-cars-make', 'Could not load this chart.'); });

    API.get('/api/stats/listings-by-category')
      .done(function (res) { drawListings(res.data); })
      .fail(function () { message('#chart-listings', 'Could not load this chart.'); });

    API.get('/api/stats/events-by-city')
      .done(function (res) { drawCities(res.data); })
      .fail(function () { message('#chart-cities', 'Could not load this chart.'); });
  }

  $('#refresh-stats').on('click', function () {
    loadAll();
    UI.toast('Charts refreshed from the database');
  });

  // Redraw on resize so the charts always fit their column.
  var resizeTimer = null;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(loadAll, 250);
  });

  loadAll();
})(jQuery, d3);
