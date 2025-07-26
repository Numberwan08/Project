const db = require("../config/db");

exports.get_event = async (req , res )=> {
    res.json({
        mag: "api แสดงกิจกรรม"
    })
}

exports.add_event = async (req , res )=> {
    res.json({
        mag: "api เพิ่มกิจกรรม"
    })
}

exports.edit_event = async (req , res )=> {
    res.json({
        mag: "api แก้ไขกิจกรรม"
    })
}

exports.delete_event = async (req , res )=> {
    res.json({
        mag: "api ลบกิจกรรม"
    })
}