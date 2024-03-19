const User = require('../models/userModel');
const Category = require('../models/categoryModel')

const isLogin = async(req, res, next) => {
    try{
        if(req.session.userid){
            next();
        }
        else {
            res.redirect('/login');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isLogout = async(req, res, next) => {
    try{
        
        if(!req.session.userid){
            next();
        }else{
            res.redirect('/');
        }
    } catch(error) {
        console.log(error.message);
    }
}

const isAuthenticated = async (req, res, next) => {
    try {
        if (req.session && req.session.userid) {
            res.locals.userAuthenticated = true;
            res.locals.email= req.session.email
            res.locals.username = req.session.username
            return next();
        } else {
            res.locals.userAuthenticated = false;
            return next();
        }
    } catch (error) {
        console.log(error);
    }
};


const checkBlockedStatus = async (req, res, next) => {
    try {
        const userId = req.session.userid;
        //console.log(userId);

        if (userId) {
            const userData = await User.findById(userId);

            if (userData && userData.is_blocked) {
                // Log out the user and redirect to the login page
                // req.session.destroy();
                req.session.userid = null
                //req.flash('error', 'Admin has blocked this account. Please contact support for assistance.');
                return res.redirect('/login');
            }
        }

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const loadCategories = async (req, res, next) => {
    try {
        // Fetch categories with is_listed: true
        const categories = await Category.find({ is_listed: true });

        // Make categories available in response locals
        res.locals.categories = categories;

        //console.log('Middle cat:',categories);

        next();
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    isLogin,
    isLogout,
    isAuthenticated,
    checkBlockedStatus,
    loadCategories
}