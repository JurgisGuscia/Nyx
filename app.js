require('dotenv').config()
var sslRedirect = require('heroku-ssl-redirect').default;
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const Mailjet = require("node-mailjet");
const saltRounds = 10;

const app = express();
app.use(sslRedirect());
app.use(express.static(__dirname + "/public"));
app.use(express.json());

app.use(bodyParser.urlencoded({
    extended: false
}));

app.set('view engine', 'ejs');

app.use(session({
    secret: "this is my first session secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI);

const mailjet = new Mailjet({
    apiKey: process.env.MJ_APIKEY_PUBLIC,
    apiSecret: process.env.MJ_APIKEY_PRIVATE
});

const userSchema = new mongoose.Schema ({
    username: {
        type: String,
        index: true
    },
    password: String,
    name: String,
    lastName: String,
    store: String,
    storePosition: String,
    webAcces: String,
    verifiedEmail: Boolean,
    verifiedAccount: Boolean
});

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
                storePosition: "99",
                webAcces: "99",
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

function checkVerifiedUser(req, res, next){
    if(req.user.verifiedAccount === true){
        return next();
    }else{
        res.redirect("/unverifiedUser");
    }
    
}

function checkNotVerifiedUser(req, res, next){
    if(req.user.verifiedAccount === false){
        return next();
    }else{
        res.redirect("/home");
    }
    
}


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

function checkAdmin(req, res, next){
    if(req.user.webAcces == "1"){
        return next();
    }else{
        res.redirect("/home");
    }
    
}



app.get("/home", checkAuthenticated, checkVerifiedUser, async (req, res)=>{
    var stats = {
        new: Number,
        export: Number,
        return: Number,
        completed: Number
    };
    stats.new = await Item.find({resolved: false || null}).exec();
    stats.export = await Item.find({resolve: "export", finished: false || null}).exec();
    stats.return = await Item.find({resolve: "return", finished: false || null}).exec();
    stats.completed = await Item.find({finished: true}).exec();
    res.render("pages/home", {user: req.user, stats: stats});
});

app.get("/", checkNotAuthenticated, (req, res)=>{
    res.render("pages/login");
});

app.get("/login", checkNotAuthenticated, (req, res)=>{
    res.render("pages/login");
});

app.get("/re-login", (req, res)=>{
    req.logOut((err)=>{
        res.redirect("/");
    });
});

app.get("/register", checkNotAuthenticated, (req, res)=>{
    res.render("pages/register");
});

app.get("/merchCards", checkAuthenticated, (req, res)=>{
    res.render("pages/cards", {user: req.user});
});


app.get("/unverifiedUser", checkNotVerifiedUser, (req,res)=>{
    res.render("pages/unverifiedUser");
});

app.get("/activeReturns", checkAuthenticated, checkVerifiedUser, async function(req, res){
    const itemList = await Item.find({resolved: false || null}).exec();
    res.render("pages/activeReturns", {items: itemList, user: req.user});
});

app.get("/awaitingExport", checkAuthenticated, checkVerifiedUser, async function(req, res){
    const itemList = await Item.find({resolved: true, resolve: "export", finished : false || null}).exec();
    res.render("pages/awaitingExport", {items: itemList, user: req.user});
});

app.get("/awaitingReturn", checkAuthenticated, checkVerifiedUser, async function(req, res){
    const itemList = await Item.find({resolved: true, resolve: "return", finished : false || null}).exec();
    res.render("pages/awaitingReturn", {items: itemList, user: req.user});
});

app.get("/completedReturns", checkAuthenticated, checkVerifiedUser, async function(req, res){
    const itemList = await Item.find({finished: true}).exec();
    res.render("pages/completedReturns", {items: itemList, user: req.user});
});





app.post("/sendItemListEmail", (req, res)=>{
    const items = req.body;
    var echoString;
    echoString = "<table>";
    var addCode = items[0].requiresCode;
    var addName = items[0].requiresName;
    var addAmmount = items[0].requiresAmmount;
    var counter = 0;
    items.forEach((e)=>{
        counter++;
        if(counter == 1){
            //skip first array item, it contains list settings
        }else{
            echoString = echoString + "<tr>";
            if(addCode){
                echoString = echoString + "<td style='width:100px'>" + e.code + "</td>";
            }
            if(addName){
                echoString = echoString + "<td>" + e.name + "</td>";
            }
            if(addAmmount){
                echoString = echoString + "<td>" + e.ammount + "</td>";
            }
            echoString = echoString + "</tr>";
        }
    });
    echoString = echoString + "</table>";
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: "NyxPlatform@mail.com",
                Name: "NyxPlatform"
              },
              To: [
                {
                  Email: req.user.username,
                }
              ],
              Subject: "Prekių sąrašas",
              htmlPart: echoString,
            }
          ]
        })

request
    .then((result) => {
        res.redirect("/activeReturns")
    })
    .catch((err) => {
        res.redirect("/activeReturns")
    })
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

app.get("/editItem/:id", checkAuthenticated, checkVerifiedUser, async (req,res)=>{
    const item = await Item.find({_id: req.params.id}).exec();
    res.render("pages/editItem", {item: item[0], user: req.user});
});

app.get("/users", checkAuthenticated, checkAdmin, async (req,res)=>{
    const userList = await User.find().exec();
    res.render("pages/userList", {users: userList, user: req.user});
});

app.get("/editUser/:id", checkAuthenticated, checkVerifiedUser, async(req,res)=>{
    const userToEdit = await User.find({_id: req.params.id}).exec();
    res.render("pages/editUser", {userToEdit: userToEdit[0], user: req.user});
});

app.post("/editUser/:id", checkAuthenticated, async(req,res)=>{
    var verifyTheAccount = false;
    var verifyTheEmail = false;
    if(req.body.accountVerified){
        verifyTheAccount = true;
    }
    if(req.body.emailVerified){
        verifyTheEmail = true;
    }
    await User.updateOne({_id: req.params.id}, {
        username: req.body.username,
        name: req.body.name,
        lastName: req.body.lastName,
        store: req.body.store,
        storePosition: req.body.storePosition,
        webAcces: req.body.webAcces,
        verifiedAccount: verifyTheAccount,
        verifiedEmail: verifyTheEmail
    });
    res.redirect("/users");
});

app.post("/editItem/:id", checkAuthenticated, async(req, res)=>{
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

app.listen(process.env.PORT, (req, res)=>{
    console.log("server started");
});





