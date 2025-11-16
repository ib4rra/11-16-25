import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./pages/share/ProtectedRoute";  // 🆕 import protection component
import Index from "./pages/Index";

// 🧭 Shared pages
import Login from "./pages/share/Login";
import RegisterPage from "./pages/share/Register";
import NotAuthorized from "./pages/share/NotAuthorized";  // 🆕 access denied page

// 🎓 Student pages
import DashboardPage from "./pages/student/Dashboard";
import Todo from "./pages/student/Todo";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSubclass from "./pages/student/StudentSubclass";
import StudentClassDashboard from "./pages/student/StudentClassDashboard";
import Archived from "./pages/student/Archived";
import Setting from "./pages/student/Setting";

// 🧑‍🏫 Instructor pages (optional for now){}
import InstructorDashboard from "./pages/instructor/InstructorDashboard"; // 🆕 placeholder
import Content_Management from "./pages/instructor/ContentManagement"; // 🆕 placeholder
import SubClass from "./pages/instructor/SubClass";
import FeaturePlaceholder from "./pages/instructor/FeaturePlaceholder";
import Archived_Instructor from "./pages/instructor/Archived";

// 🧱 Other components/features
import Body from "./web_components/Body";
import Compiler from "./features/Compiler";

import PhaserDragDrop from "./activities/dragdrop/drag_drop";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🧭 Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<NotAuthorized />} />

        {/* 🎓 Student Routes (role_id = 3) */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/todo"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Todo />
            </ProtectedRoute>
          }
        />

        <Route
  path="/student/StudentDashboard"
  element={
    <ProtectedRoute allowedRoles={[3]}>
      <StudentDashboard />
    </ProtectedRoute>
  }
/>

        <Route
          path="/student/archived"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Archived />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/setting"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <Setting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/compiler"
          element={
            <ProtectedRoute allowedRoles={[3,2]}>
              <Compiler />
            </ProtectedRoute>
          }
        />

        {/* 🧑‍🏫 Instructor Routes (role_id = 2)*/}
        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/instructor/subclass"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <SubClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/subclass"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <StudentSubclass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/class/:id"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <StudentClassDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/feature"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <FeaturePlaceholder />
            </ProtectedRoute>
          }
        />

         <Route
          path="/instructor/contentmanagement"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <Content_Management />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/archived"
          element={
            <ProtectedRoute allowedRoles={[2]}>
              <Archived_Instructor />
            </ProtectedRoute>
          }
        />
        

        {/* 🧩 Shared or public components */}
        <Route path="/body" element={<Body />} />
      </Routes>
    </Router>
  );
}

export default App;
