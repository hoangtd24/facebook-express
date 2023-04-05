const nodemailer = require("nodemailer");

const { google } = require("googleapis");

const oauth_link = "https://developers.google.com/oauthplayground";

const { MAIL, MAILING_ID, MAILING_SECRET, MAILING_REFRESH } = process.env;

exports.sendVerificationEmail = async (email, name, url) => {
  auth.setCredentials({
    refresh_token: MAILING_REFRESH,
  });

  const accessToken = auth.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: MAIL,
      clientId: MAILING_ID,
      clientSecret: MAILING_SECRET,
      refreshToken: MAILING_REFRESH,
      accessToken: accessToken,
    },
  });
  const mailOptions = {
    from: MAIL,
    to: email,
    subject: "Verify your email address",
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/dmhcnhtng/image/upload/v1645134414/logo_cs1si5.png" alt="" style="width:30px"><span>Action requise : Activate your facebook account</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">You recently created an account on Facebook. To complete your registration, please confirm your account.</span></div><a href=${url} style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600">Confirm your account</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Facebook allows you to stay in touch with all your friends, once refistered on facebook,you can share photos,organize events and much more.</span></div></div>`,
  };
  await new Promise((resolve, reject) => {
    stmp.sendMail(mailOptions, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};

exports.sendResetCode = async (email, name, code) => {
  const oauth2Client = new google.auth.OAuth2(
    MAILING_ID,
    MAILING_SECRET,
    oauth_link
  );

  oauth2Client.setCredentials({
    refresh_token: MAILING_REFRESH,
  });

  const { token } = await oauth2Client.getAccessToken();
  const stmp = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: MAIL,
      clientId: MAILING_ID,
      clientSecret: MAILING_SECRET,
      refreshToken: MAILING_REFRESH,
      accessToken: token,
      expires: 100000,
    },
  });
  const mailOptions = {
    from: MAIL,
    to: email,
    subject: "Đặt lại mật khẩu Facebook",
    html: `<div style="max-width:700px;margin-bottom:1rem;display:flex;align-items:center;gap:10px;font-family:Roboto;font-weight:600;color:#3b5998"><img src="https://res.cloudinary.com/dmhcnhtng/image/upload/v1645134414/logo_cs1si5.png" alt="" style="width:30px"><span>Action requise : Reset password Facebook</span></div><div style="padding:1rem 0;border-top:1px solid #e5e5e5;border-bottom:1px solid #e5e5e5;color:#141823;font-size:17px;font-family:Roboto"><span>Hello ${name}</span><div style="padding:20px 0"><span style="padding:1.5rem 0">you are doing a password reset on Facebook. To complete the operation. Please enter this code to confirm.</span></div><a style="width:200px;padding:10px 15px;background:#4c649b;color:#fff;text-decoration:none;font-weight:600">Code: ${code}</a><br><div style="padding-top:20px"><span style="margin:1.5rem 0;color:#898f9c">Facebook allows you to stay in touch with all your friends, once refistered on facebook,you can share photos,organize events and much more.</span></div></div>`,
  };

  stmp.sendMail(mailOptions, (err, res) => {
    if (err) {
      return err;
    }
    return res;
  });
};
