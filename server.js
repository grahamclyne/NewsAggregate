var express = require('express')
var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed
var mysql = require('mysql');
var websocket = require('express-ws');

var app = express()
var port = 3000
var newPosts = []
var stream;

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
// var sql = 'DROP TABLE posts'
// con.query(sql, function (err) {
//   if (err) throw err;
//   console.log("Table Posts Dropped");

// });
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
  var toReturn = []
  dbposts = dbposts.map(Date.parse)
  return new Promise((res, rej) => {
    for (var i = 0; i < newPosts.length; i++) {
      console.log(dbposts.includes(Date.parse(newPosts[i].pubdate)))
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
  return new Promise((res, rej) => {
    var feedparser = new FeedParser();
    var req = request(website)
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
      (async function loop() {
        while (item = stream.read()) {
          newPosts = await new Promise(resolve => { newPosts.push(item); resolve(newPosts) })
        }
      })();
      res(newPosts)
    })

  })
}
function getPosts() {
  return new Promise(async (res, rej) => {
    var newPosts = await scrapePosts('https://montrealgazette.com/feed/');
    newPosts1 = await scrapePosts('https://www.reddit.com/r/nba/new.rss')
    newPosts = newPosts.concat(newPosts1)
    var dbPosts = await getPostsFromDB();
    var items = await addPostsToDB(newPosts, dbPosts);
    res(items);
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
  setInterval(async function () {
    if (newPosts.length == 0) {
      newPosts = await getPosts();
    }
    if (newPosts.length > 0) {
      console.log("queue length:" + newPosts.length);
      var post = newPosts.pop();
      ws.send(post.title);
    }
  }, 3000)
})
getPosts()
app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))
