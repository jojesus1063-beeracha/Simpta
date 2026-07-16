const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Task Manager <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Failed to send email:", err.message);
  }
};

const taskAssignedEmail = (task, assignee) => ({
  to: assignee.email,
  subject: `New task assigned: ${task.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0f172a;">You've been assigned a new task</h2>
      <p><strong>${task.title}</strong></p>
      <p>${task.description || "No description provided."}</p>
      <p><strong>Priority:</strong> ${task.priority}</p>
      <p><strong>Due date:</strong> ${task.dueDate ? new Date(task.dueDate).toDateString() : "Not set"}</p>
      <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
        View task
      </a>
    </div>
  `,
});

const taskStatusUpdatedEmail = (task, assigner) => ({
  to: assigner.email,
  subject: `Task updated: ${task.title} is now "${task.status}"`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0f172a;">Task status updated</h2>
      <p><strong>${task.title}</strong> was marked as <strong>${task.status}</strong>.</p>
      <a href="${process.env.FRONTEND_URL}" style="display:inline-block;margin-top:12px;padding:10px 18px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;">
        View dashboard
      </a>
    </div>
  `,
});

module.exports = { sendEmail, taskAssignedEmail, taskStatusUpdatedEmail };
