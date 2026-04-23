import React, { useRef, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import { motion } from "framer-motion";
import "./FeeManagement.css";

export const FeeManagement = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  /* -------------------- STATE -------------------- */
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentSession = sessionStorage.getItem("schoolSession") || "";

  /* -------------------- REFS -------------------- */
  const classNameRef = useRef();
  const studentNameRef = useRef();
  const fatherNameRef = useRef();
  const studentIdRef = useRef();
  const amountRef = useRef();

  /* -------------------- CONSTANTS -------------------- */
  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  /* -------------------- DERIVED DATA -------------------- */
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return students;
    return students.filter((s) => s.class_name === selectedClass);
  }, [selectedClass, students]);

  const totalSelected = useMemo(() => {
    return Object.values(selectedMonths).reduce(
      (a, b) => a + (Number(b) || 0),
      0
    );
  }, [selectedMonths]);

  /* -------------------- HANDLERS -------------------- */
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    resetStudentData();
    if (studentNameRef.current) studentNameRef.current.value = "";
    if (fatherNameRef.current) fatherNameRef.current.value = "";
    if (studentIdRef.current) studentIdRef.current.value = "";
  };

  const handleStudentNameChange = (e) => {
    const studentName = e.target.value;
    if (!studentName) return resetStudentData();

    const student = students.find(
      (s) => s.student_name === studentName && s.class_name === selectedClass
    );
    if (student) {
      setSelectedStudent(student);
      if (fatherNameRef.current)
        fatherNameRef.current.value = student.parents_name;
      if (studentIdRef.current) studentIdRef.current.value = student.student_id;
      fetchStudentInfo(student.student_id);
    }
  };

  const handleFatherNameChange = (e) => {
    const fatherName = e.target.value;
    if (!fatherName) return resetStudentData();

    const student = students.find(
      (s) => s.parents_name === fatherName && s.class_name === selectedClass
    );
    if (student) {
      setSelectedStudent(student);
      if (studentNameRef.current)
        studentNameRef.current.value = student.student_name;
      if (studentIdRef.current) studentIdRef.current.value = student.student_id;
      fetchStudentInfo(student.student_id);
    }
  };

  const handleStudentIdChange = (e) => {
    const studentId = e.target.value;
    if (!studentId) return resetStudentData();

    const student = students.find(
      (s) =>
        s.student_id === parseInt(studentId) && s.class_name === selectedClass
    );
    if (student) {
      setSelectedStudent(student);
      if (studentNameRef.current)
        studentNameRef.current.value = student.student_name;
      if (fatherNameRef.current)
        fatherNameRef.current.value = student.parents_name;
      fetchStudentInfo(student.student_id);
    }
  };

  const handleCheck = (month, amt, checked, index) => {
    if (checked) {
      if (index > 0) {
        const prevMonth = months[index - 1];
        if (!alreadyPaid.includes(prevMonth) && !selectedMonths[prevMonth]) {
          alert(`⚠️ Please pay for ${prevMonth} first!`);
          return;
        }
      }
      setSelectedMonths((prev) => ({ ...prev, [month]: Number(amt) || 0 }));
    } else {
      setSelectedMonths((prev) => {
        const copy = { ...prev };
        delete copy[month];
        for (let i = index + 1; i < months.length; i++) {
          const laterMonth = months[i];
          if (copy[laterMonth] && !alreadyPaid.includes(laterMonth)) {
            delete copy[laterMonth];
          }
        }
        return copy;
      });
    }
  };

  const handleSave = async () => {
    if (!feeData || !selectedStudent) return;

    const classname = selectedStudent.class_name;
    const studentname = selectedStudent.student_name;
    const fathername = selectedStudent.parents_name;
    const classsession = currentSession;
    const monthsArray = Object.keys(selectedMonths);
    const paid_amount = Number(amountRef.current?.value || 0);

    if (!classsession || monthsArray.length === 0) {
      alert("Please select at least one month.");
      return;
    }
    if (paid_amount < totalSelected) {
      alert(
        `Amount paid (${paid_amount}) is less than the total selected amount (${totalSelected}).`
      );
      return;
    }

    let status = "DUE";
    if (paid_amount >= totalSelected && monthsArray.length > 0) status = "PAID";
    else if (paid_amount > 0 && paid_amount < totalSelected) status = "PARTIAL";

    const payload = {
      student_id: selectedStudent.student_id,
      classname,
      studentname,
      fathername,
      classsession,
      months: monthsArray,
      paid_amount,
      status,
    };

    try {
      setIsSaving(true);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/updateFee`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (res.data.paidMonths) {
        alert(
          `❌ Some months are already paid: ${res.data.paidMonths.join(", ")}`
        );
        fetchStudentInfo(selectedStudent.student_id);
      } else {
        alert(res.data.message || "Saved!");
        generateReceipt(
          payload,
          feeData,
          monthsArray,
          totalSelected,
          paid_amount,
          status
        );
        if (amountRef.current) amountRef.current.value = "";
        setSelectedMonths({});
        fetchStudentInfo(selectedStudent.student_id);
      }
    } catch (err) {
      console.error("Error saving fee:", err);
      if (err.response?.data?.paidMonths) {
        alert(
          `❌ Some months are already paid: ${err.response.data.paidMonths.join(
            ", "
          )}`
        );
        fetchStudentInfo(selectedStudent.student_id);
      } else {
        alert(
          "❌ Failed to save fee: " +
            (err.response?.data?.message || "Check console")
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  /* -------------------- HELPERS -------------------- */

  // ✅ Individual Month Receipt
  const MonthReceiptGenerate = (studentData, feeData, month, amount) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RBS School", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Student Name: ${studentData.student_name}`, 20, 40);
    doc.text(`Father's Name: ${studentData.parents_name}`, 20, 50);
    doc.text(`Class: ${studentData.class_name}`, 20, 60);
    doc.text(`Session: ${currentSession}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Month", 20, 100);
    doc.text("Amount", 160, 100);
    doc.line(20, 102, 190, 102);

    doc.setFont(undefined, "normal");
    doc.text(month, 20, 115);
    doc.text(`₹${amount}`, 160, 115);

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(`Total Paid: ₹${amount}`, 20, 140);
    doc.text(`Status: PAID`, 20, 150);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Thank you for your payment!", 105, 170, { align: "center" });

    doc.save(`Fee_Receipt_${studentData.student_id}_${month}.pdf`);
  };

  const resetStudentData = () => {
    setSelectedStudent(null);
    setStudentInfo(null);
    setFeeData(null);
    setSelectedMonths({});
    setAlreadyPaid([]);
  };

  const fetchStudentInfo = async (studentId) => {
    try {
      setError("");
      const studentRes = await axios.get(
        `${process.env.REACT_APP_API_URL}/index.php?endpoint=student/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setStudentInfo(studentRes.data);

      const feeStructurePayload = {
        className: studentRes.data.class_name,
        classsession: currentSession,
      };
      const feeRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/index.php?endpoint=GetFeeStructure`,
        feeStructurePayload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setFeeData(feeRes.data.data || null);

      const paidMonthsPayload = {
        student_id: studentId,
        classsession: currentSession,
      };
      const paidRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/index.php?endpoint=getPaidMonths`,
        paidMonthsPayload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setAlreadyPaid(paidRes.data.paidMonths || []);
    } catch (err) {
      console.error("Error fetching student:", err);
      setError("Failed to fetch student information");
    }
  };

  // ✅ Multi-month receipt (after saving)
  const generateReceipt = (
    studentData,
    feeData,
    monthsArray,
    totalAmount,
    paid_amount,
    status
  ) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RBS School", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Student Name: ${studentData.studentname}`, 20, 40);
    doc.text(`Father's Name: ${studentData.fathername}`, 20, 50);
    doc.text(`Class: ${studentData.classname}`, 20, 60);
    doc.text(`Session: ${studentData.classsession}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Month", 20, 100);
    doc.text("Amount", 160, 100);
    doc.line(20, 102, 190, 102);

    let y = 110;
    monthsArray.forEach((month) => {
      const amount = `₹${feeData[month.toLowerCase()] || 0}`;
      doc.setFont(undefined, "normal");
      doc.text(month, 20, y);
      doc.text(amount, 160, y);
      y += 10;
    });

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.text(`Total Selected: ₹${totalAmount}`, 20, y + 15);
    doc.text(`Paid Amount: ₹${paid_amount}`, 20, y + 25);
    doc.text(`Status: ${status}`, 20, y + 35);

    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text("Thank you for your payment!", 105, y + 50, { align: "center" });

    doc.save(`Fee_Receipt_${studentData.student_id}.pdf`);
  };

  /* -------------------- EFFECTS -------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/index.php?endpoint=student`,
          {
            params: { classsession: sessionStorage.getItem("schoolSession") },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setStudents(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, []);

  /* -------------------- UI -------------------- */
  return (
    <motion.div className="fm-wrapper" initial="hidden" animate="visible">
      <main className="fm-main">
        <h1>Fee Management</h1>

        {/* ---------- CONTROLS ---------- */}
        <section className="fm-controls">
          <select
            className="fm-search"
            value={selectedClass}
            onChange={handleClassChange}
            ref={classNameRef}
          >
            <option value="">Select Class</option>
            {[...new Set(students.map((s) => s.class_name))].map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>

          <select
            className="fm-search"
            onChange={handleStudentNameChange}
            ref={studentNameRef}
            disabled={!selectedClass}
          >
            <option value="">Select Student Name</option>
            {filteredStudents.map((s) => (
              <option key={s.student_id} value={s.student_name}>
                {s.student_name}
              </option>
            ))}
          </select>

          <select
            className="fm-search"
            onChange={handleFatherNameChange}
            ref={fatherNameRef}
            disabled={!selectedClass}
          >
            <option value="">Select Father's Name</option>
            {filteredStudents.map((s) => (
              <option key={s.student_id} value={s.parents_name}>
                {s.parents_name}
              </option>
            ))}
          </select>

          <select
            className="fm-search"
            onChange={handleStudentIdChange}
            ref={studentIdRef}
            disabled={!selectedClass}
          >
            <option value="">Select Student ID</option>
            {filteredStudents.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.student_id}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={currentSession}
            readOnly
            className="fm-search"
          />
        </section>

        {error && <p className="fm-error">{error}</p>}

        {studentInfo && (
          <div className="student-info-card">
            <h3>Student Information</h3>
            <div className="student-details">
              <p>
                <strong>Name:</strong> {studentInfo.student_name}
              </p>
              <p>
                <strong>Class:</strong> {studentInfo.class_name}
              </p>
              <p>
                <strong>Father's Name:</strong> {studentInfo.parents_name}
              </p>
              <p>
                <strong>Roll No:</strong> {studentInfo.roll_no}
              </p>
              <p>
                <strong>Student ID:</strong> {studentInfo.student_id}
              </p>
            </div>
          </div>
        )}

        {feeData && (
          <div className="card table-card">
            <div className="table-header">
              <h3>Fee Payment Breakdown</h3>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Total Amount</th>
                    <th>Pay</th>
                    <th>Status</th>
                    <th>Fee Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((month, i) => {
                    const amt = feeData[month.toLowerCase()] || 0;
                    const checked = !!selectedMonths[month];
                    const isPaid = alreadyPaid.includes(month);
                    return (
                      <tr key={i}>
                        <td>{month}</td>
                        <td>₹{amt}</td>
                        <td>
                          <input
                            type="checkbox"
                            disabled={isPaid}
                            onChange={(e) =>
                              handleCheck(month, amt, e.target.checked, i)
                            }
                            checked={checked || isPaid}
                          />
                        </td>
                        <td>
                          {isPaid ? (
                            <span className="status-paid">Already Paid</span>
                          ) : checked ? (
                            <span className="status-paying">Selected</span>
                          ) : (
                            <span className="status-pending">Pending</span>
                          )}
                        </td>
                        <td>
                          {isPaid && (
                            <button
                              className="save-btn"
                              onClick={() =>
                                MonthReceiptGenerate(
                                  studentInfo,
                                  feeData,
                                  month,
                                  amt
                                )
                              }
                            >
                              Download Fee Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="total-section">
              <label>Total Selected: ₹</label>
              <input
                type="number"
                value={totalSelected}
                ref={amountRef}
                readOnly
              />
            </div>

            <div
              className="table-header"
              style={{ justifyContent: "flex-end" }}
            >
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
};
