var express = require('express')
//var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed
var mysql = require('mysql');
var websocket = require('express-ws');
const FeedParser = require('feedparser-promised');
var app = express()
var port = 3000

//CONNECT TO DB
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "NewsAggregate"
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to database.");

});
 var sql = 'DROP TABLE posts'
 con.query(sql, function (err) {
   if (err) throw err;
   console.log("Table Posts Dropped");

 });
var sql = 'CREATE TABLE IF NOT EXISTS posts (pubdate DATETIME PRIMARY KEY, link VARCHAR(255), contents TEXT(1000))'
con.query(sql, function (err, result) {
  if (err) throw err;
  //console.log(result);
});






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
        var sql = "INSERT IGNORE INTO posts (pubdate, link, contents) VALUES (" + con.escape(newPosts[i].pubdate) + "," + con.escape(newPosts[i].link) + "," + con.escape(newPosts[i].title) + ")";
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
    FeedParser.parse(website).then(async (items) => {
      const promises = items.map(item => { newPosts.push(item) });
      await Promise.all(promises);
      var dbposts = await getPostsFromDB();
      res(addPostsToDB(newPosts, dbposts));
      res(newPosts);
    }).catch(console.error)
  })
}
function getPosts() {
  return new Promise(async (res,rej) => {
  var site1 = await scrapePosts('https://montrealgazette.com/feed/')
  var site2 = await scrapePosts('http://www.reddit.com/r/nba.rss')
  var site3 = await scrapePosts('https://www.theguardian.com/us/rss')
  res(site1.concat(site2))
  })
}


//SERVER
var myLogger = function (req, res, next) {
  console.log("Request for " + req.url + " received.")
  next()
}
app.use(myLogger);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
websocket(app)
app.ws('/', async (ws, req) => {
  var newPosts = await getPosts();
  setInterval(async function () {
    if (newPosts.length == 0) {
      console.log('Checking for new posts...')
      newPosts = await getPosts();
    }
    if (newPosts.length > 0) {
      console.log("Remaining posts to send: " + newPosts.length);
      var post = newPosts.pop();
      ws.send(JSON.stringify(post));
    }
  }, 2000)
})
app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))

