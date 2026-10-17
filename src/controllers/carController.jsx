const Car = require('../models/Car');
const { contains, paginate, num } = require('../utils/query');

/*
  The garage. Everything to do with cars.

  This has the full set of actions the project needs on every model, so
  create, update, delete, list and search.

  The rule here is ownership. You can only edit or delete a car that is in
  your own garage. Site admins are the exception, they can remove any car.
*/

// GET /garage. this only renders the empty page, the cars come later over ajax
function showGarage(req, res) {
  res.render('pages/garage', { title: 'Garage', categories: Car.CATEGORIES });
}

// ---------------------------------------------------------------- LIST
// GET /api/cars            -> every car (community garage)
// GET /api/cars?mine=true  -> only the logged-in member's cars
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.query.mine === 'true') {
      filter.owner = req.currentUser._id;
    } else if (req.query.owner) {
      filter.owner = req.query.owner;
    }

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .populate('owner', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Car.countDocuments(filter),
    ]);

    res.json({ cars, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/cars/search
// the big search. it takes make, model, category, colour, a year range and a
// horsepower range, so eight parameters in total.
// every one is optional, and the ones you do fill in all have to match.
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { make, model, category, color, yearFrom, yearTo, hpMin, hpMax } = req.query;
    const filter = {};

    if (make && make.trim()) filter.make = contains(make);
    if (model && model.trim()) filter.model = contains(model);
    if (color && color.trim()) filter.color = contains(color);

    // only accept a category from my own list, otherwise just ignore it
    if (category && Car.CATEGORIES.includes(category)) filter.category = category;

    // Year range
    const yFrom = num(yearFrom);
    const yTo = num(yearTo);
    if (yFrom !== null || yTo !== null) {
      filter.year = {};
      if (yFrom !== null) filter.year.$gte = yFrom;
      if (yTo !== null) filter.year.$lte = yTo;
    }

    // Horsepower range
    const hFrom = num(hpMin);
    const hTo = num(hpMax);
    if (hFrom !== null || hTo !== null) {
      filter.horsepower = {};
      if (hFrom !== null) filter.horsepower.$gte = hFrom;
      if (hTo !== null) filter.horsepower.$lte = hTo;
    }

    const [cars, total] = await Promise.all([
      Car.find(filter)
        .populate('owner', 'username displayName avatar')
        .sort({ year: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Car.countDocuments(filter),
    ]);

    res.json({ cars, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- READ ONE
// GET /api/cars/:id
async function getOne(req, res, next) {
  try {
    const car = await Car.findById(req.params.id).populate('owner', 'username displayName avatar');
    if (!car) return res.status(404).json({ error: 'Car not found.' });
    res.json({ car });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- CREATE
// POST /api/cars
async function create(req, res, next) {
  try {
    const { make, model, year, category, engine, horsepower, color, description, photo } = req.body;

    const car = await Car.create({
      owner: req.currentUser._id,
      make,
      model,
      year,
      category,
      engine,
      horsepower,
      color,
      description,
      photo: photo || undefined,
    });

    await car.populate('owner', 'username displayName avatar');
    res.status(201).json({ ok: true, car });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
// PUT /api/cars/:id
async function update(req, res, next) {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found.' });

    if (!car.owner.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit cars in your own garage.' });
    }

    // the only fields the browser is allowed to change. anything else it sends is ignored
    const allowed = ['make', 'model', 'year', 'category', 'engine', 'horsepower', 'color', 'description', 'photo'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) car[field] = req.body[field];
    });

    await car.save(); // runs schema validation
    await car.populate('owner', 'username displayName avatar');
    res.json({ ok: true, car });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
// DELETE /api/cars/:id
async function remove(req, res, next) {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Car not found.' });

    if (!car.owner.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete cars from your own garage.' });
    }

    await car.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { showGarage, list, search, getOne, create, update, remove };
