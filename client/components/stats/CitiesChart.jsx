import React from 'react';
import { scaleBand, scaleLinear, max, axisLeft, axisBottom, format } from 'd3';
import { useChart, freshSvg, message, settle, showTip, hideTip } from './chartKit';

// how many events happen in each city
function draw(node, data, COLOURS) {
  if (!data.length) return message(node, 'No events yet.');

  const height = 280;
  const margin = { top: 16, right: 20, bottom: 66, left: 44 };
  const made = freshSvg(node, height);
  const innerW = made.width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const x = scaleBand().domain(data.map((d) => d.city)).range([0, innerW]).padding(0.22);
  const y = scaleLinear().domain([0, max(data, (d) => d.count) || 1]).nice().range([innerH, 0]);

  g.append('g').attr('transform', 'translate(0,' + innerH + ')')
    .call(axisBottom(x))
    .selectAll('text').attr('fill', COLOURS.muted)
    .attr('transform', 'rotate(-38)').style('text-anchor', 'end').style('font-size', '11px');

  g.append('g').call(axisLeft(y).ticks(5).tickFormat(format('d'))).selectAll('text').attr('fill', COLOURS.muted);

  const bars = g.selectAll('.bar').data(data).enter().append('rect')
    .attr('x', (d) => x(d.city)).attr('width', x.bandwidth()).attr('rx', 4).attr('fill', COLOURS.meet)
    .on('mousemove', (event, d) => showTip('<strong>' + d.city + '</strong><br>' + d.count + ' event' +
      (d.count === 1 ? '' : 's') + '<br>' + d.attendees + ' going in total', event))
    .on('mouseleave', hideTip);
  settle(bars, { y: innerH, height: 0 }, { y: (d) => y(d.count), height: (d) => innerH - y(d.count) });
}

export default function CitiesChart({ refreshKey }) {
  const ref = useChart('/api/stats/events-by-city', draw, refreshKey);
  return (
    <section className="card">
      <h2>Where events happen</h2>
      <p className="muted small">Events per city, with the total number of people going.</p>
      <div className="chart" ref={ref} />
    </section>
  );
}
