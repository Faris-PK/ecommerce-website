//const { default: orders } = require('razorpay/dist/types/orders');
const Users = require('../models/userModel');
const Orders = require('../models/orderModel');
const Products = require('../models/productModel');

const loadDashboard = async (req, res) => {
    try {
        const userCount = await Users.countDocuments();
        const orderCount = await Orders.countDocuments();
        
        // Fetch all orders
        const orders = await Orders.find();

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

        const totalcouponDiscount = await orders.reduce((acc,value)=>{
           return acc+=value.couponDiscount
        },0)

        const totalDeliveredAmount = deliveryTotal.length > 0 ? deliveryTotal[0].totalAmount : 0;
        const totalDeliveredDiscount = deliveryTotal.length > 0 ? deliveryTotal[0].totalDiscount : 0;

        // Find top 10 selling products
        const topSellingProducts = await Orders.aggregate([
            { $unwind: '$products' },
            { $group: { _id: '$products.productid', totalSold: { $sum: '$products.quantity' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products', // Assuming 'products' is the name of your products collection
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }
        ]);
        

        // Find top 10 selling products
        const topSellingCategories = await Orders.aggregate([
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productid',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $group: { _id: '$productDetails.category', totalSold: { $sum: '$products.quantity' },categoryName: { $first: '$productDetails.categoryName' } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'categoryDetails' } }
        ]);

         //Sales chart part
         const currentDate = new Date();
         const startDate = new Date(currentDate - 30 * 24 * 60 * 60 * 1000);
         const order2 = await Orders.find();
 
         // Calculate monthly earning
         const order = await Orders.find({
             date: { $gte: startDate, $lt: currentDate },
         });
 
         const montlyEarning = order.reduce((acc, curr) => {
             curr.products.forEach(product => {
                 if (product.orderStatus === "Delivered") {
                     acc += product.total;
                 }
             });
             return acc;
         }, 0);
 
         const revenue = order2
             ? order2.reduce((acc, curr) => {
                 acc += curr.subTotal; 
                 return acc;
             }, 0)
             : 0;
 
         const product = order
             ? order.reduce((acc, curr) => {
                 acc += curr.products.length;
                 return acc;
             }, 0)
             : 0;
 
             // Calculate monthly ordered count
             const monthlyOrderedCount = await Orders.aggregate([
                 {
                     $match: {
                         date: { $gte: startDate, $lt: currentDate },
                     },
                 },
                 {
                     $unwind: "$products",
                 },
                 {
                     $match: {
                         "products.orderStatus": "Delivered",
                     },
                 },
                 {
                     $group: {
                         _id: {
                             $dateToString: {
                                 format: "%Y-%m",
                                 date: "$date",
                             },
                         },
                         count: { $sum: 1 },
                     },
                 },
                 {
                     $sort: { "_id": 1 },
                 },
             ]);

             //console.log('monthlyOrderedCount:',monthlyOrderedCount);
 
             const data = Array.from({ length: 12 }).fill(0);
 
             // Initialize an array with 12 elements, each set to zero
             const monthlyData = Array.from({ length: 12 }).fill(0);
 
 
             // Populate the array based on the provided data
             monthlyOrderedCount.forEach(item => {
                 const monthIndex = parseInt(item._id.split("-")[1], 10) - 1;
                 monthlyData[monthIndex] = item.count;
             });
             ///console.log('monthlyData',monthlyData);
            //z console.log('montlyEarning',montlyEarning);

    

        res.render('adminDashboard', { userCount,
            orderCount, 
            totalDeliveredAmount, 
            totalDeliveredDiscount, 
            totalcouponDiscount, 
            topSellingProducts, 
            topSellingCategories,
            monthlyData,
            montlyEarning});
    } catch (error) {
        console.log(error);
        // Handle the error and send an appropriate response to the client
        res.status(500).send('Internal Server Error');
    }
};


const filterDashboard = async (req, res) => {
    try {
      const { data } = req.body;
      const desiredMonth = data; 
      const startDate = new Date(desiredMonth + "-01T00:00:00Z"); // Start of month
      const endDate = new Date(desiredMonth + "-31T23:59:59Z"); // End of month (adjusted for days in February)
      
      const monthData = await Orders.aggregate([
        {
          $match: {
            "products.orderStatus": "Delivered", 
            date: { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%d",
                date: "$date",
              },
            },
            totalAmount: { $sum: "$grandTotal" }, 
          },
        },
      ]);
  
      // Initialize an array with 30 elements, each set to zero
      const newData = Array.from({ length: 30 }).fill(0);
  
      // Populate the array based on the provided data
      monthData.forEach((item) => {
        const dayIndex = parseInt(item._id, 10) - 1; 
        if (dayIndex >= 0 && dayIndex < 30) {
          newData[dayIndex] = item.totalAmount;
        }
      });
  
      res.json({ newData, data });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


const loadSalesReport = async (req,res) =>{
    try {
        const orders = await Orders.find().populate('userId').populate('products.productid');
       // console.log('Orders from salesreport:',orders);
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

        const orders = await Orders.find({
            date: { $gte: startDateTime, $lte: endDateTime },
            'products.orderStatus': 'Delivered' // Add this query condition to filter by orderStatus
        }).populate('userId').populate('products.productid');

        //console.log('orders from salesReport:',orders);
        res.render('salesReport',{orders})
    } catch (error) {
        console.error("Error generating sales report:", error);
        return res.status(500).json({ error: "Failed to generate sales report" }); 
    }
}




module.exports = {
    loadDashboard,
    loadSalesReport,
    generateSalesReport,
    filterDashboard
}