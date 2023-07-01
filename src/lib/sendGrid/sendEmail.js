import sendGrid from './client';

/**
 * @param {string} subject
 * @param {string} html
 * @returns {Promise<void>}
 */
export default async function sendEmail(subject, html) {
  const msg = {
    to: process.env.SENDGRID_TO_EMAIL, // Your recipient
    from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender
    subject,
    html,
  };

  await sendGrid
    .send(msg)
    .then(() => {
      console.log(`💌 Sent email "${subject}"\n`);
    })
    .catch(error => {
      console.error(`🚨 Error sending email "${subject}":`, error, '\n');
    });
}
