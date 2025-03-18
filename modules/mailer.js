// require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Create a transporter for Microsoft 365 (Office 365) SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ADMIN_EMAIL_ADDRESS,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

const sendRegistrationEmail = async (toEmail, username) => {
  try {
    const templatePath = path.join(
      "./templates/registrationConfirmationEmail.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder {{username}} with the actual username
    emailTemplate = emailTemplate.replace("{{username}}", username);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Confirmation: Kyber Vision Registration ",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  try {
    const templatePath = path.join("./templates/resetPasswordLinkEmail.html");

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder {{username}} with the actual username
    emailTemplate = emailTemplate.replace("{{resetLink}}", resetLink);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Password Reset Request",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendVideoMontageCompleteNotificationEmail = async (toEmail, link) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/videoMontageCompleteNotificationEmail.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder {{montageLink}} with the actual link
    // emailTemplate = emailTemplate.replace("{{montageLink}}", link);
    emailTemplate = emailTemplate.replace(/{{montageLink}}/g, link);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Your Video Montage is Ready!",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendResetPasswordEmail,
  sendVideoMontageCompleteNotificationEmail,
};

// // Create a transporter for Microsoft 365 (Office 365) SMTP
// const transporter = nodemailer.createTransport({
//   host: "smtp.office365.com",
//   port: 587, // Secure submission port for Office 365
//   secure: false, // Must be false since STARTTLS is used
//   auth: {
//     user: process.env.ADMIN_EMAIL_ADDRESS, // Your Office 365 email
//     pass: process.env.ADMIN_EMAIL_PASSWORD, // Your email password or app password
//   },
//   tls: {
//     ciphers: "SSLv3",
//   },
// });
