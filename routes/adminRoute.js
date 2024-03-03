
 const express = require('express');
 const admin_route = express();
 const multer = require('multer');
 const upload = require('../config/multer-config');

 admin_route.set('view engine','ejs');
 admin_route.set('views','./views/admin');

 admin_route.use(express.json());
 admin_route.use(express.urlencoded({extended:true}));

 const adminController = require('../controllers/adminController');
 const adminAuth = require("../middlewares/adminAuth");
 const categoryController = require('../controllers/categoryController');
 const productController = require('../controllers/productController');
 const orderController = require('../controllers/orderController');
 const couponController = require('../controllers/couponController');
 const adminDashboardController = require('../controllers/adminDashboardController');

 admin_route.get('/login',adminAuth.isLogout,adminController.loadAdminLogin);
 admin_route.get('/',adminAuth.isLogout,adminController.loadAdminLogin);
 admin_route.post('/loginsubmit',adminController.adminVerifyLogin);
 
 admin_route.get('/dashboard', adminAuth.isLogin, adminDashboardController.loadDashboard);
 admin_route.get('/logout',adminController.adminLogout);

 admin_route.get('/userlist',adminAuth.isLogin,adminController.loadUserList);
 
admin_route.get('/salesreport', adminDashboardController.loadSalesReport);
admin_route.post('/salesreport', adminDashboardController.generateSalesReport);

 admin_route.post('/toggle_user_status/:id', adminController.toggleUserStatus);

 admin_route.get('/category', adminAuth.isLogin, categoryController.loadCategoryList); 
 admin_route.post('/save-category',categoryController.addCategory);
 admin_route.post('/toggleCategoryStatus/:categoryId',categoryController.toggleCategoryStatus);
 admin_route.post('/edit-category/:categorId',categoryController.editCategory);

 admin_route.get('/product',adminAuth.isLogin,productController.loadProductList);
 admin_route.post('/submitProduct',upload.array('image',4),productController.addProduct);
 admin_route.get('/addproduct',adminAuth.isLogin,productController.loadCategory);
 admin_route.post('/toggleProductStatus/:productId',productController.toggleProductStatus);
 admin_route.get('/editProduct/:id', adminAuth.isLogin, productController.loadEditProduct);
 admin_route.post('/submitEditProduct/:id', upload.array('image', 4), productController.editProduct);

 admin_route.get('/order',adminAuth.isLogin,orderController.loadOrderList)
 //admin_route.post('/toggleOrderStatus',orderController.updateOrderStatus)
 admin_route.post('/toggleOrderStatus', orderController.updateOrderStatus);

 admin_route.get('/coupon',adminAuth.isLogin,couponController.loadCouponPage);
 admin_route.get('/addcoupon',adminAuth.isLogin,couponController.loadAddCoupon);
 admin_route.post('/submitCoupon',couponController.submitCoupon);
 admin_route.post('/toggleCouponStatus/:couponId', couponController.toggleCouponStatus);
 // Edit Coupon Route
admin_route.get('/editCoupon/:couponId', adminAuth.isLogin, couponController.loadEditCoupon);

// Submit Edit Coupon Route
admin_route.post('/submitEditCoupon/:couponId', couponController.editCoupon);

 

 module.exports = admin_route