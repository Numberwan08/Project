const db = require('../config/db');
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

exports.get_post = async (req ,res ) => {
    try{
        const [rows] = await db.promise().query("SELECT * FROM user_post");

        if(rows.length === 0){
            return res.status(4004).json({ mag: "ไม่พบโพสต์"});
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
            error: err.message
        });
    }
}

exports.get_post_me = async (req ,res ) => {
    const {id} =req.params;
    try{
        const [rows] = await db.promise().query("SELECT * FROM user_post WHERE id_user = ?",[id]);

        if(rows.length === 0){
            return res.status(404).json({ mag: "ไม่พบโพสต์"});
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
            error: err.message
        });
    }
}


exports.add_post = async (req, res) => {
  const {
    id_user,
    name_location,
    detail_location,
    phone,
    detail_att,
    latitude,
    longitude,
    type
  } = req.body;

  const image = req.file;

  try {
    const [rows] = await db
      .promise()
      .query(
        "INSERT INTO user_post (id_user, name_location, detail_location, phone, detail_att, images, latitude, longitude ,type) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          id_user,
          name_location,
          detail_location,
          phone,
          detail_att,
          image.path,
          latitude,
          longitude,
          type
        ]
      );

    if (rows.affectedRows === 0) {
      deleteImage(image.path);
      return res.status(400).json({
        msg: "ไม่สามารถโพสต์ได้",
        error: "ไม่สามารถโพสต์ได้",
      });
    }

    return res.status(201).json({ msg: "add post siucess" });
  } catch (err) {
    deleteImage(image.path);
    console.log("error user_post", err);
    return res.status(500).json({
      msg: "ไม่สามารถโพสต์ได้",
      error: err.message,
    });
  }
};



exports.edit_post = async (req, res) => {

    const { id } = req.params;
    const {
        name_location,
        detail_location,
        phone,
        detail_att,
        images,
        latitude,
        longitude
    } = req.body;
    try {
        const [rows] = await db.promise().query("UPDATE user_post SET name_location = ?, detail_location = ?, phone = ?, detail_att = ?, images = ?, latitude = ?, longitude = ? WHERE id_post = ?", [
            name_location,
            detail_location,
            phone,
            detail_att,
            images,
            latitude,
            longitude,
            id
        ]);

        if (rows.affectedRows === 0) {
            return res.status(404).json({
                msg: "โพสต์ไม่พบ",
                error: "โพสต์ไม่พบ"
            });
        }

        return res.status(200).json({
            msg: "แก้ไขโพสต์สำเร็จ"
        });

    } catch (err) {
        console.log("error edit user_post", err);
        return res.status(500).json({
            msg: "ไม่สามารถแก้ไขโพสต์ได้",
            error: err.message
        });
    }

}

exports.delete_post = async (req, res) => {
    try{
        const { id } = req.params;

        const [rows] = await db.promise().query("SELECT * FROM user_post WHERE id_post = ?", [id]);
       
        if(rows.length === 0){
            return res.status(404).json({
                msg: "โพสต์ไม่พบ",
                error: "โพสต์ไม่พบ"
            });
        }

        const [result] = await db.promise().query("DELETE FROM user_post WHERE id_post = ?", [id]);
        if(result.affectedRows === 0){
            return res.status(400).json({
                msg: "ไม่สามารถลบโพสต์ได้",
                error: "ไม่สามารถลบโพสต์ได้"
            });
        }
        return res.status(200).json({
            msg: "ลบโพสต์สำเร็จ"
        });

    } catch(err){
        console.log("error delete user_post", err);
        return res.status(500).json({
            msg: "ไม่สามารถลบโพสต์ได้",
            error: err.message
        });
    }   
    
}