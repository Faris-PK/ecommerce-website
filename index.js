const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://faripk369:tvskl55370@cluster0.yamkkq5.mongodb.net/");

const express = require('express');
const app = express();
const path = require('path');
const flash = require('express-flash');
const nocache = require('nocache');
const session  = require('express-session');
const dotenv = require('dotenv').config();

app.use(nocache());

app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/uploads')))

app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET, // Change this to a long, random string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express.json());

//For user Routes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);

//For admin Route
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(4000, ()=> {
  console.log("http://localhost:4000");
});




