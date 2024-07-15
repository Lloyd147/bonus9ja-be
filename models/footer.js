const Joi = require('joi');
const mongoose = require('mongoose');

// Define Mongoose Schemas
const followUsSchema = new mongoose.Schema({
  link: { type: String, required: true },
  icon: { type: String, required: true }
});

const pageLinksSchema = new mongoose.Schema({
  link: { type: String, required: true }
});

const accordiansSchema = new mongoose.Schema({
  title: { type: String, required: true },
  title1: { type: String, required: true },
  text: { type: String, required: true }
});

const otherTextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  text: { type: String, required: true }
});

const footerSchema = new mongoose.Schema({
  status: { type: String, required: true, enum: ['active', 'inactive'] },
  name: { type: String, required: true },
  followUs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FollowUs' }],
  pageLinks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PageLinks' }],
  accordians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Accordians' }],
  otherText: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OtherText' }]
});

const FollowUs = mongoose.model('FollowUs', followUsSchema);
const PageLinks = mongoose.model('PageLinks', pageLinksSchema);
const Accordians = mongoose.model('Accordians', accordiansSchema);
const OtherText = mongoose.model('OtherText', otherTextSchema);
const Footer = mongoose.model('Footer', footerSchema);

// Joi Validation Schemas
const validateFollowUs = (req) => {
  const schema = Joi.object({
    link: Joi.string().uri().required(),
    icon: Joi.string().required()
  });
  return schema.validate(req);
};

const validatePageLinks = (req) => {
  const schema = Joi.object({
    link: Joi.string().uri().required()
  });
  return schema.validate(req);
};

const validateAccordians = (req) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    title1: Joi.string().required(),
    text: Joi.string().required()
  });
  return schema.validate(req);
};

const validateOtherText = (req) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    icon: Joi.string().required(),
    text: Joi.string().required()
  });
  return schema.validate(req);
};

const validateStatusUpdate = (req) => {
  const schema = Joi.object({
    status: Joi.string().valid('active', 'inactive').required()
  });
  return schema.validate(req);
};

const validateFooter = (req) => {
  const schema = Joi.object({
    status: Joi.string().valid('active', 'inactive').required(),
    name: Joi.string().required(),
    followUs: Joi.array(),
    pageLinks: Joi.array(),
    accordians: Joi.array(),
    otherText: Joi.array()
  });
  return schema.validate(req);
};

module.exports = {
  Footer,
  FollowUs,
  PageLinks,
  Accordians,
  OtherText,
  validateFollowUs,
  validatePageLinks,
  validateAccordians,
  validateOtherText,
  validateFooter,
  validateStatusUpdate
};
