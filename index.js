var express = require('express');
var chance = new require('chance')();
var redis = require('redis');
var bodyParser = require('body-parser');
var mustache = require('mustache-express');
var markdown = require('markdown').markdown;

var url_util = require('./util.js');

// *** Redis
client = redis.createClient();
client.on("error", function(err) {
    console.log('Error ' + err);
});


// urlutil.testEncode(10000);



// *** Express
var app = express();
app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', __dirname + '/html');
app.use(bodyParser.urlencoded({
    extended: true
}));


// This is the test point
app.get('/email', function(req, res) {
    emails = [];
    for (var i = 0; i < 10; i++) {
        emails.push({'email': chance.email()});
    }

    res.render('email', {
        content: {
            'email': emails,
            'info': req.params,
        }
    });
});

app.get('/', function(req, resp) {
    resp.render('index');
})




// This returns the short url
app.get('/:code', function(req, resp) {
    var code = req.params.code;

    if (code.length >= 8) {
        resp.status(404).render('markdown', {
            'html': '<p>URL Not Found</p>',
        });
        return;
    }

    var result = url_util.baseDecode(req.params.code);
    if (result > 0) {
        client.hgetall('url:short:' + result, function(err, url) {

            // Check the code exist first
            if (!url) {
                resp.status(404).render('markdown', {
                    'html': '<p>URL Not Found</p>',
                });
                return;
            }

            // Check the expiry time
            var current_time = new Date().getTime() / 1000;
            // console.log(parseInt(url.time) + parseInt(url.expire), current_time);
            if (url.expire >= 0 && parseInt(url.time) + parseInt(url.expire) < current_time) {
                resp.status(403).render('markdown', {
                    'html': '<p>URL Expired</p>',
                });
                return;
            }

            // Render URL
            if (url_util.isUrl(url.content)) {
                // Is url, then do redirect
                resp.redirect(302, url.content);
            } else {
                // Not url, render markdown
                resp.render('markdown', {
                    'html': markdown.toHTML(url.content),
                })
            }

        });
    } else {
        resp.status(404).render('markdown', {
            'html': '<p>Invalid URL</p>',
        });
    }
});


// This posts the short url
app.post('/shorten', function(req, resp) {
    // console.log(req.body);

    // Get the current head
    client.get('url_head', function(err, head) {
        // Check url head
        if (!head) head = 1;
        else head = parseInt(head);

        // Check head bound
        if (head < 0) head = 1;

        // Check the url is valid
        console.log(req.body);
        var url = req.body.url;
        var expire = parseInt(req.body.expire) || -1;
        if (!url || (!Number.isInteger(expire))) {
            resp.status(400).send('Bad Request');
            return;
        }

        // Increment the url head and write the content
        client.set('url_head', head + 1, redis.print);
        client.hmset('url:short:' + head, {
            'content': req.body.url,
            'time': Math.floor(new Date().getTime() / 1000),
            'expire': expire,
        }, redis.print);

        var short_url = "https://" + req.get('Host') + "/" + url_util.baseEncode(head);
        resp.render('successful_page', {
            'url': short_url,
        });
    });
});





// Create Server
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
});
