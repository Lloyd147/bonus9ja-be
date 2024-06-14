const express = require('express');
const authorize = require('../middlewares/authorize');
const { Odd, validateOdd } = require('../models/odd');
const {
  validatePagination,
  findBestOdds,
  validateOrder,
} = require('../lib/utils');

const router = express.Router();

router.get('/', async (req, res) => {
  const { error } = validatePagination(req.query);
  if (error) return res.status(400).send(error.details[0].message);

  const currentPage = parseInt(req.query.pageNumber);
  const limit = parseInt(req.query.pageSize);

  const options = req.query.disabled ? {} : { suspendAll: false };

  const odds = await Odd.find(options)
    .sort('order')
    .limit(limit)
    .skip((currentPage - 1) * limit);

  const totalOdds = await Odd.countDocuments();
  const totalPages = Math.ceil(totalOdds / limit);

  res.send({
    odds,
    currentPage,
    totalPages,
    totalOdds,
  });
});

router.post('/', authorize, async (req, res) => {
  const { error } = validateOdd(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let oddData = extractOdd(req);

  const bestCalculatedOdds = findBestOdds(oddData?.odds);

  if (bestCalculatedOdds?.error)
    res.status(400).send(bestCalculatedOdds?.error);

  oddData = { ...oddData, bestCalculatedOdds };

  const odd = new Odd(oddData);
  await odd.save();
  res.send(odd);
});

router.put('/:id', authorize, async (req, res) => {
  const { error } = validateOdd({ isEdit: true, ...req.body });
  if (error) return res.status(400).send(error.details[0].message);

  const odd = await Odd.findById(req.params.id);

  if (!odd)
    return res.status(404).send('The odd with the given ID does not exist.');

  let oddData = extractOdd(req);

  const bestCalculatedOdds = findBestOdds(oddData?.odds);

  if (bestCalculatedOdds?.error)
    res.status(400).send(bestCalculatedOdds?.error);

  oddData = { ...oddData, bestCalculatedOdds };

  const updatedOdd = await Odd.findByIdAndUpdate(odd._id, oddData, {
    new: true,
  });

  res.send(updatedOdd);
});

router.delete('/:id', authorize, async (req, res) => {
  const odd = await Odd.findById(req.params.id);

  if (!odd)
    return res.status(404).send('The odd with the given ID does not exist.');

  Odd.deleteOne({ _id: odd.id }).then(() => {
    Odd.updateMany({ order: { $gt: odd.order } }, { $inc: { order: -1 } }).then(
      () => {
        res.send(odd);
      }
    );
  });
});

router.post('/reorder', authorize, async (req, res) => {
  const { error } = validateOrder(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const odd = await Odd.findById(req.body.id);

  if (!odd)
    return res.status(404).send('The odd with the given ID does not exist.');

  const originalOrder = odd.order;
  const newOrder = parseInt(req.body.order);

  if (originalOrder !== newOrder) {
    odd.order = newOrder;
    odd.save().then(async () => {
      if (newOrder > originalOrder) {
        await Odd.updateMany(
          {
            order: { $gt: originalOrder, $lte: newOrder },
            _id: { $ne: odd._id },
          },
          { $inc: { order: -1 } }
        ).then(async () => {
          res.send('Success');
        });
      } else if (newOrder < originalOrder) {
        await Odd.updateMany(
          {
            order: { $gte: newOrder, $lt: originalOrder },
            _id: { $ne: odd._id },
          },
          { $inc: { order: 1 } }
        ).then(async () => {
          res.send('Success');
        });
      }
    });
  }
});

function extractOdd(req) {
  return {
    eventDateTime: req.body.eventDateTime,
    league: req.body.league,
    homeTeam: req.body.homeTeam,
    awayTeam: req.body.awayTeam,
    suspendAll: req.body.suspendAll,
    odds: req.body.odds,
  };
}

module.exports = router;
