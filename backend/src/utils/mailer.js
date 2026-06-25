import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to, otp) {
  try {
    await resend.emails.send({
      from: "noreply@lessonplanbuilder.online",
      to: to,
      subject: "OTP Code",
      html: "<h3>Your OTP is: " + otp + "</h3>"
    });
    console.log("email sent");
    return true;
  } catch (err) {
    console.log("email failed");
    console.log(err.message);
    return false;
  }
}

// Fallback for other existing routes so backend doesn't break
export const sendEmail = async (to, subject, text) => {
  try {
    await resend.emails.send({
      from: "noreply@lessonplanbuilder.online",
      to: to,
      subject: subject,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`
    });
    console.log("email sent");
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    return false;
  }
};
