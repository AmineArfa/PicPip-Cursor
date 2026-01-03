import { Resend } from 'resend';

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Pip <pip@picpip.co>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@picpip.co';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendNewTicketNotificationParams {
  ticketNumber: string;
  userEmail: string;
  messagePreview: string;
}

interface SendAdminReplyParams {
  ticketNumber: string;
  userEmail: string;
  adminMessage: string;
}

export async function sendNewTicketNotification({
  ticketNumber,
  userEmail,
  messagePreview,
}: SendNewTicketNotificationParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Help Ticket: ${ticketNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Help Ticket</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff61d2 0%, #2962ff 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Help Ticket Received</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${userEmail}</p>
              <p style="margin: 10px 0 0 0;"><strong>Message Preview:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #ff61d2;">
                ${messagePreview.split('\n').map(line => `<p style="margin: 5px 0;">${line}</p>`).join('')}
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${APP_URL}/admin/support?ticket=${ticketNumber}" 
                 style="display: inline-block; background: #ff61d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Ticket
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">
              <p>This is an automated notification from PicPip Support System</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending new ticket notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending new ticket notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAdminReply({
  ticketNumber,
  userEmail,
  adminMessage,
}: SendAdminReplyParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Re: Your PicPip Support Ticket ${ticketNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Support Ticket Reply</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff61d2 0%, #2962ff 100%); padding: 30px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Pip Has Responded!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>Ticket Number:</strong> ${ticketNumber}</p>
              <p style="margin: 10px 0 0 0;"><strong>Pip's Response:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 10px; border-left: 3px solid #2962ff;">
                ${adminMessage.split('\n').map(line => `<p style="margin: 5px 0;">${line}</p>`).join('')}
              </div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 3px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>Note:</strong> If you need further assistance, please submit a new help request through the PicPip website.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">
              <p>This is an automated response from PicPip Support</p>
              <p style="margin-top: 10px;">
                <a href="${APP_URL}/help" style="color: #2962ff; text-decoration: none;">Need more help? Visit our help page</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending admin reply notification:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending admin reply notification:', error);
    return { success: false, error: error.message };
  }
}

