const express=require('express')
const router=express.Router()
const auth=require('../../middleware/auth')
const {body,validationResult}=require('express-validator')
const User=require('../../models/User')
const Post=require('../../models/Post')
const Profile=require('../../models/Profile')
const { compareSync } = require('bcryptjs')

//@desc adds a post
//@route api/posts
//@access private 

router.post('/',[auth,
body('text',"test is required").not().isEmpty()
],async (req,res)=>{
    const error=validationResult(req)
    if(!error.isEmpty()){
        console.log(error);
        return res.status(400).json({errors:error.array()})
    }
    try{
        const user=await User.findById(req.user.id).select("-password");
        const newPost=new Post({
            text : req.body.text,
            avatar:user.avatar,
            user:req.user.id,
            name:user.name
        })

        const post=await newPost.save()
        return res.json(post)
    }catch(err){
        console.log(err);
        return res.status(500).send('server error')
    }
})

//@desc gets all the posts
//@route get api/post
//@acces private
router.get('/',auth,async(req,res)=>{
    try{
        const posts=await Post.find().sort({date:-1})
        if(!posts){
            return res.status(404).json({msg:"no posts found"})
        } 
        return res.json(posts)
    }catch(err){
     console.log(err);
    res .status(500).send('server error')
    }
})

//@desc gets a posts with id
//@route get api/post/:post_id
//@acces private
router.get('/:post_id',auth,async(req,res)=>{
    try{
        const post=await Post.findById(req.params.post_id);
        if(!post){
            return res.status(404).json({msg:"Post not found"})
        } 
        return res.json(post)
    }catch(err){
    if(err.kind=="ObjectId"){
        return res.status(404).json({msg:"Post not found"})
    }
     console.log(err);
    res .status(500).send('server error')
    }
})

//@desc delets a posts with id
//@route delete api/post/:post_id
//@acces private
router.delete('/:post_id',auth,async(req,res)=>{
    try{
        const post=await Post.findById(req.params.post_id);
        console.log(post);
        if(post.user.toString()!== req.user.id){
            return res.status(401).json({msg:"user not authorized"})
        } 
        await post.remove()
        return res.send("post deleted")
    }catch(err){
    if(err.kind=="ObjectId"){
        return res.status(404).json({msg:"Post not found"})
    }
     console.log(err);
    res .status(500).send('server error')
    }
})

//@desc  likes a post
//@route put api/post/like/:post_id
//@acces private
router.put('/like/:post_id',auth,async(req,res)=>{
    try{
        const post=await Post.findById(req.params.post_id);
        console.log(post);
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length>0){
            return res.status(400).json({msg:"post already liked"})
        }
         post.likes.unshift({user:req.user.id})
         await post.save()
         return res.json(post.likes)
    }catch(err){
    if(err.kind=="ObjectId"){
        return res.status(404).json({msg:"Post not found"})
    }
     console.log(err);
    res .status(500).send('server error')
    }
})
//@desc  unlikes a post
//@route put api/post/unlike/:post_id
//@acces private
router.put('/unlike/:post_id',auth,async(req,res)=>{
    try{
        const post=await Post.findById(req.params.post_id);
        console.log(post);
        if(post.likes.filter(like=>like.user.toString()===req.user.id).length===0){
            return res.status(400).json({msg:"post not liked"})
        }
         const removeIndex=post.likes.map(like=>like.user.toString()).indexOf(req.user.id)
         console.log(removeIndex)
         post.likes.splice(removeIndex,1)
         await post.save()
         return res.json(post.likes)
    }catch(err){
    if(err.kind=="ObjectId"){
        return res.status(404).json({msg:"Post not found"})
    }
     console.log(err);
    res .status(500).send('server error')
    }
})

//@desc  adds a comment to a post
//@route post api/post/comment/:post_id
//@acces private

router.post("/comment/:post_id",[auth,
body('text',"text is required").not().isEmpty()
],async(req,res)=>{
    const error=validationResult(req);
    if(!error.isEmpty()){
        console.log(error);
        return res.status(400).json({errors:error.array()})
    }
    try{
        const post=await Post.findById(req.params.post_id);
        if(!post){
            console.log(post)
            return res.status(404).json({msg:"Post not found"})
        }
        const user=await User.findById(req.user.id);
        post.comments.unshift({
            text:req.body.text,
            user:req.user.id,
            avatar:user.avatar,
        }   )
        await post.save()
        return res.json(post.comments)
    }catch(err){
            if(err.kind==="ObjectId"){
                console.log(err)
                return res.statsus(404).json({msg:"Post not found"})
            }
            console.log(err)
            return res.statsus(500).send("server error")
    }
   
})

//@desc  gets all comment for a post
//@route put api/post/comment/:post_id
//@acces private
router.get("/comment/:post_id",auth,async(req,res)=>{
        try{
            const post=await Post.findById(req.params.post_id);
            if(!post){
                console.log(post)
                return res.status(404).json({msg:"Post not found"})
            }
            return res.json(post.comments)
        }catch(err){
                if(err.kind==="ObjectId"){
                    console.log(err)
                    return res.statsus(404).json({msg:"Post not found"})
                }
                console.log(err)
                return res.statsus(500).send("server error")
        }
       
})
//@desc  deletes a comment on a post
//@route delete api/post/comment/:post_id
//@acces private
router.delete("/comment/:post_id/:comment_id",auth,async(req,res)=>{
    try{
        const post=await Post.findById(req.params.post_id);
        if(!post){
            console.log(post)
            return res.status(404).json({msg:"Post not found"})
        }
        if(post.comments.filter(comment=>comment.user.toString()===req.user.id).length===0){
            return res.status(400).json({msg:"User not Authorized"})
        }
        const removeIndex=post.comments.map(item=>item.user).indexOf(req.user.id)
        post.comments.splice(removeIndex,1)
        await post.save()
        console.log(removeIndex)
        return res.json(post.comments)
    }catch(err){
            if(err.kind==="ObjectId"){
                console.log(err)
                return res.statsus(404).json({msg:"Post not found"})
            }
            console.log(err)
            return res.statsus(500).send("server error")
    }
   
})
module.exports=router