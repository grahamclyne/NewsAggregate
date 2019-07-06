var express = require('express')
var FeedParser = require('feedparser');
var request = require('request'); // for fetching the feed

var req = request('https://www.reddit.com/r/nba.rss')
var feedparser = new FeedParser();

req.on('error', function (error) {
  // handle any request errors
});

req.on('response', function (res) {
  var stream = this; // `this` is `req`, which is a stream

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
var items = [];

feedparser.on('readable', function () {
  // This is where the action is!
  var stream = this; // `this` is `feedparser`, which is a stream
  var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
  var item;
  while (item = stream.read()) {
    items.push(item)
  }
});


const app = express()
const port = 3000

var myLogger = function (req, res, next) {
    console.log("Request for " + req.url + " received.")
    next()
}
app.use(function(req,res,next)   {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
app.get('/posts', (req,res) => {
    console.log('sending posts\n')
    res.json(items);
})
app.use(myLogger)

app.listen(port, () => console.log(`Listening on 127.0.0.1:${port}`))
