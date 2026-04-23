import React, { useEffect, useRef, useState } from "react";
import "./Classes.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Classes = () => {
  const [classes, setClasses] = useState([]);
  console.log(process.env.REACT_APP_API_URL);
  const classNameRef = useRef();
  const navigate = useNavigate();
  const currentSession = sessionStorage.getItem("schoolSession");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const handleAddClass = async (e) => {
    e.preventDefault();

    const payload = {
      className: classNameRef.current.value,
      session: currentSession,
    };

    if (!payload.className || !payload.session) {
      return alert("Fill in required fields");
    }

    try {
      // ✅ Correct API URL
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/classes`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      console.log(response.data);
      console.log(payload);
      alert("Class is Saved");

      // ✅ Pass className when navigating
      navigate("/FeeView", {
        state: { className: payload.className, session: payload.session },
      });

      classNameRef.current.value = "";
    } catch (error) {
      console.error(error);
      alert("Save failed");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this class?"
    );
    if (!confirmDelete) return;

    try {
      // ✅ Correct API URL
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/classes/${id}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setClasses((prev) => prev.filter((cls) => cls.id !== id));
      alert("Class deleted successfully");
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete class");
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // ✅ Correct API URL
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/classes`,
          {
            params: { classsession: sessionStorage.getItem("schoolSession") },
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching Classes", error);
      }
    };
    fetchClasses();
  }, []);

  return (
    <div className="classes-wrapper">
      <header className="classes-header">
        <div>
          <h1>Efficient Class Management</h1>
          <p>
            Empower your staff to seamlessly add, view, update, and delete class
            entries for a streamlined academic administration.
          </p>
        </div>
        <img
          src="https://img.icons8.com/external-flat-juicy-fish/344/external-teacher-school-flat-flat-juicy-fish.png"
          alt="teachers illustration"
          className="classes-illustration"
        />
      </header>

      <section className="add-class">
        <h2>Add New Class</h2>
        <div className="form-grid">
          <input
            type="text"
            placeholder="Class Name (e.g., 8A)"
            ref={classNameRef}
          />
          <input
            type="text"
            placeholder="Session (e.g., 2025-26)"
            value={currentSession}
            readOnly
          />
        </div>
        <button className="add-btn" onClick={handleAddClass}>
          Add Class
        </button>
      </section>

      <section className="registered-classes">
        <h2>Registered Classes List</h2>
        <table>
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Session</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id}>
                <td>{cls.className}</td>
                <td>{cls.session}</td>
                <td>
                  <button className="edit-btn">✎</button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(cls.id)}
                  >
                    🗑
                  </button>
                  <button
                    className="FeeView"
                    onClick={() =>
                      navigate("/FeeView", {
                        state: {
                          className: cls.className,
                          session: cls.session,
                        },
                      })
                    }
                  >
                    Modify Fee
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
