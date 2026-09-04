/*
  The statistics page. Five charts, all drawn with D3.

  Each chart asks its own endpoint for data with jQuery ajax, then builds the
  svg with D3. None of the numbers are typed in. Add an event or a car, press
  Refresh, and the bars move.
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

  // clears out the old chart and gives me back a clean svg to draw into.
  // without the clear, redrawing stacks a second chart on top of the first.
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

  /*
    Sets a bar to its real size, and animates it growing when that makes sense.

    This one caught me out. The final size always gets applied here. The
    animation is only a bonus on top. The reason is that animations run on
    animation frames, and the browser does not run those for a tab that is
    hidden. When the growing was the only thing setting the size, opening the
    page in a background tab left you staring at an empty chart. Same if you
    have reduce motion switched on.
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

  // one tooltip element shared by all the charts instead of one each
  var tooltip = d3.select('body').append('div').attr('class', 'chart-tooltip');

  function showTip(html, event) {
    tooltip.html(html)
      .style('left', (event.pageX + 12) + 'px')
      .style('top', (event.pageY - 28) + 'px')
      .classed('is-visible', true);
  }
  function hideTip() { tooltip.classed('is-visible', false); }

  // ------------------------------------------------------------------ 1
  // chart 1. two bars per month, one for meets and one for races
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

    // the faint lines going across, makes the heights easier to read
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
  // chart 2. sideways bars, one per car make
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
  // chart 3. bars for how many items, plus a line of dots for average price
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

    // counts are whole numbers so force whole number ticks. it was showing 0.5
    // of a listing before, which makes no sense
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

    // the average price goes on its own axis on the right, drawn as a line
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
  // chart 4. how many events happen in each city
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

  // ------------------------------------------------------------------ 5
  // how many events each group runs per month. the server works the average
  // out from how long the group has existed, so a group made last week does
  // not look busier than one that has been going all year.
  function drawGroupActivity(data) {
    var sel = '#chart-group-activity';
    if (!data.length) return message(sel, 'No groups yet.');

    var height = Math.max(180, data.length * 30 + 46);
    var margin = { top: 10, right: 46, bottom: 30, left: 130 };
    var made = freshSvg(sel, height);
    var innerW = made.width - margin.left - margin.right;
    var innerH = height - margin.top - margin.bottom;

    var g = made.svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var y = d3.scaleBand().domain(data.map(function (d) { return d.name; }))
      .range([0, innerH]).padding(0.22);

    // if every group has zero events the max would be 0 and every bar would
    // be full width, so keep the top of the scale at least 1
    var top = d3.max(data, function (d) { return d.eventsPerMonth; }) || 1;
    var x = d3.scaleLinear().domain([0, top]).nice().range([0, innerW]);

    g.append('g').call(d3.axisLeft(y))
      .selectAll('text').attr('fill', COLOURS.text).style('font-size', '11px');

    g.append('g').attr('transform', 'translate(0,' + innerH + ')')
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text').attr('fill', COLOURS.muted);

    var bars = g.selectAll('.bar').data(data).enter().append('rect')
      .attr('y', function (d) { return y(d.name); })
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('rx', 4)
      .attr('fill', COLOURS.bar2)
      .on('mousemove', function (event, d) {
        showTip('<strong>' + d.name + '</strong><br>' +
          d.eventsPerMonth + ' events per month<br>' +
          d.events + ' events in total<br>' +
          d.members + ' member' + (d.members === 1 ? '' : 's'), event);
      })
      .on('mouseleave', hideTip);

    settle(bars, { width: 0 }, { width: function (d) { return x(d.eventsPerMonth); } });

    g.selectAll('.value').data(data).enter().append('text')
      .attr('y', function (d) { return y(d.name) + y.bandwidth() / 2 + 4; })
      .attr('x', function (d) { return x(d.eventsPerMonth) + 6; })
      .attr('fill', COLOURS.muted).style('font-size', '11px')
      .text(function (d) { return d.eventsPerMonth; });
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

    API.get('/api/stats/group-activity')
      .done(function (res) { drawGroupActivity(res.data); })
      .fail(function () { message('#chart-group-activity', 'Could not load this chart.'); });
  }

  $('#refresh-stats').on('click', function () {
    loadAll();
    UI.toast('Charts refreshed from the database');
  });

  // redraw when the window resizes so the charts keep fitting. the timeout
  // stops it firing hundreds of times while you drag the window
  var resizeTimer = null;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(loadAll, 250);
  });

  loadAll();
})(jQuery, d3);
