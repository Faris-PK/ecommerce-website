const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Decora");

const express = require('express');
const app = express();
const path = require('path');
const flash = require('connect-flash');
const nocache = require('nocache');
const session  = require('express-session');

app.use(nocache());

app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/uploads')))

app.use(flash());
app.use(session({
  secret: 'SECRET_KEY', // Change this to a long, random string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

//For user Routes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//For admin Route
// const adminRoute = require('./routes/adminRoute');
// app.use('/',adminRoute);

app.listen(4000, ()=> {
  console.log("http://localhost:4000");
});