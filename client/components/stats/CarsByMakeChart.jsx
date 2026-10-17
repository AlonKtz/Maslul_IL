import React from 'react';
import { scaleBand, scaleLinear, max, axisLeft, axisBottom, format } from 'd3';
import { useChart, freshSvg, message, settle, showTip, hideTip } from './chartKit';

// sideways bars, one per car make
function draw(node, data, COLOURS) {
  if (!data.length) return message(node, 'No cars in any garage yet.');

  const height = Math.max(180, data.length * 30 + 40);
  const margin = { top: 10, right: 40, bottom: 24, left: 110 };
  const made = freshSvg(node, height);
  const innerW = made.width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const y = scaleBand().domain(data.map((d) => d.make)).range([0, innerH]).padding(0.22);
  const x = scaleLinear().domain([0, max(data, (d) => d.count) || 1]).nice().range([0, innerW]);

  g.append('g').call(axisLeft(y)).selectAll('text').attr('fill', COLOURS.text).style('font-size', '12px');
  g.append('g').attr('transform', 'translate(0,' + innerH + ')')
    .call(axisBottom(x).ticks(5).tickFormat(format('d')))
    .selectAll('text').attr('fill', COLOURS.muted);

  const bars = g.selectAll('.bar').data(data).enter().append('rect')
    .attr('y', (d) => y(d.make)).attr('height', y.bandwidth()).attr('x', 0).attr('rx', 4).attr('fill', COLOURS.bar)
    .on('mousemove', (event, d) => showTip('<strong>' + d.make + '</strong><br>' + d.count + ' car' +
      (d.count === 1 ? '' : 's') + '<br>avg ' + d.averageHorsepower + ' hp', event))
    .on('mouseleave', hideTip);
  settle(bars, { width: 0 }, { width: (d) => x(d.count) });

  g.selectAll('.count').data(data).enter().append('text')
    .attr('y', (d) => y(d.make) + y.bandwidth() / 2 + 4).attr('x', (d) => x(d.count) + 6)
    .attr('fill', COLOURS.muted).style('font-size', '12px').text((d) => d.count);
}

export default function CarsByMakeChart({ refreshKey }) {
  const ref = useChart('/api/stats/cars-by-make', draw, refreshKey);
  return (
    <section className="card">
      <h2>Most common makes in the garages</h2>
      <p className="muted small">Bar length is the number of cars; hover for average power.</p>
      <div className="chart" ref={ref} />
    </section>
  );
}
