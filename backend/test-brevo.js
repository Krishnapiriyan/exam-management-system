// test-brevo.js
// Run this with: node test-brevo.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testBrevo() {
  console.log('--- Brevo (SendinBlue) Verification Script ---');
  console.log('Provider:', process.env.EMAIL_PROVIDER);
  console.log('Brevo User:', process.env.BREVO_USER);
  console.log('From Address:', process.env.EMAIL_FROM);

  if (!process.env.BREVO_PASS || process.env.BREVO_PASS.includes('your-brevo-smtp-key')) {
    console.error('ERROR: Please update your .env file with a real BREVO_PASS/Key first.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.BREVO_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: 'skrishnapiriyan@gmail.com', // Test recipient
      subject: '🚀 EMS Brevo Verification Test',
      html: `
        <h1>Brevo Integration Successful!</h1>
        <p>Your Exam Management System is now configured to use <b>Brevo (SendinBlue)</b>.</p>
        <p>Provider configured: <code>${process.env.EMAIL_PROVIDER}</code></p>
      `
    });

    console.log('SUCCESS: Email sent successfully via Brevo!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('FAILED: Could not send email via Brevo.');
    console.error('Error Details:', error.message);
  }
}

testBrevo();
