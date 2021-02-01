const express=require('express')
const router=express.Router()
const auth=require('../../middleware/auth')
const User=require('../../models/User')
const { body, validationResult } = require('express-validator');
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const config=require('config')
//@desc Test route
//@route api/Auth
//@access public 

router.get('/',auth,async(req,res)=>{
    try{
        const user= await User.findById(req.user.id).select("-password")
        if(user){
                res.json({user})
        }
    }catch(err){
        console.log(err.message)
        res.status(500).send("server failed")
    }
    
})

//@route api/auth
//@desc Authenticate user and get token
//@access public
router.post('/',[
    body('password',"Password required").exists(),
    body('email',"Email required").isEmail()
],async (req,res)=>{
    console.log("yo")
    console.log(req.body)
    //check parameter with constrains
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const{email,password}=req.body;
    try{
        //checks if user already exists
        let user=await User.findOne({email});
        if(!user){
            return res.status(400).json({errors:[{"msg":"Invalid credentials"}]})
        }
       const isMatch= await bcrypt.compare(password,user.password)
       if(!isMatch){
        return res.status(400).json({errors:[{"msg":"Invalid credentials"}]})
       }
       const payload={
           user:{
               id:user.id
           }
       }
       //create token with payload 
       jwt.sign(payload,config.get('secret'),{expiresIn: 360000},(err,token)=>{
           if (err) throw err
            else res.json({token})
           
       })
      
    }catch(err){
        console.log(err.message)
        res.status(500).send("Server error")
    }   
})

module.exports=router