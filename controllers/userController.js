const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const userOTPVerification = require('../models/userOTPVerification');
const Products = require('../models/productModel');
const Order = require('../models/orderModel');
const Wallet = require('../models/walletModel');
const Token = require('../models/tokenModel');
const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Wishlist = require("../models/whishlistModel");
const Cart = require("../models/cartModel");
const mongoose = require('mongoose');
const { request } = require('express');

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
        res.render('user/registration')
    } catch (error) {
        console.log(error.message)
    }
}

const insertUser = async (req, res) => {
    try{

        const exist = await User.findOne({email:req.body.email})

        if(exist){
            //req.flash('email', 'Email already exists');
            res.render('user/registration',{message:"Email Already Exists!"});
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

            // Create a wallet for the new user
            const newWallet = new Wallet({ user: user._id });
            await newWallet.save();

            sendOTPVerificationEmail(user, res);
            // if(userData){
            //     res.redirect('./login')
            // }
            // else{
            //     res.render('registration', {message: "Your registration has been failed...!!!"});
            // }z
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
        //res.render('success-2', { title: 'Registration Successfull!', message: 'Verify your Email.' });
        res.redirect(`/otp?email=${email}`)
    } catch (error) {
        doc
        console.log(error.messgae)
    }
}


const loadOTP = async (req, res) => {
    try {
        const email = req.query.email;
        res.render('user/otpVerification', { email, errorMessage: undefined });
    } catch (error) {
        console.log(error.message)
    }
}


const verifyOTP = async (req, res) => {
    try {
      const email = req.body.email;
      const otp = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;
      const userVerification = await userOTPVerification.findOne({ email: email });
  
      if (!userVerification) {
        req.flash('error','This account is not verified!! Go to login for verification')
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
            _id: user._id,
            email: user.email,
            name: user.name,
          };
          
          // redirect to the login page with a success parameter
          //res.redirect('/login?success=true')
          res.render('user/success-2', { title: 'Successfully Registered!', message: 'Go to Login!' });

          ;
        } else {
          console.log('user blocked from this site');
          res.redirect('/login');
        }
      } else {
        // Render the OTPVerification page again with an error message
        res.render('user/OTPVerification', { email, errorMessage: 'Invalid OTP! Try again' });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  

  const resendOTP = async (req, res) => {
    try {
      const email = req.query.email;
      await sendOTPVerificationEmail({ email }, res);
    } catch (error) {
      console.log(error.message);
      res.redirect('/login'); // Redirect to login page or handle the error appropriately
    }
  };
  


const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_blocked) {
                    req.flash('error', 'Admin has blocked this account. Please contact support for assistance.');
                    res.redirect('/login');
                    //req.flash('error', 'Admin has blocked this account. Please contact support for assistance.');
                    //res.render('login', { message: "Admin has blocked this account. Please contact support for assistance." });
                } else if (!userData.is_verified) {
                    sendOTPVerificationEmail(userData, res);
                    // res.render('login', { message: "Email is not verified...!!!" });
                } else {
                    req.session.userid = userData._id;
                    req.session.email = email; // Store user email in the session
                    req.session.name = userData.name; // Store username in the session
                    req.flash('light', 'Welcome To Decora ');
                    res.redirect('/');

                }
            } else {
                // res.render('login', { message: "Email and Password is incorrect...!!!" });
                req.flash('error', 'Email and Password is incorrect...!!!');
                    res.redirect('/login');
            }
        } else {
            res.render('user/login', { message: "Email and Password is incorrect...!!!" });
        }

    } catch (error) {
        console.log(error.message);
    }
};


  

const userLogout = async (req,res)=>{
    try {
        req.session.userid = null
        res.redirect('/login')
    } catch (error) {
        console.log(error.message)
    }
 }


const loadLogin = async (req, res) => {
    try {
        // Assuming you want to pass some session data to the login page
       // const sessionData = req.session.someData; // Replace 'someData' with the actual data you want to pass
       //, { sessionData }
        res.render('user/login');
    } catch (error) {
        console.log(error.message);
    }
};




const loadAboutUs = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name;
        res.render('user/aboutUs',{email,username});
        
    }
    catch(error) {
        console.log(error.message);
    }
}


// const loadHome = async (req, res) => {
//     try {
//         const email = req.session.email;
//         const username = req.session.name;

