
const { error, log } = require("console");
const db = require("../config/db");
const fs = require('fs');
const { getIO } = require("../socket");
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
        t1.id_product,t1.name_product,t1.detail_product,t1.phone,t1.latitude,t1.longitude,t1.price,t1.images,t2.first_name
        FROM user_prodact t1 JOIN user t2 ON t1.id_user = t2.id_user WHERE t1.id_product=?`,[id]);
        if(rows.length === 0){
            return res.status(404).json({mag:"ไม่พบสินค้า"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg:"ดึงข้อมูลสินค้าสำเร็จ",data:formatData});

    }catch(err){
        console.log("error get data");
        return res.status(500).json({
            msg :"ไม่สามารถดึงข้อมูลสินค้าได้",
            error: err.message
        })
        
    }
}

exports.get_prodact = async (req , res )=>{
    try{
        const [rows] = await db.promise().query(`SELECT 
    t1.*, 
    t2.first_name, 
    t2.last_name, 
    t3.name_location
FROM user_prodact AS t1
JOIN user AS t2 
    ON t1.id_user = t2.id_user
LEFT JOIN user_post AS t3 
    ON t1.id_post = t3.id_post
WHERE t1.status != 'ปฎิเสธ' and t1.status != 'รอดำเนินการ'
ORDER BY 
    t3.name_location ASC, 
    t1.id_product ASC;
;`);
if(rows.length===0){
            return res.status(404).json({ msg:"ไม่พบสินค้า"})
        }
        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

    }catch(err){
        console.log("error get post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลโพสต์ได้",
            error:err.message
        });
    }
}

// รายการสินค้าที่รอดำเนินการอนุมัติ
exports.get_pending_products = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`SELECT 
    t1.*, 
    t2.first_name, 
    t2.last_name, 
    t3.name_location
FROM user_prodact AS t1
JOIN user AS t2 
    ON t1.id_user = t2.id_user
LEFT JOIN user_post AS t3 
    ON t1.id_post = t3.id_post
WHERE t1.status = 'รอดำเนินการ'
ORDER BY 
    t1.id_product DESC;`);

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงสินค้ารอดำเนินการสำเร็จ", data: formatData});
    } catch (err) {
        console.log("error get pending products", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงสินค้ารอดำเนินการได้",
            error: err.message
        });
    }
}

// รายการสินค้าที่ถูกปฎิเสธ
exports.get_rejected_products = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`SELECT 
    t1.*, 
    t2.first_name, 
    t2.last_name, 
    t3.name_location
FROM user_prodact AS t1
JOIN user AS t2 
    ON t1.id_user = t2.id_user
LEFT JOIN user_post AS t3 
    ON t1.id_post = t3.id_post
WHERE t1.status = 'ปฎิเสธ'
ORDER BY 
    t1.id_product DESC;`);

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงสินค้าที่ถูกปฎิเสธสำเร็จ", data: formatData});
    } catch (err) {
        console.log("error get rejected products", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงสินค้าที่ถูกปฎิเสธได้",
            error: err.message
        });
    }
}
exports.get_product_me = async (req , res )=>{
    const {id} = req.params;
    try{
        const [rows] =await db.promise().query(`SELECT 
        t1.*,          
        t2.first_name, 
        t2.last_name, 
        t3.name_location
    FROM user_prodact AS t1
    JOIN user AS t2 ON t1.id_user = t2.id_user
    LEFT JOIN user_post AS t3 ON t1.id_post = t3.id_post
    WHERE t1.id_user = ?
    ORDER BY t3.name_location ASC, t1.id_product ASC;
    `,[id]);
        if(rows.length === 0){
            return res.status(404).json({msg:"ไม่พบสินค้า"});
        }

        const formatData = rows.map((row)=>({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}`: null,
        }));

        return res.status(200).json({msg: "ดึงข้อมูลโพสต์สำเร็จ", data: formatData});

    }catch(err){
        console.log("error get product");
        return res.status(500).json({ msg:"ไม่สามารถดึงข้อมูลได้", error:err.message})
    }
}

