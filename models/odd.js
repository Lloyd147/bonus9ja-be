const Joi = require('joi');
const mongoose = require('mongoose');

const oddSchema = new mongoose.Schema({
  eventDateTime: { type: String, required: true },
  league: { type: String, required: true },
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  suspendAll: Boolean,
  bestCalculatedOdds: {
    homeWin: { value: Number, bookie: String },
    draw: { value: Number, bookie: String },
    awayWin: { value: Number, bookie: String },
  },
  odds: {
    type: Map,
    of: {
      oneX: {
        homeWin: Number,
        draw: Number,
        awayWin: Number,
      },
      suspended: Boolean,
    },
  },
  order: { type: Number, min: 1 },
});

oddSchema.pre('save', async function (next) {
  if (!this.order) {
    const totalOdds = await Odd.countDocuments();
    this.order = totalOdds + 1;
  }
  next();
});

const Odd = mongoose.model('Odd', oddSchema);

function validateOdd(req) {
  const oneXSchema = Joi.object({
    homeWin: Joi.number(),
    draw: Joi.number(),
    awayWin: Joi.number(),
  });

  const bookieOddsSchema = Joi.object({
    oneX: oneXSchema,
    suspended: Joi.boolean(),
  });

  const schema = Joi.object({
    isEdit: Joi.boolean().optional(),
    eventDateTime: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    league: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    homeTeam: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    awayTeam: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    suspendAll: Joi.boolean(),
    odds: Joi.object().pattern(Joi.string(), bookieOddsSchema),
  });

  return schema.validate(req);
}

module.exports.Odd = Odd;
module.exports.validateOdd = validateOdd;
