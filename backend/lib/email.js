// Email sending via Resend

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || "FelloWorks <onboarding@resend.dev>";

// Shared email wrapper — cream background, white card, no border-radius
function emailShell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F2EE;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EE;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E0DAD2;">

          <!-- Wordmark header -->
          <tr>
            <td style="padding:32px 48px 0;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#1A1A1A;letter-spacing:-0.01em;">FelloWorks</p>
            </td>
          </tr>

          ${bodyHtml}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #E0DAD2;">
              <p style="margin:0;font-size:11px;color:#9A8F84;text-transform:uppercase;letter-spacing:0.1em;">
                fello.works &middot; Invite-only network
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send an invite email to a prospective member
async function sendInviteEmail({ inviterName, inviteeEmail, token }) {
  const inviteUrl = `${process.env.FRONTEND_URL}/invite.html?token=${token}`;

  const body = `
    <tr>
      <td style="padding:32px 48px 16px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#9A8F84;">You've been invited</p>
        <h1 style="margin:0 0 16px;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.2;font-style:italic;">
          ${inviterName} invited you to join FelloWorks.
        </h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#6B6259;">
          FelloWorks is an invite-only collaboration network for freelancers, consultants and fractional leaders.
          Every member is vouched for by someone already inside.
          ${inviterName} thought you'd be a good fit.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 48px 32px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#D62B3F;">
              <a href="${inviteUrl}"
                 style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                Accept invitation &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9A8F84;">
          This invitation expires in 7 days. If you weren't expecting this, you can ignore it.
        </p>
        <p style="margin:12px 0 0;font-size:12px;color:#9A8F84;word-break:break-all;">
          Or copy this link: <a href="${inviteUrl}" style="color:#D62B3F;">${inviteUrl}</a>
        </p>
      </td>
    </tr>
  `;

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      inviteeEmail,
    subject: `${inviterName} invited you to FelloWorks`,
    html:    emailShell(body),
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

// Notify a member that they have feedback awaiting approval
async function sendFeedbackNotificationEmail({ reviewerName, recipientFirstName, recipientEmail }) {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard.html`;

  const body = `
    <tr>
      <td style="padding:32px 48px 16px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#9A8F84;">New feedback</p>
        <h1 style="margin:0 0 16px;font-size:28px;font-weight:400;color:#1A1A1A;line-height:1.2;font-style:italic;">
          ${reviewerName} left you feedback.
        </h1>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#6B6259;">
          Hi ${recipientFirstName}, ${reviewerName} has written feedback about working with you.
          Head to your dashboard to review it — you decide whether it appears on your profile.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 48px 32px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#D62B3F;">
              <a href="${dashboardUrl}"
                 style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                Review feedback &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9A8F84;">
          Approving it makes it visible on your profile. Declining keeps it private.
        </p>
      </td>
    </tr>
  `;

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      recipientEmail,
    subject: `${reviewerName} left you feedback on FelloWorks`,
    html:    emailShell(body),
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

// Notify founder of a new in-app feedback report
async function sendFeedbackReportEmail({ memberName, type, message, page }) {
  const body = `
    <tr>
      <td style="padding:32px 48px 16px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#9A8F84;">${type}</p>
        <h1 style="margin:0 0 16px;font-size:24px;font-weight:400;color:#1A1A1A;line-height:1.2;">
          New feedback from ${memberName}
        </h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B6259;">${message.replace(/\n/g, "<br>")}</p>
        <p style="margin:0;font-size:12px;color:#9A8F84;">Page: ${page}</p>
      </td>
    </tr>
  `;

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      process.env.ADMIN_EMAIL || "hello@fello.works",
    subject: `[${type}] Feedback from ${memberName}`,
    html:    emailShell(body),
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

module.exports = { sendInviteEmail, sendFeedbackNotificationEmail, sendFeedbackReportEmail };
