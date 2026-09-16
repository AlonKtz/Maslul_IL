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
  { name: 'Tel Aviv', major: true, coordinates: [34.7818, 32.0853] },
  { name: 'Jerusalem', major: true, coordinates: [35.2137, 31.7683] },
  { name: 'Haifa', major: true, coordinates: [34.9896, 32.794] },
  { name: 'Rishon LeZion', coordinates: [34.8066, 31.973] },
  { name: 'Petah Tikva', coordinates: [34.8878, 32.084] },
  { name: 'Ashdod', major: true, coordinates: [34.6553, 31.8044] },
  { name: 'Netanya', major: true, coordinates: [34.8532, 32.3215] },
  { name: 'Beer Sheva', major: true, coordinates: [34.7915, 31.253] },
  { name: 'Holon', coordinates: [34.7725, 32.0117] },
  { name: 'Ramat Gan', coordinates: [34.8248, 32.0684] },
  { name: 'Herzliya', coordinates: [34.8447, 32.1624] },
  { name: 'Kfar Saba', coordinates: [34.907, 32.175] },
  { name: 'Raanana', coordinates: [34.8713, 32.1848] },
  { name: 'Modiin', major: true, coordinates: [35.0104, 31.8928] },
  { name: 'Ashkelon', major: true, coordinates: [34.5742, 31.6688] },
  { name: 'Bat Yam', coordinates: [34.75, 32.0171] },
  { name: 'Rehovot', coordinates: [34.8113, 31.8928] },
  { name: 'Hadera', major: true, coordinates: [34.9196, 32.434] },
  { name: 'Nazareth', major: true, coordinates: [35.2978, 32.7021] },
  { name: 'Tiberias', major: true, coordinates: [35.5308, 32.7959] },
  { name: 'Acre', coordinates: [35.0818, 32.9281] },
  { name: 'Safed', major: true, coordinates: [35.496, 32.965] },
  { name: 'Kiryat Gat', coordinates: [34.7642, 31.61] },
  { name: 'Dimona', major: true, coordinates: [35.0333, 31.0686] },
  { name: 'Eilat', major: true, coordinates: [34.9519, 29.5577] },
  { name: 'Nahariya', major: true, coordinates: [35.0947, 33.0069] },
  { name: 'Kiryat Shmona', major: true, coordinates: [35.5697, 33.2075] },
  { name: 'Karmiel', coordinates: [35.3047, 32.9153] },
  { name: 'Afula', major: true, coordinates: [35.2902, 32.6078] },
  { name: 'Zichron Yaakov', coordinates: [34.9522, 32.5722] },
  { name: 'Beit Shemesh', coordinates: [34.9886, 31.7314] },
  { name: 'Lod', coordinates: [34.8903, 31.9467] },
  { name: 'Yavne', coordinates: [34.7397, 31.8781] },
  { name: 'Sderot', coordinates: [34.5964, 31.525] },
  { name: 'Ofakim', coordinates: [34.6203, 31.3142] },
  { name: 'Arad', coordinates: [35.2125, 31.2589] },
  { name: 'Mitzpe Ramon', major: true, coordinates: [34.8014, 30.6103] },
];

const CITY_NAMES = CITIES.map((c) => c.name);

// gives back the [lng, lat] for a city name, or null if the name is not in the list
function coordinatesOf(cityName) {
  const city = CITIES.find((c) => c.name === cityName);
  return city ? city.coordinates : null;
}

module.exports = { CITIES, CITY_NAMES, coordinatesOf };
