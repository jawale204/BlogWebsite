const mongoose=require('mongoose')
const config= require('config')
const db=config.get('mongoURI')
const ConnectDB = async () =>{
  try{
      await mongoose.connect(db,{useNewUrlParser:true,useUnifiedTopology:true,useCreateIndex: true})
      console.log('MongoDb connected..')
  }catch(err){
      console.log(err.message)
  }
}

module.exports=ConnectDB