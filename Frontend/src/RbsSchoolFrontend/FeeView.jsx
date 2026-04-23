import React, { useRef,useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './FeeView.css';
import axios from 'axios';

export const FeeView = () => {
  const janRef = useRef();
  const febRef = useRef();
  const marRef = useRef();
  const apRef = useRef();
  const mayRef = useRef();
  const junRef = useRef();
  const julRef = useRef();
  const augRef = useRef();
  const sepRef = useRef();
  const octRef = useRef();
  const novRef = useRef();
  const decRef = useRef();
  const examRef = useRef();

  const location = useLocation();
  const { className,session } = location.state || {};

  const navigate = useNavigate();
    useEffect(() => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/");
      }
    }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(session);
    if (!className) {
      alert("Class name is missing. Please go back and select a class.");
      return;
    }
    if (!session) {
      alert("Session name is missing. Please go back and select a class.");
      return;
    }

    const payload = {
      classsession:session,
      className: className,
      january: janRef.current.value,
      february: febRef.current.value,
      march: marRef.current.value,
      april: apRef.current.value,
      may: mayRef.current.value,
      june: junRef.current.value,
      july: julRef.current.value,
      august: augRef.current.value,
      september: sepRef.current.value,
      october: octRef.current.value,
      november: novRef.current.value,
      december: decRef.current.value,
      // examFee: examRef.current.value
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/FeeStructure`, payload);
      console.log(response.data);
      alert("Fee definitions saved!");
      navigate("/classes");
    } catch (error) {
      console.error(error);
      alert("Failed to save fees.");
    }
  };

  // const goBack = () => navigate(-1);

  return (
    <form className="fd-card" onSubmit={handleSubmit}>
      {/* <button type="button" onClick={goBack} className="fd-back">
        ← Back
      </button> */}

      <h1 className="fd-title">Fee Definition</h1>
      <p className="fd-sub">
        Define monthly tuition fees and exam fees for the academic year.
      </p>

      <div className="fd-row">
        <label>Class</label>
        <input type="text" value={"Class - "+className || ""} readOnly />
      </div>
      <div className="fd-row">
        <label>Session</label>
        <input type="text" value={"Session - "+session || ""} readOnly />
      </div>

      <div className="fd-row">
        <label>January</label>
        <input type="text" required ref={janRef} />
        <label>February</label>
        <input type="text" required ref={febRef} />
        <label>March</label>
        <input type="text" required ref={marRef} />
        <label>April</label>
        <input type="text" required ref={apRef} />
        <label>May</label>
        <input type="text" required ref={mayRef} />
        <label>June</label>
        <input type="text" required ref={junRef} />
        <label>July</label>
        <input type="text" required ref={julRef} />
        <label>August</label>
        <input type="text" required ref={augRef} />
        <label>September</label>
        <input type="text" required ref={sepRef} />
        <label>October</label>
        <input type="text" required ref={octRef} />
        <label>November</label>
        <input type="text" required ref={novRef} />
        <label>December</label>
        <input type="text" required ref={decRef} />
      </div>

      <div className="fd-row fd-exam">
        <label>Exam Fees</label>
        <input type="text" required placeholder="Enter Exam Fee" ref={examRef} />
      </div>

      <button className="fd-btn" type="submit">
        Save Fee Definitions
      </button>
    </form>
  );
};
