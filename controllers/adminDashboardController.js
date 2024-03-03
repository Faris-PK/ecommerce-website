//const { default: orders } = require('razorpay/dist/types/orders');
const Users = require('../models/userModel');
const Orders = require('../models/orderModel');
const Products = require('../models/productModel');

const loadDashboard = async (req, res) => {
    try {
        const userCount = await Users.countDocuments();
        const orderCount = await Orders.countDocuments();
        
        // Calculate the total sum of amounts and discounts for delivered products
        const deliveryTotal = await Orders.aggregate([
            { $unwind: '$products' }, // Unwind the products array
            { $match: { 'products.orderStatus': 'Delivered' } }, // Match only delivered products
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$products.price' }, // Sum the amounts for delivered products
                    totalDiscount: { $sum: '$products.couponDiscount' } // Sum the discounts for delivered products
                }
            }
        ]);

        const totalDeliveredAmount = deliveryTotal.length > 0 ? deliveryTotal[0].totalAmount : 0;
        const totalDeliveredDiscount = deliveryTotal.length > 0 ? deliveryTotal[0].totalDiscount : 0;

       

        res.render('adminDashboard', { userCount, orderCount, totalDeliveredAmount, totalDeliveredDiscount });
    } catch (error) {
        console.log(error);
        // Handle the error and send an appropriate response to the client
        res.status(500).send('Internal Server Error');
    }
};


const loadSalesReport = async (req,res) =>{
    try {
        const orders = await Orders.find().populate('userId').populate('products.productid');
        console.log('Orders from salesreport:',orders);
        res.render('salesReport',{orders}) 
    } catch (error) {
      console.log(error);  
    }
}



const generateSalesReport = async (req,res) =>{
    try {
        const {startDate,endDate} = req.body;
         
        const startDateTime = new Date(`${startDate}T00:00:00.000Z`);
        const endDateTime = new Date(`${endDate}T23:59:59.999Z`);

        const orders = await Orders.find({date:{$gte:startDateTime,$lte:endDateTime}}).populate('userId').populate('products.productid');
        res.render('salesReport',{orders})
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" }); 
    }
}




module.exports = {
    loadDashboard,
    loadSalesReport,
    generateSalesReport
}