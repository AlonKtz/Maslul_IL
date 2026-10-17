const Listing = require('../models/Listing');
const { CITIES, coordinatesOf } = require('../data/cities');
const { contains, paginate, num } = require('../utils/query');

/*
  The marketplace. Everything to do with items people are selling.

  Full create, update, delete, list and search, plus marking something as sold,
  likes and comments.

  The rule is that only the seller can edit or delete their own listing.
  Site admins can as well.
*/

// GET /market, renders the empty page
function showMarket(req, res) {
  res.render('pages/market', {
    title: 'Marketplace',
    cities: CITIES.map((c) => c.name),
    categories: Listing.CATEGORIES,
    conditions: Listing.CONDITIONS,
  });
}

// GET /market/:id, one item on its own page
async function showListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'username displayName avatar location')
      .populate('comments.author', 'username displayName avatar');

    if (!listing) {
      return res.status(404).render('pages/error', {
        title: 'Listing not found',
        message: 'That item is no longer listed.',
      });
    }

    res.render('pages/listing', {
      title: listing.title,
      listing,
      isSeller: listing.seller._id.equals(req.currentUser._id),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIST
// GET /api/listings            -> everything available
// GET /api/listings?mine=true  -> my own listings (including sold)
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.query.mine === 'true') {
      filter.seller = req.currentUser._id;
    } else {
      // things that already sold are hidden from the public list unless asked for
      if (req.query.includeSold !== 'true') filter.status = 'available';
    }
    if (req.query.seller) filter.seller = req.query.seller;

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/listings/search
// takes keyword, category, condition, city, a price range, and make, model
// and a year range for when the item is a whole car.
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const {
      keyword, category, condition, city,
      priceMin, priceMax, make, model, yearFrom, yearTo, includeSold,
    } = req.query;
    const filter = {};

    if (keyword && keyword.trim()) {
      filter.$or = [{ title: contains(keyword) }, { description: contains(keyword) }];
    }
    if (category && Listing.CATEGORIES.includes(category)) filter.category = category;
    if (condition && Listing.CONDITIONS.includes(condition)) filter.condition = condition;
    if (city && coordinatesOf(city)) filter.city = city;
    if (make && make.trim()) filter.make = contains(make);
    if (model && model.trim()) filter.model = contains(model);
    if (includeSold !== 'true') filter.status = 'available';

    const pMin = num(priceMin);
    const pMax = num(priceMax);
    if (pMin !== null || pMax !== null) {
      filter.price = {};
      if (pMin !== null) filter.price.$gte = pMin;
      if (pMax !== null) filter.price.$lte = pMax;
    }

    const yFrom = num(yearFrom);
    const yTo = num(yearTo);
    if (yFrom !== null || yTo !== null) {
      filter.year = {};
      if (yFrom !== null) filter.year.$gte = yFrom;
      if (yTo !== null) filter.year.$lte = yTo;
    }

    // newest first unless the user picked a price sort
    let sort = { createdAt: -1 };
    if (req.query.sort === 'price-asc') sort = { price: 1 };
    if (req.query.sort === 'price-desc') sort = { price: -1 };

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'username displayName avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Listing.countDocuments(filter),
    ]);

    res.json({ listings, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- AREA SEARCH
// POST /api/listings/area. exactly the same idea as the events one, it finds
// items for sale inside the shape the user drew on the map.
async function searchArea(req, res, next) {
  try {
    const { polygon, category, priceMax } = req.body;

    if (!Array.isArray(polygon) || polygon.length < 3) {
      return res.status(400).json({ error: 'Draw an area with at least three points.' });
    }

    const clean = polygon.map((p) => {
      if (!Array.isArray(p) || p.length !== 2) {
        throw Object.assign(new Error('Bad point'), { status: 400, expose: true });
      }
      const lng = Number(p[0]);
      const lat = Number(p[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw Object.assign(new Error('Point is outside the world'), { status: 400, expose: true });
      }
      return [lng, lat];
    });

    const first = clean[0];
    const last = clean[clean.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) clean.push([first[0], first[1]]);

    const filter = {
      status: 'available',
      location: { $geoWithin: { $geometry: { type: 'Polygon', coordinates: [clean] } } },
    };

    if (category && Listing.CATEGORIES.includes(category)) filter.category = category;
    const pMax = num(priceMax);
    if (pMax !== null) filter.price = { $lte: pMax };

    const listings = await Listing.find(filter)
      .populate('seller', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ listings, total: listings.length });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- CREATE
async function create(req, res, next) {
  try {
    const { title, description, price, category, condition, city, make, model, year, photos } = req.body;

    const coordinates = coordinatesOf(city);
    if (!coordinates) return res.status(400).json({ error: 'Pick a city from the list.' });

    const listing = await Listing.create({
      seller: req.currentUser._id,
      title,
      description,
      price,
      category,
      condition,
      city,
      location: { type: 'Point', coordinates },
      make: make || '',
      model: model || '',
      year: year || null,
      photos: Array.isArray(photos) ? photos.slice(0, 6) : [],
    });

    await listing.populate('seller', 'username displayName avatar');
    res.status(201).json({ ok: true, listing });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
async function update(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own listings.' });
    }

    ['title', 'description', 'price', 'category', 'condition', 'make', 'model', 'year', 'status'].forEach((f) => {
      if (req.body[f] !== undefined) listing[f] = req.body[f];
    });

    if (req.body.city !== undefined) {
      const coordinates = coordinatesOf(req.body.city);
      if (!coordinates) return res.status(400).json({ error: 'Pick a city from the list.' });
      listing.city = req.body.city;
      listing.location = { type: 'Point', coordinates };
    }

    if (Array.isArray(req.body.photos)) listing.photos = req.body.photos.slice(0, 6);

    await listing.save();
    await listing.populate('seller', 'username displayName avatar');
    res.json({ ok: true, listing });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
async function remove(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own listings.' });
    }

    await listing.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings/:id/sold. the seller marks it sold, or puts it back on sale
async function toggleSold(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (!listing.seller.equals(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Only the seller can change this.' });
    }

    listing.status = listing.status === 'sold' ? 'available' : 'sold';
    await listing.save();
    res.json({ ok: true, status: listing.status });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIKE / COMMENT
async function toggleLike(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const index = listing.likes.findIndex((id) => id.equals(req.currentUser._id));
    if (index === -1) listing.likes.push(req.currentUser._id);
    else listing.likes.splice(index, 1);

    await listing.save();
    res.json({ ok: true, likes: listing.likes.length, liked: index === -1 });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    listing.comments.push({ author: req.currentUser._id, text: req.body.text });
    await listing.save();
    await listing.populate('comments.author', 'username displayName avatar');

    res.status(201).json({ ok: true, comments: listing.comments });
  } catch (err) {
    next(err);
  }
}

async function removeComment(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const comment = listing.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    const allowed =
      comment.author.equals(req.currentUser._id) ||
      listing.seller.equals(req.currentUser._id) ||
      req.currentUser.role === 'admin';
    if (!allowed) return res.status(403).json({ error: 'You cannot delete this comment.' });

    comment.deleteOne();
    await listing.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showMarket,
  showListing,
  list,
  search,
  searchArea,
  create,
  update,
  remove,
  toggleSold,
  toggleLike,
  addComment,
  removeComment,
};
