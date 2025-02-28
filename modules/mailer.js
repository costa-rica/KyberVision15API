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

const sendRegistrationEmail = async (toEmail, name) => {
  try {
    const templatePath = path.join(
      process.env.PATH_NODEMAILER_HTML_TEMPLATES,
      "registration_email.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    // Replace the placeholder {{name}} with the actual name
    emailTemplate = emailTemplate.replace("{{name}}", name);

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

// // Function to send a registration email
// const sendRegistrationEmail = async (toEmail, name) => {
//   try {
//     const mailOptions = {
//       from: process.env.ADMIN_EMAIL_ADDRESS, // Must be the same as the authenticated user
//       to: toEmail,
//       subject: "Confirm Your Registration",
//       html: `
//                 <h2>Welcome, ${name}!</h2>
//                 <p>Thank you for registering to Kyber Vision !</p>

//                 <p>If you did not request this, please ignore this email.</p>
//             `,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent:", info.response);
//     return info;
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error;
//   }
// };

module.exports = { sendRegistrationEmail };
