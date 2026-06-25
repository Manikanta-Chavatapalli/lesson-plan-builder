import { Resend } from "resend";
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendEnquiryResponse(parentEmail, parentName, originalMessage, teacherResponse) {
    if (!process.env.RESEND_API_KEY) {
      console.error('Resend API Key not found in environment variables.');
      throw new Error('Email configuration is missing');
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">FirstCry Intellitots</h2>
          <p>Dear ${parentName},</p>
          <p>Thank you for reaching out to us. A teacher has responded to your recent enquiry.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
            <p style="margin-top: 0; white-space: pre-wrap;">${teacherResponse}</p>
          </div>

          <p><strong>Your original message:</strong></p>
          <div style="background-color: #f1f5f9; padding: 10px; font-size: 0.9em; color: #64748b; margin-bottom: 20px;">
            <p style="margin: 0;"><em>${originalMessage}</em></p>
          </div>

          <p>Best regards,<br>FirstCry Intellitots Team</p>
        </div>
      `;

    try {
      const data = await resend.emails.send({
        from: "noreply@lessonplanbuilder.online",
        to: parentEmail,
        subject: `Response to your Enquiry - FirstCry Intellitots`,
        html: htmlContent
      });
      console.log('Email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
  }

  async sendRejectionEmail(parentEmail, parentName, originalMessage, rejectionReason) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Email configuration is missing');
    }

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #e11d48;">FirstCry Intellitots</h2>
          <p>Dear ${parentName},</p>
          <p>Thank you for your interest. Unfortunately, we are unable to proceed with your enquiry at this time.</p>
          
          <div style="background-color: #fff1f2; padding: 15px; border-left: 4px solid #e11d48; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Reason:</strong> ${rejectionReason}</p>
          </div>

          <p><strong>Your original message:</strong></p>
          <div style="background-color: #f1f5f9; padding: 10px; font-size: 0.9em; color: #64748b; margin-bottom: 20px;">
            <p style="margin: 0;"><em>${originalMessage}</em></p>
          </div>

          <p>Best regards,<br>FirstCry Intellitots Team</p>
        </div>
      `;

    try {
      console.log('Sending rejection email to:', parentEmail);
      const data = await resend.emails.send({
        from: "noreply@lessonplanbuilder.online",
        to: parentEmail,
        subject: `Update regarding your Enquiry - FirstCry Intellitots`,
        html: htmlContent
      });
      console.log('Rejection email sent:', data);
      return data;
    } catch (error) {
      console.error('Failed to send rejection email:', error.message);
      throw error;
    }
  }
}

export default new EmailService();

