const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.ObjectId,
        ref:'users',
        required:true
    },
    product:[{
        productid:{
            type:mongoose.Schema.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:1
        },
        totalPrice:{
            type:Number,
            required:true
        },
        Image:{
            type:String,
        }
    }],
    grandTotal:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model('Cart',cartSchema)