import "./AboutDeveloper.css";
import { useNavigate } from "react-router-dom";
export const AboutDeveloper=()=> {
  const navigate = useNavigate();
  return (
    <div className="about-container">
      <div className="about-card">
        <h1>About the Developer</h1>
        <p>Hello! 👋</p>
        <p>
          My name is <strong>Sachin Diwakar</strong>.  
          I’m a passionate <strong>MERN Stack Developer</strong> who loves
          building real-world applications like this School Management System.
        </p>

        <h2>Skills</h2>
        <ul>
          <li>React.js, Node.js, Express.js,MySQL</li>
          <li>HTML, CSS, JavaScript</li>
          <li>MySQL, REST APIs</li>
        </ul>

        <h2>Contact</h2>
        <p>Email: <a href="https://mail.google.com/mail/?view=cm&fs=1&to=sachindiwakar711@gmail.com" target="_blank" rel="noreferrer">sachindiwakar711@gmail.com</a></p>
        <p>Phone: +91 7895838237</p>
        <p>
          LinkedIn: <a href="https://www.linkedin.com/in/sachin-diwakar" target="_blank"  rel="noreferrer">https://www.linkedin.com/in/sachin-diwakar</a>
        </p>
        <br />
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      </div>
    </div>
  );
}
