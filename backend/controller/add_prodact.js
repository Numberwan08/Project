
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

exports.get_prodact = async (req , res )=>{
    res.json({
        mag: "api แสดงสินค้า"
    })
}

exports.add_prodact = async (req , res )=>{
    try {
        console.log("req.body", req.body);
        const {
            id_user,
            name_prodact,
            detail_prodact,
            date,
            phone,
            latitude,
            longitude,
            price,
            images
        }= req.body;
        const [rows] = await db.promise().query("INSERT INTO user_prodact (id_user, name_prodact, detail_prodact, date, phone, latitude, longitude, price, images) VALUES (?,?,?,?,?,?,?,?,?)", [
            id_user,
            name_prodact,
            detail_prodact,
            date,
            phone,
            latitude,
            longitude,
            price,
            images
        ]);

        if(rows.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถเพิ่มสินค้าได้",
                error: "ไม่สามารถเพิ่มสินค้าได้"
            });
        }
        return res.status(201).json({
            msg: "เพิ่มสินค้าสำเร็จ"
        });


    }catch(err) {
        console.log("error add_prodact", err);
        return res.status(500).json({
            msg: "ไม่สามารถเพิ่มสินค้าได้",
            error: err.message
        });
    }
}

exports.edit_prodact = async (req , res )=>{
    const {id} = req.params;
    const {
        name_prodact,
        detail_prodact,
        date,
        phone,
        latitude,
        longitude,
        price,
        images
    } = req.body;
    try{
        
        const [rows] = await db.promise().query("UPDATE user_prodact SET name_prodact = ?, detail_prodact = ?, date = ?, phone = ?, latitude = ?, longitude = ?, price = ?, images = ? WHERE id_prodact = ?", [
            name_prodact,
            detail_prodact,
            date,
            phone,
            latitude,
            longitude,
            price,
            images,
            id
        ]);

        if(rows.affectedRows === 0) {
            return res.status(400).json({
                msg: "ไม่สามารถแก้ไขสินค้าได้",
                error: "ไม่สามารถแก้ไขสินค้าได้"
            });
        }
        return res.status(200).json({
            msg: "แก้ไขสินค้าสำเร็จ"
        });

    } catch(err) {
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

        const [rows] =await db.promise().query("SELECT * FROM user_prodact WHERE id_prodact = ?", [id]);
        if(rows.length === 0) {
            return res.status(404).json({
                msg: "ไม่พบสินค้าที่ต้องการลบ",
                error: "ไม่พบสินค้าที่ต้องการลบ"
            });
        }
        await db.promise().query("DELETE FROM user_prodact WHERE id_prodact = ?", [id]);
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