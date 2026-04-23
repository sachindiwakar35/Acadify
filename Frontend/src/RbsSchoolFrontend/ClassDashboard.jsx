import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./ClassDashboard.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September",
  "October", "November", "December"
];

const COLORS = ["#2ecc71", "#e74c3c"]; // Paid, Unpaid

export function ClassDashboard() {
  const { state } = useLocation();
  const initialClass = state?.classname || ""; // ✅ directly destructure

  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState(initialClass);
  const [month, setMonth] = useState("");
  const [session, setSession] = useState(
    sessionStorage.getItem("schoolSession") || ""
  );
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    paid_students: 0,
    unpaid_students: 0,
    total_paid_amount: 0,
  });
  const [rows, setRows] = useState([]);
  const [search] = useState("");

  const navigate = useNavigate();

  // 🔹 Auth check
  useEffect(() => {
    if (!sessionStorage.getItem("token")) {
      navigate("/");
    }
  }, [navigate]);

  // 🔹 Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/classes`,
          { params: { classsession: session }, 
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
        );

        let classList = [];
        if (Array.isArray(res.data)) {
          classList = res.data;
        } else if (res.data?.result && Array.isArray(res.data.result)) {
          classList = res.data.result;
        }

        setClasses(classList);

        // ✅ if no class selected from navigation, default to first class
        if (!initialClass && classList.length > 0) {
          const firstClass =
            typeof classList[0] === "object"
              ? classList[0].className
              : classList[0];
          setClassName(firstClass);
        }
      } catch (e) {
        console.warn("Could not fetch classes", e);
      }
    };

    if (session) fetchClasses();
  }, [session, initialClass]);

  // 🔹 Fetch report data
  const fetchReport = async () => {
    if (!className || !session) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_API_URL}/classFeeReport`,
        {
          params: {
            className,
            classsession: session,
            month: month || undefined,
          },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setSummary(res.data.summary || {
        paid_students: 0,
        unpaid_students: 0,
        total_paid_amount: 0,
      });
      setRows(res.data.students || []);
    } catch (e) {
      console.error("Error fetching report:", e);
      setSummary({ paid_students: 0, unpaid_students: 0, total_paid_amount: 0 });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [className, month, session]);

  // 🔹 Chart data
  const chartData = useMemo(
    () => [
      { name: "Paid Students", value: summary.paid_students || 0 },
      { name: "Unpaid Students", value: summary.unpaid_students || 0 },
    ],
    [summary]
  );

  // 🔹 Search filter
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.studentname || "").toLowerCase().includes(q) ||
        (r.fathername || "").toLowerCase().includes(q) ||
        (r.month || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <div className="report-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1>Fee Reports</h1>

      <div className="filters">
        <div className="filter">
          <label>Session</label>
          <input
            value={session}
            onChange={(e) => {
              const newSession = e.target.value;
              setSession(newSession);
              sessionStorage.setItem("schoolSession", newSession);
            }}
            placeholder="e.g. 2024-25"
          />
        </div>

        <div className="filter">
          <label>Class</label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          >
            {classes.map((c, i) => (
              <option key={i} value={typeof c === "string" ? c : c.className}>
                {typeof c === "string" ? c : c.className}
              </option>
            ))}
          </select>
        </div>

        <div className="filter">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ Summary cards */}
      <div className="summary-cards">
        <div className="card paid">
          <div className="label">Paid Students</div>
          <div className="value">{summary.paid_students || 0}</div>
        </div>
        <div className="card unpaid">
          <div className="label">Unpaid Students</div>
          <div className="value">{summary.unpaid_students || 0}</div>
        </div>
        <div className="card total">
          <div className="label">Total Collected</div>
          <div className="value">₹{summary.total_paid_amount || 0}</div>
        </div>
      </div>

      {/* ✅ Chart */}
      <div className="chart-wrapper">
        <h3>Fee Status Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} students`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Table */}
      <div className="table-section">
        <h3>Fee Details</h3>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th>Phone Number</th>
                <th>Month</th>
                <th>Status</th>
                <th>Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="loading-cell">
                    <div className="loading-spinner"></div>
                    Loading fee data...
                  </td>
                </tr>
              ) : filteredRows.length ? (
                filteredRows.map((r, i) => (
                  <tr key={`${r.student_id}-${r.month}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{r.studentname}</td>
                    <td>{r.fathername}</td>
                    <td>
                      <a
                        href={`https://wa.me/${r.phone}?text=Hello%20${encodeURIComponent(
                          r.studentname
                        )},%20please%20pay%20your%20fee%20for%20${encodeURIComponent(
                          r.month
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {r.phone}
                      </a>
                    </td>
                    <td>{r.month}</td>
                    <td
                      className={`status ${
                        r.status === "PAID" ? "paid" : "unpaid"
                      }`}
                    >
                      {r.status}
                    </td>
                    <td className="amount">₹{r.paid_amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No fee records found for the selected criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
