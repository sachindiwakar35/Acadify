import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ACADEMIC_MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

export const Dashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [session, setSession] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);

  const navigate = useNavigate();
  const currentSession = sessionStorage.getItem("schoolSession");

  // ✅ Protect Dashboard (check login token)
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  // ✅ Load saved session
  useEffect(() => {
    const savedSession = sessionStorage.getItem("schoolSession");
    if (savedSession) {
      setSession(savedSession);
      setShowDashboard(true);
    }
  }, []);

  // ✅ Save Session
  const saveSession = () => {
    if (session.trim()) {
      sessionStorage.setItem("schoolSession", session);
      setShowDashboard(true);
    } else {
      alert("Please select a valid session!");
    }
  };

  // ✅ Download Student Data
  const handle = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/updateFee`,{
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
      });
      const worksheet = XLSX.utils.json_to_sheet(response.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      const excelBuffer = XLSX.write(workbook, { BookType: "xlsx", type: "array" });
      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileData, "StudentStatusData.xlsx");
    } catch (error) {
      console.log("Error Fetching the data", error);
    }
  };

  // ✅ Download Class Data
  const fun = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/classes`,
        {
          params: { classsession: sessionStorage.getItem("schoolSession") },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
        
      );
      const worksheet = XLSX.utils.json_to_sheet(response.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Classes");
      const excelBuffer = XLSX.write(workbook, { BookType: "xlsx", type: "array" });
      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(fileData, "ClassesData.xlsx");
    } catch (error) {
      console.log("Error Fetching the data", error);
    }
  };

  // ✅ Total Students
  useEffect(() => {
    if (showDashboard) {
      const fetchTotalStudents = async () => {
        try {
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/student`,
            { params: { classsession: sessionStorage.getItem("schoolSession") },headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          }, }
          );
          setTotalStudents(res.data.length);
        } catch (error) {
          console.error("Error fetching student count:", error);
        }
      };
      fetchTotalStudents();
    }
  }, [showDashboard]);

  // ✅ Total Classes
  useEffect(() => {
    if (showDashboard) {
      const fetchClasses = async () => {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/classes`,{ 
            params: { classsession: sessionStorage.getItem("schoolSession")},
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          }
          );
          setTotalClasses(res.data.length);
        } catch (error) {
          console.log("Error fetching classes:", error);
        }
      };
      fetchClasses();
    }
  }, [showDashboard]);

  // ✅ Pending Students Count
  useEffect(() => {
    const fetchPendingStudents = async () => {
      if (!session) return;

      const jsMonth = new Date().getMonth(); // 0 = Jan
      const currentMonth = ACADEMIC_MONTHS[(jsMonth + 9) % 12]; // Align Apr–Mar
      console.log("📌 Current Academic Month:", currentMonth);

      try {
        // Step 1: Get all classes
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/classes`,{ 
          params: { classsession: session },
           headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        let classList = Array.isArray(res.data)
          ? res.data
          : res.data?.result || [];

        // Step 2: Count pending students
        let totalPending = 0;
        for (const c of classList) {
          const className = typeof c === "string" ? c : c.className;

          const report = await axios.get(`${process.env.REACT_APP_API_URL}/classFeeReport`,{
            params: { className, classsession: session, month: currentMonth },
            headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          } 
          });

          const students = report.data.students || [];
          const pending = students.filter((s) => s.status !== "PAID");
          totalPending += pending.length;
        }

        console.log("📌 Total Pending Students:", totalPending);
        sessionStorage.setItem("pending", totalPending);
      } catch (err) {
        console.error("Error fetching pending students:", err);
      }
    };

    fetchPendingStudents();
  }, [session]);

  return (
    <div className="dashboard-container">
      {/* ✅ Session Selector */}
      <AnimatePresence>
        {!showDashboard && (
          <motion.div
            className="session-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2 initial={{ y: -20 }} animate={{ y: 0 }}>
              Select Current Session
            </motion.h2>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="session-input"
            >
              <option value="">-- Select Session --</option>
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
              <option value="2026-27">2026-27</option>
              <option value="2027-28">2027-28</option>
              <option value="2028-29">2028-29</option>
              <option value="2029-30">2029-30</option>
            </select>
            <button className="session-btn" onClick={saveSession}>
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Dashboard */}
      {showDashboard && (
        <motion.div
          className="dashboard-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="welcome"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>
              Welcome Back, <span className="highlight">Administrator!</span>
            </h1>
            <p>
              Session: <strong>{currentSession}</strong>
            </p>
            <p>
              Here’s a quick overview of your school’s key statistics and recent activities.
            </p>
          </motion.div>

          <section className="summary">
            <motion.div
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/Students")}
            >
              <h3>Total Students</h3>
              <p className="number">{totalStudents}</p>
              <span>Across all grades in {currentSession}</span>
            </motion.div>

            <motion.div
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/Classes")}
            >
              <h3>Total Registered Classes</h3>
              <p className="number">{totalClasses}</p>
              <span>New Classes Registered this year</span>
            </motion.div>

            <motion.div
              className="card"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/ClassDashboard")}
            >
              <h3>Pending Fee Payments</h3>
              <p className="number">{sessionStorage.getItem("pending")}</p>
              <span>Outstanding payments this month</span>
            </motion.div>
          </section>

          <div className="activity-container">
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <button className="action-btn purple" onClick={handle}>
                👥 Download Student Excel
              </button>
              <button className="action-btn blue" onClick={fun}>
                Download Classes Excel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <small className="note2" onClick={() => navigate("/AboutDeveloper")}>
        Developed by - SACHIN DIWAKAR
      </small>
    </div>
  );
};
