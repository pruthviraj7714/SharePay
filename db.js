const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URL =  process.env.MONGO_URL; 
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });


const userSchame = new mongoose.Schema({
    username: {
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minLength:3,
        maxLength:30
    },
    password: {
        type:String,
        required:true,
        minlength:6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});

const accountSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    }, 
    balance : {
        type : Number,
        required : true
    }
})



const User = mongoose.model('User', userSchame);
const Account = mongoose.model('Account', accountSchema);


module.exports = {
    User,
    Account
}