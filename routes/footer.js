const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { Footer, FollowUs, PageLinks, Accordians, OtherText, validateFooter, validateStatusUpdate, validatePageLinks, validateAccordians, validateOtherText } = require('../models/footer'); // Adjust the path as necessary
const authorize = require('../middlewares/authorize');

router.use(express.json());

router.get('/footers', async (req, res) => {
  try {
    const footers = await Footer.find().populate('followUs').populate('pageLinks').populate('accordians').populate('otherText');
    res.send(footers);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// CREATE a new Footer
router.post('', authorize, async (req, res) => {
  const { error } = validateFooter(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { followUs, pageLinks, accordians, otherText, ...footerData } = req.body;

    const followUsDocs = await FollowUs.insertMany(followUs, { session });
    const pageLinksDocs = await PageLinks.insertMany(pageLinks, { session });
    const accordiansDocs = await Accordians.insertMany(accordians, { session });
    const otherTextDocs = await OtherText.insertMany(otherText, { session });

    const footer = new Footer({
      ...footerData,
      followUs: followUsDocs.map((doc) => doc._id),
      pageLinks: pageLinksDocs.map((doc) => doc._id),
      accordians: accordiansDocs.map((doc) => doc._id),
      otherText: otherTextDocs.map((doc) => doc._id)
    });

    await footer.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).send(footer);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: err.message });
  }
});

// GET all Footers
router.get('', authorize, async (req, res) => {
  try {
    const footers = await Footer.find().select('status name');
    res.send(footers);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// GET a specific Footer with associated details
router.get('/:id', authorize, async (req, res) => {
  try {
    const footer = await Footer.findById(req.params.id).populate('followUs').populate('pageLinks').populate('accordians').populate('otherText');
    if (!footer) return res.status(404).send('Footer not found');
    res.send(footer);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// UPDATE a specific Footer and its details
router.put('/:id', authorize, async (req, res) => {
  const { error } = validateFooter(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const footerId = req.params.id;
    const { followUs, pageLinks, accordians, otherText, ...footerData } = req.body;

    const footer = await Footer.findById(footerId).session(session);
    if (!footer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send('Footer not found');
    }

    // Update FollowUs
    if (followUs) {
      await FollowUs.deleteMany({ _id: { $in: footer.followUs } }, { session });
      const followUsDocs = await FollowUs.insertMany(followUs, { session });
      footer.followUs = followUsDocs.map((doc) => doc._id);
    }

    // Update PageLinks
    if (pageLinks) {
      await PageLinks.deleteMany({ _id: { $in: footer.pageLinks } }, { session });
      const pageLinksDocs = await PageLinks.insertMany(pageLinks, { session });
      footer.pageLinks = pageLinksDocs.map((doc) => doc._id);
    }

    // Update Accordians
    if (accordians) {
      await Accordians.deleteMany({ _id: { $in: footer.accordians } }, { session });
      const accordiansDocs = await Accordians.insertMany(accordians, { session });
      footer.accordians = accordiansDocs.map((doc) => doc._id);
    }

    // Update OtherText
    if (otherText) {
      await OtherText.deleteMany({ _id: { $in: footer.otherText } }, { session });
      const otherTextDocs = await OtherText.insertMany(otherText, { session });
      footer.otherText = otherTextDocs.map((doc) => doc._id);
    }

    Object.assign(footer, footerData);

    await footer.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.send(footer);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ error: err.message });
  }
});

// DELETE a specific Footer and its associated details
router.delete('/:id', authorize, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const footer = await Footer.findById(req.params.id).session(session);
    if (!footer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send('Footer not found');
    }

    await FollowUs.deleteMany({ _id: { $in: footer.followUs } }, { session });
    await PageLinks.deleteMany({ _id: { $in: footer.pageLinks } }, { session });
    await Accordians.deleteMany({ _id: { $in: footer.accordians } }, { session });
    await OtherText.deleteMany({ _id: { $in: footer.otherText } }, { session });

    await footer.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.send(footer);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send({ error: err.message });
  }
});

router.put('/:id/status', authorize, async (req, res) => {
  const { error } = validateStatusUpdate(req.body);
  if (error) return res.status(400).send({ error: error.details[0].message });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const footerId = req.params.id;
    const { status } = req.body;

    const footer = await Footer.findById(footerId).session(session);
    if (!footer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).send('Footer not found');
    }

    footer.status = status;
    await footer.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.send(footer);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
