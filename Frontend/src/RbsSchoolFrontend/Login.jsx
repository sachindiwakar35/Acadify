import React, { useRef } from "react";
import "./Login.css";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const navigate = useNavigate();
  const masterKeyRef = useRef();
  const handle= async (e)=>{
    e.preventDefault();
    let logkey = masterKeyRef.current.value;
    try{
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/checkMaster1`,{logkey});
      console.log("Response", response.data);
      console.log("Your Token : ", response.data.token);
      sessionStorage.setItem("token",response.data.token);
      if(response.data.status){
        alert("Login Successful");
        setTimeout(() => {
          navigate("/Dashboard");
        }, 500);
      }
    }catch(error){
      console.error(error);
      alert("Invalid Key");
    }
  }
  return (
    <div className="login-container">
      {/* Left Section */}
      <motion.div 
        className="login-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      > 
        <h2>Secure Access to <span className="highlight">RBS School Portal</span></h2>
        <p>
          Welcome to the EduAdmin Portal, your centralized platform for managing
          student data, fees, and school operations. This portal is exclusively
          for authorized staff to ensure secure and efficient administration.
        </p>
        <small className="note">
          Strict security protocols are in place to protect sensitive information.
        </small>
        <small className="note1" onClick={()=>navigate("/AboutDeveloper")}>Developed by - SACHIN DIWAKAR</small>
      </motion.div>
      {/* Right Section */}
      <motion.div 
        className="login-right"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="login-box">
          <h1 className="logo">✦ Logo</h1>
          <h2 className="login-title">Admin Login</h2>
          <form>
            <div className="form-group">
              <label>Key</label>
              <input type="password" placeholder="Enter your Key" ref={masterKeyRef}/>
            </div>
            <button type="submit" className="login-btn" onClick={handle}>
              Login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

