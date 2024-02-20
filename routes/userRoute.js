const express = require('express');
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');


const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController')
const userAuth = require('../middlewares/userAuth')


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.get('/register',userController.loadRegister);
user_route.post('/register',userController.insertUser);

user_route.get('/otp',userController.loadOTP);
user_route.post('/otp',userController.verifyOTP);
user_route.get('/resend-otp',userController.resendOTP);

user_route.get('/login',userAuth.isLogout,userController.loadLogin)
user_route.post('/loginsubmit',userController.verifyLogin);

user_route.get('/logout',userController.userLogout);

user_route.get('/aboutus',userController.loadAboutUs);
user_route.get('/contactus',userController.loadContactUs);

user_route.get('/', userAuth.isAuthenticated,userAuth.checkBlockedStatus, userController.loadHome);
user_route.get('/home', userAuth.isAuthenticated,userAuth.checkBlockedStatus, userController.loadHome);

user_route.get('/productdetails/:productId',userController.loadProductDetails);

//for cart

user_route.get('/cart',userAuth.isLogin,userAuth.isAuthenticated,cartController.loadCart);
user_route.post('/addtocart',cartController.addToCart);
user_route.delete('/removeFromCart/:productId',userAuth.isLogin,cartController.removeFromCart);

user_route.get('/checkout',userAuth.isLogin,userAuth.isAuthenticated,cartController.loadCheckout);

user_route.post('/api/saveAddress',cartController.checkoutAddress);
user_route.delete('/delete-address/:addressId',userController.deleteAddress);
user_route.post('/saveNewAddress',userController.addAddress);

user_route.post('/placeOrder',cartController.placeOrder);
// user_route.post('/cancelOrder', cartController.cancelOrder);
//user_route.post('/cancelOrder/:orderId', cartController.cancelOrder);
user_route.get('/profile',userController.userProfile);

user_route.get('/user/address/:id',userController.loadEditAddresss);
user_route.put('/user/address/:id',userController.updateAddress)

//user_route.get('/edit/:id', userController.editUser);
user_route.put('/edit/:id', userController.updateUser);

// user_route.get('/forgot-password',userAuth.isLogout,userController.loadForgotPassword);
// user_route.post('/forgot-password-submit',userController.submitForgotPassword);

user_route.get('/forgot-password', userAuth.isLogout, userController.loadForgotPassword);
user_route.post('/forgot-password-submit', userController.submitForgotPassword);
user_route.get('/reset-password/:token', userController.loadResetPassword);
user_route.post('/reset-password-submit', userController.submitResetPassword);

user_route.get('/edit-password',userController.loadPasswordUpdate);
user_route.post('/password-update', userController.updatePassword);


module.exports = user_route;