exports.add_prodact = async (req , res )=>{
    const [[{max_id}]] = await db.promise().query("SELECT MAX(id_product) as max_id FROM user_prodact ")

    const {
        id_user,
        id_post,
        name_product,
        detail_product,
        phone,
        price,
        type
    } = req.body;

    const image = req.file;
    try{
        // Enforce name uniqueness within the same post (id_post)
        const trimmedName = (name_product || "").replace(/\s+/g, " ").trim();
        if (!id_post) {
            if (image && image.path && fs.existsSync(image.path)) deleteImage(image.path);
            return res.status(400).json({ msg: "กรุณาระบุโพสต์ (id_post)", error: "id_post required" });
        }
        if (!trimmedName) {
            if (image && image.path && fs.existsSync(image.path)) deleteImage(image.path);
            return res.status(400).json({ msg: "กรุณาระบุชื่อสินค้า", error: "name_product required" });
        }

        const [rows] = await db.promise().query("INSERT INTO user_prodact (id_product,id_user,id_post,name_product,detail_product,phone,price,images,type,status)VALUES (?,?,?,?,?,?,?,?,?,?)",[
            max_id+1,
            id_user,
            id_post,
            trimmedName,
            detail_product,
            phone,
            price,
            image.path,
            type,
            'รอดำเนินการ'
        ]);

        if(rows.affectedRows === 0 ){
            deleteImage(image.path);
            return res.status(400).json({
                msg:"ไม่สามารถเพิ่มได้",
                error:"ไม่สามารถเพิ่มได้"
            })
        }

        return res.status(201).json({msg:"เพิ่มสินค้าสำเร็จ"});
        
    }catch(err){
    deleteImage(image.path);
    console.log("error add product", err);
    return res.status(500).json({
        msg: "ไม่สามารถโพสต์ได้",
        error: err.message,
    });
    }
}

// อัปเดตสถานะสินค้า (อนุมัติ/ปฎิเสธ)
exports.update_product_status = async (req, res) => {
    try {
        const { id } = req.params;
        let { status } = req.body;
        const allowed = new Set(['อนุมัติ', 'ปฎิเสธ']);
        if (!allowed.has(String(status))) {
            return res.status(400).json({ msg: 'สถานะไม่ถูกต้อง', error: 'invalid status' });
        }
        const [rows] = await db.promise().query("SELECT * FROM user_prodact WHERE id_product = ?", [id]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบสินค้า' });
        }
        await db.promise().query("UPDATE user_prodact SET status = ? WHERE id_product = ?", [status, id]);
        const [after] = await db.promise().query("SELECT * FROM user_prodact WHERE id_product = ?", [id]);
        const product = after[0];
        if (product && product.images) {
            product.images = `${req.protocol}://${req.headers.host}/${product.images}`;
        }
        try {
            const io = getIO && getIO();
            if (io && product && product.id_user) {
                io.emit('product-approved', {
                    target_user_id: product.id_user,
                    id_product: product.id_product,
                    id_post: product.id_post,
                    name_product: product.name_product,
                    status,
                    ts: Date.now()
                });
            }
        } catch (_) {}
        return res.status(200).json({ msg: 'อัปเดตสถานะสำเร็จ', data: product });
    } catch (err) {
        console.log('error update product status', err);
        return res.status(500).json({ msg: 'ไม่สามารถอัปเดตสถานะได้', error: err.message });
    }
}

