import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { TimerPage } from "./pages/TimerPage";
import MainLayout from "./layouts/MainLayout";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportPage } from "./pages/ReportPage";
import { TeamDashboard } from "./pages/TeamDashboard";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<TimerPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="reportes" element={<ReportPage />} />
        <Route path="team-dashboard" element={<TeamDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
