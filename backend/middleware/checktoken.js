const jwt = require("jsonwebtoken");

const authtoken =(req,res,next) =>{
    
    const authHearder = req.headers["authorization"];
        const token = authHearder?.split(" ")[1];

        if(!token){
            return res.status(401).json({
                msg: "Un authorization"
            })
        }

        jwt.verify(token,"asdasdweqwellitd", (err , payload ) => {
            if(err){
                return res.status(403).json({msg: "tokenไม่ถูกหรือหมดอายุ"})
            }
            req.user=payload;
            next();
        });
}
module.exports = authtoken;