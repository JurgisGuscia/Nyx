require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({
    extended: false
}));

app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/nyxDB");

const userSchema = new mongoose.Schema ({
    username: {
        type: String,
        index: true
    },
    password: String,
    name: String,
    lastName: String,
    store: String,
    storePosition: Number,
    webAcces: Number,
    verifiedEmail: Boolean,
    verifiedAccount: Boolean
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.serializeUser((user, done)=>{
    done(null, user);
});
  
passport.deserializeUser((user, done)=>{
    done(null, user);
});

passport.use(new LocalStrategy(async function(username, password, done){
    console.log("is called");
    const user = await User.findOne( {username: username}).exec();
    if(user == null){
        console.log("no user with that email found");
        return done(null, false); // no user with that email found
    }

    try{
        if(await bcrypt.compare(password, user.password)){
            console.log("user found and password matches");
            return done(null, true); // user found and password matches
        }else{
            console.log("user founs, but password doesn't match");
            return done(null, false); // user founs, but password doesn't match
        }
    }catch (e){
        return done(e);
    }
}));

app.post("/register", async function(req, res){
    //handle registration
    const registeringUser = {
        username: req.body.username,
        password: req.body.password
    }
    if(await User.findOne({ username: registeringUser.username}).exec()){
        //user email already exists
        res.redirect("/register");
    }else{
        //register user
        const hashedPassword = bcrypt.hash(registeringUser.password, saltRounds, (err, hash)=>{
            User.create({
                username: registeringUser.username,
                password: hash,
                name: req.body.name,
                lastName: req.body.lastName,
                store: req.body.store,
                storePosition: 0,
                webAcces: 0,
                verifiedEmail: false,
                verifiedAccount: false
            });
        });
        res.redirect("/home");
    }
});

app.post("/", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/"
}));

app.get("/logout", (req, res)=>{
    req.logOut((err)=>{
        res.redirect("/");
    });
    
});



function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect("/");
    }
    
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        res.redirect("/home");
    }else{
        return next();
    }
    
}



app.get("/", checkNotAuthenticated, (req, res)=>{
    res.render("pages/login");
});

app.get("/register", checkNotAuthenticated, (req, res)=>{
    res.render("pages/register");
});

app.get("/home", checkAuthenticated, function(req, res){
    res.render("pages/home");
});

app.listen(3000, (req, res)=>{
    console.log("server listening on port 3000");
});





