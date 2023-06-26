const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');


app.use(express.static(__dirname + "/public"));

app.get("/", (req, res)=>{
    res.render("pages/login");
});

app.get("/register", (req, res)=>{
    res.render("pages/register");
});

app.post("/", (req, res)=>{
    //handle log in attempt
    
});

app.post("/register", (req, res)=>{
    //handle registration
    
});


app.listen(3000, (req, res)=>{
    console.log("server listening on port 3000");
});