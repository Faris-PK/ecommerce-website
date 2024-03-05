const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Wallet = require('../models/walletModel');

const Razorpay = require('razorpay');
const crypto = require('crypto');
const {v4:uuidv4} = require('uuid');

const  instance = new Razorpay({
    key_id:process.env.RAZORPAY_ID_KEY,
    key_secret:process.env.RAZORPAY_SECRET_KEY,
});

function generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}  




const loadCart = async (req, res) => {
    try {
        let userId = req.session.userid;
      
        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: Product, 
            select: 'name price image',
        });
        // console.log("cart: ", cart);

        
        if (!cart) {
            return res.render('cart', { cartProduct: [], subtotal: 0 });
        }

        const subtotal = cart.subTotal;
        const offerDiscount = cart.offerDiscount;

        res.render('cart', { cartProduct: cart.product, subtotal, offerDiscount });

    } catch (error) {
        console.log(error);
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, userId, quantity } = req.body;

        // Find the cart for the user
        let userCart = await Cart.findOne({ userid: userId });

        // If userCart is null, create a new one
        if (!userCart) {
             // Find product details
        const product = await Product.findById(productId);
            const cart = new Cart({
                userid: userId,
                product: [
                    {
                        productid: productId,
                        quantity: quantity,
                        totalPrice: quantity * product.price,
                        Image: product.image[3],
                    },
                ],
            });

            cart.subTotal = cart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
            cart.grandTotal = cart.subTotal - cart.offerDiscount - cart.couponDiscount;

            await cart.save();
            return res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
        }

        // Find the product in the cart
        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

        const product = await Product.findById(productId);


        if (existingProduct) {
            // If the product already exists in the cart, update the quantity
            existingProduct.quantity += parseInt(quantity);
            existingProduct.totalPrice = existingProduct.quantity * product.price;

            await userCart.save();

            return res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: true });
        } else {
            // If the product doesn't exist in the cart, add a new entry
            userCart.product.push({
                productid: product._id,
                quantity: quantity,
                totalPrice: quantity * product.price,
                Image: product.image[3],
            });

           
        } 
        userCart.subTotal = userCart.product.reduce((acc, cur) => acc + cur.totalPrice, 0);
        userCart.grandTotal = userCart.subTotal - userCart.offerDiscount - userCart.couponDiscount;

        await userCart.save();
           
        return res.status(200).json({ message: 'Product added to cart successfully' });
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// const removeFromCart = async(req,res)=>{
//     try {
//         const userId = req.session.userid;
//         const productIdToRemove = req.params.productId;

//         //Find the cart for the user 
//         const userCart = await Cart.findOne({userid:userId});
        
//         if (userCart) {
//             //Remove the product from the product array
//             userCart.product = userCart.product.filter(product=>String(product.productid) !== productIdToRemove);

//             //Save the updated cart
//             await userCart.save();

//             res.status(200).json({ message: 'Product removed from cart successfully' })

//         } else {
//             res.status(404).json({error:'Cart not found'});
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }

