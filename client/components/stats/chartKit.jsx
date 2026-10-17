import { useEffect, useRef } from 'react';
import { select } from 'd3';
import 'd3-transition';
import { api } from '../../lib/api';

/*
  What all five charts share.

  Each chart component calls useChart(url, draw, refreshKey): it fetches its
  numbers, then draw(node, data, colours) builds the svg with D3 inside the
  component's own element. It draws again when Refresh is pressed
  (refreshKey), when the theme changes (new colours) and when the window is
  resized (new width).
*/

// the chart colours come from the design tokens in style.css, so the charts
// follow the light or dark theme. the second value is the fallback
export function readColours() {
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => (css.getPropertyValue(name) || '').trim() || fallback;
  return {
    meet: token('--ok', '#2a9d8f'),
    race: token('--brand', '#e63946'),
    bar: token('--amber', '#f4a261'),
    bar2: token('--info', '#457b9d'),
    text: token('--ink', '#15151e'),
    muted: token('--ink-muted', '#5b5b66'),
    grid: token('--line', '#d6d6de'),
  };
}

// clears the chart and gives back a clean svg to draw into. without the
// clear, drawing again stacks a second chart on top of the first
export function freshSvg(node, height) {
  const container = select(node);
  container.selectAll('*').remove();
  const width = Math.max(320, node.clientWidth);
  return {
    width,
    svg: container.append('svg').attr('width', width).attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height),
  };
}

export function message(node, text) {
  select(node).selectAll('*').remove();
  select(node).append('p').attr('class', 'empty').text(text);
}

/*
  Sets a bar to its real size, and animates it growing when that makes sense.
  The final size is always applied: animations run on animation frames,
  which the browser does not run in a hidden tab, so when the animation was
  the only thing setting the size a background tab showed an empty chart.
  Same with reduce motion switched on.
*/
export function settle(selection, from, to) {
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.hidden || reduceMotion) {
    Object.keys(to).forEach((key) => selection.attr(key, to[key]));
    return;
  }
  Object.keys(from).forEach((key) => selection.attr(key, from[key]));
  const moving = selection.transition().duration(650);
  Object.keys(to).forEach((key) => moving.attr(key, to[key]));
}

// one tooltip shared by all the charts instead of one each
let tooltip = null;
function tip() {
  if (!tooltip) tooltip = select('body').append('div').attr('class', 'chart-tooltip');
  return tooltip;
}
export function showTip(html, event) {
  tip().html(html)
    .style('left', (event.pageX + 12) + 'px')
    .style('top', (event.pageY - 28) + 'px')
    .classed('is-visible', true);
}
export function hideTip() {
  tip().classed('is-visible', false);
}

// fetch the numbers and draw them, again on refresh, theme change and resize
export function useChart(url, draw, refreshKey) {
  const ref = useRef(null);
  const dataRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get(url)
      .then((res) => {
        if (!alive || !ref.current) return;
        dataRef.current = res.data;
        draw(ref.current, res.data, readColours());
      })
      .catch(() => alive && ref.current && message(ref.current, 'Could not load this chart.'));
    return () => { alive = false; };
  }, [url, refreshKey]);

  useEffect(() => {
    const redraw = () => {
      if (ref.current && dataRef.current) draw(ref.current, dataRef.current, readColours());
    };
    // resizing fires many times while dragging, so wait until it settles
    let timer = null;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(redraw, 250);
    };
    document.addEventListener('theme:change', redraw);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('theme:change', redraw);
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, []);

  return ref;
}
