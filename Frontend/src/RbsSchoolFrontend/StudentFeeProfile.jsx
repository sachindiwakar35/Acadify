import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StudentFeeProfile.css";
import axios from "axios";

export const StudentFeeProfile = () => {
  const [studentData, setStudentData] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const amount = useRef();
    useEffect(() => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/");
      }
    }, [navigate]);

  // id passed from StudentList.jsx
  const { id } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3600/FeeSubmit");

        const student = response.data.result.find(
          (s) => String(s.id) === String(id)
        );
        if (student) {
          setStudentData(student);
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
      }
    };
    fetchData();
  }, [id]);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const handleCheck = (month, amount, isChecked, index) => {
    // force sequential month payments
    if (isChecked && index > 0) {
      const prevMonth = months[index - 1];
      if (!selectedMonths[prevMonth]) return;
    }

    setSelectedMonths((prev) => {
      const updated = { ...prev };
      if (isChecked) {
        updated[month] = amount;
      } else {
        months.slice(index).forEach((m) => delete updated[m]);
      }
      return updated;
    });
  };

  // total of all checked months
  const totalPaid = Object.values(selectedMonths).reduce(
    (sum, amt) => parseInt(sum) + parseInt(amt),
    0
  );

  // Save changes handler
  const updateStatus = async () => {
    const enteredAmount = parseInt(amount.current.value || 0);

    // decide status
    let status = "DUE";
    if (enteredAmount === totalPaid) {
      status = "PAID";
    }

    try {
      const payload = {
        student_id: studentData.id,
        paid_amount: enteredAmount,
        status: status,
        months: Object.keys(selectedMonths),
      };

      const res = await axios.post("http://localhost:3600/updateFee", payload);
      alert(res.data.message);
    } catch (err) {
      console.error("Error saving fee:", err);
      alert("❌ Failed to save fee");
    }
  };

  if (!studentData) return <h2>Loading student data...</h2>;

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Student Fee Profile</h1>
      </div>

      <main className="main-grid">
        {/* LEFT SIDE */}
        <div className="left-col">
          <div className="card student-card">
            <img src="goku.webp" alt="" className="student-avatar" />
            <div>
              <h2>{studentData.student_name}</h2>
              <p>ID: {studentData.id}</p>
              <p>{studentData.class_name} · Roll {studentData.roll_no}</p>
            </div>
          </div>

          <div className="card">
            <h3>Parent / Guardian</h3>
            <ul>
              <li><strong>Father:</strong> {studentData.parents_name}</li>
              <li><strong>Phone:</strong> {studentData.phone_no}</li>
            </ul>
          </div>

          <div className="card">
            <h3>Address</h3>
            <p>{studentData.address}</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="card table-card">
          <div className="table-header">
            <h3>Fee Payment Breakdown</h3>
            <button className="save-btn" onClick={updateStatus}>Save Changes</button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Amount</th>
                  <th>Pay</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, i) => {
                  const amt = studentData[month.toLowerCase()] || 0;
                  return (
                    <tr key={i}>
                      <td>{month}</td>
                      <td>₹{amt}</td>
                      <td>
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            handleCheck(month, amt, e.target.checked, i)
                          }
                          checked={!!selectedMonths[month]}
                        />
                      </td>
                      <td>
                        {selectedMonths[month] ? (
                          <span className="status-paying">Paying</span>
                        ) : (
                          <span className="status-pending">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="total-section">
            <h3>Total Selected: ₹{totalPaid}</h3>
          </div>

          <div className="total-section">
            <label>Enter Amount: </label>
            <input type="number" placeholder="Enter Amount" ref={amount} />
          </div>
        </div>
      </main>
    </div>
  );
};
