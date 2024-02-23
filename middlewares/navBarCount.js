const Cart = require('../models/cartModel');
const Wishlist =require('../models/whishlistModel');


const cartAndWishlistCount = async (req,res,next) =>{
    try {
        //Count the total number of products Cart and Wishlist
        const totalCartItems = await Cart.findOne({userid:req.session.userid})
        .select('product')
        .lean();// lean() is to convert mongoose document to plain JavaScript object

        // Check if a cart document was found
        if (totalCartItems) {
            const totalQuantity = totalCartItems.product.reduce((total, item) => total + item.quantity, 0);
            res.locals.cartCount = totalQuantity;
        } else {
            res.locals.cartCount = "";
        }

        const totalWishlistItems = await Wishlist.findOne({ userid: req.session.userid })
        .select('product')
        .lean();

    // Check if a wishlist document was found
    if (totalWishlistItems) {
        const wishlistItemCount = totalWishlistItems.product.length;
        res.locals.wishlistCount = wishlistItemCount;
    } else {
        res.locals.wishlistCount = ""; 
    }

    next();
        

    } catch (error) {
        next()
    }
}

module.exports = {
    cartAndWishlistCount
}