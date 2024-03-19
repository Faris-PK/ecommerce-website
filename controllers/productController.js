const Products = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');
const Offer = require('../models/offerModel')


const loadProductList = async (req, res) => {
    try {
        const products = await Products.find().populate('category');

        res.render('productList', { 'products': products });
    } catch (error) {
        console.log(error.message);
    }
}


const loadCategory = async (req,res)=>{
    try {
        const category = await Category.find();
        res.render('addProduct',{categories:category});
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async (req,res)=>{
    try {
        const {name,price,quantity,category,description} = req.body;

        const images = req.files.map(file => file.filename);

        //Assuming 'image is an array of string (file path or base64 encoded image)

        const newProduct = new Products ({
            name:name,
            price:price,
            quantity:quantity,
            category:category,
            description:description,
            image:images
                       
        });
        await newProduct.save();

        res.redirect('/admin/product');// Redirect to a suitable route after successful submission
    } catch (error) {
        console.log(error.message);
        req.flash('err','Error saving product.Please try again')
    }
}


const toggleProductStatus = async (req,res)=>{
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId);

        if(!product){
            return res.status(404).json({success:false,message:'product not found'});
        }

        //Toggle the 'is_listed' property
        product.is_listed = !product.is_listed;
        await product.save();

        //Send the updated product informatioin as JSON response
        res.json({
            success:true,
            product:{
                _id:product._id,
                is_listed:product.is_listed,
            },
        })
            
    
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
        
    }
}
// const loadEditProduct = async (req,res)=>{
//     try {
//         const category = await Category.find();
//         res.render('editProduct',{categories:category});
//     } catch (error) {
//         console.error('Error in loadEditProduct controller:', error);
//         res.status(500).send('Internal Server Error');
//     }
// }
const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        // console.log('Product ID:', productId);

        const category = await Category.find();
        const product = await Products.findById(productId).populate('category')
           //console.log(product);

        if (!product) {
            //console.log('Product not found');
            return res.status(404).send('Product not found');
        }

        //console.log('Found product:', product);

        res.render('editProduct', { categories: category, product: product });
    } catch (error) {
        console.error('Error in loadEditProduct controller:', error);
        res.status(500).send('Internal Server Error');
    }
}





const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, price, quantity, category, description } = req.body;

        //console.log('reqqqq..booody:',req.body);

        // Check if images are included in the form data
        const images = req.files ? req.files.map(file => file.filename) : [];

        // Get the existing product
        const existingProduct = await Products.findById(productId);

        const imagesToDelete = req.body.deletedImages;


        // Update the existing product with the new information
        await Products.findByIdAndUpdate({_id: productId}, {
            name: name,
            price: price,
            quantity: quantity,
            category: category,
            description: description,
            // Use the existing images if not provided in the form data
            image: images.length > 0 ? images : existingProduct.image
        });

        if (imagesToDelete && imagesToDelete.length > 0) {
            for (const imageFilename of imagesToDelete) {
                await Products.updateOne({ _id: productId }, { $pull: { image: imageFilename } });
            }
            console.log('Images deleted successfully from the database.');
        }



        res.redirect('/admin/product'); // Redirect to a suitable route after successful submission
    } catch (error) {
        console.log(error.message);
        req.flash('err', 'Error editing product. Please try again');
    }
}



    
module.exports = {
    loadProductList,
    loadCategory,
    addProduct,
    toggleProductStatus,
    loadEditProduct,
    editProduct
}