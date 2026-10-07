import nodemailer from 'nodemailer';

export function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export async function sendVisitSummaryEmail({ to, patientName, visitorName, summary, checkIn, checkOut }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured (set SMTP_USER and SMTP_PASS in environment)');
  }

  const subject = `Visit summary for ${patientName}`;
  const body = [
    `Hello ${patientName},`,
    '',
    `A visit has been closed.`,
    `Visitor: ${visitorName}`,
    `Check-in: ${checkIn}`,
    `Check-out: ${checkOut}`,
    '',
    'Summary:',
    summary,
    '',
    '— Hospital Manager',
  ].join('\n');

  const transporter = getTransport();
  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
  });

  return { subject, body };
}
