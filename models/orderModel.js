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
            required:true,
        },
        image:{
            type:String
        }
    }],

    paymentMode:{
        type:String,
    },
    subtotal: {
        type: Number
    },
    date: {
        type: Date
    },
    address: {
        type: Object
    },
})

module.exports = mongoose.model('Order',orderSchema);