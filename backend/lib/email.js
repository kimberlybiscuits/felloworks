// Email sending via Resend
// Used for invite emails. Add other transactional emails here as needed.

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || "FelloWorks <onboarding@resend.dev>";

// Send an invite email to a prospective member
// inviterName — full name of the person sending the invite
// inviteeEmail — recipient address
// token — the invite token, embedded in the link
async function sendInviteEmail({ inviterName, inviteeEmail, token }) {
  const inviteUrl = `${process.env.FRONTEND_URL}/invite.html?token=${token}`;

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      inviteeEmail,
    subject: `${inviterName} invited you to FelloWorks`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F2EE;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EE;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 32px;font-size:20px;font-weight:600;color:#FF6B35;letter-spacing:-0.01em;">
                FelloWorks
              </p>
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#7A8C9A;">
                You've been invited
              </p>
              <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;color:#FFFFFF;line-height:1.2;">
                ${inviterName} invited you to FelloWorks.
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#7A8C9A;">
                FelloWorks is invite-only. Every member has been vouched for by someone
                already inside. ${inviterName} thought you'd be a good fit.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 48px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FF6B35;border-radius:4px;">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Accept your invitation →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;color:#7A8C9A;">
                This invitation expires in 7 days. If you weren't expecting this,
                you can ignore it.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:12px;color:#3A4E60;">
                fello.works · Beta · April 2026
              </p>
            </td>
          </tr>

        </table>

        <!-- URL fallback -->
        <table width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:16px 0 0;">
              <p style="margin:0;font-size:12px;color:#7A8C9A;text-align:center;">
                If the button doesn't work, copy this link:<br />
                <a href="${inviteUrl}" style="color:#FF6B35;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

// Notify a member that they have feedback awaiting approval
async function sendFeedbackNotificationEmail({ reviewerName, recipientFirstName, recipientEmail }) {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard.html`;

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      recipientEmail,
    subject: `${reviewerName} left you feedback on FelloWorks`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F5F2EE;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2EE;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border-radius:8px;overflow:hidden;">

          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 32px;font-size:20px;font-weight:600;color:#FF6B35;letter-spacing:-0.01em;">
                FelloWorks
              </p>
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#7A8C9A;">
                New feedback
              </p>
              <h1 style="margin:0 0 20px;font-size:28px;font-weight:400;color:#FFFFFF;line-height:1.2;">
                ${reviewerName} left you feedback.
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#7A8C9A;">
                Hi ${recipientFirstName}, ${reviewerName} has written feedback about working with you.
                You can review it and choose whether to approve it for your profile.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FF6B35;border-radius:4px;">
                    <a href="${dashboardUrl}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      Review feedback →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:13px;color:#7A8C9A;">
                You're in control of what appears on your profile. Approving it makes it
                visible to other members. Declining keeps it private.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 48px;border-top:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:12px;color:#3A4E60;">
                fello.works · Beta · April 2026
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}

module.exports = { sendInviteEmail, sendFeedbackNotificationEmail };