//         // Fetch products and categories with is_listed: true
//         const products = await Products.find({ is_listed: true }).populate('category', 'is_listed');
//         const categories = await Category.find({ is_listed: true });

//         // Filter out products that belong to unlisted categories
//         const filteredProducts = products.filter(product => product.category.is_listed);

//         // Check if there are any products or categories
//         if (filteredProducts.length === 0 || categories.length === 0) {
//             // Handle the case when there are no products or categories
//             return res.render('user/home', { email, username, userAuthenticated: req.session.userid, products: [], categories: [] });
//         }

//         // Render the home page with filtered products and categories
//         res.render('user/home', { email, username, userAuthenticated: req.session.userid, products: filteredProducts, categories });
//     } catch (error) {
//         console.log(error.message);
//         res.render('errorPage'); // Handle error rendering
//     }
// };

const loadHome = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name;
        const itemsPerPage = 8;
        const page = req.query.page || 1;

        // Fetch products with is_listed: true and paginate the results
        let products = await Products.find({ is_listed: true })
            .populate('category', 'is_listed')
            .populate('offer') // Populate the 'offer' field
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);
            //console.log('products from populate:',products);


            // Determine the best offer for each product
        products = await Promise.all(products.map(async (product) => {
            const { bestOffer, bestOfferType } = await product.determineBestOffer();
            return { ...product.toObject(), bestOffer, bestOfferType };
        }));

        //console.log('product fro home:',products);

        // Fetch all categories with is_listed: true
        const categories = await Category.find({ is_listed: true });

        // Filter out products that belong to unlisted categories
        const filteredProducts = products.filter(product => product.category.is_listed);

        // Check if there are any products or categories
        if (filteredProducts.length === 0 || categories.length === 0) {
            // Handle the case when there are no products or categories
            return res.render('user/home', { email, username, userAuthenticated: req.session.userid, products: [], categories: [] });
        }

        // Count total products for pagination
        const totalProducts = await Products.countDocuments({ is_listed: true });
        const totalPages = Math.ceil(totalProducts / itemsPerPage);

        // Render the home page with filtered products, categories, and pagination data
        res.render('user/home', {
            email,
            username,
            userAuthenticated: req.session.userid,
            products: filteredProducts,
            categories,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.log(error.message);
        //res.render('errorPage'); // Handle error rendering
    }
};


const loadContactUs = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name;
        res.render('user/contact',{email,username})
    }
    catch(error) {
        console.log(error.message);
    }

}

const loadProductDetails = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name;
        const userId = req.session.userid;
        const productId = req.params.productId;
        
        // Fetch the product details along with its category and offers
        const product = await Products.findById(productId).populate('offer').populate('category');

        if (!product) {
            // If product is not found, handle the error
            return res.status(404).render('errorPage', { errorMessage: 'Product not found' });
        }

        // console.log("Above the determine best offer in controller");
        // Determine the best offer for the product
        const { bestOffer, bestOfferType } = await product.determineBestOffer();
        //console.log('bestoffer',bestOffer);
       // console.log('bestoffertype',bestOfferType);

        // console.log("bestOffer: ", bestOffer);
        // console.log(("bestOfferType: ", bestOfferType));

        // console.log("Passed the best offer in controller");

        // Check if the product is already in the cart
        const cart = await Cart.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInCart = false;

        // If the product is in the cart, set alreadyInCart to true
        if (cart) {
            alreadyInCart = true;
        }

        const wishlist = await Wishlist.findOne({ userid: userId, 'product.productid': productId });
        let alreadyInWishlist = false;

        // If the product is in the cart, set alreadyInCart to true
        if (wishlist) {
            alreadyInWishlist = true;
        }

        // Pass the product, userId, alreadyInCart, alreadyInWishlist, and bestOffer to the view

        res.render('user/productDetails', { product, userId, alreadyInCart, alreadyInWishlist, bestOffer, bestOfferType  });
    } catch (error) {
        console.log(error.message);
        res.status(500).render('errorPage', { errorMessage: 'Internal Server Error' });
    }
};





// const editUser = async (req, res) => {
//     try {
//         const userId = req.params.id; // Assuming you have a user ID in the request params
//         const user = await User.findById(userId);

//         if (!user) {
//             res.status(404).send("User not found");
//             return;
//         }

//         res.render('editUser', { user });
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUser = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            // Add other fields as needed
        };

        await User.findByIdAndUpdate(userId, updatedUser);
        res.send("User updated successfully");
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const loadForgotPassword = async (req,res)=>{
    try {

        res.render('user/forgot-password')
    } catch (error) {
        console.log(error.message);
    }
}

