import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import NotFound from "./pages/NotFound.jsx";
import Register from "./pages/Register.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import WorkerDashboard from "./pages/WorkerDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<AppShell />}
        >
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["user"]}>
                  <Dashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="chat/:bookingId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="worker-dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["worker"]}>
                  <WorkerDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
