import React from 'react';
import { scaleBand, scaleLinear, max, axisLeft, axisBottom, axisRight, format, line } from 'd3';
import { useChart, freshSvg, message, settle, showTip, hideTip } from './chartKit';

// bars for how many items, plus a line of dots for the average price
function draw(node, data, COLOURS) {
  if (!data.length) return message(node, 'Nothing listed for sale yet.');

  const height = 300;
  const margin = { top: 20, right: 56, bottom: 74, left: 44 };
  const made = freshSvg(node, height);
  const innerW = made.width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const x = scaleBand().domain(data.map((d) => d.category)).range([0, innerW]).padding(0.25);
  const y = scaleLinear().domain([0, max(data, (d) => d.count) || 1]).nice().range([innerH, 0]);
  const yPrice = scaleLinear().domain([0, max(data, (d) => d.averagePrice) || 1]).nice().range([innerH, 0]);

  g.append('g').attr('transform', 'translate(0,' + innerH + ')')
    .call(axisBottom(x))
    .selectAll('text').attr('fill', COLOURS.muted)
    .attr('transform', 'rotate(-32)').style('text-anchor', 'end').style('font-size', '11px');

  // counts are whole numbers, so whole number ticks (it showed 0.5 of a listing before)
  g.append('g').call(axisLeft(y).ticks(Math.min(5, y.domain()[1])).tickFormat(format('d')))
    .selectAll('text').attr('fill', COLOURS.muted);

  g.append('g').attr('transform', 'translate(' + innerW + ',0)')
    .call(axisRight(yPrice).ticks(5).tickFormat((v) => '₪' + (v / 1000) + 'k'))
    .selectAll('text').attr('fill', COLOURS.bar2).style('font-size', '10px');

  const bars = g.selectAll('.bar').data(data).enter().append('rect')
    .attr('x', (d) => x(d.category)).attr('width', x.bandwidth()).attr('rx', 4).attr('fill', COLOURS.bar)
    .on('mousemove', (event, d) => showTip('<strong>' + d.category + '</strong><br>' + d.count + ' listed<br>avg ₪' +
      d.averagePrice.toLocaleString('en-US'), event))
    .on('mouseleave', hideTip);
  settle(bars, { y: innerH, height: 0 }, { y: (d) => y(d.count), height: (d) => innerH - y(d.count) });

  // the average price has its own axis on the right, drawn as a line
  const priceLine = line().x((d) => x(d.category) + x.bandwidth() / 2).y((d) => yPrice(d.averagePrice));
  g.append('path').datum(data).attr('fill', 'none').attr('stroke', COLOURS.bar2).attr('stroke-width', 2).attr('d', priceLine);
  g.selectAll('.dot').data(data).enter().append('circle')
    .attr('cx', (d) => x(d.category) + x.bandwidth() / 2).attr('cy', (d) => yPrice(d.averagePrice))
    .attr('r', 4).attr('fill', COLOURS.bar2);
}

export default function ListingsChart({ refreshKey }) {
  const ref = useChart('/api/stats/listings-by-category', draw, refreshKey);
  return (
    <section className="card">
      <h2>Marketplace by category</h2>
      <p className="muted small">How many items are listed, and what they cost on average.</p>
      <div className="chart" ref={ref} />
    </section>
  );
}
