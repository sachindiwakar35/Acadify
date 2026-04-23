import { useEffect, useState } from "react";
import "./Report.css";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Report = () => {
  const [classesData, setClassesData] = useState([]);
  const navigate = useNavigate();

    useEffect(() => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/");
      }
    }, [navigate]);

  useEffect(() => {
    const fun = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/classes`, {params: { classsession: sessionStorage.getItem("schoolSession") },
      headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },});
        console.log(response.data);
        setClassesData(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    fun();
  }, []);

  return (
    <div id="rep1">
      <motion.div
        className="dashboard-content1"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <section className="summary1">
          {classesData.map((cls, index) => (
            <motion.div
              key={index}
              className="card1"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/ClassDashboard",{state:{classname:cls.className}})}
            >
              <h3>{cls.className}</h3>
            </motion.div>
          ))}
        </section>
      </motion.div>
    </div>
  );
};
