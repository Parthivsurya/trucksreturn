import nodemailer from 'nodemailer';
import pool from '../db/db.js';

// ── Config ────────────────────────────────────────────────────────────────────

async function getSmtpConfig() {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

function createTransporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.smtp_host,
    port: parseInt(cfg.smtp_port) || 587,
    secure: cfg.smtp_secure === '1',
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmail({ to, subject, html }) {
  const cfg = await getSmtpConfig();
  if (cfg.smtp_enabled !== '1') return;
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) return;

  const from = `"${cfg.smtp_from_name || cfg.site_name || 'ReturnLoad'}" <${cfg.smtp_from_email || cfg.smtp_user}>`;
  try {
    await createTransporter(cfg).sendMail({ from, to, subject, html });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`📧 Email failed to ${to}:`, err.message);
  }
}

export async function testEmail(toAddress) {
  const cfg = await getSmtpConfig();
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('SMTP not configured. Fill in host, username, and password first.');
  }
  const from = `"${cfg.smtp_from_name || cfg.site_name || 'ReturnLoad'}" <${cfg.smtp_from_email || cfg.smtp_user}>`;
  await createTransporter(cfg).sendMail({
    from,
    to: toAddress,
    subject: `Test email from ${cfg.site_name || 'ReturnLoad'}`,
    html: baseTemplate({
      title: 'Test Email',
      preview: 'Your SMTP configuration is working correctly.',
      body: `<p>This is a test email from your <strong>${cfg.site_name || 'ReturnLoad'}</strong> admin panel.</p>
             <p>Your SMTP settings are configured correctly and emails will be delivered to users.</p>`,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

// ── Base template ─────────────────────────────────────────────────────────────

function baseTemplate({ title, preview, body, siteName = 'ReturnLoad', primaryColor = '#0f172a', ctaText, ctaUrl }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif; color:#1e293b; }
    .wrapper { max-width:580px; margin:40px auto; background:#fff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; }
    .header { background:${primaryColor}; padding:28px 32px; }
    .header-brand { color:#fff; font-size:20px; font-weight:700; letter-spacing:-0.3px; text-decoration:none; }
    .body { padding:32px; }
    .title { font-size:22px; font-weight:700; color:${primaryColor}; margin:0 0 16px; }
    .text { font-size:15px; line-height:1.7; color:#475569; margin:0 0 16px; }
    .info-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px 24px; margin:20px 0; }
    .info-row { display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
    .info-row:last-child { border-bottom:none; padding-bottom:0; }
    .info-label { color:#94a3b8; font-weight:500; }
    .info-value { color:#0f172a; font-weight:600; text-align:right; max-width:60%; }
    .badge { display:inline-block; padding:4px 12px; border-radius:99px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
    .badge-open      { background:#dcfce7; color:#166534; }
    .badge-booked    { background:#dbeafe; color:#1e40af; }
    .badge-transit   { background:#fef9c3; color:#854d0e; }
    .badge-delivered { background:#d1fae5; color:#065f46; }
    .badge-cancelled { background:#fee2e2; color:#991b1b; }
    .cta { display:block; text-align:center; margin:24px 0 0; }
    .cta a { display:inline-block; background:${primaryColor}; color:#fff; text-decoration:none; padding:14px 32px; border-radius:12px; font-weight:600; font-size:15px; }
    .footer { padding:20px 32px; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#94a3b8; }
    .divider { height:1px; background:#f1f5f9; margin:20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="header-brand">${siteName}</span>
    </div>
    <div class="body">
      <h1 class="title">${title}</h1>
      ${body}
      ${ctaText && ctaUrl ? `<div class="cta"><a href="${ctaUrl}">${ctaText}</a></div>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${siteName}. This is an automated notification.
    </div>
  </div>
</body>
</html>`;
}

function statusBadge(status) {
  const map = { open:'badge-open', booked:'badge-booked', in_transit:'badge-transit', picked_up:'badge-transit', delivered:'badge-delivered', cancelled:'badge-cancelled', confirmed:'badge-booked', disputed:'badge-cancelled' };
  return `<span class="badge ${map[status] || 'badge-booked'}">${status.replace('_', ' ')}</span>`;
}

// ── Emails ────────────────────────────────────────────────────────────────────

export async function sendOtpEmail({ email, otp, siteName: siteOverride }) {
  const cfg = await getSmtpConfig();

  if (cfg.smtp_enabled !== '1' || !cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('Email service is not configured. Please contact the administrator.');
  }

  const site = siteOverride || cfg.site_name || 'ReturnLoad';
  const from = `"${cfg.smtp_from_name || site}" <${cfg.smtp_from_email || cfg.smtp_user}>`;

  // Throws on SMTP failure — caller must handle
  await createTransporter(cfg).sendMail({
    from,
    to: email,
    subject: `${otp} is your ${site} verification code`,
    html: baseTemplate({
      title: 'Verify your email',
      body: `
        <p class="text">You're one step away from joining <strong>${site}</strong>.</p>
        <p class="text">Enter this code to verify your email address:</p>
        <div style="text-align:center;margin:28px 0">
          <span style="display:inline-block;font-size:40px;font-weight:900;letter-spacing:12px;color:#0f172a;background:#f8fafc;padding:18px 32px;border-radius:16px;border:2px dashed #e2e8f0">${otp}</span>
        </div>
        <p class="text" style="font-size:13px;color:#94a3b8;text-align:center">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      `,
      siteName: site,
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
  console.log(`📧 OTP email sent to ${email}`);
}

export async function sendLoginEmail(user) {
  const cfg = await getSmtpConfig();
  if (cfg.email_on_login !== '1') return;
  await sendEmail({
    to: user.email,
    subject: `New login to your ${cfg.site_name || 'ReturnLoad'} account`,
    html: baseTemplate({
      title: 'Login Notification',
      body: `
        <p class="text">Hi <strong>${user.name}</strong>,</p>
        <p class="text">A new login was detected on your <strong>${cfg.site_name || 'ReturnLoad'}</strong> account.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Account</span><span class="info-value">${user.email}</span></div>
          <div class="info-row"><span class="info-label">Role</span><span class="info-value" style="text-transform:capitalize">${user.role}</span></div>
          <div class="info-row"><span class="info-label">Time</span><span class="info-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span></div>
        </div>
        <p class="text" style="font-size:13px;color:#94a3b8">If this wasn't you, please contact the platform administrator immediately.</p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

export async function sendBookingCreatedToShipper({ booking, load, driver, truck }) {
  const cfg = await getSmtpConfig();
  if (cfg.email_on_booking_shipper !== '1') return;
  const { rows: [shipper] } = await pool.query('SELECT name, email FROM users WHERE id = $1', [load.user_id]);
  if (!shipper?.email) return;

  const siteUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
  const trackingUrl = `${siteUrl}/shipper/tracking/${booking.uuid}`;

  await sendEmail({
    to: shipper.email,
    subject: `Driver booked your load — ${load.cargo_type} (${load.pickup_city} → ${load.delivery_city})`,
    html: baseTemplate({
      title: 'Your Load Has Been Booked!',
      body: `
        <p class="text">Hi <strong>${shipper.name}</strong>,</p>
        <p class="text">Great news! A driver has accepted your load. Here are the details:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${load.cargo_type} · ${load.weight_tons}t</span></div>
          <div class="info-row"><span class="info-label">Route</span><span class="info-value">${load.pickup_city} → ${load.delivery_city}</span></div>
          <div class="info-row"><span class="info-label">Driver</span><span class="info-value">${driver.name}</span></div>
          ${truck ? `<div class="info-row"><span class="info-label">Truck</span><span class="info-value">${truck.truck_type} · ${truck.registration_number || ''}</span></div>` : ''}
          <div class="info-row"><span class="info-label">Agreed Price</span><span class="info-value">₹${Number(booking.agreed_price).toLocaleString('en-IN')}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value">${statusBadge('confirmed')}</span></div>
        </div>
        <p class="text">You can track the driver's live location in real-time from the tracking page. Location updates automatically every 30 seconds while the driver is active.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${trackingUrl}" style="display:inline-block;background:${cfg.primary_color || '#0f172a'};color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
            📍 Track Live Location
          </a>
        </div>
        <p class="text" style="font-size:13px;color:#94a3b8;">Or copy this link: <a href="${trackingUrl}" style="color:${cfg.primary_color || '#0f172a'}">${trackingUrl}</a></p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

export async function sendBookingCreatedToDriver({ booking, load, driver }) {
  const cfg = await getSmtpConfig();
  if (cfg.email_on_booking_driver !== '1') return;
  await sendEmail({
    to: driver.email,
    subject: `Booking confirmed — ${load.cargo_type} from ${load.pickup_city}`,
    html: baseTemplate({
      title: 'Booking Confirmed',
      body: `
        <p class="text">Hi <strong>${driver.name}</strong>,</p>
        <p class="text">Your booking has been confirmed. Here are the details:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${load.cargo_type} · ${load.weight_tons}t</span></div>
          <div class="info-row"><span class="info-label">Pickup</span><span class="info-value">${load.pickup_city}</span></div>
          <div class="info-row"><span class="info-label">Delivery</span><span class="info-value">${load.delivery_city}</span></div>
          <div class="info-row"><span class="info-label">Agreed Price</span><span class="info-value">₹${Number(booking.agreed_price).toLocaleString('en-IN')}</span></div>
          ${load.timeline ? `<div class="info-row"><span class="info-label">Timeline</span><span class="info-value">${load.timeline}</span></div>` : ''}
          ${load.description ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${load.description}</span></div>` : ''}
        </div>
        <p class="text">Please proceed to the pickup location and update your status when you collect the goods.</p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

export async function sendBookingStatusUpdate({ booking, load, newStatus, toUser, role }) {
  const cfg = await getSmtpConfig();
  if (cfg.email_on_status_change !== '1') return;
  const statusMessages = {
    picked_up:  { title: 'Goods Picked Up',        msg: 'The driver has picked up the goods and is heading to the delivery location.' },
    in_transit: { title: 'In Transit',              msg: 'Your shipment is currently in transit.' },
    delivered:  { title: 'Delivered Successfully!', msg: 'The goods have been delivered to the destination. Please verify and rate the experience.' },
    cancelled:  { title: 'Booking Cancelled',       msg: 'This booking has been cancelled.' },
    disputed:   { title: 'Dispute Raised',          msg: 'A dispute has been raised on this booking. The platform admin will review it.' },
  };

  const info = statusMessages[newStatus] || { title: `Status: ${newStatus.replace('_', ' ')}`, msg: 'Your booking status has been updated.' };

  await sendEmail({
    to: toUser.email,
    subject: `${info.title} — ${load.cargo_type} (${load.pickup_city} → ${load.delivery_city})`,
    html: baseTemplate({
      title: info.title,
      body: `
        <p class="text">Hi <strong>${toUser.name}</strong>,</p>
        <p class="text">${info.msg}</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Booking #</span><span class="info-value">${booking.id}</span></div>
          <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${load.cargo_type} · ${load.weight_tons}t</span></div>
          <div class="info-row"><span class="info-label">Route</span><span class="info-value">${load.pickup_city} → ${load.delivery_city}</span></div>
          <div class="info-row"><span class="info-label">Price</span><span class="info-value">₹${Number(booking.agreed_price).toLocaleString('en-IN')}</span></div>
          <div class="info-row"><span class="info-label">New Status</span><span class="info-value">${statusBadge(newStatus)}</span></div>
        </div>
        ${newStatus === 'delivered' ? `<p class="text">Thank you for using ${cfg.site_name || 'ReturnLoad'}! Don't forget to rate your experience.</p>` : ''}
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

export async function sendDriverConnectRequest({ driver, shipper, load }) {
  const cfg = await getSmtpConfig();
  await sendEmail({
    to: driver.email,
    subject: `A shipper wants you for their load — ${load.cargo_type} (${load.pickup_city} → ${load.delivery_city})`,
    html: baseTemplate({
      title: 'Load Request from a Shipper',
      body: `
        <p class="text">Hi <strong>${driver.name}</strong>,</p>
        <p class="text">
          <strong>${shipper.name}</strong> has reviewed your route and would like you to carry their load.
          Here are the details:
        </p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${load.cargo_type} · ${load.weight_tons}t</span></div>
          <div class="info-row"><span class="info-label">Pickup</span><span class="info-value">${load.pickup_city}</span></div>
          <div class="info-row"><span class="info-label">Delivery</span><span class="info-value">${load.delivery_city}</span></div>
          <div class="info-row"><span class="info-label">Offered Price</span><span class="info-value">₹${Number(load.offered_price).toLocaleString('en-IN')}</span></div>
          ${load.timeline ? `<div class="info-row"><span class="info-label">Timeline</span><span class="info-value">${load.timeline}</span></div>` : ''}
          <div class="info-row"><span class="info-label">Shipper</span><span class="info-value">${shipper.name}</span></div>
          ${shipper.phone ? `<div class="info-row"><span class="info-label">Contact</span><span class="info-value">${shipper.phone}</span></div>` : ''}
        </div>
        <p class="text">
          Log in to <strong>${cfg.site_name || 'ReturnLoad'}</strong>, find this load in the Load Finder,
          and accept it to confirm the booking.
        </p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}

export async function sendVerificationApproved({ driver }) {
  const cfg = await getSmtpConfig();
  const siteUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
  await sendEmail({
    to: driver.email,
    subject: `Your truck is verified — you can now accept loads on ${cfg.site_name || 'ReturnLoad'}`,
    html: baseTemplate({
      title: 'Truck Verified!',
      body: `
        <p class="text">Hi <strong>${driver.name}</strong>,</p>
        <p class="text">Great news! Your truck and documents have been reviewed and <strong style="color:#166534">verified</strong> by our admin team.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-delivered">Verified</span></span></div>
          <div class="info-row"><span class="info-label">What's next?</span><span class="info-value">You can now set your route and accept loads</span></div>
        </div>
        <p class="text">Log in now, set your return route, and start finding loads along your way!</p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
      ctaText: 'Set My Route',
      ctaUrl: `${siteUrl}/driver/availability`,
    }),
  });
}

export async function sendVerificationRejected({ driver, reason }) {
  const cfg = await getSmtpConfig();
  const siteUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
  await sendEmail({
    to: driver.email,
    subject: `Action required: Truck verification rejected on ${cfg.site_name || 'ReturnLoad'}`,
    html: baseTemplate({
      title: 'Verification Rejected',
      body: `
        <p class="text">Hi <strong>${driver.name}</strong>,</p>
        <p class="text">Unfortunately, your truck verification has been <strong style="color:#991b1b">rejected</strong> by our admin team.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="badge badge-cancelled">Rejected</span></span></div>
          ${reason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${reason}</span></div>` : ''}
        </div>
        <p class="text">Please fix the issue mentioned above, re-upload your documents, and resubmit for review. Our team will review your updated submission promptly.</p>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
      ctaText: 'Re-upload Documents',
      ctaUrl: `${siteUrl}/driver/truck`,
    }),
  });
}

export async function sendLoadStatusUpdate({ load, newStatus, shipper }) {
  const cfg = await getSmtpConfig();
  if (cfg.email_on_load_status !== '1') return;
  await sendEmail({
    to: shipper.email,
    subject: `Load status updated to "${newStatus}" — ${load.cargo_type}`,
    html: baseTemplate({
      title: 'Load Status Updated',
      body: `
        <p class="text">Hi <strong>${shipper.name}</strong>,</p>
        <p class="text">The status of your load has been updated by the platform admin.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Load #</span><span class="info-value">${load.id}</span></div>
          <div class="info-row"><span class="info-label">Cargo</span><span class="info-value">${load.cargo_type} · ${load.weight_tons}t</span></div>
          <div class="info-row"><span class="info-label">Route</span><span class="info-value">${load.pickup_city} → ${load.delivery_city}</span></div>
          <div class="info-row"><span class="info-label">New Status</span><span class="info-value">${statusBadge(newStatus)}</span></div>
        </div>
      `,
      siteName: cfg.site_name || 'ReturnLoad',
      primaryColor: cfg.primary_color || '#0f172a',
    }),
  });
}
