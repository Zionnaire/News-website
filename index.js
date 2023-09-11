require("dotenv").config();
const express = require("express");
const app = require("./app");
const connectDB = require("./configs/db");
const roleRouter = require("./routes/roles");
const userRouter = require("./routes/users");
const authRouter = require('./routes/auth')
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const adminRouter = require("./routes/admin");
const commentRouter = require('./routes/comment');
const contentRouter = require('./routes/content');
const renderRouter = require("./routes/renderActive");
const superAdminRouter = require("./routes/superAdmin");
const categoryRouter = require("./routes/category");


const port = process.env.PORT || 4000;
app.use(cors());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(bodyParser.text({ type: '/' }));

app.use(fileUpload());
app.use(express.json());
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/users", userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/contents', contentRouter);
app.use('/api/v1/', renderRouter);
app.use('/api/v1/superAdmin', superAdminRouter);
app.use('/api/v1/category', categoryRouter);

connectDB();
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});