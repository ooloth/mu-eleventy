const dotenv = require('dotenv');
const sendGrid = require('@sendgrid/mail');

dotenv.config();

sendGrid.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = sendGrid;