const removeFromCart = async (req, res) => {
    try {
        const userId = req.session.userid;
        const productIdToRemove = req.params.productId;

        // Find the cart for the user
        const userCart = await Cart.findOne({ userid: userId });

        if (userCart) {
            // Remove the product from the product array
            userCart.product = userCart.product.filter(
                (product) => String(product.productid) !== productIdToRemove
            );

            // Recalculate subTotal and grandTotal
            userCart.subTotal = userCart.product.reduce(
                (total, product) => total + product.totalPrice,
                0
            );
            userCart.grandTotal = userCart.subTotal - userCart.offerDiscount - userCart.couponDiscount;

            // Save the updated cart
            await userCart.save();

            res.status(200).json({ message: 'Product removed from cart successfully' });
        } else {
            res.status(404).json({ error: 'Cart not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userid;

       // console.log(userId);

        // Fetch user address
        const user = await User.findById(userId);
        const userAddresses = user.address;

        // Fetch wallet
        const wallet = await Wallet.findOne({ user: userId });

        //console.log(wallet);

        if (!wallet) {
            console.error('Wallet not found for user');
            req.flash('error', 'Unable to proceed as wallet not found.');
            return res.redirect('/cart');
        }

        // Fetch cart products
        const cart = await Cart.findOne({ userid: userId }).populate({
            path: "product.productid",
            model: Product,
            select: 'name price',
        });

        if (!cart) {
            console.error('Cart not found for user');
            req.flash('error', 'Unable to proceed as your cart is empty.');
            return res.redirect('/cart');
        }

        const subTotal = cart.subTotal;
        const couponDiscount = cart.couponDiscount;
        const discount = cart.offerDiscount + cart.couponDiscount;
        const grandTotal = cart.grandTotal;
        const walletBalance = wallet.balance;

        //console.log(wallet.balance);

        res.render('checkout', {
            checkoutProduct: cart.product, userAddresses, couponDiscount, subTotal, discount, grandTotal,
            walletBalance: walletBalance
        });
    } catch (error) {
        console.error(error.message);
        // Handle other errors if needed
        res.status(500).send('Internal Server Error');
    }
};



const checkoutAddress = async(req, res) => {
    try {
        const user = await User.findById(req.session.userid)

        // Add the address details to the user's address array
        user.address.push({
            name: req.body.name,
            housename: req.body.housename,
            street: req.body.street,
            city: req.body.city,
            pin: req.body.pin,
            mobile: req.body.mobile
        });

        // Save the user with the new address to MongoDB
        const savedUser = await user.save();

        res.status(200).json({ message: 'Address saved successfully', user: savedUser });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}



const placeOrder = async (req,res)=>{
    try {
        const userId = req.session.userid;
        const paymentMethod = req.body.paymentMethod;
        const selectedAddress = req.body.selectedAddress;
        const paymentId = req.body.paymentId;
        const cartId = req.session.userid;
        console.log('userId',userId);
        console.log('paymentMethod',paymentMethod);
        console.log('selectedAddress',selectedAddress);
        console.log('paymentId',paymentId);
        console.log('cartid',cartId);
        const cart = await Cart.findOne({ userid: cartId });
        if (!cart) {
            console.error('Cart not found for user:', userId);
            return res.redirect('/error');
        }

        const { offerDiscount, couponDiscount, subTotal, grandTotal } = cart;
        // console.log("offerDiscount: ", offerDiscount);
        // console.log("couponDiscount: ", couponDiscount);
        // console.log("subTotal: ", subTotal);
        // console.log("grandTotal: ", grandTotal);

        let paymentStatus;
        let paymentMessage;
        const generatedOrderId = generateOrderId();

        
        switch (paymentMethod) {
            case 'wallet':
                console.log("Wallet selected");
    
                
                try {
                    const wallet = await Wallet.findOne({ user: userId });
                    // console.log("wallet: ", wallet);
                    if (!wallet) {
                        console.log("Inside not wallet if condn");
                        throw new Error("Wallet not found for the user");
                    }

                    
                    if (wallet.balance >= grandTotal) {
                        wallet.balance -= grandTotal;
                        wallet.walletHistory.push({
                            amount: grandTotal,
                            type: "Debit",
                            reason: "Order Payment",
                            orderId2: generatedOrderId,
                            date: new Date()
                        });

                        await wallet.save();
                        console.log("Wallet saved");
                        paymentStatus = 'success'
                        
                    } else {
                        // console.log("Inside else condn for less balance");
                        throw new Error("Insufficient funds in the wallet");
                    }
                } catch (error) {
                    // console.log("Inside catch");
                    console.error("Error processing wallet payment:", error);
                }
                break;
            case 'razorpay':
                paymentStatus = 'success'
                break;
            case 'cod':
                paymentStatus = 'success'
                break;
            default:
                console.error('Invalid payment method:', paymentMethod);
                return res.status(400).json({ success: false, message: 'Invalid payment method' });
        }
        if (paymentStatus !== 'success') {
            console.log("Payment status not success");
            return res.status(400).json({ success: false, message: paymentMessage });
        }
        const checkoutProduct = await Cart.find({ userid: req.session.userid }).populate({
            path: "product.productid",
            model: Product,
            select: 'name price image',
        });

        const products = checkoutProduct.reduce((acc, checkoutItem) => {
            return acc.concat(checkoutItem.product.map((product, index) => ({
                productid:product.productid._id,
                name: product.productid.name,
                price: product.productid.price,
                offerDiscount: product.productid.offerDiscount,
                quantity: product.quantity,
                total: product.totalPrice,
                orderStatus: 'Placed',
                image: product.productid.image[3],
            })));
        }, []);
        const user = await User.findById(req.session.userid).lean();

        if (!user) {
            console.log("Inside not user if condn");
            console.error('User not found');
            return res.redirect('/error');
        }

        const selectedAddressObj = user.address.find(address => address._id.toString() === selectedAddress);

        if (!selectedAddressObj) {
            console.error('Selected address not found');
            return res.redirect('/error');
        }

        const shippingTimeMs = 7 * 24 * 60 * 60 * 1000;
        const estimatedDeliveryDate = new Date(Date.now() + shippingTimeMs);

        
        const hashedOrderId = generateHash(generatedOrderId);

        const orderData = {
            hashedOrderId: hashedOrderId,
            orderId: generatedOrderId,
            userId: userId, // Add this line to set the userId
            products: products,
            paymentMode: paymentMethod,
            paymentId: paymentId,
            subTotal: subTotal,
            offerDiscount: offerDiscount,
            couponDiscount: couponDiscount,
            grandTotal: grandTotal,
            date: new Date(),
            edd: estimatedDeliveryDate,
            address: {
                name: selectedAddressObj.name,
                housename: selectedAddressObj.housename,
                street: selectedAddressObj.street,
                city: selectedAddressObj.city,
                pin: selectedAddressObj.pin,
                mobile: selectedAddressObj.mobile
            },
        };
        

        const orderInstance = new Order(orderData);
        await orderInstance.save();

        await Cart.findOneAndDelete({ userid: req.session.userid });

        for (const product of products) {
            try {
                const productInStock = await Product.findById(product.productid);
                if (productInStock) {
                    productInStock.quantity -= product.quantity;
                    await productInStock.save();
                } else {
                    console.error(`Product with ID ${product.productid} not found in the stock database`);
                }
            } catch (error) {
                console.error('Error updating product stock:', error);
                return res.status(500).json({ success: false, message: 'An error occurred while updating product stock.' });
            }
        }
        
        // console.log("Just above the order success");
        res.status(200).json({ success: true, hashedOrderId });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing the order or updating product stock.' });
    }
   

}



//Function to generate a unique ID (OD + timestamp + random number)

function generateOrderId(){
    const timestamp = Date.now().toString();//Get the current timestamp in millisecondes
    const randomDigits = Math.floor(Math.random()*1000000).toString().padStart(6,'0');// Generate a random 6-digit number
    return `OD${timestamp}${randomDigits}`;
}

const verifyPayment = async (req,res) =>{
    try {
        const userId = req.session.user_id;
        const {payment,order} = req.body;
        const orderId = order.receipt;

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'u9bejgIeznjidxSe9MNYGpTR');
        hmac.update(payment.razorpay_order_id + '|' + payment.razorpay_payment_id);
        hmac = hmac.digest('hex');

        if (hmac === payment.razorpay_signature) {
            const orderDetails = await Order.findById(orderId);

            if (!orderDetails) {
                console.error('Order not found:', orderId);
                return res.status(404).json({ error: 'Order not found' });
            }

            orderDetails.paymentStatus = "Razorpay";
            await orderDetails.save();

            const cartDeleteResult = await Cart.deleteOne({ userid: userId });

            if (!cartDeleteResult.ok) {
                console.error('Error deleting cart items for user:', userId);
                return res.status(500).json({ error: 'Error deleting cart items' });
            }

            return res.json({ payment: true });
        } else {
            console.error('Razorpay signature mismatch');
            return res.status(400).json({ error: 'Razorpay signature mismatch' });
        }

        
    } catch (error) {
        console.error('Razorpay signature mismatch');
        return res.status(400).json({ error: 'Razorpay signature mismatch' });
    }

}

const generateRazorpay = (orderid, adjustedAmount) => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: adjustedAmount,
            currency: "INR",
            receipt: "" + orderid
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Error generating Razorpay order:", err);
                reject(err); // Reject the promise with the error object
            } else {
                resolve(order); // Resolve the promise with the order object
            }
        });
    });
};

const loadOrderConfirmation = async (req, res) => {
    try {

        const email = req.session.email;
        const username = req.session.name;

        
        const hashedOrderId = req.params.Id;
        // console.log("req.params.id: ", req.params.Id);
        // console.log("hashedOrderId: ", hashedOrderId);
        // Fetching order details from the database using the hashed order ID
        const order = await Order.findOne({ hashedOrderId:hashedOrderId });
        // console.log("order: ", order);

        const user = await User.findById(order.userId);
        // console.log("user: ", user);
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        res.render('orderconfirmation', { order,  user,email,username});
    } catch (error) {
        console.log(error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
}

module.exports = {
    loadCart,
    addToCart,
    removeFromCart,
    loadCheckout,
    checkoutAddress,
    placeOrder,
    verifyPayment,
    generateRazorpay,
    loadOrderConfirmation
}