const mongoose = require('mongoose')
const User = require('../models/userModel');
const Products = require("../models/productModel");
const Order = require("../models/orderModel");
const Wallet = require('../models/walletModel');
const Category = require('../models/categoryModel');

const userProfile = async (req, res) => {
    try {
        const userId = req.session.userid;
        const user = await User.findById(userId); 
        const userAddress = user.address;
        //console.log(userAddress);
        // const email = req.session.email;
        // const username = req.session.name;
        const wallet = await Wallet.findOne({ user: userId });
        //console.log('wallet:',wallet);

        const order = await Order.find({userId: userId}).populate({
            path: 'products.productid',
            model: Order,
            select: 'name price quantity date image'
        });
        //console.log('orrdeer:',order);

        //console.log(order);
         // Fetch wallet details
         //const wallet = await Wallet.findOne({ user: userId });
         //console.log('Wallet from profile',wallet);

        res.render('user/userProfile', { user, userAddress, order ,wallet});
    } catch (error) {
        console.log(error.message);
    }
};




const addAddress = async (req,res)=>{
    try {
        const user = await User.findById(req.session.userid);

        //Add the address details to the user's address array 
        user.address.push({
            name:req.body.name,
            housename:req.body.housename,
            street:req.body.street,
            city:req.body.city,
            pin:req.body.pin,
            mobile:req.body.mobile
        });

        //Sve the user with the new address to DB

        const svaeUser = await user.save();
        res.status(200).json({message:'Address svaed Successfully',user:svaeUser});
    } catch (error) {
        console.error('Error saving address:',error);
        res.status(500).json({message:'Internal server error'});
    }
}


const deleteAddress = async (req,res)=>{
    try {
        const userId = req.session.userid;
        const addressId = req.params.addressId;

        //Find the user and remove the specified address
        const user = await User.findById(userId);
        user.address.pull({_id:addressId});
        await user.save();

        res.json({success:true,message:'Address deleted succcessfully'});


    } catch (error) {
        console.error('Error deleting address:',error); 
        res.status(500).json({success:false,message:'Faoled to delete address.'});      
    }
}


const loadEditAddresss = async (req,res) =>{
    try {
        const userId = req.session.userid;
        const addressId = req.params.id;
        const user = await User.findById(userId);
        const address = user.address.id(addressId);
        res.json(address)
    } catch (error) {
        console.error('Error fetching address details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateAddress = async (req,res)=>{
    try {
        const userId = req.session.userid;
        const addressId = req.params.id;
        const updateAddress = req.body;
        const user = await User.findById(userId);
        const address = user.address.id(addressId);

        //Update the address feilds

        address.name = updateAddress.name;
        address.housename = updateAddress.housename;
        address.street = updateAddress.street;
        address.city = updateAddress.city;
        address.pin = updateAddress.pin;
        address.mobile = updateAddress.mobile;

        await user.save();//Save the update user details
        res.json({success:true});//Send success Response

    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
       
}
const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        //console.log('userid...:',userId);
        const orderId = req.params.Id; 
       // console.log('orderId.....:',orderId);
        const email = req.session.email;
        const username = req.session.name;

        // Query the Order model to find the order with the given orderId and userId
        const order = await Order.findOne({ _id: orderId, userId: userId }).populate({
            path: 'products.productid',
            model: Products,
            select: 'name price quantity image orderStatus' // Select the fields you need from the Product model
        });
       //console.log("order:",order);
        

        //console.log(order);
        if (!order) {
            // Handle case where order is not found
            return res.status(404).send('Order not found');
        }

        //Check if at least one product in the order is marked as delivered
        const isProductDelivered = order.products.some(product => product.orderStatus === 'Delivered');


        // Render the 'orderdetails' view and pass the order data to it
        res.render('user/orderDetails', { order, username, email,isProductDelivered });
    } catch (error) { 
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const orderCancel = async (req, res) => {
    const { orderId, productId } = req.params;
    const { reason } = req.body; 

    try {
        
        const order = await Order.findOneAndUpdate(
            { _id: orderId, 'products._id': productId },
            {
                $set: {
                    'products.$.orderStatus': 'Cancelled',
                    'products.$.reason': reason 
                }
            },
            { new: true }
        );

        //console.log('Order:',order);

        if (!order) {
            return res.status(404).json({ message: 'Order or product not found' });
        }

        order.products.forEach((product) => {   
                 //console.log('product.productId:',product.productid);
                // console.log('product.quantity:',product.quantity);
                Products.updateOne(
                    { _id: product.productid },
                    { $inc: { quantity: product.quantity } }
                ).exec();
            
        });

        
        if (order.paymentMode === 'razorpay' || order.paymentMode === 'wallet') {
            
            const wallet = await Wallet.findOne({ user: order.userId });

            let cancelledAmount = 0;

            
            order.products.forEach((product) => {
                
                if (product.orderStatus === 'Cancelled') {
                    cancelledAmount += product.total;
                     //console.log('product.productId:',product.productid);
                    // console.log('product.quantity:',product.quantity);
                    // Products.updateOne(
                    //     { _id: product.productid },
                    //     { $inc: { quantity: product.quantity } }
                    // ).exec();
                }
            });
            // console.log("order.subtotal: ", order.subtotal);
            // console.log("cancelledAmount: ", cancelledAmount);
            
            order.subtotal -= cancelledAmount;
            await order.save();

            // console.log("order.subtotal -= cancelledAmount: ", order.subtotal);

            
            wallet.balance += cancelledAmount;
            const reason = 'Order cancellation refund'
        
            
            wallet.walletHistory.push({
                amount: cancelledAmount,
                type: 'Credit',
                reason: reason,
                orderId: orderId, 
                orderId2: order.orderId,
                date: new Date()
            });

            
            await wallet.save();
        }

        res.json({ message: 'Item cancelled successfully', order });
    } catch (error) {
        console.error('Error cancelling item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const orderReturnRequest = async (req, res) => {

   // console.log("Inside return request controller");

    const orderId = req.params.orderId;
   //console.log('orderId:',orderId);

    const productId = req.params.productId;
  //  console.log('productId:',productId);

    const { index, reason } = req.body;

    try {
        
        const order = await Order.findOneAndUpdate(
            { 
                _id: orderId,
                'products._id': productId
            },
            {
                $set: {
                    'products.$.reason': reason,
                    'products.$.orderStatus': 'Return Requested'
                }
            },
            { new: true }
        );
       // console.log('order:',order);

        if (!order) {
            return res.status(404).json({ message: 'Order or Product not found' });
        }

        res.status(200).json({ message: 'Return requested successfully', order: order });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loadInvoiceDetails = async (req, res) => {
    try {
        const userId = req.session.userid;
        const orderId = req.params.Id; // This is the custom order ID
        const email = req.session.email;
        const username = req.session.name;

        // Query the Order model using the custom orderId field
        const order = await Order.findOne({ orderId: orderId, userId: userId }).populate({
            path: 'products.productid',
            model: Products,
            select: 'name price quantity image'
        });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('user/invoice', { order, username, email });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};




    

module.exports = {
    addAddress,
    deleteAddress,
    updateAddress,
    userProfile,
    loadEditAddresss,
    loadOrderDetails,
    orderCancel,
    orderReturnRequest,
    //loadAllProducts
    loadInvoiceDetails
    
};