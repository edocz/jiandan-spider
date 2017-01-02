var Promise = require('bluebird');
var fs      = require('fs');
var cheerio = require('cheerio');
var request = Promise.promisifyAll(require("request"));

if(!fs.existsSync('pics/')){  
  fs.mkdirSync('pics/');
}

// 爬取链接内图片地址
findPageLinks().each(function (pageLink) {
  logger ( '正在爬取页面 ' + pageLink )
  return request.getAsync(pageLink).then(function (res) {
    if (res.statusCode === 200) {
      $ = cheerio.load(res.body);
      var links = [];
      $('.view_img_link').each(function (index, el) {
        var link = $(el).attr('href') ? $(el).attr('href') : $(el).attr('src');
        if (link.indexOf('http:') !== 0 && link.indexOf('//') === 0) {
          links.push('http:' + link);
        } else {
          links.push(link);
        }
      });
      return Promise.resolve(links);
    } else {
      return Promise.resolve([]);
    }
  }).each(function (link) {
    var fileName = link.substring( link.lastIndexOf('/') + 1, link.length );
    var file = 'pics/' + fileName;
    request(link).pipe(fs.createWriteStream(file))
      .on('error', function(err) {
        console.log(err)
      });
  });
});

// 获取所有页面链接
function findPageLinks() {
  var BASE_URL = 'http://jandan.net/ooxx/page-';
  var startUrl = BASE_URL + '99999'; //输入一个极大页面数 会跳转到当前最大页
  return request.getAsync(startUrl).then(function (res) {
    if (res.statusCode === 200) {
      $ = cheerio.load(res.body);
      var count = +$('.current-comment-page+a').eq(0).text()
      return Promise.resolve(count);
    } else {
      return Promise.reject(new Error('code:' + res.statusCode));
    }
  }).then(function (count) {
    var pageLinks = [];
    for(var i = 1; i < count+1; i++) {
      pageLinks.push(BASE_URL + i);
    }
    return Promise.resolve(pageLinks);
  });
}

function logger ( msg ) {  
  process.stdout.clearLine();  // clear current text
  process.stdout.cursorTo(0);  // move cursor to beginning of line
  process.stdout.write(msg);
}