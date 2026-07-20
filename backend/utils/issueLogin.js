const crypto = require("crypto");
const User = require("../models/User");
const { checkSeatAvailable } = require("./seatLimit");
const { generateId } = require("./generateId");
const { sendEmail } = require("./sendEmail");

const issueTeacherLogin = async (teacher, companyId) => {
  const existingUser = await User.findOne({ email: teacher.email });
  if (existingUser) {
    teacher.userAccount = existingUser._id;
    await teacher.save();
    return { ok: true };
  }

  const seat = await checkSeatAvailable(companyId);
  if (!seat.ok) return seat;

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const user = await User.create({
    name: teacher.name,
    email: teacher.email,
    password: tempPassword,
    role: "teacher",
    company: companyId,
    userId: generateId("USR"),
  });
  teacher.userAccount = user._id;
  await teacher.save();

  await sendEmail({
    to: teacher.email,
    subject: "Your teacher account is ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f172a;">Welcome</h2>
        <p>A teacher account has been created for you.</p>
        <p><strong>Email:</strong> ${teacher.email}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
          Log in
        </a>
      </div>
    `,
  });
  return { ok: true };
};

const issueStudentLogin = async (student, companyId, loginEmail) => {
  const existingUser = await User.findOne({ email: loginEmail });
  if (existingUser) {
    student.userAccount = existingUser._id;
    await student.save();
    return { ok: true };
  }

  const seat = await checkSeatAvailable(companyId);
  if (!seat.ok) return seat;

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const user = await User.create({
    name: student.name,
    email: loginEmail,
    password: tempPassword,
    role: "student",
    company: companyId,
    userId: generateId("USR"),
  });
  student.userAccount = user._id;
  await student.save();

  await sendEmail({
    to: loginEmail,
    subject: "Your student account is ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f172a;">Welcome</h2>
        <p>A student account has been created for ${student.name}.</p>
        <p><strong>Email:</strong> ${loginEmail}<br/>
           <strong>Temporary password:</strong> ${tempPassword}</p>
        <p>Please log in and change your password as soon as possible.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
          Log in
        </a>
      </div>
    `,
  });
  return { ok: true };
};

const sendWelcomeEmail = async ({ to, personName, companyName }) => {
  await sendEmail({
    to,
    subject: `You've been added to ${companyName} on Simpta`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color:#0f172a;">Welcome to ${companyName}</h2>
        <p>${personName} has been added to the ${companyName} workspace on Simpta.</p>
        <p>Ask your administrator for your login details, or if you already have them, log in below.</p>
        <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
          Go to Simpta
        </a>
      </div>
    `,
  });
};

module.exports = { issueTeacherLogin, issueStudentLogin, sendWelcomeEmail };
