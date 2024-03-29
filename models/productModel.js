const mongoose = require("mongoose");
const Offer = require("./offerModel");
const Category = require("./categoryModel");

const productSchema = mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    price:{
        type:Number,
        required: true
    },
    quantity:{
        type:Number,
        required: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
   
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    is_listed: {
        type: Boolean,
        default:true
    }
});


productSchema.methods.determineBestOffer = async function() {
    let bestOffer = null;
    let bestOfferType = null;

   // console.log(';inside function');

    try {
        if (this.offer) {
            const productOffer = this.offer;
            
            if (productOffer && productOffer.is_active) {
                bestOffer = productOffer;
                bestOfferType = 'product';
            }
        }
        
        if (this.category) {
            const category = await Category.findById(this.category).populate('offer');

            if (category && category.offer && category.offer.is_active) {
                if (!bestOffer || category.offer.discountPercentage > bestOffer.discountPercentage) {
                    bestOffer = category.offer;
                    bestOfferType = 'category';
                }
            }
        }
    } catch (error) {
        console.error("Error determining best offer:", error);
    }

    return Promise.resolve({bestOffer, bestOfferType});
};


const Products = mongoose.model('Products', productSchema);

module.exports = Products