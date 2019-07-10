var express = require('express')
var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed
var mysql = require('mysql');
var websocket = require('express-ws');
var req = request('https://www.reddit.com/r/nba/new.rss')
var feedparser = new FeedParser();
var app = express()
var port = 3000
var items = []

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

function addPostsToDB(alreadyContains) {
  return new Promise((res, rej) => {
    var newPosts = []
    for (var i = 0; i < items.length; i++) {
      for (var j = 0; j < alreadyContains.length; j++) {
        if (!(con.escape(items[i]['pubdate']) == alreadyContains[j])) {
          newPosts.push(items[i])
          var sql = "INSERT IGNORE INTO posts (pubdate, link, contents) VALUES (" + con.escape(items[i].pubdate) + "," + con.escape(items[i].link) + "," + con.escape(items[i].title) + ")";
          con.query(sql, function (err, result) {
            if (err) throw err;
          })
          break;
        }
      }
    }
    res(newPosts);
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









//GET DATA FROM WEBSITE AND PARSE
req.on('error', function (error) {
  // handle any request errors
});
req.on('response', function (res) {
  var stream = this;

  if (res.statusCode !== 200) {
    this.emit('error', new Error('Bad status code'));
  }
  else {
    stream.pipe(feedparser);
  }
});


feedparser.on('error', function (error) {
  // always handle errors
});
feedparser.on('readable', async function () {
  var stream = this;
  var meta = this.meta;
  var item;
  while (item = stream.read()) {
    items.push(item)
  }
  var posts = await getPostsFromDB();
  items = await addPostsToDB(posts);
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
app.get('/', (res)=> {

})
websocket(app)
app.ws('/', (ws, req) => {
  var count = 0;
  setInterval(() => {
    if (!(items.length == 0)) {
      var item = items.pop();
      ws.send(item.title);
    }
  }, 3000)
})

app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))
