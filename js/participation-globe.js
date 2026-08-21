(async function () {
const [d3, topojson, worldModule] = await Promise.all([
  import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm'),
  import('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm'),
  import('https://esm.sh/@d3-maps/atlas@1.0.0/world/countries/countries-110m'),
]);
const { feature } = topojson;
const world = worldModule.default;

const countries = feature(world, world.objects.features).features;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function responsePins(locations) {
  return locations.flatMap((cluster, clusterIndex) => {
    const count = Math.max(1, Math.min(24, Number(cluster.count) || 1));
    return Array.from({ length: count }, (_, responseIndex) => {
      const angle = responseIndex * 2.399963 + clusterIndex * .41;
      const radius = responseIndex === 0 ? 0 : .055 * Math.sqrt(responseIndex);
      return {
        id: `${clusterIndex}-${responseIndex}`,
        coordinates: [Number(cluster.lon) + Math.cos(angle) * radius, Number(cluster.lat) + Math.sin(angle) * radius],
      };
    });
  });
}

function initGlobe(stage) {
  if (stage.dataset.globeReady === 'true') return;
  stage.dataset.globeReady = 'true';

  const data = stage.participationData || { locations: [] };
  const locations = Array.isArray(data.locations) ? data.locations : [];
  const pinsData = responsePins(locations);
  const width = Math.max(280, stage.clientWidth);
  const height = Math.max(260, stage.clientHeight);
  const navy = '#1d2f4e';
  const paper = '#f7f3eb';
  const brass = '#a77e36';

  const svg = d3.select(stage).append('svg').attr('viewBox', `0 0 ${width} ${height}`);
  const defs = svg.append('defs');
  defs.append('filter').attr('id', `curve-ink-blur-${Math.round(width)}`).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    .append('feGaussianBlur').attr('stdDeviation', 5.5);

  const projection = d3.geoOrthographic().rotate([28, -18]).translate([width / 2, height / 2]).scale(Math.min(width, height) * .39).clipAngle(90);
  const baseScale = projection.scale();
  const path = d3.geoPath(projection);
  const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('fill', paper).attr('stroke', navy).attr('stroke-opacity', .34).attr('stroke-width', .75);
  const outerBezel = svg.append('circle').attr('cx', width / 2).attr('cy', height / 2).attr('fill', 'none').attr('stroke', brass).attr('stroke-opacity', .34).attr('stroke-width', .7);
  const innerBezel = svg.append('circle').attr('cx', width / 2).attr('cy', height / 2).attr('fill', 'none').attr('stroke', navy).attr('stroke-opacity', .16).attr('stroke-width', .55);
  const graticule = svg.append('path').datum(d3.geoGraticule10()).attr('fill', 'none').attr('stroke', navy).attr('stroke-opacity', .105).attr('stroke-width', .55);
  const countryPaths = svg.selectAll('path.country').data(countries).join('path').attr('class', 'country').attr('fill', navy).attr('fill-opacity', .042).attr('stroke', navy).attr('stroke-opacity', .28).attr('stroke-width', .48);
  const inkLayer = svg.append('g').attr('filter', `url(#curve-ink-blur-${Math.round(width)})`);
  const pinLayer = svg.append('g');
  const coordinateLeft = svg.append('text').attr('x', 18).attr('y', 25).attr('fill', navy).attr('fill-opacity', .48).attr('font-family', 'Barlow Condensed, Arial Narrow, sans-serif').attr('font-size', 10).attr('letter-spacing', '.08em');
  const coordinateRight = svg.append('text').attr('x', width - 18).attr('y', 25).attr('text-anchor', 'end').attr('fill', navy).attr('fill-opacity', .48).attr('font-family', 'Barlow Condensed, Arial Narrow, sans-serif').attr('font-size', 10).attr('letter-spacing', '.08em');

  function render() {
    sphere.attr('d', path);
    outerBezel.attr('r', projection.scale() + 6);
    innerBezel.attr('r', Math.max(2, projection.scale() - 4));
    graticule.attr('d', path);
    countryPaths.attr('d', path);
    const center = projection.invert([width / 2, height / 2]);
    coordinateLeft.text(`${Math.abs(center[1]).toFixed(0)}° ${center[1] >= 0 ? 'N' : 'S'}`);
    coordinateRight.text(`${Math.abs(center[0]).toFixed(0)}° ${center[0] >= 0 ? 'E' : 'W'}`);

    const visibleFields = locations.map((item, index) => ({ item, index, point: projection([Number(item.lon), Number(item.lat)]) }))
      .filter(entry => entry.point && d3.geoDistance(center, [Number(entry.item.lon), Number(entry.item.lat)]) < Math.PI / 2);
    inkLayer.selectAll('circle').data(visibleFields, entry => entry.index).join('circle')
      .attr('cx', entry => entry.point[0]).attr('cy', entry => entry.point[1])
      .attr('r', entry => 7 + Math.sqrt(Math.max(1, Number(entry.item.count) || 1)) * 4.6)
      .attr('fill', navy).attr('opacity', entry => .026 + Math.min(.04, (Number(entry.item.count) || 1) * .004));

    const visiblePins = pinsData.map(item => ({ ...item, point: projection(item.coordinates) }))
      .filter(entry => entry.point && d3.geoDistance(center, entry.coordinates) < Math.PI / 2);
    const pins = pinLayer.selectAll('g.pin').data(visiblePins, entry => entry.id).join(enter => {
      const pin = enter.append('g').attr('class', 'pin');
      pin.append('line').attr('x1', 0).attr('x2', 0).attr('y1', 1).attr('y2', 3.3).attr('stroke', brass).attr('stroke-width', .65);
      pin.append('circle').attr('cy', 0).attr('r', 1.45).attr('fill', brass).attr('stroke', navy).attr('stroke-opacity', .2).attr('stroke-width', .35);
      return pin;
    });
    pins.attr('transform', entry => `translate(${entry.point[0]},${entry.point[1]})`).attr('opacity', .92);
  }

  let dragging = false;
  let velocityX = 0;
  let velocityY = 0;
  let resumeAt = performance.now() + 2200;
  let dirty = true;
  const requestRender = () => { dirty = true; };

  svg.call(d3.drag()
    .on('start', () => { dragging = true; velocityX = 0; velocityY = 0; })
    .on('drag', event => {
      const rotation = projection.rotate();
      velocityX = event.dx * .34;
      velocityY = -event.dy * .34;
      projection.rotate([rotation[0] + velocityX, Math.max(-65, Math.min(65, rotation[1] + velocityY)), rotation[2]]);
      requestRender();
    })
    .on('end', () => { dragging = false; resumeAt = performance.now() + 2600; }));

  function zoom(direction) {
    const factor = direction === 'in' ? 1.16 : 1 / 1.16;
    projection.scale(Math.max(baseScale * .72, Math.min(baseScale * 2.35, projection.scale() * factor)));
    resumeAt = performance.now() + 1800;
    requestRender();
  }
  stage.querySelectorAll('[data-globe-zoom]').forEach(button => button.addEventListener('click', () => zoom(button.dataset.globeZoom)));
  stage.parentElement.querySelectorAll('[data-globe-zoom]').forEach(button => button.addEventListener('click', () => zoom(button.dataset.globeZoom)));
  stage.addEventListener('wheel', event => {
    event.preventDefault();
    projection.scale(Math.max(baseScale * .72, Math.min(baseScale * 2.35, projection.scale() * Math.exp(-event.deltaY * .0012))));
    resumeAt = performance.now() + 1800;
    requestRender();
  }, { passive: false });

  let previous = performance.now();
  function frame(now) {
    const elapsed = Math.min(40, now - previous);
    previous = now;
    if (!dragging && (Math.abs(velocityX) > .003 || Math.abs(velocityY) > .003)) {
      const rotation = projection.rotate();
      projection.rotate([rotation[0] + velocityX, Math.max(-65, Math.min(65, rotation[1] + velocityY)), rotation[2]]);
      velocityX *= .93;
      velocityY *= .93;
      dirty = true;
    } else if (!dragging && now > resumeAt && !reducedMotion.matches) {
      const rotation = projection.rotate();
      projection.rotate([rotation[0] + elapsed * .0024, rotation[1], rotation[2]]);
      dirty = true;
    }
    if (dirty) { render(); dirty = false; }
    requestAnimationFrame(frame);
  }
  render();
  requestAnimationFrame(frame);
}

function initAll() {
  document.querySelectorAll('[data-participation-globe]').forEach(initGlobe);
}

initAll();
new MutationObserver(initAll).observe(document.documentElement, { childList: true, subtree: true });
})().catch((error) => {
  console.error('Participation globe could not load', error);
});
