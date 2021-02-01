const express=require('express')
const app=express();
const ConnectDB=require('./config/db')
const PORT=process.env.PORT || 5000;

ConnectDB()


app.use(express.json());
app.get("/",(req,res)=>{
    res.send("API connected")
})

app.use('/api/users',require('./routes/api/users'))
app.use('/api/auth',require('./routes/api/auth'))
app.use('/api/posts',require('./routes/api/posts'))
app.use('/api/profile',require('./routes/api/profile'))

app.listen(PORT,()=>{
    console.log(`listening to port ${PORT}`)
});