const submitForgotPassword = async (req, res) => {
    try {
        const email = req.body.email;
        //console.log(email);
        const userData = await User.findOne({ email: email });
        if (!userData || !userData.is_verified) {
            req.flash('error', 'Invalid email or not verified.');
            return res.redirect('/forgot-password');
        }

        // Generate a token
        const token = crypto.randomBytes(20).toString('hex');

        // Save the token in the database
        const tokenData = new Token({
            Token: token,
            userId: userData._id,
        });
        await tokenData.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: "faripk369@gmail.com",
                pass: "amvs diqc bblx rhzh"
            }
        })

        // Send the reset password email with the token link
        const resetLink = `https://decoraa.shop/reset-password/${token}`;
        const mailOptions = {
            from: 'faripk369@gmail.com',
            to: email,
            subject: 'Reset Password',
            html: `Click <a href="${resetLink}">here</a> to reset your password.`,
        };

        await transporter.sendMail(mailOptions);

        // Redirect to the reset password page with the token
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

// const loadForgotPasswordConfirmation = async (req, res) => {
//     try {
//         res.render('forgotConfirmation');
//     } catch (error) {
//         console.log(error.message);
//     }
// }
const loadResetPassword = async (req,res)=>{

    try {
        const token = req.params.token; // Assuming you use '/reset-password/:token' in your route
        const tokenData = await Token.findOne({ Token: token });
        //console.log(Token.find());
       // console.log("TokenData:",tokenData);
        if (!tokenData) {
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgot-password');
        }

        // Pass the token to the reset password page
        res.render('user/reset-password',{token});
    } catch (error) {
        console.log(error.message);
    }

}

const submitResetPassword = async (req,res)=>{
    try {
        const token = req.body.token;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        // Find the user associated with the token
        const tokenData = await Token.findOne({ Token: token });

        if (!tokenData) {
            req.flash('error', 'Invalid or expired token.');
            return res.redirect('/forgot-password');
        }

        // Check if the passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match.');
            return res.redirect(`/reset-password/${token}`);
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        const user = await User.findById(tokenData.userId);
        user.password = passwordHash;
        await user.save();

        // Remove the token from the database
        await Token.deleteOne({ Token: token });
        
        // Set success flash message
        req.flash('success', 'Password reset successfully.');


        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
    }
}

