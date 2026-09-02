// Sends transactional emails via Resend (https://resend.com).
// Uses plain fetch against their REST API -- no SDK needed.
//
// Note: on Resend's free/test mode (no verified custom domain), emails can
// only be delivered to the email address of the Resend account itself.
// Sending to arbitrary customer addresses requires verifying a domain in
// the Resend dashboard -- see README.md for details.
async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY environment variable -- cannot send email.');
    throw new Error('Email service is not configured');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'SmartBiz AI <onboarding@resend.dev>',
      to: [to],
      subject,
      html
    })
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Resend API error:', response.status, errorBody);
    throw new Error('Failed to send email');
  }
  return response.json();
}
async function sendPasswordResetEmail(to, resetUrl) {
  return sendEmail({
    to,
    subject: 'Reset your SmartBiz AI password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your SmartBiz AI password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#0F4C46;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  });
}
module.exports = { sendEmail, sendPasswordResetEmail };
