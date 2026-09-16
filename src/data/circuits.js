/*
  The circuits a race can be held on.

  Israel does not have many real race tracks, so these are the kinds of venue
  a meet would actually use: a drag strip, a couple of street circuits, an
  oval, a hill road, a rally stage and a kart track.

  Each one has a layout, which is a list of [x, y] points between 0 and 1.
  The event page scales those to whatever size the canvas is and draws the
  track, then animates a car going round it. closed says whether the last
  point joins back to the first (a lap) or the track is point to point (a
  drag strip or a hill climb, where you say how many runs instead of laps).

  lengthKm is used with the lap count to show the total race distance.
*/
const CIRCUITS = [
  {
    id: 'drag-strip',
    name: 'Quarter mile drag strip',
    raceTypes: ['Drag'],
    lengthKm: 0.402,
    closed: false,
    unit: 'runs',
    description: 'Straight line, standing start, two lanes. Timing lights at both ends.',
    layout: [[0.06, 0.55], [0.94, 0.55]],
  },
  {
    id: 'port-street',
    name: 'Port street circuit',
    raceTypes: ['Track', 'Time attack', 'Drift'],
    lengthKm: 2.8,
    closed: true,
    unit: 'laps',
    description: 'Temporary circuit through the port roads. Two long straights and a tight chicane.',
    layout: [
      [0.10, 0.30], [0.55, 0.22], [0.80, 0.30], [0.90, 0.48], [0.82, 0.62],
      [0.68, 0.60], [0.60, 0.72], [0.40, 0.78], [0.22, 0.70], [0.12, 0.52],
    ],
  },
  {
    id: 'desert-oval',
    name: 'Desert oval',
    raceTypes: ['Track'],
    lengthKm: 1.6,
    closed: true,
    unit: 'laps',
    description: 'Simple banked oval on packed sand. Fast and easy to follow from the stands.',
    layout: [
      [0.20, 0.30], [0.50, 0.22], [0.80, 0.30], [0.90, 0.50], [0.80, 0.70],
      [0.50, 0.78], [0.20, 0.70], [0.10, 0.50],
    ],
  },
  {
    id: 'kart-track',
    name: 'Kart track',
    raceTypes: ['Track', 'Time attack'],
    lengthKm: 1.1,
    closed: true,
    unit: 'laps',
    description: 'Tight and technical, a lot of second gear. Good for time attack in small cars.',
    layout: [
      [0.10, 0.60], [0.18, 0.30], [0.35, 0.25], [0.42, 0.42], [0.55, 0.35],
      [0.70, 0.22], [0.88, 0.32], [0.84, 0.52], [0.68, 0.55], [0.72, 0.72],
      [0.52, 0.80], [0.35, 0.70], [0.25, 0.78],
    ],
  },
  {
    id: 'mountain-hillclimb',
    name: 'Mountain hill climb',
    raceTypes: ['Hillclimb'],
    lengthKm: 4.5,
    closed: false,
    unit: 'runs',
    description: 'Closed mountain road, bottom to top. One car at a time against the clock.',
    layout: [
      [0.08, 0.85], [0.22, 0.80], [0.18, 0.66], [0.36, 0.60], [0.30, 0.46],
      [0.50, 0.42], [0.46, 0.30], [0.66, 0.28], [0.72, 0.16], [0.90, 0.12],
    ],
  },
  {
    id: 'forest-stage',
    name: 'Forest rally stage',
    raceTypes: ['Rally'],
    lengthKm: 12,
    closed: false,
    unit: 'passes',
    description: 'Gravel forest road, co driver reading notes. Fast crests and blind corners.',
    layout: [
      [0.05, 0.20], [0.20, 0.28], [0.30, 0.18], [0.42, 0.34], [0.38, 0.50],
      [0.55, 0.56], [0.62, 0.42], [0.76, 0.48], [0.80, 0.64], [0.95, 0.80],
    ],
  },
  {
    id: 'skid-pad',
    name: 'Drift skid pad',
    raceTypes: ['Drift'],
    lengthKm: 0.8,
    closed: true,
    unit: 'laps',
    description: 'Wide open tarmac with a figure of eight marked out. Bring spare rear tyres.',
    layout: [
      [0.30, 0.50], [0.20, 0.32], [0.35, 0.22], [0.50, 0.40], [0.65, 0.22],
      [0.80, 0.32], [0.70, 0.50], [0.80, 0.68], [0.65, 0.78], [0.50, 0.60],
      [0.35, 0.78], [0.20, 0.68],
    ],
  },
  {
    id: 'industrial-loop',
    name: 'Industrial zone loop',
    raceTypes: ['Track', 'Time attack', 'Drift'],
    lengthKm: 2.2,
    closed: true,
    unit: 'laps',
    description: 'Wide roads between the warehouses, closed off for the evening. Square corners.',
    layout: [
      [0.12, 0.25], [0.60, 0.25], [0.60, 0.45], [0.88, 0.45], [0.88, 0.75],
      [0.35, 0.75], [0.35, 0.55], [0.12, 0.55],
    ],
  },
];

const CIRCUIT_IDS = CIRCUITS.map((c) => c.id);

function circuitById(id) {
  return CIRCUITS.find((c) => c.id === id) || null;
}

module.exports = { CIRCUITS, CIRCUIT_IDS, circuitById };
