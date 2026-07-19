import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Team from "./pages/Team";
import SuperAdmin from "./pages/SuperAdmin";
import SchoolDashboard from "./pages/SchoolDashboard";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import TeacherPortal from "./pages/TeacherPortal";
import StudentPortal from "./pages/StudentPortal";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { getHomePath } from "./utils/getHomePath";

const RoleRedirect = () => {
  const { user, companyStatus } = useAuth();
  return <Navigate to={getHomePath(user, companyStatus)} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Task Manager product */}
      <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute adminOnly><Team /></ProtectedRoute>} />

      {/* School Management product */}
      <Route path="/school" element={<ProtectedRoute adminOnly><SchoolDashboard /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute adminOnly><Teachers /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute adminOnly><Students /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute adminOnly><Classes /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/teacher-portal" element={<ProtectedRoute><TeacherPortal /></ProtectedRoute>} />
      <Route path="/student-portal" element={<ProtectedRoute><StudentPortal /></ProtectedRoute>} />

      {/* Platform */}
      <Route path="/admin" element={<ProtectedRoute superAdminOnly><SuperAdmin /></ProtectedRoute>} />

      <Route path="*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
