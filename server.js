var express = require('express')
var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed
var mysql = require('mysql');
var websocket = require('express-ws');

var app = express()
var port = 3000
var newPosts = []
var stream;



//functions for database querying
function getPostsFromDB() {
  return new Promise((res, rej) => {
    var sql = 'SELECT pubdate FROM posts';
    con.query(sql, function (err, result) {
      if (err) throw err;
      var output = []

      Object.keys(result).forEach(function (key) {//TODO: why does this need qoutes?
        output.push("'" + result[key].pubdate + "'")
      })
      res(output);
    })
  })
}

function addPostsToDB(newPosts, dbposts) {
  return new Promise((res, rej) => {
    for (var i = 0; i < newPosts.length; i++) {
      for (var j = 0; j < dbposts.length; j++) {
        console.log(newPosts[i])
        console.log(con.escape(newPosts[i]['pubdate']) == dbposts[j])
        if (!(con.escape(newPosts[i]['pubdate']) == dbposts[j])) {
          newPosts.splice(i, 1)
          // var sql = "INSERT IGNORE INTO posts (pubdate, link, contents) VALUES (" + con.escape(newPosts[i].pubdate) + "," + con.escape(newPosts[i].link) + "," + con.escape(newPosts[i].title) + ")";
          // con.query(sql, function (err, result) {
          //   if (err) throw err;
          // })
          // break;
        }
      }
    }
    res(newPosts);
  })
}
function scrapePosts() {
  return new Promise((res, rej) => {
    var feedparser = new FeedParser();
    var req = request('https://www.reddit.com/r/nba/new.rss')
    req.on('error', function (error) {
      // handle any request errors
    });
    req.on('response', function (res) {
      stream = this;

      if (res.statusCode !== 200) {
        this.emit('error', new Error('Bad status code'));
      }
      else {
        stream.pipe(feedparser);
      }
    });

    feedparser.on('error', (err) => {
      if (err) throw err;
    })
    feedparser.on('readable', () => {
      var stream = feedparser;
      var meta = this.meta;
      var item;
      while (item = stream.read()) {
        newPosts.push(item)
      }
      res(newPosts)

    })
  })
}
function getPosts() {
  return new Promise(async (res, rej) => {
    var posts = await scrapePosts()
    //  var dbPosts = await getPostsFromDB();
    //  var items = await addPostsToDB(newPosts, dbPosts);
    res(posts)
  })
}




















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
var sql = 'CREATE TABLE IF NOT EXISTS posts (pubdate VARCHAR(40) PRIMARY KEY, link VARCHAR(255), contents TEXT(1000))'
con.query(sql, function (err, result) {
  if (err) throw err;
  //console.log(result);
});
















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
  setInterval(async function () {
    if (newPosts.length == 0) {
      newPosts = await getPosts();
    }
    console.log("queue length:" + newPosts.length);
    var posts = newPosts.pop();
    ws.send(posts.title);
  }, 1000)
})

app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))
