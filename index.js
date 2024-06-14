const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config();
require('express-async-errors');
require('./startup/cloudinary');
const offer = require('./routes/offer');
const odd = require('./routes/odd');
const user = require('./routes/user');
const auth = require('./routes/auth');
const connectDb = require('./startup/db');
const deleteOutdatedOdds = require('./jobs/deleteOutdatedOdds');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.urlencoded({ extended: true }));

app.use('/api/offers', offer);
app.use('/api/odds', odd);
app.use('/api/users', user);
app.use('/api/auth', auth);

connectDb().then(() => {
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  deleteOutdatedOdds();
});
