const Categories = require('../models/categoryModel');


const addCategory = async (req,res)=>{
    const { categoryName } = req.body

    try {
        const exist = await Categories.findOne({name:categoryName});
        //console.log(exist);
        if (exist) {
            req.flash('name','Category already exists');
            res.status(200).json({ success: false, message: 'Category already exists' });
        } else {
            const newCategory = new Categories({
                name: categoryName
            })
            await newCategory.save();
            res.status(201).json({success:true,message:'Category added Successfully',category:newCategory})
            
        }
    } catch (error) {
        console.log('Error adding category :',error);
        res.status(500).json({message:"Internal server error"})
    }
};

const loadCategoryList = async(req,res)=>{
    try {
        const categories = await Categories.find()
        res.render('categoryList',{categories:categories})
    } catch (error) {
        console.log(error.message)
    }
}

const toggleCategoryStatus = async (req,res) =>{
    try {
        const categoryId = req.params.categoryId;
        const category = await Categories.findById(categoryId);

        //const caaaaaateee = await Categories.find()
        //console.log('category:',caaaaaateee);

        if(!category){
            return res.status(404).json({success:false,message:'Category not found'});
        }

        //Toggle the 'is_listed' property
        category.is_listed = !category.is_listed;
        await category.save();

        //Send the updated category information as JSON response

        res.json({
            success:true,
            category:{
                _id:category._id,
                is_listed:category.is_listed,
            }
        });
    } catch (error) {
       console.log("Error:",error);
       res.status(500).json({success:false,message:"Internal Server Error"});
    }
}


const editCategory = async (req,res) =>{
    try {
        //Find the category by ID
        const category = await Categories.findById(req.body.id);

        if(!category){
            return res.status(404).send({success:false,message:'Category not found'});
        }

        //Check if the new category name is already in the database

        const newName = req.body.name;
        const existingCategory= await Categories.findOne({name:newName});

        if(existingCategory && existingCategory._id.toString() !== category._id.toString()){
            return res.status(400).send({success:false,message:'Category name already exists'});
        }

        ///Update the category name
        category.name = newName;
        await category.save();

        res.send({success: true,message:'Category added Successfully'})
    } catch (error) {
        console.log(error.message);
        res.status(500).send({success:false,message:'Internal server Error'})
    }
}





module.exports = {
    addCategory,
    loadCategoryList,
    toggleCategoryStatus,
    editCategory
}