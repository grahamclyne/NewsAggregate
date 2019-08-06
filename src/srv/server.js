var express = require('express')
var fs = require('fs');
var https = require('https')
var http = require('http')
var db = require('./db.js')
var app = express()
var server = '';
var websocket = '';


if (process.env.NODE_ENV == 'development') {
  server = http.createServer(app)
}
if (process.env.NODE_ENV == 'production') {
  var privateKey = fs.readFileSync('/etc/letsencrypt/live/grahamclyne.com/privkey.pem')
  var certificate = fs.readFileSync('/etc/letsencrypt/live/grahamclyne.com/fullchain.pem')
  var credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app)
}

websocket = require('express-ws')(app, server)

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


//logger function
app.use(function (req, res, next) {
  console.log("Request for " + req.url + " received.")
  next()
})
//setting proper headers
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

//for manual ssl ceritification with certbot
const letsEncryptReponse = process.env.CERTBOT_RESPONSE;
app.get('/.well-known/acme-challenge/:content', function (req, res) {
  res.send(letsEncryptReponse);
});

//serves static files
app.use(express.static('src/usr'));

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
      try {
        ws.send(JSON.stringify(post));
      }
      catch (err) {
        console.log("Cannot send post to client.")
        return ws.close()
      }
    }
    setTimeout(interval, 500)
  }
  interval()
  ws.on('close', function () {
    clearInterval(interval)
    return ws.close()
  })
})


server.listen(3000)
