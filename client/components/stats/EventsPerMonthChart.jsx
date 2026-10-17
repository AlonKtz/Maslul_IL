import React from 'react';
import { scaleBand, scaleLinear, max, axisLeft, axisBottom } from 'd3';
import { useChart, freshSvg, message, settle, showTip, hideTip } from './chartKit';

// two bars per month, one for meets and one for races
function draw(node, data, COLOURS) {
  if (!data.length) return message(node, 'No events yet.');

  const height = 300;
  const margin = { top: 20, right: 20, bottom: 46, left: 44 };
  const made = freshSvg(node, height);
  const innerW = made.width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const x0 = scaleBand().domain(data.map((d) => d.month)).range([0, innerW]).padding(0.2);
  const x1 = scaleBand().domain(['meet', 'race']).range([0, x0.bandwidth()]).padding(0.08);
  const y = scaleLinear().domain([0, max(data, (d) => Math.max(d.meet, d.race)) || 1]).nice().range([innerH, 0]);

  // the faint lines going across make the heights easier to read
  g.append('g').call(axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))
    .selectAll('line').attr('stroke', COLOURS.grid);

  g.append('g').attr('transform', 'translate(0,' + innerH + ')')
    .call(axisBottom(x0))
    .selectAll('text').attr('fill', COLOURS.muted)
    .attr('transform', 'rotate(-30)').style('text-anchor', 'end');

  g.append('g').call(axisLeft(y).ticks(5)).selectAll('text').attr('fill', COLOURS.muted);

  const months = g.selectAll('.month').data(data).enter().append('g')
    .attr('transform', (d) => 'translate(' + x0(d.month) + ',0)');

  ['meet', 'race'].forEach((key) => {
    const bars = months.append('rect')
      .attr('x', x1(key)).attr('width', x1.bandwidth()).attr('rx', 3).attr('fill', COLOURS[key])
      .on('mousemove', (event, d) => showTip('<strong>' + d.month + '</strong><br>' + key + 's: ' + d[key], event))
      .on('mouseleave', hideTip);
    settle(bars, { y: innerH, height: 0 }, { y: (d) => y(d[key]), height: (d) => innerH - y(d[key]) });
  });

  const legend = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',6)');
  [['meet', 'Meets'], ['race', 'Races']].forEach((pair, i) => {
    const item = legend.append('g').attr('transform', 'translate(' + (i * 84) + ',0)');
    item.append('rect').attr('width', 11).attr('height', 11).attr('rx', 2).attr('fill', COLOURS[pair[0]]);
    item.append('text').attr('x', 16).attr('y', 10).attr('fill', COLOURS.muted).style('font-size', '12px').text(pair[1]);
  });
}

export default function EventsPerMonthChart({ refreshKey }) {
  const ref = useChart('/api/stats/events-per-month', draw, refreshKey);
  return (
    <section className="card">
      <h2>Meets and races per month</h2>
      <p className="muted small">Grouped by the month the event takes place.</p>
      <div className="chart" ref={ref} />
    </section>
  );
}
