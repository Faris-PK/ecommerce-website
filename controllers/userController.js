const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const userOTPVerification = require('../models/userOTPVerification');


const securePassword = async(password) => {
    try{
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error){
        console.log(error.messgae);
    }
}


const loadRegister = async(req,res)=>{
    try {
        res.render('registration')
    } catch (error) {
        console.log(error.message)
    }
}

const insertUser = async (req, res) => {
    try{

        const exist = await User.findOne({email:req.body.email})

        if(exist){
            //req.flash('email', 'Email already exists');
            res.render('registration',{message:"Email Already Exists!"});
        }
        else{
            const spassword = await securePassword(req.body.password);
            
            const user = User({
                email: req.body.email,
                name: req.body.name,
                mobile:req.body.mobile,
                password: spassword,
                is_admin: 0,
                is_blocked:0,
                is_verified: 0,
            });

              await user.save();

            sendOTPVerificationEmail(user, res);
            // if(userData){
            //     res.redirect('./login')
            // }
            // else{
            //     res.render('registration', {message: "Your registration has been failed...!!!"});
            // }
        }
    } catch(error){
        console.log(error.message);
    }
}

const sendOTPVerificationEmail = async({email},res)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            port:465,
            secure:true,
            auth:{
                user:"faripk369@gmail.com",
                pass:"amvs diqc bblx rhzh"
            }
        })
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
        console.log("OTP:"+otp);

        //mail options
        const mailoptions = {
            from:'faripk369@gmail.com',
            to:email,
            subject:"Verify your Email",
            html:`Your OTP is: ${otp}`

        };
        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp,saltRounds);
        
        const newOTPVerification = await new userOTPVerification({email:email,otp:hashedOTP});


        //save otp record
        await newOTPVerification.save();
        await transporter.sendMail(mailoptions);

        res.redirect(`/otp?email=${email}`)
    } catch (error) {
        console.log(error.messgae)
    }
}

const loadOTP = async (req,res)=>{
    try {
        const email = req.query.mail;
        res.render('OTPVerification',{email:email});

    } catch (error) {
        console.log(error.message)
    }
}

const verifyOTP = async (req, res) => {
    try {
      const email = req.body.email;
      const otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4; // Fix typo in variable names
      const userVerification = await userOTPVerification.findOne({ email: email });
  
      if (!userVerification) {
        res.redirect('/login');
        return;
      }
  
      const { otp: hashedOTP } = userVerification;
  
      const validOTP = await bcrypt.compare(otp, hashedOTP);
  
      if (validOTP) {
        const userData = await User.findOne({ email: email });
  
        if (userData) {
          await User.findByIdAndUpdate({
              _id: userData._id,
            },
            {
              $set: {
                is_verified: true,
              },
            }
          );
        }
  
        // delete otp record
  
        const user = await User.findOne({ email: email });
        await userVerification.deleteOne({ email: email });
  
        if (user.is_verified) {
          req.session.user = {
            _id: user.id,
            email: user.email,
            name: user.name,
          };
  
          // redirect to the login page with a success parameter
          res.redirect('/login?success=true');
        } else {
          console.log('user blocked from this site');
          res.redirect('/login');
        }
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch && !userData.is_blocked) {
                if (userData.is_verified) {
                    res.render('login', { message: "Email is not verified...!!!" });
                } else {
                    req.session.userid = userData._id;
                    req.session.email = email; // Store user email in the session
                    req.session.name = userData.name; // Store username in the session
                    res.redirect('/');
                }
            } else {
                res.render('login', { message: "Email and Password is incorrect...!!!" });
            }
        } else {
            res.render('login', { message: "Email and Password is incorrect...!!!" });
        }

    } catch (error) {
        console.log(error.message);
    }
};


  

// const userLogout = async (req,res)=>{
//     try {
//         req.session.userid = null
//         res.redirect('/login')
//     } catch (error) {
//         console.log(error.message)
//     }
// }
const userLogout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
            } else {
                // res.clearCookie('sessionID'); // If you're using a session store like express-session
                res.redirect('/login');
            }
        });
    } catch (error) {
        console.log(error.message);
    }
};


// const loadLogin = async (req, res) => {
//     try {
//         res.render('login')
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }
const loadLogin = async (req, res) => {
    try {
        // Assuming you want to pass some session data to the login page
        const sessionData = req.session.someData; // Replace 'someData' with the actual data you want to pass

        res.render('login', { sessionData });
    } catch (error) {
        console.log(error.message);
    }
};




const loadAboutUs = async (req, res) => {
    try {
        res.render('aboutUs')
    }
    catch(error) {
        console.log(error.message);
    }
}

// const loadHome = async (req, res) => {
//     try {
//         //const products = await Products.find({ is_listed: true });
//         res.render('home')
//     }
//     catch(error) {
//         console.log(error.message);
//     }
// }

const loadHome = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name; // Retrieve username from the session
        res.render('home', { email, username });
    } catch (error) {
        console.log(error.message);
    }
};



const loadContactUs = async (req, res) => {
    try {
        res.render('contact')
    }
    catch(error) {
        console.log(error.message);
    }

}


module.exports = {
    loadRegister,
    insertUser,
    loadLogin,
    loadOTP,
    sendOTPVerificationEmail,
    verifyOTP,
    userLogout,
    verifyLogin,
    loadAboutUs,
    loadContactUs,
    loadHome
    
    
}