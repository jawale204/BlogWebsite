const express=require('express')
const router=express.Router()
const auth=require('../../middleware/auth')
const User=require('../../models/User')
const Profile=require('../../models/Profile')
const {body,validationResult}=require("express-validator");
const config=require('config')
const request=require('request')
//@desc get user profile
//@route api/profile/me
//@access private 

router.get('/',auth,async (req,res)=>{
    try{
    const profile=await Profile.findOne({user:req.user.id}).populate('user',['name','avatar'])
        if(!profile){
            return res.status(401).json({msg :"Profile doesnot exist"})
        }
        res.json(profile)
    }catch(err){
        console.log(err.message)
        res.status(500).send("server failed")
    }
})
//@desc create or update user profile
//@route api/profile/me
//@access private 
router.post('/',[auth,
        body('status',"status is required").not().isEmpty(),
        body('skills',"skills are required").not().isEmpty()],
        async(req,res)=>{
            const errors=validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()})
            }
            const {
                company,
                website,
                location, 
                bio,
                status,
                githubusername,
                skills,
                youtube,
                twitter,
                facebook,
                linkedin,
                instagram,
            }=req.body;

            //build profile object
            const profileFields={};
            profileFields.user=req.user.id;
            if (company) profileFields.company=company;
            if (website) profileFields.website=website;
            if (location) profileFields.location=location;
            if (bio) profileFields.bio=bio;
            if (status) profileFields.status=status;
            if (githubusername) profileFields.githubusername=githubusername;
            if (skills) {
                profileFields.skills=skills.split(",").map(skill=>skill.trim())
            }

            // build profile social object
            profileFields.social={}

            if(youtube) profileFields.social.youtube=youtube
            if(twitter) profileFields.social.twitter=twitter
            if(facebook) profileFields.social.facebook=facebook
            if(linkedin) profileFields.social.linkedin=linkedin
            if(instagram) profileFields.social.instagram=instagram
            
            try{
                let profile = await Profile.findOne({user:req.user.id});
                if(profile){
                     Profile.findOneAndUpdate({user:req.user.id},{$set:profileFields}, {useFindAndModify: false,new:true},function( error, result){
                        return res.json(result)
                    });
                    
                }
                else{
                    profile=new Profile(profileFields);
                    await profile.save();
                    return res.json(profile); 
                }
            }catch(err){
                console.log(err)
                res.status(500).send("server error")
            }

})

//@desc get user profile
//@route api/profile/user/:user_id
//@access public 
router.get('/user/:user_id',async(req,res)=>{
    try{
        let profile=await Profile.findOne({user:req.params.user_id}).populate("user",["name","avatar"]);
        if(!profile) return  res.status(400).json({msg:"profile does not exist"})
        res.json(profile)
    }catch(err)
    {
        if(err.kind="ObjectId"){
            console.log(err)
           return res.status(400).json({msg:"profile does not exist"})
        }
        console.log(err)
        return res.status(500).send("server error")
    }
})

//@desc delete user and  user profile
//@route api/profile/delete/:user_id
//@access private 
router.delete('/delete/:user_id',auth,async(req,res)=>{
    try{
        await Profile.findOneAndRemove({user:req.params.user_id},{useFindAndModify:false});
        console.log(req.params.user_id)
        await User.findByIdAndRemove(req.params.user_id,{useFindAndModify:false});
        res.send("user deleted")
    }catch(err)
    {
        if(err.kind="ObjectId"){
           console.log(err)
           return res.status(400).json({msg:"profile does not exist"})
        }
        console.log(err)
        return res.status(500).send("server error")
    }
})

//@desc adding user experience
//@route api/profile/experience
//@access private 

router.put('/experience',[auth,
body('title','title is required').not().isEmpty(),
body('company','company is required').not().isEmpty(),
body('from','from is required').not().isEmpty(),
],async (req,res)=>{

    const error= validationResult(req);
    if(!error.isEmpty()){
        console.log(error);
        return res.status(400).json({errors:error.array()})
    } 
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp={
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try{

        const profile= await Profile.findOne({user:req.user.id});
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile)

    }catch(err){
        console.log(err);
        return res.status(500).send("server error");
    }
})

//@desc delete user experience
//@route api/profile/experience/:exp_id
//@access private 
router.delete('/experience/:exp_id',auth,async (req,res)=>{
    try{
        const profile=await Profile.findOne({user:req.user.id});
        //getindex of experience
        const removeIndex= profile.experience.map(item=>item.id).indexOf(req.params.exp_id);
        console.log(req.params.exp_id);
        profile.experience.splice(removeIndex,1);
        await profile.save()
        return res.json(profile);
    }catch(err){
        console.log(err);
        return res.status(500).send("server error");
    }
})

//@desc adding user education
//@route api/profile/education
//@access private 

router.put('/education',[auth,
    body('school','school is required').not().isEmpty(),
    body('degree','degree is required').not().isEmpty(),
    body('from','from is required').not().isEmpty(),
    body('fieldofstudy','fieldofstudy is required').not().isEmpty(),
    ],async (req,res)=>{
    
        const error= validationResult(req);
        if(!error.isEmpty()){
            console.log(error);
            return res.status(400).json({errors:error.array()})
        } 
        const {
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        } = req.body;
    
        const newEdu={
            school,
            degree,
            fieldofstudy,
            from,
            to,
            current,
            description
        }
    
        try{
    
            const profile= await Profile.findOne({user:req.user.id});
            profile.education.unshift(newEdu);
            await profile.save();
            res.json(profile)
    
        }catch(err){
            console.log(err);
            return res.status(500).send("server error");
        }
    })
    
    //@desc delete user education
    //@route api/profile/education/:edu_id
    //@access private 
    router.delete('/education/:edu_id',auth,async (req,res)=>{
        try{
            const profile=await Profile.findOne({user:req.user.id});
            //getindex of experience
            const removeIndex= profile.education.map(item=>item.id).indexOf(req.params.exp_id);
            profile.education.splice(removeIndex,1);
            await profile.save()
            return res.json(profile);
        }catch(err){
            console.log(err);
            return res.status(500).send("server error");
        }
    })


//@desc get user github repos
//@route api/profile/github/:username
//@access public 
router.get('/github/:username',(req,res)=>{
    try{
   const options={
    uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sorted=created:asc&client_id=${config.get('githubclientid')}&client_secret=${config.get('githubsecret')}}`,
    method:"GET",
    headers:{"user-agent":"node.js"}
   }
   request(options,(error,response,body)=>{
       if (error){
        console.log(error)
        return  res.status(400).json({msg:"no user found"})
       } 
       if(response.statusCode!==200){
        return  res.status(404).json({msg:"no user found"})
       }
       return res.json(JSON.parse(body))
   })
    }catch(err){
        console.log(err);
        return res.status(500).send("server error");
    }

    
})
module.exports=router