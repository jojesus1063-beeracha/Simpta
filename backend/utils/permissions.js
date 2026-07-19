// Who can create/assign tasks: admins, teachers, and anyone explicitly granted it
const canCreateTasks = (user) =>
  user.role === "admin" || user.role === "teacher" || user.permissions?.createTasks === true;

// Who can edit a specific task: admins, whoever it's assigned to as "owner",
// or anyone granted blanket edit access
const canEditTask = (user, task) =>
  user.role === "admin" ||
  user.permissions?.editAnyTask === true ||
  (task.owner && String(task.owner) === String(user._id));

module.exports = { canCreateTasks, canEditTask };
