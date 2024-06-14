const Joi = require('joi');
const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
  cloudinaryId: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const offerSchema = new mongoose.Schema({
  cons: { type: String },
  enabled: { type: Boolean, required: true },
  infoImage: logoSchema,
  upTo: { type: String },
  wageringRollover: { type: String },
  minOdds: { type: String },
  keyInfo2: { type: String },
  keyInfo3: { type: String },
  logo: logoSchema,
  name: { type: String, required: true },
  order: { type: Number, min: 1 },
  playLink: { type: String, required: true },
  promoInfo: { type: String, maxLength: 20, required: true },
  pros: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  review: { type: String },
  terms: { type: String },
  minOddsForBonus: { type: Number },
  selections: {
    type: Map,
    of: {
      type: String,
    },
  },
});

offerSchema.pre('save', async function (next) {
  if (!this.order) {
    const totalOffers = await Offer.countDocuments();
    this.order = totalOffers + 1;
  }
  next();
});

const Offer = mongoose.model('Offer', offerSchema);

function validateOffer(req) {
  const schema = Joi.object({
    isEdit: Joi.boolean().optional(),
    name: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    enabled: Joi.boolean().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    playLink: Joi.string().when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    promoInfo: Joi.string().max(20).when('isEdit', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    pros: Joi.string(),
    cons: Joi.string(),
    rating: Joi.number().min(0).max(5),
    review: Joi.string(),
    upTo: Joi.string(),
    wageringRollover: Joi.string(),
    minOdds: Joi.string(),
    keyInfo2: Joi.string(),
    keyInfo3: Joi.string(),
    terms: Joi.string(),
    minOddsForBonus: Joi.number(),
    selections: Joi.string(),
  });

  return schema.validate(req);
}

const validateFileInput = (req) => {
  const schema = Joi.object({
    logo: Joi.array().items(
      Joi.object({
        fieldname: Joi.string().valid('logo').required(),
        mimetype: Joi.string()
          .valid('image/png', 'image/jpg', 'image/jpeg')
          .required(),
      }).unknown()
    ),
    infoImage: Joi.array().items(
      Joi.object({
        fieldname: Joi.string().valid('infoImage').required(),
        mimetype: Joi.string()
          .valid('image/png', 'image/jpg', 'image/jpeg')
          .required(),
      }).unknown()
    ),
  });

  return schema.validate(req);
};

module.exports.Offer = Offer;
module.exports.validateOffer = validateOffer;
module.exports.validateFileInput = validateFileInput;
