// URL Code Encoding & Decoding
var charset = '0123456789abcdefghjklmnpqrstuvwxyz';
var matcher = /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/;

exports.baseEncode = function (i) {
    var len = charset.length;
    var encoded = '';
    while (i > 0) {
        encoded = charset.charAt(i % len) + encoded;
        i = Math.floor(i / len);
    }
    return encoded;
}

exports.baseDecode = function (s) {
    var len = charset.length;
    var decoded = 0;
    for (var i = 0; i < s.length; i++) {
        var num = charset.indexOf(s.charAt(s.length - i - 1));
        decoded += num * Math.pow(len, i);
    }
    return decoded;
}

exports.testEncode = function testEncode(range) {
    console.log('Testing from 0 to ' + range);
    for (var i = 0; i < range; ++i) {
        if (this.baseDecode(this.baseEncode(i)) != i) {
            console.log('Error at ' + i);
        }
    }
    console.log('done');
}


exports.isUrl = function(str){
    return matcher.test(str);
}
