if (process.env.NODE_ENV !== 'production') {
    const donetev = require('dotenv').config()
}

const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const mysql = require('mysql');


const initalizePassport = require('./passport-config')
initalizePassport(passport,
    username => {
        return users.find(user => user.username === username)
    },
    id => {
        return user.find(user => user.id === id)
    }
);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
  });
  
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

const users = []

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.set('view-engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.render('index.ejs')
});

app.get('/login', (req, res) => {
    res.render('login.ejs')
});

app.get('/newAccount', (req, res) => {
    res.render('newAccount.ejs')
});

app.post('/newAccount', async (req, res) => {
    try {
        if (req.body.psw === req.body.psw2) {
            const hashedPassword = await bcrypt.hash(req.body.psw, 10);
            users.push({
                id: Date.now().toString,
                username: req.body.uname,
                password: hashedPassword
            });
            res.redirect('/login');
        } else {
            res.redirect('/newAccount');
        }
    } catch {
        res.redirect('/newAccount');
    }
    console.log(users);
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.use('/', express.static('assets'));
app.listen(process.env.port || 3000);
