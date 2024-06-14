const express = require('express');
const authorize = require('../middlewares/authorize');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { Offer, validateOffer, validateFileInput } = require('../models/offer');
const { validateOrder, validatePagination } = require('../lib/utils');
const { Odd } = require('../models/odd');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', async (req, res) => {
  const { error } = validatePagination(req.query);
  if (error) return res.status(400).send(error.details[0].message);

  const page = parseInt(req.query.pageNumber);
  const limit = parseInt(req.query.pageSize);

  const options = req.query.disabled ? {} : { enabled: true };

  const offers = await Offer.find(options)
    .sort('order')
    .limit(limit)
    .skip((page - 1) * limit);

  const totalOffers = await Offer.countDocuments();
  const totalPages = Math.ceil(totalOffers / limit);

  res.send({
    offers,
    currentPage: page,
    totalPages,
    totalOffers,
  });
});

router.post(
  '/',
  authorize,
  upload.fields([{ name: 'logo' }, { name: 'infoImage' }]),
  async (req, res) => {
    const { error } = validateOffer(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let images = {};
    if (req.files) {
      const { error } = validateFileInput(req.files);
      if (error) return res.status(400).send(error.details[0].message);
      for (file in req.files) {
        const imgFile = req.files[file]?.[0];
        const isLogo = file === 'logo';
        if (imgFile) {
          const imageData = await saveImage(imgFile, null, isLogo);
          if (imageData?.error)
            return res
              .status(500)
              .send('An error occurred while processing the images.');

          images[file] = imageData;
        }
      }
    }

    let offerData = extractOffer(req);
    if (images?.logo) offerData.logo = images.logo;
    if (images?.infoImage) offerData.infoImage = images.infoImage;

    const offer = new Offer(offerData);
    await offer.save();
    res.send(offer);
  }
);

router.put(
  '/:id',
  authorize,
  upload.fields([{ name: 'logo' }, { name: 'infoImage' }]),
  async (req, res) => {
    const { error } = validateOffer({ isEdit: true, ...req.body });
    if (error) return res.status(400).send(error.details[0].message);

    const offer = await Offer.findById(req.params.id);

    if (!offer)
      return res
        .status(404)
        .send('The offer with the given ID does not exist.');

    let images = {};
    if (req.files) {
      const { error } = validateFileInput(req.files);
      if (error) return res.status(400).send(error.details[0].message);
      for (file in req.files) {
        const imgFile = req.files[file]?.[0];
        const isLogo = file === 'logo';
        if (imgFile) {
          const imageData = await saveImage(
            imgFile,
            offer[file]?.cloudinaryId,
            isLogo
          );
          if (imageData?.error)
            return res
              .status(500)
              .send('An error occurred while processing the images.');

          images[file] = imageData;
        }
      }
    }

    let offerData = extractOffer(req);
    if (images?.logo) offerData.logo = images.logo;
    if (images?.infoImage) offerData.infoImage = images.infoImage;

    const updatedOffer = await Offer.findByIdAndUpdate(offer._id, offerData, {
      new: true,
    });
    res.send(updatedOffer);
  }
);

router.delete(
  '/:id',
  authorize,
  deleteBookieAndUpdateOdds,
  async (req, res) => {
    const offer = await Offer.findById(req.params.id);

    if (!offer)
      return res
        .status(404)
        .send('The offer with the given ID does not exist.');

    Offer.deleteOne({ _id: offer.id }).then(() => {
      if (offer?.logo?.cloudinaryId) deleteImage(offer.logo.cloudinaryId);
      if (offer?.infoImage?.cloudinaryId)
        deleteImage(offer.infoImage.cloudinaryId);
      Offer.updateMany(
        { order: { $gt: offer.order } },
        { $inc: { order: -1 } }
      ).then(() => {
        res.send(offer);
      });
    });
  }
);

router.get('/:id', async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer)
    return res.status(404).send('The offer with the given ID does not exist.');

  res.send(offer);
});

router.post('/reorder', authorize, async (req, res) => {
  const { error } = validateOrder(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const offer = await Offer.findById(req.body.id);

  if (!offer)
    return res.status(404).send('The offer with the given ID does not exist.');

  const originalOrder = offer.order;
  const newOrder = parseInt(req.body.order);

  if (originalOrder !== newOrder) {
    offer.order = newOrder;
    offer.save().then(async () => {
      if (newOrder > originalOrder) {
        await Offer.updateMany(
          {
            order: { $gt: originalOrder, $lte: newOrder },
            _id: { $ne: offer._id },
          },
          { $inc: { order: -1 } }
        ).then(async () => {
          res.send('Success');
        });
      } else if (newOrder < originalOrder) {
        await Offer.updateMany(
          {
            order: { $gte: newOrder, $lt: originalOrder },
            _id: { $ne: offer._id },
          },
          { $inc: { order: 1 } }
        ).then(async () => {
          res.send('Success');
        });
      }
    });
  }
});

// Handle multer error with a custom response
router.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError &&
    err.code === 'LIMIT_UNEXPECTED_FILE'
  ) {
    return res
      .status(400)
      .send(
        `Invalid file field: '${err.field}'. Only 'logo' and 'infoImage' are allowed.`
      );
  }
  next(err);
});

// update odds on offer deletion
async function deleteBookieAndUpdateOdds(req, res, next) {
  try {
    const offer = await Offer.findById(req.params.id);
    const bookieName = offer?.name;

    const oddsToUpdate = await Odd.find({
      [`odds.${bookieName}`]: { $exists: true },
    });

    const updatePromises = oddsToUpdate.map((odd) => {
      delete odd.odds[bookieName];
      return odd.save();
    });

    await Promise.all(updatePromises);

    next();
  } catch (error) {
    res.status(500).send(error.message);
  }
}

async function saveImage(file, cloudinaryId = null, isLogo = false) {
  try {
    const encodedImage = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${encodedImage}`;

    const transformation = isLogo
      ? [
          {
            width: 300,
            crop: 'scale',
          },
        ]
      : [];

    const uploadOptions = {
      ...(cloudinaryId && { public_id: cloudinaryId, overwrite: true }),
      transformation,
    };

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    return {
      cloudinaryId: result.public_id,
      imageUrl: result.secure_url,
    };
  } catch (error) {
    console.error('Error processing image and offer:', error);
    return { error: true };
  }
}

async function deleteImage(cloudinaryId) {
  try {
    const result = await cloudinary.uploader.destroy(cloudinaryId);
    if (result.result === 'ok') {
      return true;
    } else {
      throw new Error(result);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

function extractOffer(req) {
  return {
    name: req.body.name,
    playLink: req.body.playLink,
    enabled: req.body.enabled,
    promoInfo: req.body.promoInfo,
    rating: req.body.rating,
    review: req.body.review,
    upTo: req.body.upTo,
    wageringRollover: req.body.wageringRollover,
    minOdds: req.body.minOdds,
    keyInfo2: req.body.keyInfo2,
    keyInfo3: req.body.keyInfo3,
    terms: req.body.terms,
    pros: req.body.pros,
    cons: req.body.cons,
    minOddsForBonus: req.body.minOddsForBonus,
    selections: req.body.selections && JSON.parse(req.body.selections),
  };
}

module.exports = router;
