export const getHomePath = (user, companyStatus) => {
  if (!user) return "/login";
  if (user.isSuperAdmin) return "/admin";

  if (companyStatus?.productType === "school") {
    if (user.role === "admin") return "/school";
    if (user.role === "teacher") return "/teacher-portal";
    if (user.role === "student") return "/student-portal";
  }

  return "/tasks";
};
