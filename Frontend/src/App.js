import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "./waste/Login";
import { Dashboard } from "./waste/Dashboard";
import { StudentData } from "./waste/StudentData";
import { Classes } from "./waste/Classes";
import { FeeManagement } from "./waste/FeeManagement";
import { FeeView } from "./waste/FeeView";
import { StudentFeeProfile } from "./waste/StudentFeeProfile";
import { Layout } from "./waste/Layout";
import { Report } from "./waste/Report";
import { ClassDashboard } from "./waste/ClassDashboard";
import { AboutDeveloper } from "./waste/AboutDeveloper";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />
        <Route path="/AboutDeveloper" element={<AboutDeveloper />} />
        <Route path="/ClassDashboard" element={<ClassDashboard />} />

        {/* Protected routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Students" element={<StudentData />} />
          <Route path="/FeeManagement" element={<FeeManagement />} />
          <Route path="/Classes" element={<Classes />} />
          <Route path="/FeeView" element={<FeeView />} />
          <Route path="/StudentFeeProfile" element={<StudentFeeProfile />} />
          <Route path="/Report" element={<Report />} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;