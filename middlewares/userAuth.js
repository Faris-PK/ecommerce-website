const User = require('../models/userModel')

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
            return next();
        } else {
            res.locals.userAuthenticated = false;
            return next();
        }
    } catch (error) {
        console.log(error);
    }
};


// const checkBlockedStatus = async (req, res, next) => {
//     try {
//         const userId = req.session.userid;
//         //console.log(userId);

//         if (userId) {
//             const userData = await User.findById(userId);

//             if (userData && userData.is_blocked) {
//                 // Log out the user and redirect to the login page
//                 req.session.destroy();
//                 req.flash('error', 'Admin has blocked this account. Please contact support for assistance.');
//                 return res.redirect('/login');
//             }
//         }

//         // Continue to the next middleware or route handler
//         next();
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };
const checkBlockedStatus = async (req, res, next) => {
    try {
        const userId = req.session.userid;

        if (userId) {
            const userData = await User.findById(userId);

            if (userData) {
                if (userData.is_blocked) {
                    // Log out the user and redirect to the login page
                    req.session.destroy();
                    return res.redirect('/login');
                } else {
                    // User is not blocked, continue to the next middleware or route handler
                    next();
                }
            } else {
                // Handle case where user data is not found
                res.redirect('/login');
            }
        } else {
            // Handle case where there is no user session
            res.redirect('/login');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    isLogin,
    isLogout,
    isAuthenticated,
    checkBlockedStatus
}