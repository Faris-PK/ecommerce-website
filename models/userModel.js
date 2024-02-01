const mongoose = require('mongoose');

const user = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_blocked:{
        type:Boolean,
        required:false
    }, 
    is_verified :{
        type : Boolean,
        default:false
      }
})

const User = mongoose.model("User",user);

module.exports = User;