
const { error, log } = require("console");
const db = require("../config/db");
const fs = require('fs');
const deleteImage =(path)=>{
    fs.unlink(path,(err)=>{
        if(err){
            console.error("Error deleting image:", err);
        }else{
            console.log("Image deleted successfully");
        }
    });
};

exports.get_product_id = async (req,res)=>{
    try{
        const {id} =req.params;
        const [rows] =await db.promise().query(`SELECT 
        t1.name_product,t1.detail_product,t1.phone,t1.latitude,t1.longitude,t1.price,t1.images,t2.first_name
        FROM user_prodact t1 JOIN user t2 ON t1.id_user = t2.id_user WHERE t1.id_product=?`,[id]);
        if(rows.length === 0){
            return res.status(404).json({mag:"ไม่พบสินค้า"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag:"ดึงข้อมูลสินค้าสำเร็จ",data:formatData});

    }catch(err){
        console.log("error get data");
        return res.status(500).json({
            mag :"ไม่สามารถดึงข้อมูลสินค้าได้",
            error: err.message
        })
        
    }
}

exports.get_prodact = async (req , res )=>{
    try{
        const [rows] = await db.promise().query("SELECT * FROM user_prodact");
        if(rows.length===0){
            return res.status(404).json({ mag:"ไม่พบสินค้า"})
        }
        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error:err.message
        });
    }
}
exports.get_product_me = async (req , res )=>{
    const {id} = req.params;
    try{
        const [rows] =await db.promise().query("SELECT * FROM user_prodact WHERE id_user = ?",[id]);
        if(rows.length === 0){
            return res.status(404).json({mag:"ไม่พบสินค้า"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({mag: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

    }catch(err){
        console.log("error get product");
        return res.status(500).json({ mag:"ไม่สามารถดึงข้อมูลได้", error:err.message})
    }
}

exports.add_prodact = async (req , res )=>{
    const [[{max_id}]] = await db.promise().query("SELECT MAX(id_product) as max_id FROM user_prodact ")

    const {
        id_user,
        name_product,
        detail_product,
        phone,
        latitude,
        longitude,
        price,
        type
    } = req.body;

    const image = req.file;
    try{

        const [rows] = await db.promise().query("INSERT INTO user_prodact (id_product,id_user,name_product,detail_product,phone,latitude,longitude,price,images,type)VALUES (?,?,?,?,?,?,?,?,?,?)",[
            max_id+1,
            id_user,
            name_product,
            detail_product,
            phone,
            latitude,
            longitude,
            price,
            image.path,
            type
        ]);

        if(rows.affectedRows === 0 ){
            deleteImage(image.path);
            return res.status(400).json({
                mag:"ไม่สามารถเพิ่มได้",
                error:"ไม่สามารถเพิ่มได้"
            })
        }

        return res.status(201).json({mag:"sucess"});
        
    }catch(err){
    deleteImage(image.path);
    console.log("error add product", err);
    return res.status(500).json({
        msg: "ไม่สามารถโพสต์ได้",
        error: err.message,
    });
    }
}

exports.edit_prodact = async (req, res) => {
    const { id } = req.params;
    let {
        name_product,
        detail_product,
        phone,
        latitude,
        longitude,
        price,
        type
    } = req.body;

    try {
        // ตรวจสอบว่ามีการอัปโหลดไฟล์ใหม่หรือไม่
        let imagePath = null;
        if (req.file) {
            // ดึง path รูปใหม่
            imagePath = req.file.path;

            // ลบรูปเดิม (ถ้ามี)
            const [oldRows] = await db.promise().query("SELECT images FROM user_prodact WHERE id_product = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        // ถ้าไม่ได้อัปโหลดรูปใหม่ ให้ใช้ path เดิม
        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM user_prodact WHERE id_product = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(
            "UPDATE user_prodact SET name_product = ?, detail_product = ?, phone = ?, latitude = ?, longitude = ?, price = ?, images = ?, type = ? WHERE id_product = ?",
            [
                name_product,
                detail_product,
                phone,
                latitude,
                longitude,
                price,
                imagePath,
                type,
                id
            ]
        );

        if (rows.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถแก้ไขสินค้าได้",
                error: "ไม่สามารถแก้ไขสินค้าได้"
            });
        }
        return res.status(200).json({
            msg: "แก้ไขสินค้าสำเร็จ"
        });

    } catch (err) {
        console.log("error edit_prodact", err);
        return res.status(500).json({
            msg: "ไม่สามารถแก้ไขสินค้าได้",
            error: err.message
        });
    }
}

exports.delete_prodact = async (req , res )=>{
    try {
        const {id} = req.params;

        const [rows] =await db.promise().query("SELECT * FROM user_prodact WHERE id_product = ?", [id]);
        if(rows.length === 0) {
            return res.status(404).json({
                msg: "ไม่พบสินค้าที่ต้องการลบ",
                error: "ไม่พบสินค้าที่ต้องการลบ"
            });
        }

        const imagePath = rows[0].images;
        if (imagePath && fs.existsSync(imagePath)) {
            deleteImage(imagePath);
        }
        
        await db.promise().query("DELETE FROM user_prodact WHERE id_product = ?", [id]);
        if(rows.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถลบสินค้าได้",
                error: "ไม่สามารถลบสินค้าได้"
            });
        }
        return res.status(200).json({
            msg: "ลบสินค้าสำเร็จ"
        });

    } catch(err) {
        console.log("error delete_prodact", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบสินค้าได้",
            error: err.message
        });
    }
}