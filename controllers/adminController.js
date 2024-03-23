const Users = require("../models/userModel");
const Order = require("../models/orderModel");

const loadAdminLogin = async(req, res) => {
    try {
        res.render('adminlogin');
    } catch (error) {
        console.log(error);
    }
}


const adminVerifyLogin = async(req, res) => {
    try{
        const adminEmail = req.body.adminEmail;
        const adminPassword = req.body.adminPassword;
        
        if(adminEmail == process.env.adminEmail && adminPassword == process.env.adminPassword){
            // Session variable for the authenticated admin
            req.session.admin = {email: adminEmail};
            res.redirect('/admin/dashboard');
    
        }
        else{
          return  res.render('adminlogin',{message:"Email and Password is incorrect...!!!"});
        }
    } catch (error) {
        console.log(error);
    }
}





const adminLogout = async (req,res)=>{
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log(err.message);
            } else {
                // res.clearCookie('sessionID'); // If you're using a session store like express-session
                res.redirect('/admin/login');
            }
        });
    } catch (error) {z
        console.log(error.message);
    }
}

const loadUserList = async(req,res)=>{
    try {
        const users = await Users.find();
        res.render('userList',{users:users});
    } catch (error) {
        console.log(error.message);
    }
}


const toggleUserStatus = async(req,res)=>{
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);
        if(userId){
            user.is_blocked = !user.is_blocked;
            await user.save();

            res.json({success:true,message:"User Status toggled Successfully", isBlocked:user.is_blocked});
        }else{
            res.status(404).json({success:false,message:"User not Found"})
        }
    } catch (error) {
        console.log(error.message)
    }
}




module.exports = {
    loadAdminLogin,
    adminVerifyLogin,
    //loadDashboard,
    adminLogout,
    loadUserList,
    toggleUserStatus,
    
}