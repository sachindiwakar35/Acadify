const express = require("express");
const app = express();
const cors = require("cors");
const mq = require("mysql");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(cors());

const SECRET_KEY = "Your_Secret_Key";

const con = mq.createConnection({
    host: "localhost",
    user: "root",
    password: "Your BD password",
    database: "Your database name"
});

con.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database');
});

app.post("/checkMaster1", (req, res) => {
  console.log("🚀 API HIT /checkMaster1");
  console.log("📥 Body:", req.body);

  const { logkey } = req.body;

  console.log("🔑 Received Key:", logkey);

  const qu = "SELECT * FROM keyholder LIMIT 1";

  con.query(qu, (err, data) => {
    if (err) {
      console.log("❌ DB Error:", err);
      return res.status(500).send("Database error");
    }

    console.log("📄 DB Data:", data);

    if (data.length === 0) {
      console.log("❌ No key found");
      return res.status(404).send("No key stored");
    }

    const dbKey = data[0].logkey;
    console.log("🔐 Stored Key:", dbKey);

    if (logkey !== dbKey) {
      console.log("❌ Wrong Key");
      return res.status(401).send({ status: false });
    }

    const token = jwt.sign(
      { name: "masterKey" },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    console.log("✅ Token Generated:", token);

    res.send({
      status: true,
      token
    });
  });
});

app.post("/classes",(req,res)=>{
    const {className, session} = req.body;
    var qu = "insert into classes(className, `session`)values(?,?)";
    con.query(qu,[className,session],(err,result)=>{
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Data saved", result });
    });
});

app.get("/classes",(req,res)=>{
  const classsesion = req.query.classsession;
  var qu = "select * from classes where session = ?";
  con.query(qu,[classsesion],(err,result)=>{
    if (err) {
      console.error(err);
      return res.json({result});
    }
    res.json( result );
  });
});

app.get("/classestest",(req,res)=>{
  const classsesion = req.query.classsession;
  var qu = "select * from classes where session = ?";
  con.query(qu,[classsesion],(err,result)=>{
    if (err) {
      console.error(err);
      return res.json({result});
    }
    res.json( {result} );
  });
});

app.delete("/classes/:id",(req,res)=>{
    const {id} = req.params;
    var qu = "delete from classes where id = ?";
    con.query(qu,[id],(err,result)=>{
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Class deleted", result });
    });
});

app.delete("/student/:student_id",(req,res)=>{
    const {student_id} = req.params;
    var qu = "delete from student where student_id = ?";
    con.query(qu,[student_id],(err,result)=>{
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Class deleted", result });
    });
});

app.post("/reg", (req, res) => {
    const { key } = req.body;
    bcrypt.hash(key, 10, (err, hash) => {
        if (err) {
            console.error("Bcrypt Error:", err);
            return res.status(500).send("Error hashing key");
        }

        const qu = "INSERT INTO keyholder (key1) VALUES (?)";
        con.query(qu, [hash], function (err, result) {
            if (err) {
                console.error("DB Error:", err);
                return res.status(500).send("Database error");
            }

            console.log("Original Key:", key);
            console.log("Hashed Key:", hash);

            res.status(201).send({
                message: "Key saved successfully",
                insertId: result.insertId
            });
        });
    });
});

app.post("/student", (req, res) => {
  const { student_name, class_name, dateofbirth, gender, parents_name, session, address, phone_no } = req.body;
  const getRollNoQuery = "SELECT COALESCE(MAX(roll_no), 0) + 1 AS newRoll FROM student WHERE class_name = ?";
  con.query(getRollNoQuery, [class_name], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error fetching roll number" });
    }
    const newRollNo = result[0].newRoll;
    const insertQuery = `INSERT INTO student (roll_no, student_name, class_name, dateofbirth, gender, parents_name, session, address, phone_no)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    con.query(
      insertQuery,
      [newRollNo, student_name, class_name, dateofbirth, gender, parents_name, session, address, phone_no],
      (err, insertResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Error inserting student" });
        }
        res.json({
          message: "Student registered successfully",
          student_id: insertResult.insertId,
          roll_no: newRollNo
        });
      }
    );
  });
});

app.get("/student/:student_id", (req, res) => {
  const { student_id } = req.params;
  const q = "SELECT * FROM student WHERE student_id = ?";
  con.query(q, [student_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(result[0]); 
  });
});

// dono same API hai lekin ek session se data layega or ek classsession se layega because DB name alag hai na.
app.get("/student",(req,res)=>{
  const classsession = req.query.classsession;
  var qu = "select * from student where session = ?";
  con.query(qu,[classsession],(err,result)=>{
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(result);
  });
});

app.get("/studenttest",(req,res)=>{
  const classsession = req.query.session;
  var qu = "select * from student where session = ?";
  con.query(qu,[classsession],(err,result)=>{
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(result);
  });
});
app.get("/studentLike", (req, res) => {
  const student_name = req.query.student_name;
  const qu = "SELECT * FROM student WHERE student_name LIKE ?";
  con.query(qu, [student_name + "%"], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(result);
  });
});
app.get("/student1",(req,res)=>{
  const className = req.query.className;
  var qu = "SELECT * FROM feestatus WHERE TRIM(LOWER(classname)) = TRIM(LOWER(?))";
  con.query(qu,[className],(err,result)=>{
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.send(result);
  });
});

app.get("/classFeeStatusPie", (req, res) => {
  const { className, classsession, month } = req.query;
  let qu = `SELECT SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_students, SUM(CASE WHEN status != 'PAID' THEN 1 ELSE 0 END) AS unpaid_students FROM feestatus WHERE TRIM(LOWER(classname)) = TRIM(LOWER(?)) AND classsession = ?`;
  const params = [className.toLowerCase(), classsession];
  if (month) {
    qu += " AND TRIM(LOWER(month)) = TRIM(LOWER(?))";
    params.push(month.toLowerCase());
  }
  con.query(qu, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.send(result[0]);
  });
});


app.post("/updateFee", (req, res) => {
  const { student_id, classname, studentname, fathername, classsession, months, status } = req.body;
  const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || null;

  if (!student_id || !classsession || !months || months.length === 0) {
    return res.status(400).json({ message: "❌ student_id, classsession, and months are required" });
  }
  const checkQuery = `SELECT * FROM student WHERE student_id = ? AND student_name = ? AND class_name = ? AND parents_name = ? AND session = ?`;
  con.query(checkQuery, [student_id, studentname, classname, fathername, classsession], (err, checkResult) => {
    if (err) return res.status(500).json({ message: "Database error while checking student" });
    if (checkResult.length === 0) {
      return res.status(404).json({ message: "❌ Student not found with provided details" });
    }
    const checkPaidQuery = `SELECT month FROM feestatus WHERE student_id = ? AND classsession = ? AND month IN (?)`;
    con.query(checkPaidQuery, [student_id, classsession, months], (err, paidResult) => {
      if (err) return res.status(500).json({ message: "Database error while checking paid months" });
      if (paidResult.length > 0) {
        const paidMonths = paidResult.map(item => item.month);
        return res.status(400).json({ message: "❌ Some months are already paid", paidMonths });
      }
      const feeQuery = `SELECT * FROM feesubmit WHERE className = ? AND classsession = ? LIMIT 1`;
      con.query(feeQuery, [classname, classsession], (err, feeResult) => {
        if (err) return res.status(500).json({ message: "Database error while fetching fee structure" });
        if (feeResult.length === 0) return res.status(404).json({ message: "❌ Fee structure not found" });
        const feeStructure = feeResult[0];
        const monthMap = {
          January: "january",
          February: "february",
          March: "march",
          April: "april",
          May: "may",
          June: "june",
          July: "july",
          August: "august",
          September: "september",
          October: "october",
          November: "november",
          December: "december"
        };
        const promises = months.map(month => {
          const dbCol = monthMap[month];
          const monthFee = feeStructure[dbCol] || 0;
          return new Promise((resolve, reject) => {
            const insertQuery = `INSERT INTO feestatus (student_id, classname, studentname, fathername, classsession, month, paid_amount, status, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            con.query(
              insertQuery,
              [student_id, classname, studentname, fathername, classsession, month, monthFee, status, ip_address],
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
          });
        });
        Promise.all(promises)
          .then(() => res.json({ message: "✅ Fee details updated successfully", ip: ip_address }))
          .catch(err => res.status(500).json({ message: "Database error while updating fee", error: err.message }));
      });
    });
  });
});

