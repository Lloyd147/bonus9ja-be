const cron = require('node-cron');
const { Odd } = require('../models/odd');

const deleteOutdatedOdds = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const outdatedOdds = await Odd.find({
        eventDateTime: { $lt: now.toISOString() },
      });

      if (outdatedOdds?.length > 0) {
        for (const odd of outdatedOdds) {
          await Odd.deleteOne({ _id: odd._id });
          await Odd.updateMany(
            { order: { $gt: odd.order } },
            { $inc: { order: -1 } }
          );
        }
      }
    } catch (err) {
      console.error('Error processing outdated odds:', err);
    }
  });
};

module.exports = deleteOutdatedOdds;
