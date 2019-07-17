var FeedParser = require('feedparser-promised');
var mysql = require('mysql');
require('dotenv').config()

//functions for database querying
function getPostsFromDB() {
  return new Promise((res, rej) => {
    var sql = 'SELECT pubdate FROM posts';
    con.query(sql, function (err, result) {
      if (err) throw err;
      var output = []
      Object.keys(result).forEach(function (key) {//TODO: why does this need qoutes?
        output.push(result[key].pubdate)
      })
      res(output);
    })
  })
}

function addPostsToDB(newPosts, dbposts) {
  dbposts = dbposts.map(Date.parse)
  return new Promise((res, rej) => {
    var toReturn = []
    for (var i = 0; i < newPosts.length; i++) {
      if (!(dbposts.includes(Date.parse(newPosts[i].pubdate)))) {
        toReturn.push(newPosts[i])
        //'YYYY-MM-DD hh:mm:ss' <---- DATETIME format
        var sql = "INSERT IGNORE INTO posts (pubdate, link, title) VALUES (" + con.escape(newPosts[i].pubdate) + "," + con.escape(newPosts[i].link) + "," + con.escape(newPosts[i].title) + ")";
        con.query(sql, function (err, result) {
          if (err) throw err;
        })
      }
    }
    res(toReturn);
  })
}

function scrapePosts(website) {
  var newPosts = []
  return new Promise((res, rej) => {
    try {
      FeedParser.parse(website).then(async (items) => {
        const promises = items.map(item => { newPosts.push(item) });
        await Promise.all(promises);
        var dbposts = await getPostsFromDB();
        res(addPostsToDB(newPosts.slice(0, 10), dbposts));
      }).catch(err => rej(err))
    }
    catch (err) {
      rej(err)
    }
  })
}

function getMostRecentPosts() {
  var sql = 'SELECT * FROM posts ORDER BY pubdate DESC LIMIT 10';
  var output = [];
  con.query(sql, function (err, result) {
    if (err) throw err;
    Object.keys(result).forEach(function (key) {//TODO: why does this need qoutes?
      output.push(result[key])
    })
  })
  return output;
}


var con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to database.");
});
var sql = 'DROP TABLE IF EXISTS posts'
con.query(sql, function (err) {
  if (err) throw err;
  console.log("Table Posts Dropped");
});
var sql = 'CREATE TABLE IF NOT EXISTS posts (pubdate DATETIME PRIMARY KEY, link VARCHAR(255), title TEXT(1000))'
con.query(sql, function (err, result) {
  if (err) throw err;
});



module.exports = {scrapePosts}