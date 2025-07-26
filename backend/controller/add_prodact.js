const db = require("../config/db");

exports.get_prodact = async (req , res )=>{
    res.json({
        mag: "api แสดงสินค้า"
    })
}

exports.add_prodact = async (req , res )=>{
    res.json({
        mag: "api เพิ่มสินค้า"
    })
}

exports.edit_prodact = async (req , res )=>{
    res.json({
        mag: "api แก้ไขสินค้า"
    })
}

exports.delete_prodact = async (req , res )=>{
    res.json({
        mag: "api ลบสินค้า"
    })
}