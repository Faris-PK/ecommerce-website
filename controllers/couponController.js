const User = require('../models/userModel');
const Orders = require('../models/orderModel');
const Product = require('../models/productModel');
const Coupon = require('../models/couponModel');
const Cart = require('../models/cartModel');

const loadCouponPage = async (req,res) =>{
    try {
        //Fetch the  all coupon from the database
        const coupons = await Coupon.find();
        //console.log('Coooopen:::::::::::',coupons);
        res.render("couponList", { coupons });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


const loadAddCoupon = async (req,res)=>{
    try {
        res.render('addCoupon');
    } catch (error) {
        console.log(error.message);
    }
}

const submitCoupon = async (req,res) =>{
    try {
        //create a new coupon instance wiith data from the form

        const {
            couponCode,
            discountAmount,
            minOrderAmount,
            couponDescription,
            startDate,
            expiryDate
        } = req.body;
        //console.log(req.body);

        const newCoupon = new Coupon({
            couponCode:couponCode,
            discountAmount:discountAmount,
            minOrderAmount:minOrderAmount,
            couponDescription:couponDescription,
            startDate:startDate,
            expiryDate:expiryDate,
            active:true
        });

        //Save new coupon to the database
        const newCouponSaved = await newCoupon.save();
        res.redirect('/admin/coupon')

    } catch (error) {
        
    }
}

const toggleCouponStatus = async (req, res) => {
    try {
        const couponId = req.params.couponId; // Corrected: use req.params.couponId
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Toggle the 'is_listed' property
        coupon.is_listed = !coupon.is_listed;
        await coupon.save();

        // Send the updated coupon information as JSON response
        res.json({
            success: true,
            coupon: {
                _id: coupon._id,
                is_listed: coupon.is_listed,
            },
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


const loadEditCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        res.render('editCoupon', { coupon: coupon });
    } catch (error) {
        console.error('Error in loadEditCoupon controller:', error);
        res.status(500).send('Internal Server Error');
    }
};

const editCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        const { couponCode, discountAmount, minOrderAmount, couponDescription, startDate, expiryDate } = req.body;

        // Get the existing coupon
        const existingCoupon = await Coupon.findById(couponId);

        // Update the existing coupon with the new information
        await Coupon.findByIdAndUpdate(couponId, {
            couponCode: couponCode,
            discountAmount: discountAmount,
            minOrderAmount: minOrderAmount,
            couponDescription: couponDescription,
            startDate: startDate,
            expiryDate: expiryDate,
            // Use the existing status if not provided in the form data
            is_listed: req.body.is_listed || existingCoupon.is_listed
        });

        res.redirect('/admin/coupon'); // Redirect to a suitable route after successful submission
    } catch (error) {
        console.log(error.message);
        req.flash('err', 'Error editing coupon. Please try again');
    }
};

// apply coupon
const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.userid;
       // console.log("USERID FROM COUPON:",userId);
        const currentUser = await User.findOne({ _id: userId });
       // console.log("CRRENT UDSREGBF:",currentUser);
        const { couponCode } = req.body;

        console.log("COUPONcOOODE",couponCode);

        const userCart = await Cart.findOne({ userid: userId }).populate(
            "product.productid"
        );
        const product = userCart.product;
        console.log();
        const usedCoupon = await Coupon.findOne({
            couponCode: couponCode,
            userUsed: { $in: [userId] },
            is_listed: true, // Added condition for is_listed: true
        });

        //console.log(usedCoupon);

        if (usedCoupon) {
            console.log("Already used coupon");
            
            return res.json({ used: true, message: "Coupon is already used" });
        }
    
        const currentCoupon = await Coupon.findOne({
            couponCode: couponCode,
        });
    
        const totalAmount = product.reduce(
            (total, product) => total + product.totalPrice,
            0
        );
        const lastPrice = totalAmount - currentCoupon.discountAmount;
    
        if (currentCoupon) {

            const today = new Date();
            const couponStartDate = new Date(currentCoupon.startDate);
            const couponEndDate = new Date(currentCoupon.expiryDate);
    
            if (today >= couponStartDate && today <= couponEndDate) {
                if (totalAmount >= currentCoupon.minOrderAmount) {
                    const changeTotalPrice = totalAmount - currentCoupon.discountAmount;
                    const updatedGrandTotal = changeTotalPrice;
                    const updatedCart = await Cart.findOneAndUpdate(
                        { userid: userId },
                        { $set: { 
                            couponDiscount: currentCoupon.discountAmount,
                            grandTotal: updatedGrandTotal
                        } },
                        { new: true }
                    );
                    return res.json({ success: true, totalPrice: changeTotalPrice ,message : 'Coupon applied successfully'}); // Return to avoid multiple responses
                } else {
                    
                    return res.json({
                    limit: true,
                    message: `Total amount must be above ₹${currentCoupon.minOrderAmount}`,
                    });
                }
            } else {
                console.log("Coupon Expired else");
                return res.json({ expired: true, message: "Coupon is expired" });
            }
        } else {
            console.log("Coupon not found else");
            return res.json({ CodeErr: true, message: "Coupon not found" });
        }
        } catch (error) {
            console.log("Catch part");
            console.error(error);
            return res.json({ CodeErr: true, message: "Coupon not found" });
        }
  };

const removeCoupon = async (req, res) => {
    const userId = req.session.userid;

    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { userid: userId },
            { $set: { couponDiscount: 0 } },
            { new: true }
        );

        if (!updatedCart) {
            throw new Error('Cart not found');
        }

        const { subTotal, offerDiscount, couponDiscount } = updatedCart;
        const newGrandTotal = subTotal - offerDiscount - couponDiscount;

        
        updatedCart.grandTotal = newGrandTotal;
        await updatedCart.save();
        res.json({ message: 'Coupon removed successfully', updatedCart: updatedCart });
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ error: 'Error removing coupon' });
    }
}



module.exports = {
    loadCouponPage,
    submitCoupon,
    loadAddCoupon,
    toggleCouponStatus,
    loadEditCoupon,
    editCoupon,
    applyCoupon,
    removeCoupon
}