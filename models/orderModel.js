const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    userid:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
    products:[{
        productid:{
            type:mongoose.Schema.ObjectId,
            ref:'Product',

        },
        name:{
            type:String,
        },
        price:{
            type:Number,
        },
        quantity:{
            type:Number,
        },
        total:{
            type:Number,
        },
        orderStatus:{
            type:String,
            // enum: ['Placed', 'Cancelled'],
            default:'Placed',
        },
        reason:{
            type:String,
            default:"N/A",
            
        },
        image:{
            type:String
        }
    }],

    paymentMode:{
        type:String,
    },
    paymentId:{
        type:String,
        required:true // Add required validation as per your requirement
    },
    orderId: {
        type:String,
        required:true
    },
    hashedOrderId: {
        type:String,
        required:true
    },
    subtotal: {
        type: Number
    },
    date: {
        type: Date
    },
    address: {
        name: String,
        housename: String,
        street: String,
        city: String,
        state: String,
        pin: String,
        mobile: String,
    },
})

module.exports = mongoose.model('Order',orderSchema);