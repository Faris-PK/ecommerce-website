const Order = require('../models/orderModel');
const User = require("../models/userModel");
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');

const loadOrderList = async (req,res)=>{
    try {
        //Fetch orders from the database
        const orders = await Order.find().populate('userid','name')
        const products = await Product.find();
        //console.log(products);
        res.render('orderList',{orders,products})
    } catch (error) {
        console.log(error.message);
    }

}

// const loadOrderList = async (req, res) => {
//     try {
//         // Fetch orders from the database, populate user name, and product information
//         const orders = await Order.find().populate({
//             path: 'userid',
//             select: 'name',
//         }).populate({
//             path: 'products.productid', // Assuming 'products' is the array field in your Order model
//             model: 'Products', // Replace 'Product' with the actual model name for the products
//             select: 'name price quantity date image', // Include 'image' in the select fields
//         });


//         //console.log(orders.product.price);
//         res.render('orderList', { orders });
//     } catch (error) {
//         console.log(error.message);
//     }
// };


// const updateOrderStatus = async(req,res)=>{
//     try {
//         const {orderId,newStatus} = req.body;

//         //Find and update the order status in the database
//         await Order.findByIdAndUpdate(orderId,{'products.0.orderStaus':newStatus});
//         console.log('Recieved request to update order status:',orderId,newStatus);

//         //Send a success response
//         res.status(200).json({ message: 'Order status updated successfully' });

//     } catch (error) {
//         // Handle errors and send an error response
//         console.error('Error updating order status:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        // Find and update the order status in the database
        await Order.findByIdAndUpdate(orderId, { 'products.0.orderStatus': newStatus });

        // Send a success response
        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        // Handle errors and send an error response
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Define your route










module.exports = {
    loadOrderList,
    updateOrderStatus
}