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

var userID = '';

const initalizePassport = require('./passport-config');
initalizePassport(passport,
    (async (username) => {
        function getUser(username) {
            return new Promise((resolve, reject) => {
                con.query("SELECT * FROM `USERS` WHERE username=?", [username], (err, result) => {
                    return err ? reject(err) : resolve(result[0]);
                });
            });
        }
        const result = await getUser(username);
        return result;
    }),
    (async (id) => {
        function getID(id) {
            return new Promise((resolve, reject) => {
                con.query("SELECT * FROM `USERS` WHERE id=?", [id], (err, result) => {
                    return err ? reject(err) : resolve(result[0]);
                });
            });
        }
        const result = await getID(id);
        return result;
    })
);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mydb",
    multipleStatements: true
});

con.connect(function (err) {
    if (err) throw err;
    console.log('Connected');
});


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
    res.render('newAccount.ejs', { flash: req.flash('msg')})
});


app.post('/newAccount', (req, res) => {
    try {
        con.query("SELECT * FROM USERS WHERE username = ?", [req.body.uname], async function (err, result) {
            if (err) throw err;
            if (result.length == 0 && req.body.psw === req.body.psw2) {
                const hashedPassword = await bcrypt.hash(req.body.psw, 10);
                console.log(hashedPassword);
                var id = Date.now().toString()
                var sql = "INSERT INTO users (id, username, password) VALUES ?";
                var value = [
                    [id, req.body.uname, hashedPassword],
                ];
                con.query(sql, [value], function (err, result) {
                    if (err) throw err;
                    console.log('1 ID recoreded');
                });
                con.query("CREATE TABLE `?` (category VARCHAR(255), price INT, description VARCHAR(255), year INT, month INT, day INT)", [id], function (err, result) {
                    if (err) throw err;
                    console.log('New table created');
                });
                res.redirect('/login');
            } else {
                req.flash('msg', 'This Username Already Exists');
                res.redirect('/newAccount');
            }
        });
    } catch {
        res.redirect('/newAccount');
    }
})

app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function (req, res) {
    userID = req.user.id;
    app.get('/home', (req, res) => {
        res.render('home.ejs')
    })
    
    app.get('/adding', (req, res) => {
        res.render('adding.ejs')
    });
    
    app.get('/monthlyIncomeTable', (req, res, next) => {
        var sql= 'SELECT * FROM `?`';
        con.query(sql, [userID], function (err, results) {
            if (err) throw err;
            //console.log(results);
            res.render('monthlyIncomeTable.ejs', { title: 'User List', userData: results});
        });
    });
    
    app.get('/monthlyExpensesTable', (req, res, next) => {
        var sql= 'SELECT * FROM `?`';
        con.query(sql, [userID], function (err, results) {
            if (err) throw err;
            //console.log("results are " + results);
            const categories = ['Food', 'Transportation', 'Savings', 'Other']
            res.render('monthlyExpensesTable.ejs', { title: 'User List', userData: results, expCategories: categories });
        });
    });

    app.get('/monthlySavingsTable', (req, res, next) => {
        var sql= 'SELECT * FROM `?`';
        con.query(sql, [userID], function (err, results) {
            if (err) throw err;
            //console.log(results);
            res.render('monthlySavingsTable.ejs', { title: 'User List', userData: results});
        });
    });

    app.get('/pieChart', (req, res) => {
        var sqlFood = "SELECT SUM(price) FROM `?` WHERE category = 1";
        var sqlTrans = "SELECT SUM(price) FROM `?` WHERE category = 2";
        var sqlSavings = "SELECT SUM(price) FROM `?` WHERE category = 3";
        var sqlOther = "SELECT SUM(price) FROM `?` WHERE category = 4";
        var sql = sqlFood + ";" + sqlTrans + ";" + sqlSavings + ";" + sqlOther;
        con.query(sql, [userID, userID, userID, userID], function (err, results) {
            if (err) throw err;
            const categories = ['Food', 'Transportation', 'Savings', 'Other']
            const data = [results[0]['0']['SUM(price)'], results[1]['0']['SUM(price)'], results[2]['0']['SUM(price)'], results[3]['0']['SUM(price)']]
            res.render('pieChart.ejs', { costs: data, expCategories: categories })
        })
    });

    app.post('/adding', (req, res) => {
        var today = new Date();
        var year = today.getFullYear()
        var month = today.getMonth()
        var day = today.getDay()
        values = [
            [req.body.category, parseInt(req.body.amount), req.body.description, year, month, day]
        ]
        con.query('INSERT INTO `?` (category, price, description, year, month, day) VALUES ?', [userID, values], function (err, result) {
            if (err) throw err;
        })
        res.redirect('/adding')
    });
    res.redirect('/home');
})

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.use('/', express.static('assets'));
app.listen(process.env.port || 3000);
