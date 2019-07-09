var express = require('express')
var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed
var mysql = require('mysql');
var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var WebSocketFrame = require('websocket').frame;
var WebSocketRouter = require('websocket').router;
var W3CWebSocket = require('websocket').w3cwebsocket;
var req = request('https://www.reddit.com/r/nba/new.rss')
var feedparser = new FeedParser();
var items = [];
const app = express()
const port = 3000

//functions for database querying
function getPostsFromDB() {
  return new Promise((res, rej) => {
    var sql = 'SELECT pubdate FROM posts';
    con.query(sql, function (err, result) {
      var output = []
      if (err) throw err;
      Object.keys(result).forEach(function (key) {
        output.push("'" + result[key].pubdate + "'")
      })
      res(output);
    })
  })
}

function addPostsToDB(alreadyContains) {
  return new Promise((res, rej) => {
    var newPosts = []
    // console.log("alreadyContains:")
    //console.log(alreadyContains)
    for (var i = 0; i < items.length; i++) {
      // console.log(con.escape(items[i]['pubdate']));
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
var sql = 'CREATE TABLE IF NOT EXISTS posts (pubdate VARCHAR(40 ) PRIMARY KEY, link VARCHAR(255), contents TEXT(1000))'
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
app.get('/posts', (req, res) => {
  res.json(items);
})

app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))


//WEBSOCKET CLIENT


wsServer = new WebSocketServer({
  httpServer: app,
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function (request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }

  var connection = request.accept('echo-protocol', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function (message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function (reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});


