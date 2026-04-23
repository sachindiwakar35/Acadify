import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentData.css";
import { motion } from "framer-motion";
import axios from "axios";
import * as XLSX from "xlsx";

// 📌 Convert Excel numeric dates to YYYY-MM-DD
function excelDateToJSDate(serial) {
  if (typeof serial === "number") {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split("T")[0];
  }
  return serial; // already a string
}

export const StudentData = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const studentNameRef = useRef();
  const classNameRef = useRef();
  const dateOfBirthRef = useRef();
  const genderRef = useRef();
  const parentsNameRef = useRef();
  const addressRef = useRef();
  const phoneNumberRef = useRef();

  // 🔍 Search Handler
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // ✅ Fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/student`,
        {
          params: { classsession: sessionStorage.getItem("schoolSession") },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setStudents(response.data);
    } catch (error) {
      console.log("Error fetching students", error);
    }
  };

  // ✅ Add Single Student
  const handleAddStudent = async (e) => {
    e.preventDefault();

    const payload = {
      student_name: studentNameRef.current.value,
      class_name: classNameRef.current.value,
      dateofbirth: dateOfBirthRef.current.value,
      gender: genderRef.current.value,
      parents_name: parentsNameRef.current.value,
      session: sessionStorage.getItem("schoolSession"),
      address: addressRef.current.value,
      phone_no: phoneNumberRef.current.value,
    };

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/student`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      alert("✅ Student registered successfully!");
      fetchStudents();

      // Clear form
      studentNameRef.current.value = "";
      classNameRef.current.value = "";
      dateOfBirthRef.current.value = "";
      genderRef.current.value = "";
      parentsNameRef.current.value = "";
      addressRef.current.value = "";
      phoneNumberRef.current.value = "";
    } catch (error) {
      console.error("Error saving student:", error);
      alert("❌ Failed to save student");
    }
  };

  // ✅ Import Students from Excel
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        console.log("📊 Parsed Excel Data:", rows);

        // ✅ Map + Validate required fields
        const payload = rows
          .map((row, index) => {
            const student = {
              roll_no: row["roll_no"] || row["Roll No"] || null,
              student_name: row["student_name"] || row["Student Name"] || null,
              class_name: row["class_name"] || row["Class"] || null,
              dateofbirth: row["dateofbirth"] || row["Date of Birth"] || null,
              gender: row["gender"] || row["Gender"] || null,
              parents_name: row["parents_name"] || row["Parents Name"] || null,
              session:
                row["session"] || sessionStorage.getItem("schoolSession"),
              address: row["address"] || row["Address"] || null,
              phone_no:
                row["phone_no"] || row["Phone"] || row["Phone Number"] || null,
            };

            // ❌ Reject rows missing required fields
            const requiredFields = [
              "student_name",
              "class_name",
              "dateofbirth",
              "gender",
              "parents_name",
              "session",
              "address",
              "phone_no",
            ];
            for (const f of requiredFields) {
              if (!student[f]) {
                console.warn(`Row ${index + 2} skipped: missing ${f}`);
                return null;
              }
            }

            return student;
          })
          .filter((s) => s !== null);

        if (payload.length === 0) {
          alert(
            "❌ No valid students found in Excel (all required fields missing)."
          );
          return;
        }

        // ✅ Send to backend
        await axios.post(
          `${process.env.REACT_APP_API_URL}/studentsBulk`,
          {
            students: payload,
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        alert(`✅ ${payload.length} Students Imported Successfully!`);
        fetchStudents();
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("❌ Error uploading Excel:", error);
      alert("Failed to import students");
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/classestest`,
          {
            params: { classsession: sessionStorage.getItem("schoolSession") },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setClasses(response.data.result);
      } catch (error) {
        console.log("Error fetching classes", error);
      }
    };
    fetchClasses();
    fetchStudents();
  }, []);

  // ✅ Delete student
  const handleDelete = async (student_id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Student?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/student`,
        {
          params: { student_id },
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setStudents((prev) => prev.filter((s) => s.student_id !== student_id));
      alert("✅ Student deleted successfully");
    } catch (error) {
      console.error("Delete failed", error);
      alert("❌ Failed to delete student");
    }
  };

  // ✅ Filter students (by search + class)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesClass = selectedClass
        ? s.class_name === selectedClass
        : true;
      const name = s.student_name || "";
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, search, selectedClass]);

  return (
    <div className="student-container">
      <motion.div
        className="form-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2>Add New Student</h2>
        <p>Enter the details for a new student registration.</p>
      </motion.div>

      <form className="student-form" onSubmit={handleAddStudent}>
        <div className="form-grid">
          <div className="form-group">
            <label>Student Name</label>
            <input
              type="text"
              placeholder="Full Name"
              ref={studentNameRef}
              required
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select required ref={classNameRef}>
              <option value="">Select Class</option>
              {classes.map((cls, index) => (
                <option key={index} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" ref={dateOfBirthRef} required />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select ref={genderRef} required>
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Parent/Guardian's Name</label>
            <input
              type="text"
              placeholder="Parents Name"
              ref={parentsNameRef}
              required
            />
          </div>

          <div className="form-group">
            <label>Session</label>
            <input
              type="text"
              readOnly
              value={sessionStorage.getItem("schoolSession")}
              required
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              placeholder="Address"
              ref={addressRef}
              required
            />
          </div>

          <div className="form-group">
            <label>Parent Contact</label>
            <input
              type="text"
              placeholder="Phone Number"
              ref={phoneNumberRef}
              required
            />
          </div>
        </div>

        <motion.button
          type="submit"
          className="enroll-btn"
          whileHover={{ scale: 1.05 }}
        >
          👥 Enroll Student
        </motion.button>

        <motion.button
          type="button"
          className="enroll-btn"
          whileHover={{ scale: 1.05 }}
          onClick={() => document.getElementById("excelUpload").click()}
        >
          📥 Import Students Excel
        </motion.button>
        <input
          type="file"
          id="excelUpload"
          accept=".xlsx, .xls, .csv"
          style={{ display: "none" }}
          onChange={handleExcelUpload}
        />
      </form>

      <div className="records">
        <h2>Student Records</h2>
        <p>Manage and view all registered student profiles.</p>

        <div className="record-header">
          <input
            type="text"
            placeholder="🔍 Search students"
            className="search"
            onChange={handleSearch}
          />

          <select
            className="fm-search"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {[...new Set(students.map((s) => s.class_name))].map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        <table className="records-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Parent's Name</th>
              <th>Class</th>
              <th>Date of Birth</th>
              <th>Roll No</th>
              <th>Session</th>
              <th>Parent Contact</th>
              <th>Activity</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={index}>
                <td>{student.student_id}</td>
                <td>{student.student_name}</td>
                <td>{student.parents_name}</td>
                <td>{student.class_name}</td>
                <td>{student.dateofbirth}</td>
                <td>{student.roll_no}</td>
                <td>{student.session}</td>
                <td>{student.phone_no}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(student.student_id)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
