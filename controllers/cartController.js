const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
const Order = require('../models/orderModel');


const loadCart = async(req,res)=>{
    try {
        let userId = req.session.userid;
        const cartProduct = await Cart.find({userid:userId}).populate({
            path:'product.productid',
            model:Product,
            select:'name price image'
        });
        //Calculate the sum of total prices for the current user's cart

        const grandTotal = cartProduct.reduce((acc,cartItem)=>{
            return acc + cartItem.product.reduce((acc,product)=>{
                return acc + product.totalPrice;
            },0);
        },0);
        res.render('cart',{cartProduct,grandTotal})
       // console.log(cartProduct,grandTotal);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}



const addToCart = async (req, res) => {
    try {
        const { productId, userId, quantity } = req.body;

        // Find product details
        const product = await Product.findById(productId);

        // If product is not found, handle accordingly (return an error response, for example)
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Find the cart for the user
        let userCart = await Cart.findOne({ userid: userId });

        // If userCart is null, create a new one
        if (!userCart) {
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

            await cart.save();
            

            return res.status(200).json({ message: 'Product added to cart successfully', isProductInCart: false });
        }

        // Find the product in the cart
        const existingProduct = userCart.product.find(product => String(product.productid) === productId);

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
                Image: product.image[0],
            });

            await userCart.save();
           
            return res.status(200).json({ message: 'Product added to cart successfully' });
        }

        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const removeFromCart = async(req,res)=>{
    try {
        const userId = req.session.userid;
        const productIdToRemove = req.params.productId;

        //Find the cart for the user 
        const userCart = await Cart.findOne({userid:userId});
        
        if (userCart) {
            //Remove the product from the product array
            userCart.product = userCart.product.filter(product=>String(product.productid) !== productIdToRemove);

            //Save the updated cart
            await userCart.save();

            res.status(200).json({ message: 'Product removed from cart successfully' })

        } else {
            res.status(404).json({error:'Cart not found'});
        }
    } catch (error) {
        console.log(error)
    }
}



const loadCheckout = async (req,res)=>{
    try {
        const userId = req.session.userid;

        //Fetch user address

        const user = await User.findById(userId);
        const userAddresses = user.address;


        //Fetch cart products

        const checkoutProduct = await Cart.find({userid:userId}).populate({
            path:"product.productid",
            model:Product, //Use the actual product model
            select:"name price",

        });
        //console.log(checkoutProduct);

       // Check if the cart is empty
       if (checkoutProduct.length === 0) {
        // Redirect to the cart page with a message
        req.flash('error', 'Your cart is empty. Add products to your cart before proceeding to checkout.');
        return res.redirect('/cart'); // Adjust the route based on your actual route
    }
    

        //Calculate Grandtotal

        const grandTotal = checkoutProduct.reduce((acc,checkoutItem)=>{
            return acc + checkoutItem.product.reduce((acc,product)=>{
                return acc + product.totalPrice;
            },0)
        },0);

        res.render('checkout',{checkoutProduct,grandTotal,userAddresses});
    } catch (error) {
        console.log(error.message);
    }
}


const checkoutAddress = async (req,res)=>{

    try {
        const user = await User.findById(req.session.userid);

        
        // Validate input data
        if (!req.body.name || !req.body.housename || !req.body.street || !req.body.city || !req.body.pincode || !req.body.mobile) {
            return res.status(400).json({ message: 'All address fields are required' });
        }

        //Add the address details to users address array 
        user.address.push({
            name:req.body.name,
            housename:req.body.housename,
            street:req.body.street,
            city:req.body.city,
            pin:req.body.pincode,
            mobile:req.body.mobile

        });

        //Sve the user with new address in mongo db
        const savedUser = await user.save();
         //console.log(savedUser);
        
        res.status(200).json({message:'Address saved successfully',user:savedUser})

    } catch (error) {  
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }

}


const placeOrder = async (req,res)=>{
    try {
         //Extract order details from the form
    const {selectedAddress , paymentMode} = req.body;

    //Retrive other order details (products , subtotal,etc.) as needed

    const checkoutProduct = await Cart.find({userid:req.session.userid}).populate({
        path:"product.productid",
        model:Product, //Use the actual Product model
        select:'name price image quantity',

    });

    const products = checkoutProduct.reduce((acc, checkoutItem) => {
        return acc.concat(checkoutItem.product.map(product => ({
            productid: product.productid._id,
            name: product.productid.name,
            price: product.productid.price, // Corrected typo here
            quantity: product.quantity,
            total: product.totalPrice,
            orderStatus: 'Placed',
            reason: 'N/A',
            image: product.productid.image[0]
        })));
    }, []);
   
    const subtotal = products.reduce((acc,product)=>acc+product.total,0);

    //Find the user by ID and retrieve the selected address
    const user = await User.findById(req.session.userid).lean();

    if(!user){
        //HAndle the case where the user is not found
        console.error('User not found');
        return res.redirect('/error')
    }

    const selectedAddressObj = user.address.find(address => address._id.toString() === selectedAddress);

    if(!selectedAddressObj){
        //Handle the case where the selected is not found
        console.error('Selected address not found');
        return res.redirect('/error');

    }


    //Create a new order

    const newOrder = new Order({
        userid:req.session.userid,
        products:products,
        paymentMode:paymentMode,
        subtotal:subtotal,
        address:{
            name:selectedAddressObj.name,
            housename:selectedAddressObj.housename,
            street:selectedAddressObj.street,
            city:selectedAddressObj.city,
            pin:selectedAddressObj.pin,
            mobile:selectedAddressObj.mobile
        },
        date: new Date(),

    });

    //Save the order to the db
    await newOrder.save();
   
    // Clear the user's cart after placing the order
    await Cart.findOneAndDelete({ userid: req.session.userid });
    

    //Reduce the quantity of products in the  products stock db

    for(const product of products){
        const productInStock = await Product.findById(product.productid);
        if(productInStock){
            //Subtract the ordered quantity from the available quantity
            productInStock.quantity -= product.quantity;
            await productInStock.save();
        }else{
            console.error(`Product with ID ${product.productid} not found in stock.`);
        }
    }

    //Add cart clearing logic here in future

    //res.redirect('/home')
    res.render('success', { title: 'Order Placed Successfully!', message: 'Thank you for your order.' });
        
    } catch (error) {
        console.error('Error placing order :',error);
        res.redirect('/error')
    }
   

}

module.exports = {
    loadCart,
    addToCart,
    removeFromCart,
    loadCheckout,
    checkoutAddress,
    placeOrder
}