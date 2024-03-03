const express = require('express');
const user_route = express();

user_route.set('view engine','ejs');
user_route.set('views','./views/user');


const userController = require('../controllers/userController');
const cartController = require('../controllers/cartController')
const userAuth = require('../middlewares/userAuth');
const wishlistController = require('../controllers/whishlidtController');
const navBarCount = require('../middlewares/navBarCount');
const userProfileController = require('../controllers/userProfileController');
const couponController = require('../controllers/couponController');


user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

user_route.get('/register',userAuth.loadCategories,userController.loadRegister);
user_route.post('/register',userAuth.loadCategories,userController.insertUser);

user_route.get('/otp',userAuth.loadCategories,userController.loadOTP);
user_route.post('/otp',userAuth.loadCategories,userController.verifyOTP);
user_route.get('/resend-otp',userAuth.loadCategories,userController.resendOTP);

user_route.get('/login',userAuth.loadCategories,userAuth.isLogout,userController.loadLogin)
user_route.post('/loginsubmit',userAuth.loadCategories,userController.verifyLogin);

user_route.get('/logout',userController.userLogout);

user_route.get('/aboutus',userAuth.loadCategories,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userController.loadAboutUs);
user_route.get('/contactus',userAuth.loadCategories,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userController.loadContactUs);

user_route.get('/',userAuth.loadCategories, userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userController.loadHome);
user_route.get('/home', userAuth.loadCategories,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount, userController.loadHome);
user_route.get('/shop', userAuth.loadCategories,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount, userController.loadShop);

user_route.get('/productdetails/:productId',userAuth.loadCategories, userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userController.loadProductDetails);

//for cart

user_route.get('/cart',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,cartController.loadCart);
user_route.post('/addtocart',cartController.addToCart);
user_route.delete('/removeFromCart/:productId',userAuth.isLogin,cartController.removeFromCart);

//for wishlist
user_route.get('/wishlist',userAuth.loadCategories, userAuth.isLogin, userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount, wishlistController.loadWishlist);
user_route.post('/addtowishlist', wishlistController.addToWishlist);
user_route.delete('/removeFromWishlist/:productId', userAuth.isLogin, wishlistController.removeFromWishlist);

user_route.get('/checkout',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,cartController.loadCheckout);

user_route.post('/api/saveAddress',cartController.checkoutAddress);
user_route.delete('/delete-address/:addressId',userProfileController.deleteAddress);
user_route.post('/saveNewAddress',userProfileController.addAddress);

user_route.post('/applycouponcode',userAuth.isLogin,couponController.applyCoupon);
user_route.post('/removeCoupon', couponController.removeCoupon);


user_route.post('/placeOrder',cartController.placeOrder);
user_route.get('/orderconfirmation/:Id',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,cartController.loadOrderConfirmation)

user_route.get('/profile',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userProfileController.userProfile);

user_route.get('/user/address/:id',userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userProfileController.loadEditAddresss);
user_route.put('/user/address/:id',userProfileController.updateAddress);


user_route.put('/edit/:id', userController.updateUser);

user_route.get('/forgot-password',userAuth.loadCategories, userAuth.isLogout, userController.loadForgotPassword);
user_route.post('/forgot-password-submit', userController.submitForgotPassword);
user_route.get('/reset-password/:token', userController.loadResetPassword);
user_route.post('/reset-password-submit', userController.submitResetPassword);

user_route.get('/edit-password',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userController.loadPasswordUpdate);
user_route.post('/password-update', userController.updatePassword);
user_route.get('/orderdetails/:Id',userAuth.loadCategories,userAuth.isLogin,userAuth.isAuthenticated,userAuth.checkBlockedStatus,navBarCount.cartAndWishlistCount,userProfileController.loadOrderDetails);
user_route.put('/orderdetails/:orderId/products/:productId/cancel', userProfileController.orderCancel);
user_route.put('/orderdetails/:orderId/products/:productId/return', userProfileController.orderReturnRequest);


// Add this route in your router
user_route.get('/category/:categoryId',userAuth.loadCategories,userAuth.isAuthenticated, userAuth.checkBlockedStatus, navBarCount.cartAndWishlistCount, userController.loadCategoryProducts);



module.exports = user_route;
