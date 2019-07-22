var express = require('express')
var request = require('request'); // for fetching the feed
var websocket = require('express-ws');
var FeedParser = require('feedparser-promised');
var db = require('./db.js')
var path = require('path');
var app = express()
var port = 3000
websocket(app)


function getPosts() {
  return new Promise(async (res, rej) => {
      var total = []
      var posts = []
      var sites = [
        'https://montrealgazette.com/feed/',
        'https://www.theguardian.com/us/rss',
        'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
        'https://www.aljazeera.com/xml/rss/all.xml',
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "http://feeds.foxnews.com/foxnews/latest",
        "http://www.latimes.com/rss2.0.xml",
        "http://www.dailymail.co.uk/news/articles.rss",
        "http://www.independent.co.uk/news/world/rss"


      ]
      for (let i = 0; i < sites.length; i++) {
        try {
          posts[i] = await db.scrapePosts(sites[i])
        }
        catch (err) {
          console.log("Could not scrape site " + sites[i] + " -> " + err)
        }
        total = total.concat(posts[i])
      }
      res(total)
  }
  )
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


//WEBSOCKET CONNECTION
app.ws('/', async (ws, req) => {
  var newPosts = await getPosts();
  var interval = async function () {
    if (newPosts.length == 0) {
      console.log('Checking for new posts...')
      newPosts = await getPosts();
      if (newPosts.length == 0) {
        newPosts = db.getMostRecentPosts();
      };
    }
    else if (newPosts.length > 0) {
      console.log("Remaining posts to send: " + newPosts.length);
      var post = newPosts.pop();
      ws.send(JSON.stringify(post));
    }
    setTimeout(interval, 500)
  }
  interval()
  ws.on('close', function () {
    clearInterval(interval)
  })
})


//SENDING STATIC FILES
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../usr/index.html'))
})
app.get('/:file', (req, res) => {
  var options = {
    root: __dirname + '/../usr',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };
  console.log(req.params.file)
  var fileName = req.params.file;
  res.sendFile(fileName, options, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
})
app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))