const loadPasswordUpdate = async (req, res) => {
    try {
        const email = req.session.email;
        const username = req.session.name;
        res.render('user/editPassword',{email,username});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const updatePassword = async (req, res) => {
    try {
        
        const userId = req.session.userid; 

        if (!userId) {
            // Handle case where user is not found
            return res.render('user/editPassword', { message: "User not found" });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            // Handle case where user is not found
            return res.render('user/editPassword', { message: "User not found" });
        }

        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmNewPassword = req.body.confirmPassword; // Corrected the field name

        // Check if the current password matches the stored password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            // Handle case where current password is not valid
            return res.render('user/editPassword', { message: "Current password is incorrect" });
        }

        // Check if the new password and confirm new password match
        if (newPassword !== confirmNewPassword) {
            // Handle case where new passwords do not match
            return res.render('user/editPassword', { message: "New passwords do not match" });
        }

        // Update the user's password
        const hashedNewPassword = await securePassword(newPassword);
        user.password = hashedNewPassword;

        // Save the updated user object
        await user.save();

        // Redirect or render success message
        req.flash('success', 'Password Changed Successfully');
        res.redirect('/edit-password'); 
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



const ITEMS_PER_PAGE_SHOP = 9


// const loadAllProducts = async (req, res) => {
//     const page = parseInt(req.query.page) || 1;
//     try {
//         const categoriesQueryParam = req.query.categories;
//         const minPrice = parseInt(req.query.minPrice) || 0;
//         const maxPrice = parseInt(req.query.maxPrice) || 100000; // Assuming 1000 is the maximum price
//         const searchTerm = req.query.search;

//         let filter = { is_listed: true };

//         if (categoriesQueryParam) {
//             const categoryIds = categoriesQueryParam.split(',');
//             filter.category = { $in: categoryIds };
//         }

//         // Add price range filter
//         filter.price = { $gte: minPrice, $lte: maxPrice };

//         if (searchTerm) {
//             // Assuming 'name' is the field you want to search in
//             // Adjust this according to your schema
//             filter.$or = [
//                 { name: { $regex: searchTerm, $options: 'i' } },
//                 // Add more fields here if you want to search in other fields
//             ];
//         }

//         //Sort
        
//         let sort = {};
//         const sortParam = req.query.sort;
//         if (sortParam) {
//             if (sortParam === 'price_asc') {
//                 sort = { price: 1 };
//             } else if (sortParam === 'price_desc') {
//                 sort = { price: -1 };
//             } else if (sortParam === 'name_asc') {
//                 sort = { name: 1 };
//             } else if (sortParam === 'name_desc') {
//                 sort = { name: -1 };
//             }
//         }
//         //console.log('sort: ',sort);

//         const totalItems = await Products.countDocuments(filter);
//         const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP);
//         const categories = await Category.find({is_listed: true});

//         let products = await Products.find(filter)
//             .populate('category')
//             .populate('offer') // Populate the 'offer' field
//             .sort(sort) // Apply sorting
//             .skip((page - 1) * ITEMS_PER_PAGE_SHOP)
//             .limit(ITEMS_PER_PAGE_SHOP);


//             // Determine the best offer for each product
//             products = await Promise.all(products.map(async (product) => {
//                 const { bestOffer, bestOfferType } = await product.determineBestOffer();
//                 return { ...product.toObject(), bestOffer, bestOfferType };
//             })); 
            
            

//         if (req.xhr) {
//             res.render("partials/productlist", { products, currentPage: page, totalPages });
//         } else {
//             res.render("user/allProducts", { products, currentPage: page, totalPages, categories });
//         }

//     } catch (error) {
//         console.log(error);
//         res.status(500).send('Internal Server Error');
//     }
// }
const loadAllProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    try {
        const categoriesQueryParam = req.query.categories;
        const minPrice = parseInt(req.query.minPrice) || 0;
        const maxPrice = parseInt(req.query.maxPrice) || 100000; // Assuming 1000 is the maximum price
        const searchTerm = req.query.search;

        let filter = { is_listed: true };

        if (categoriesQueryParam) {
            const categoryIds = categoriesQueryParam.split(',');
            filter.category = { $in: categoryIds };
        }

        // Add price range filter
        filter.price = { $gte: minPrice, $lte: maxPrice };

        if (searchTerm) {
            // Assuming 'name' is the field you want to search in
            // Adjust this according to your schema
            filter.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                // Add more fields here if you want to search in other fields
            ];
        }

        // Sort
        let sort = {};
        const sortParam = req.query.sort;
        if (sortParam) {
            if (sortParam === 'price_asc') {
                sort = { price: 1 };
            } else if (sortParam === 'price_desc') {
                sort = { price: -1 };
            } else if (sortParam === 'name_asc') {
                sort = { name: 1 };
            } else if (sortParam === 'name_desc') {
                sort = { name: -1 };
            }
        }

        const totalItems = await Products.countDocuments(filter);
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE_SHOP);
        const categories = await Category.find({is_listed: true});

        // Determine if pagination should be applied
        const applyPagination = !sortParam; // If sortParam is not provided, apply pagination

        let productsQuery = Products.find(filter)
            .populate('category')
            .populate('offer') // Populate the 'offer' field
            .sort(sort); // Apply sorting

        // Apply pagination if necessary
        if (applyPagination) {
            productsQuery = productsQuery.skip((page - 1) * ITEMS_PER_PAGE_SHOP).limit(ITEMS_PER_PAGE_SHOP);
        }

        let products = await productsQuery;

        // Determine the best offer for each product
        products = await Promise.all(products.map(async (product) => {
            const { bestOffer, bestOfferType } = await product.determineBestOffer();
            return { ...product.toObject(), bestOffer, bestOfferType };
        })); 

        if (req.xhr) {
            res.render("partials/productlist", { products, currentPage: page, totalPages });
        } else {
            res.render("user/allProducts", { products, currentPage: page, totalPages, categories });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
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
    loadHome,
    resendOTP,
    loadProductDetails,
    updateUser,
    loadForgotPassword,
    submitForgotPassword,
    loadResetPassword,
    submitResetPassword,
    //loadForgotPasswordConfirmation,
    loadPasswordUpdate,
    updatePassword,
    // loadCategoryProducts,
    // loadShop
    loadAllProducts
   
}