const db = require('../config/db');


exports.get_post = async (req ,res ) => {
res.json({
    msg: "api แสดงโพสต์"
})
}


exports.add_post = async (req, res) => {
try{
    console.log("req.body", req.body);
        const {
            id_user,
            name_location,
            detail_location,
            phone,
            detail_att,
            images,
            latitude,
            longitude,
            date
        } = req.body;

       const [rows] = await db.promise().query("INSERT INTO user_post (id_user, name_location, detail_location, phone, detail_att, images, latitude, longitude, date) VALUES (?,?,?,?,?,?,?,?,?)",[
            id_user,
            name_location,
            detail_location,
            phone,
            detail_att,
            images,
            latitude,
            longitude,
            date
       ])

       if(rows.affectedRows === 0){
            return res.status(400).json({
                msg : "ไม่สามารถโพสต์ได้",
                error : "ไม่สามารถโพสต์ได้"
            })
        }

        return res.status(201).json({
            msg : "โพสต์สำเร็จ"
        })

    }catch(err){
        console.log("error user_post", err);
        return res.status(500).json({
            msg : "ไม่สามารถโพสต์ได้",
            error : err.message
        })
    }
}


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