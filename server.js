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
                con.query("CREATE TABLE `?` (id VARCHAR(255), category VARCHAR(255), price INT, description VARCHAR(255), year INT, month INT, day INT)", [id], function (err, result) {
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
    user = req.user;
    app.get('/home', (req, res) => {
        res.render('home.ejs', {userInfo: user})
    })
    app.get('/adding', (req, res) => {
        userID = (req.query.id);
        res.render('adding.ejs', {userInfo: user})
    });

    app.get('/addingIncome', (req, res) => {
        userID = (req.query.id);
        res.render('addingIncome.ejs', {userInfo: user})
    });
    
    app.get('/monthlyIncomeTable', (req, res) => {
        var sql = 'SELECT * FROM `?`';
        userID = (req.query.id);
        con.query(sql, [userID], function (err, results) {
            if (err) throw err;
            //console.log(results);
            res.render('monthlyIncomeTable.ejs', { title: 'User List', userData: results, userInfo: user});
        });
    });
    
    app.get('/monthlyExpensesTable', (req, res, next) => {
        var sql = 'SELECT * FROM `?`';
        userID = (req.query.id);
        con.query(sql, [userID], function (err, results) {
            if (err) throw err;
            const categories = ['', 'Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Medical & Healthcare', 'Personal', 'Education', 'Fun Money', 'Other']
            res.render('monthlyExpensesTable.ejs', { title: 'User List', userData: results, expCategories: categories, userInfo: user});
        });
    });
    
    app.get('/monthlySavingsTable', (req, res) => {
        var sqlIncome = 'Select SUM(price) FROM `?` WHERE category = 12';
        var sqlExpenses = 'Select SUM(price) FROM `?` WHERE NOT category = 12';
        var sql = sqlIncome + ';' + sqlExpenses;
        userID = (req.query.id);
        con.query(sql, [userID, userID], function (err, results) {
            if (err) throw err; 
            const savings = results[0]['0']['SUM(price)'] - results[1]['0']['SUM(price)']
            res.render('monthlySavingsTable.ejs', { title: 'User List', userData: results, saving: savings, userInfo: user});
        });
    });
    
    app.get('/pieChart', (req, res) => {
        userID = (req.query.id);
        var sqlHousing = "SELECT SUM(price) FROM `?` WHERE category = 1";
        var sqlTrans = "SELECT SUM(price) FROM `?` WHERE category = 2";
        var sqlFood = "SELECT SUM(price) FROM `?` WHERE category = 3";
        var sqlUtilities = "SELECT SUM(price) FROM `?` WHERE category = 4";
        var sqlInsurance = "SELECT SUM(price) FROM `?` WHERE category = 5";
        var sqlMedical = "SELECT SUM(price) FROM `?` WHERE category = 6";
        var sqlPersonal = "SELECT SUM(price) FROM `?` WHERE category = 7";
        var sqlEducation = "SELECT SUM(price) FROM `?` WHERE category = 8";
        var sqlFunMoney = "SELECT SUM(price) FROM `?` WHERE category = 9";
        var sqlOther = "SELECT SUM(price) FROM `?` WHERE category = 10";
        var sql = sqlHousing + ";" + sqlTrans + ";" + sqlFood + ";" + sqlUtilities + ";" + sqlInsurance + ";" + sqlMedical + ";" + sqlPersonal + ";" + sqlEducation + ";" + sqlFunMoney + ";" + sqlOther;
        con.query(sql, [userID, userID, userID, userID, userID, userID, userID, userID, userID, userID], function (err, results) {
            if (err) throw err;
            const categories = ['Housing', 'Transportation', 'Food', 'Utilities', 'Insurance', 'Medical & Healthcare', 'Personal', 'Education', 'Fun Money', 'Other']
            const data = [results[0]['0']['SUM(price)'], results[1]['0']['SUM(price)'], results[2]['0']['SUM(price)'], results[3]['0']['SUM(price)'], results[4]['0']['SUM(price)'], results[5]['0']['SUM(price)'], results[6]['0']['SUM(price)'], results[7]['0']['SUM(price)'], results[8]['0']['SUM(price)'], results[9]['0']['SUM(price)']]
            res.render('pieChart.ejs', { costs: data, expCategories: categories, userInfo: user})
        })
    });
    
    app.get('/barChart', (req, res) => {
        userID = (req.query.id);
        var sqlJan = "SELECT SUM(price) FROM `?` WHERE month = 1";
        var sqlFeb = "SELECT SUM(price) FROM `?` WHERE month = 2";
        var sqlMar = "SELECT SUM(price) FROM `?` WHERE month = 3";
        var sqlApr = "SELECT SUM(price) FROM `?` WHERE month = 4";
        var sqlMay = "SELECT SUM(price) FROM `?` WHERE month = 5";
        var sqlJun = "SELECT SUM(price) FROM `?` WHERE month = 6";
        var sqlJul = "SELECT SUM(price) FROM `?` WHERE month = 7";
        var sqlAug = "SELECT SUM(price) FROM `?` WHERE month = 8";
        var sqlSep = "SELECT SUM(price) FROM `?` WHERE month = 9";
        var sqlOct = "SELECT SUM(price) FROM `?` WHERE month = 10";
        var sqlNov = "SELECT SUM(price) FROM `?` WHERE month = 11";
        var sqlDec = "SELECT SUM(price) FROM `?` WHERE month = 12";
        var sql = sqlJan + ";" + sqlFeb + ";" + sqlMar + ";" + sqlApr + ";" + sqlMay + ";" + sqlJun + ";" + sqlJul + ";" + sqlAug + ";" + sqlSep + ";" + sqlOct + ";"+ sqlNov + ";" + sqlDec;
        con.query(sql, [userID, userID, userID, userID, userID, userID, userID, userID, userID, userID, userID, userID], function (err, results){
            if (err) throw err;
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            const data = [results[0]['0']['SUM(price)'], results[1]['0']['SUM(price)'], results[2]['0']['SUM(price)'], results[3]['0']['SUM(price)'], results[4]['0']['SUM(price)'], results[5]['0']['SUM(price)'], results[6]['0']['SUM(price)'], results[7]['0']['SUM(price)'], results[8]['0']['SUM(price)'], results[9]['0']['SUM(price)'], results[10]['0']['SUM(price)'], results[11]['0']['SUM(price)']]
            res.render('barChart.ejs', { data: data, month: months, userInfo: user})
        })
    })
    
    
    app.get('/delete', (req, res) => {
        var sql = "DELETE FROM `?` WHERE id = ?"
        con.query(sql, [user.id, req.query.id], (err, results) => {
            if (err) throw err;
        })
        res.redirect('/monthlyExpensesTable?id=' + user.id)
    });
    
    app.post('/adding', (req, res) => {
        userID = (req.query.id);
        var today = new Date();
        var id = Date.now().toString()
        var year = today.getFullYear()
        var month = today.getMonth() + 1
        var day = today.getDate()
        values = [
            [id, req.body.category, parseInt(req.body.amount), req.body.description, year, month, day]
        ]
        con.query('INSERT INTO `?` (id, category, price, description, year, month, day) VALUES ?', [userID, values], function (err, result) {
            if (err) throw err;
        })
        res.redirect('/adding?id=' + userID)
    });

    app.post('/addingIncome', (req, res) => {
        userID = (req.query.id);
        var category = 12
        var today = new Date();
        var id = Date.now().toString()
        var year = today.getFullYear()
        var month = today.getMonth() + 1
        var day = today.getDate()
        values = [
            [id, category, parseInt(req.body.amount), req.body.description, year, month, day]
        ]
        con.query('INSERT INTO `?` (id, category, price, description, year, month, day) VALUES ?', [userID, values], function (err, result) {
            if (err) throw err;
        })
        res.redirect('/addingIncome?id=' + userID)
    }); 
    res.redirect('/home')
})

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        user = "";
        res.redirect('/');
    });
});

app.use('/', express.static('assets'));
app.listen(process.env.port || 3000);
