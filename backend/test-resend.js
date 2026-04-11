// test-resend.js
// Run this with: node test-resend.js
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('--- Resend Verification Script ---');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
  console.log('From Address:', process.env.EMAIL_FROM);

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('PLACEHOLDER')) {
    console.error('ERROR: Please update your .env file with a real RESEND_API_KEY first.');
    return;
  }

  try {
    // IMPORTANT: When using the 'onboarding@resend.dev' sender, 
    // Resend only allows you to send emails to the address you signed up with.
    // Change the email below to YOUR real email address to test delivery.
    const recipient = 'skrishnapiriyan@gmail.com'; 

    console.log(`Sending a test email to: ${recipient}...`);

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: recipient,
      subject: '🚀 EMS Resend Real-World Test',
      html: `
        <h1>It works!</h1>
        <p>This email was sent via <b>Resend</b> using your API key.</p>
        <p><b>Note:</b> You can only send to yourself until you verify a custom domain.</p>
      `
    });

    if (error) {
      console.error('FAILED: Could not send email.');
      console.error('Error Details:', error);
      return;
    }

    console.log('SUCCESS: Email sent successfully!');
    console.log('Response ID:', data.id);
    console.log('\nCheck your inbox (and spam folder) for skrishnapiriyan@gmail.com');
  } catch (error) {
    console.error('FAILED: Exception occurred.');
    console.error('Error Details:', error.message);
  }
}

testEmail();
