const multer = require('multer');
const path = require('path');


//Set storage engine

const storage = multer.diskStorage({
    destination: (req,res,cb)=>{
        cb(null,'public/uploads');//Set the destination folder for uploaded files
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now() + "-" + file.originalname);
    }
});

//Initialize multer upload
const upload = multer({
    storage:storage,
    limits:{files:4},
});






module.exports = upload;