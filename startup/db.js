const mongoose = require('mongoose');
const { Footer, FollowUs, PageLinks, Accordians, OtherText } = require('../models/footer');

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log('Connected to DB');
  } catch (error) {
    console.log('Cannot connect to DB. Error: ', error);
  }
}

// const seedData = async () => {
//   try {
//     // Clean up existing records
//     await Footer.deleteMany({});
//     await FollowUs.deleteMany({});
//     await PageLinks.deleteMany({});
//     await Accordians.deleteMany({});
//     await OtherText.deleteMany({});
//     // Create FollowUs records
//     const followUs1 = new FollowUs({ link: 'https://twitter.com', icon: 'twitter-icon.svg' });
//     const followUs2 = new FollowUs({ link: 'https://facebook.com', icon: 'facebook-icon.svg' });
//     // Create PageLinks records
//     const pageLink1 = new PageLinks({ link: 'https://example.com/about' });
//     const pageLink2 = new PageLinks({ link: 'https://example.com/contact' });
//     // Create Accordians records
//     const accordian1 = new Accordians({ title: 'FAQ', title1: 'General Questions', text: 'Here are some frequently asked questions' });
//     // Create OtherText records
//     const otherText1 = new OtherText({ title: 'Address', icon: 'address-icon.svg', text: '1234 Street, City, Country' });
//     // Save records
//     await followUs1.save();
//     await followUs2.save();
//     await pageLink1.save();
//     await pageLink2.save();
//     await accordian1.save();
//     await otherText1.save();
//     // Create a Footer record with references
//     const footer = new Footer({
//       status: 'active',
//       name: 'Main Footer',
//       followUs: [followUs1._id, followUs2._id],
//       pageLinks: [pageLink1._id, pageLink2._id],
//       accordians: [accordian1._id],
//       otherText: [otherText1._id]
//     });
//     await footer.save();
//     console.log('Data seeded successfully!');
//   } catch (error) {
//     console.error('Failed to seed data:', error);
//   }
// };
// seedData();
module.exports = connectDb;
