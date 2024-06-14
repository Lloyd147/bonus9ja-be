const Joi = require('joi');

function validateOrder(req) {
  const schema = Joi.object({
    id: Joi.string().required(),
    order: Joi.number().min(1).required(),
  });

  return schema.validate(req);
}

function validatePagination(req) {
  const schema = Joi.object({
    pageNumber: Joi.number().min(1).required(),
    pageSize: Joi.number().min(1).required(),
    disabled: Joi.boolean(),
  });

  return schema.validate(req);
}

function findBestOdds(odds) {
  const bestOdds = {
    homeWin: { value: 0, bookie: '' },
    draw: { value: 0, bookie: '' },
    awayWin: { value: 0, bookie: '' },
  };

  for (const bookie in odds) {
    if (odds.hasOwnProperty(bookie)) {
      const bookieData = odds[bookie];

      if (!bookieData?.oneX) return { error: 'oneX not provided' };

      if (!bookieData.suspended) {
        const { oneX } = bookieData;

        if (oneX.homeWin > bestOdds.homeWin.value) {
          bestOdds.homeWin.value = oneX.homeWin;
          bestOdds.homeWin.bookie = bookie;
        }

        if (oneX.draw > bestOdds.draw.value) {
          bestOdds.draw.value = oneX.draw;
          bestOdds.draw.bookie = bookie;
        }

        if (oneX.awayWin > bestOdds.awayWin.value) {
          bestOdds.awayWin.value = oneX.awayWin;
          bestOdds.awayWin.bookie = bookie;
        }
      }
    }
  }

  return bestOdds;
}

module.exports.validateOrder = validateOrder;
module.exports.validatePagination = validatePagination;
module.exports.findBestOdds = findBestOdds;
