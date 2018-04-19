var https = require('https');
var url = require('url');

function GetPosterFromNameId(name_id, callback) {
    var req_url = {
        host: 'www.imdb.com',
        path: '/name/' + name_id + '/'
    };
    https.request(req_url, (res) => {
        var body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            var poster_link_pos = body.indexOf('<a href="/name/' + name_id + '/mediaviewer/');
            var poster_img_pos = body.indexOf('<img', poster_link_pos);
            var poster_src_pos = body.indexOf('src=', poster_img_pos) + 5;
            var poster_end_pos = body.indexOf('"', poster_src_pos);
            var poster_url = url.parse(body.substring(poster_src_pos, poster_end_pos));
            callback && callback({host: poster_url.host, path: poster_url.pathname});
        });
    }).end();
}

function GetPosterFromTitleId(title_id, callback) {
    var req_url = {
        host: 'www.imdb.com',
        path: '/title/' + title_id + '/'
    };
    https.request(req_url, (res) => {
        var body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        res.on('end', () => {
            var poster_link_pos = body.indexOf('<a href="/title/' + title_id + '/mediaviewer/');
            var poster_img_pos = body.indexOf('<img', poster_link_pos);
            var poster_src_pos = body.indexOf('src=', poster_img_pos) + 5;
            var poster_end_pos = body.indexOf('"', poster_src_pos);
            var poster_url = url.parse(body.substring(poster_src_pos, poster_end_pos));
            callback && callback({host: poster_url.host, path: poster_url.pathname});
        });
    }).end();
}

module.exports = {};
module.exports.GetPosterFromNameId = GetPosterFromNameId;
module.exports.GetPosterFromTitleId = GetPosterFromTitleId;