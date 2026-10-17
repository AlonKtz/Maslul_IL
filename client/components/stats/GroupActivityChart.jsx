import React from 'react';
import { scaleBand, scaleLinear, max, axisLeft, axisBottom } from 'd3';
import { useChart, freshSvg, message, settle, showTip, hideTip } from './chartKit';

/*
  How many events each group runs per month. The server works the average
  out from how long the group has existed, so a group made last week does
  not look busier than one that has been going all year.
*/
function draw(node, data, COLOURS) {
  if (!data.length) return message(node, 'No groups yet.');

  const height = Math.max(180, data.length * 30 + 46);
  const margin = { top: 10, right: 46, bottom: 30, left: 130 };
  const made = freshSvg(node, height);
  const innerW = made.width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const g = made.svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const y = scaleBand().domain(data.map((d) => d.name)).range([0, innerH]).padding(0.22);
  // with no events anywhere the top would be 0 and every bar full width, so keep it at least 1
  const top = max(data, (d) => d.eventsPerMonth) || 1;
  const x = scaleLinear().domain([0, top]).nice().range([0, innerW]);

  g.append('g').call(axisLeft(y)).selectAll('text').attr('fill', COLOURS.text).style('font-size', '11px');
  g.append('g').attr('transform', 'translate(0,' + innerH + ')').call(axisBottom(x).ticks(5))
    .selectAll('text').attr('fill', COLOURS.muted);

  const bars = g.selectAll('.bar').data(data).enter().append('rect')
    .attr('y', (d) => y(d.name)).attr('height', y.bandwidth()).attr('x', 0).attr('rx', 4).attr('fill', COLOURS.bar2)
    .on('mousemove', (event, d) => showTip('<strong>' + d.name + '</strong><br>' +
      d.eventsPerMonth + ' events per month<br>' + d.events + ' events in total<br>' +
      d.members + ' member' + (d.members === 1 ? '' : 's'), event))
    .on('mouseleave', hideTip);
  settle(bars, { width: 0 }, { width: (d) => x(d.eventsPerMonth) });

  g.selectAll('.value').data(data).enter().append('text')
    .attr('y', (d) => y(d.name) + y.bandwidth() / 2 + 4).attr('x', (d) => x(d.eventsPerMonth) + 6)
    .attr('fill', COLOURS.muted).style('font-size', '11px').text((d) => d.eventsPerMonth);
}

export default function GroupActivityChart({ refreshKey }) {
  const ref = useChart('/api/stats/group-activity', draw, refreshKey);
  return (
    <section className="card">
      <h2>How busy each group is</h2>
      <p className="muted small">
        Roughly how many events each group puts on per month, worked out from how long the group has
        existed. This is the closest one to the example in the brief, which asks for an average per
        group per month.
      </p>
      <div className="chart" ref={ref} />
    </section>
  );
}