app.post("/FeeStructure", (req, res) => {
  const { className, classsession ,january, february, march, april, may, june, july, august, september, october, november, december} = req.body;
  const insertQuery = `INSERT INTO feesubmit (className, classsession, january, february, march, april, may, june, july, august, september, october, november, december)VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  con.query(insertQuery, [className,classsession,january,february,march,april,may,june,july,august,september,october,november,december], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    res.json({ message: "✅ Fee saved successfully", insertId: result.insertId });
  });
});

app.get("/updateFee", (req, res) => {
  var qu = "select * from feestatus"; 
  con.query(qu,(err,result)=>{ 
    if (err) { 
      console.error(err); 
      return res.status(500).json({ error: "Database error" }); 
    } 
    res.json(result); 
  });
});

//also imp
app.post("/GetFeeStructure",(req,res)=>{
  const {className,classsession} = req.body;
  const getFeeQuery = `select * from feesubmit where className = ? and classsession = ?`;
  con.query(getFeeQuery,[className,classsession],(err,result)=>{
    if (err) {
      console.error("DB Error", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }

    if (result.length > 0) {
      return res.json({
        message: "Fee structure found",
        data: result[0]
      });
    } else {
      return res.status(404).json({ message: "No fee structure found for this class & session" });
    }
  });
});

app.post("/getPaidMonths", (req, res) => {
  const { student_id, classsession } = req.body;
  
  if (!student_id || !classsession) {
    return res.status(400).json({ message: "Student ID and session are required" });
  }

  const paidMonthsQuery = `SELECT month FROM feestatus WHERE student_id = ? AND classsession = ?`;
  con.query(paidMonthsQuery, [student_id, classsession], (err, result) => {
    if (err) {
      console.error("DB Error", err);
      return res.status(500).json({ message: "Database error", error: err.message });
    }
    const paidMonths = result.map(item => item.month);
    res.json({ paidMonths });
  });
});

app.get("/classFeeReport", (req, res) => {
  const { className, classsession, month } = req.query;
  const studentSql = `SELECT student_id, student_name, parents_name AS fathername, class_name, phone_no FROM student WHERE class_name = ? AND session = ? ORDER BY student_id`;
  con.query(studentSql, [className, classsession], (err, students) => {
    if (err) {
      console.error("Student SQL error:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }
    if (!students.length) {
      return res.json({
        summary: { paid_students: 0, unpaid_students: 0, total_paid_amount: 0 },
        students: []
      });
    }
    const feeSql = `SELECT student_id, paid_amount, status FROM feestatus WHERE className = ? AND classsession = ? AND month = ?`;

    con.query(feeSql, [className, classsession, month], (err, fees) => {
      if (err) {
        console.error("Fee SQL error:", err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }
      const feeMap = {};
      fees.forEach(f => {
        feeMap[f.student_id] = f;
      });
      const rows = students.map(s => {
        const fee = feeMap[s.student_id];
        return {student_id: s.student_id,studentname: s.student_name,fathername: s.fathername,classname: s.class_name,phone: s.phone_no || null,month,paid_amount: fee ? fee.paid_amount : 0,status: fee ? fee.status : "UNPAID"};}
      );
      const summary = {
        paid_students: rows.filter(r => r.status === "PAID").length,
        unpaid_students: rows.filter(r => r.status === "UNPAID").length,
        total_paid_amount: rows.reduce((sum, r) => sum + (r.paid_amount || 0), 0)
      };
      res.json({ summary, students: rows });
    });
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});