exports.edit_prodact = async (req, res) => {
    const { id } = req.params;
    let {
        name_product,
        detail_product,
        phone,
        price,
        type
    } = req.body;

    try {
        // Get product's post to enforce per-post uniqueness
        const [[info]] = await db.promise().query("SELECT id_post FROM user_prodact WHERE id_product = ?", [id]);
        const postId = info ? info.id_post : null;
        const trimmedName = (name_product || "").replace(/\s+/g, " ").trim();
        if (!trimmedName) {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) deleteImage(req.file.path);
            return res.status(400).json({ msg: "กรุณาระบุชื่อสินค้า", error: "name_product required" });
        }
        if (postId) {
            const [dup] = await db.promise().query(
                "SELECT id_product FROM user_prodact WHERE name_product = ? AND id_post = ? AND id_product <> ?",
                [trimmedName, postId, id]
            );
            if (dup.length > 0) {
                if (req.file && req.file.path && fs.existsSync(req.file.path)) deleteImage(req.file.path);
                return res.status(400).json({ msg: "ชื่อนี้ถูกใช้ในโพสต์นี้แล้ว", error: "duplicate name_product in post" });
            }
        }
        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path;
            const [oldRows] = await db.promise().query("SELECT images FROM user_prodact WHERE id_product = ?", [id]);
            if (oldRows.length > 0 && oldRows[0].images && fs.existsSync(oldRows[0].images)) {
                deleteImage(oldRows[0].images);
            }
        }

        if (!imagePath) {
            const [oldRows] = await db.promise().query("SELECT images FROM user_prodact WHERE id_product = ?", [id]);
            imagePath = oldRows.length > 0 ? oldRows[0].images : null;
        }

        const [rows] = await db.promise().query(
            "UPDATE user_prodact SET name_product = ?, detail_product = ?, phone = ?, price = ?, images = ?, type = ? WHERE id_product = ?",
            [
                trimmedName,
                detail_product,
                phone,
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

exports.nearby_product = async (req, res) => {
    const { id } = req.params;
    try {
        
        const [[current]] = await db.promise().query("SELECT latitude, longitude FROM user_prodact WHERE id_product = ?", [id]);
        if (!current || !current.latitude || !current.longitude) {
            return res.status(404).json({ msg: "ไม่พบข้อมูลสถานที่หลัก" });
        }
        const [places] = await db.promise().query("SELECT id_product, name_product, detail_product, latitude, longitude, images FROM user_prodact WHERE id_product != ? AND latitude IS NOT NULL AND longitude IS NOT NULL", [id]);
        function toRad(Value) { return (Value * Math.PI) / 180; }
        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }
        const nearby = places.map(place => ({
            ...place,
            distance: getDistance(
                parseFloat(current.latitude),
                parseFloat(current.longitude),
                parseFloat(place.latitude),
                parseFloat(place.longitude)
            )
        })).sort((a, b) => a.distance - b.distance).slice(0, 3);
        return res.status(200).json({ data: nearby });
    } catch (err) {
        console.log("error nearby", err);
        return res.status(500).json({ msg: "ไม่สามารถดึงสถานที่ใกล้เคียงได้", error: err.message });
    }
}

exports.get_products_by_post = async (req, res) => {
    const { id_post } = req.params;
    try {
        const [rows] = await db.promise().query(`
            SELECT t1.*, t2.first_name 
            FROM user_prodact t1 
            JOIN user t2 ON t1.id_user = t2.id_user 
            WHERE t1.id_post = ? 
            ORDER BY t1.id_product DESC
        `, [id_post]);

        const formatData = rows.map((row) => ({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}` : null,
        }));

        return res.status(200).json({ msg: "ดึงข้อมูลสินค้าสำเร็จ", data: formatData });
    } catch (err) {
        console.log("error get products by post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลสินค้าได้",
            error: err.message
        });
    }
}

exports.get_random_products_by_post = async (req, res) => {
    const { id_post } = req.params;
    try {
        const [rows] = await db.promise().query(`
            SELECT t1.*, t2.first_name 
            FROM user_prodact t1 
            JOIN user t2 ON t1.id_user = t2.id_user 
            WHERE t1.id_post = ? and t1.status = 'อนุมัติ'
            ORDER BY RAND() 
            LIMIT 3
        `, [id_post]);

        const formatData = rows.map((row) => ({
            ...row,
            images: row.images ? `${req.protocol}://${req.headers.host}/${row.images}` : null,
        }));

        return res.status(200).json({ msg: "ดึงข้อมูลสินค้าแนะนำสำเร็จ", data: formatData });
    } catch (err) {
        console.log("error get random products by post", err);
        return res.status(500).json({
            msg: "ไม่สามารถดึงข้อมูลสินค้าแนะนำได้",
            error: err.message
        });
    }
}
