exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://admin:Mbdtf87!@ds129024.mlab.com:29024/blogapi';
exports.PORT = process.env.PORT || 8080;
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://admin:Mbdtf87!@ds129024.mlab.com:29024/blogapi');
exports.PORT = process.env.PORT || 8080;