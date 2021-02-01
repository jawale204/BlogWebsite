const express=require('express')
const router=express.Router()
const { body, validationResult } = require('express-validator');
const User=require('../../models/User')
const gavatar=require('gravatar')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const config=require('config')
//@desc Test route
//@route Register Users
//@access public 

router.post('/',[
    body('name').not().isEmpty(),
    body('password').isLength({min:6 }),
    body('email').isEmail()
],async (req,res)=>{

    console.log(req.body)
    //check parameter with constrains
    const errors=validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    const{ name,email,password}=req.body;
    try{
        //checks if user already exists
        let user=await User.findOne({email});
        if(user){
            return res.status(400).json({errors:[{"msg":"User already exists"}]})
        }
        //fetches avatar
        const avatar =gavatar.url(email,{
            s:'200',
            r:"mm",
            r:"pg"
        })
        //create instance 
        user= new User({
            name,
            email,
            password,
            avatar
        })

       const salt =await bcrypt.genSalt(10)
       user.password=await bcrypt.hash(password,salt)
       //saves to the  mongodb
       await user.save()
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