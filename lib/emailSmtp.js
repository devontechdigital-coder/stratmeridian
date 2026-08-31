import nodemailer from 'nodemailer';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function getSmtpSettings() {
  await connectToDatabase();
  return Settings.findOne({ type: 'theme' }).lean();
}

function cleanSmtpValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function hasSmtpConfig(settings) {
  const fromEmail = cleanSmtpValue(settings?.smtpFromEmail || settings?.smtpUser || settings?.emailId);
  return Boolean(
    cleanSmtpValue(settings?.smtpHost) &&
    settings?.smtpPort &&
    cleanSmtpValue(settings?.smtpUser) &&
    cleanSmtpValue(settings?.smtpPassword) &&
    fromEmail
  );
}

export async function sendSmtpMail({ to, subject, text, html }) {
  const settings = await getSmtpSettings();
  if (!hasSmtpConfig(settings)) {
    throw new Error('SMTP settings are not configured');
  }

  const transporter = nodemailer.createTransport({
    host: cleanSmtpValue(settings.smtpHost),
    port: Number(settings.smtpPort),
    secure: Boolean(settings.smtpSecure),
    auth: {
      user: cleanSmtpValue(settings.smtpUser),
      pass: cleanSmtpValue(settings.smtpPassword),
    },
  });

  const fromName = cleanSmtpValue(settings.smtpFromName || settings.websiteName) || 'Support';
  const fromEmail = cleanSmtpValue(settings.smtpFromEmail || settings.smtpUser || settings.emailId);
  const from = `"${fromName.replace(/"/g, '')}" <${fromEmail}>`;

  return transporter.sendMail({ from, to, subject, text, html });
}
