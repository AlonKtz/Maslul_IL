/*
  A list of cities in Israel with their coordinates.

  I use this in two places:
    1. the city dropdown when you create an event or a listing. picking a city
       gives me the coordinates so the user never has to type numbers.
    2. the canvas map, which draws these as dots so you can see where things
       are before you draw an area.

  The coordinates are written [longitude, latitude] because that is the order
  GeoJSON and MongoDB expect. It is the opposite of how people normally say it.
*/
const CITIES = [
  { name: 'Tel Aviv', coordinates: [34.7818, 32.0853] },
  { name: 'Jerusalem', coordinates: [35.2137, 31.7683] },
  { name: 'Haifa', coordinates: [34.9896, 32.794] },
  { name: 'Rishon LeZion', coordinates: [34.8066, 31.973] },
  { name: 'Petah Tikva', coordinates: [34.8878, 32.084] },
  { name: 'Ashdod', coordinates: [34.6553, 31.8044] },
  { name: 'Netanya', coordinates: [34.8532, 32.3215] },
  { name: 'Beer Sheva', coordinates: [34.7915, 31.253] },
  { name: 'Holon', coordinates: [34.7725, 32.0117] },
  { name: 'Ramat Gan', coordinates: [34.8248, 32.0684] },
  { name: 'Herzliya', coordinates: [34.8447, 32.1624] },
  { name: 'Kfar Saba', coordinates: [34.907, 32.175] },
  { name: 'Raanana', coordinates: [34.8713, 32.1848] },
  { name: 'Modiin', coordinates: [35.0104, 31.8928] },
  { name: 'Ashkelon', coordinates: [34.5742, 31.6688] },
  { name: 'Bat Yam', coordinates: [34.75, 32.0171] },
  { name: 'Rehovot', coordinates: [34.8113, 31.8928] },
  { name: 'Hadera', coordinates: [34.9196, 32.434] },
  { name: 'Nazareth', coordinates: [35.2978, 32.7021] },
  { name: 'Tiberias', coordinates: [35.5308, 32.7959] },
  { name: 'Acre', coordinates: [35.0818, 32.9281] },
  { name: 'Safed', coordinates: [35.496, 32.965] },
  { name: 'Kiryat Gat', coordinates: [34.7642, 31.61] },
  { name: 'Dimona', coordinates: [35.0333, 31.0686] },
  { name: 'Eilat', coordinates: [34.9519, 29.5577] },
];

const CITY_NAMES = CITIES.map((c) => c.name);

// gives back the [lng, lat] for a city name, or null if the name is not in the list
function coordinatesOf(cityName) {
  const city = CITIES.find((c) => c.name === cityName);
  return city ? city.coordinates : null;
}

module.exports = { CITIES, CITY_NAMES, coordinatesOf };
