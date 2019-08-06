    A small app to automatically post headlines from various news sources. 
    server starts by using feedparser library to scrape rss feeds from websites (a hard-coded list) and then the server then sends requests one by one via websockets to the client. if there are no new posts to scrape, the ten most recent posts are continually fed to the client
    
    See grahamclyne.com for the running version

    to run: 
    #npm install
    #npm run build
    #npn run start

    Development location-> localhost:3000

    TODO
    limit scraping to only 10 items per site at the feedparser
    set up watching mechanism for webpack
    change key of list in index.js
    use docker
    look into express sessions
    travis CI


    NOTES
    for some reason need to use react-transition-group 1.x, anything higher there is a conflict
    to use certbot, use manual mode!!!!!