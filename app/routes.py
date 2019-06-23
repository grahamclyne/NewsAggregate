import feedparser
from flask import render_template
from app import app
from flask import request
@app.route('/')
@app.route('/index')
def index():
    NewsFeed = feedparser.parse("https://www.reddit.com/r/nba.rss")
    x = list(map(lambda x:x,NewsFeed['entries']))
    return render_template('index.html', title="News Feed", posts=x)