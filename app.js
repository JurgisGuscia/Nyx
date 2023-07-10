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
//store positions:
//0 - Administracija
//1 - Kasos
//2 - Skyrius
//3 - PPG


 const itemSchema = new mongoose.Schema ({
    addDate: {  //date item was return on, set as index
        type: String,
        index: true
    },
    code: String, //item code
    name: String, //item name
    ammount: Number, //ammount of items returned
    authorUser: String, //who created the entry
    boughtIn: String, //store that item was bought in
    authorComment: String, //comment of the user who returned the item
    resolveDate: String, //when entry was solved 
    resolvedBy: String, //user that resolved the entry
    resolve: String, //resolve - export or sell localy
    resolved: Boolean, //weather item is resolved or not 
    resolverComment: String, //comment of the user who resolved the item
    finished: Boolean, //if it is exported
    finishedBy: String, //who exported the item
    finishDate: String, //date of item export
    finisherComment: String //comment of the user who exported item
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
const Item = new mongoose.model("Item", itemSchema);

passport.serializeUser((user, done)=>{
    done(null, user);
});
  
passport.deserializeUser((user, done)=>{
    done(null, user);
});

passport.use(new LocalStrategy(async function(username, password, done){
    const user = await User.findOne( {username: username}).exec();
    if(user == null){
        return done(null, false); // no user with that email found
    }
    try{
        if(await bcrypt.compare(password, user.password)){
            return done(null, user); // user found and password matches
        }else{
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
                storePosition: "4",
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


app.get("/home", checkAuthenticated, (req, res)=>{
    res.render("pages/home", {user: req.user});
});

app.get("/", checkNotAuthenticated, (req, res)=>{
    res.render("pages/login");
});

app.get("/register", checkNotAuthenticated, (req, res)=>{
    res.render("pages/register");
});


// still need to edit item list filtration
app.get("/activeReturns", checkAuthenticated, async function(req, res){
    const itemList = await Item.find({resolved: false || null}).exec();
    res.render("pages/activeReturns", {items: itemList, user: req.user});
});

app.get("/awaitingExport", checkAuthenticated, async function(req, res){
    const itemList = await Item.find({resolved: true, resolve: "export", finished : false || null}).exec();
    res.render("pages/awaitingExport", {items: itemList, user: req.user});
});

app.get("/awaitingReturn", checkAuthenticated, async function(req, res){
    const itemList = await Item.find({resolved: true, resolve: "return", finished : false || null}).exec();
    res.render("pages/awaitingReturn", {items: itemList, user: req.user});
});

app.get("/completedReturns", checkAuthenticated, async function(req, res){
    const itemList = await Item.find({finished: true}).exec();
    res.render("pages/completedReturns", {items: itemList, user: req.user});
});


app.post("/activeReturns", (req, res)=>{
    var dateObj = new Date();
    var dateYear = dateObj.getFullYear();
    var dateMonth = dateObj.getMonth() + 1;
    if(dateMonth < 10){
        dateMonth = "0" + dateMonth;
    }
    var dateDay = dateObj.getDate();
    if(dateDay < 10){
        dateDay = "0" + dateDay;
    }
    var dateString = dateYear + "-" + dateMonth + "-" + dateDay;
    if(req.body.authorComment.length > 0){
        var authorCommentString = req.body.authorComment;
    }else{
        var authorCommentString = "Komentaro nėra.";
    }
    var authorString = req.user.name + " " + req.user.lastName;
    Item.create({
        addDate: dateString,
        code: req.body.itemCode,
        name: req.body.itemName,
        ammount: req.body.itemCount,
        authorUser: authorString,
        boughtIn: req.body.boughtIn,
        authorComment: authorCommentString
    });
    res.redirect("/activeReturns");
});

app.get("/editItem/:id", async (req,res)=>{
    const item = await Item.find({_id: req.params.id}).exec();
    res.render("pages/editItem", {item: item[0], user: req.user});
});

app.post("/editItem/:id", async(req, res)=>{
    var dateObj2  = new Date();
    var dateYear2 = dateObj2.getFullYear();
    var dateMonth2 = dateObj2.getMonth() + 1;
    if(dateMonth2 < 10){
        dateMonth2 = "0" + dateMonth2;
    }
    var dateDay2 = dateObj2.getDate();
    if(dateDay2 < 10){
        dateDay2 = "0" + dateDay2;
    }
    var dateString2 = dateYear2 + "-" + dateMonth2 + "-" + dateDay2;

    if(req.body.resolve == "0"){
        const res = await Item.updateOne({ _id: req.params.id }, { 
            code: req.body.code,
            name: req.body.name,
            ammount: req.body.ammount,
            boughtIn: req.body.boughtIn,
            authorComment: req.body.authorComment
        });    
    }else if(!req.body.finish){
        var rComment = req.body.resolverComment;
        if(rComment.length > 0){
            const res = await Item.updateOne({ _id: req.params.id }, { 
                code: req.body.code,
                name: req.body.name,
                ammount: req.body.ammount,
                boughtIn: req.body.boughtIn,
                authorComment: req.body.authorComment,
                resolved: true,
                resolve: req.body.resolve,
                resolveDate: dateString2,
                resolvedBy: req.user.name + " " + req.user.lastName,
                resolverComment: req.body.resolverComment
            });   
        }else{
            const res = await Item.updateOne({ _id: req.params.id }, { 
                code: req.body.code,
                name: req.body.name,
                ammount: req.body.ammount,
                boughtIn: req.body.boughtIn,
                authorComment: req.body.authorComment,
                resolved: true,
                resolve: req.body.resolve,
                resolveDate: dateString2,
                resolvedBy: req.user.name + " " + req.user.lastName,
                resolverComment: "Komentaro nėra."
            });   
        }
        
    }else{
        var dateObj = new Date();
        var dateYear = dateObj.getFullYear();
        var dateMonth = dateObj.getMonth() + 1;
        if(dateMonth < 10){
            dateMonth = "0" + dateMonth;
        }
        var dateDay = dateObj.getDate();
        if(dateDay < 10){
            dateDay = "0" + dateDay;
        }
        var dateString3 = dateYear + "-" + dateMonth + "-" + dateDay;
        if(req.body.finisherComment.length > 0){
            var finishComment = req.body.finisherComment;
        }else{
            var finishComment = "Komentaro Nėra."
        }
        const res = await Item.updateOne({ _id: req.params.id }, { 
            finished: true,
            finishedBy: req.user.name + " " + req.user.lastName,
            finishDate: dateString3,
            finisherComment: finishComment            
        });               
    }
    res.redirect("/activeReturns");
});

app.listen(3000, (req, res)=>{
    console.log("server listening on port 3000");
});





