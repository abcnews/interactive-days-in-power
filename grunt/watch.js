module.exports = {
	"options": {
		"livereload": true
	},
	"gruntfile": {
		"files": [
			"Gruntfile.js",
			"grunt/*.js"
		],
		"tasks": ["jshint:gruntfile"],
		"interrupt": true
	},
	"js": {
		"files": "src/scripts/**/*",
		"tasks": [
			"jshint:js",
			"browserify:dev"
		],
		"interrupt": true
	},
	"css": {
		"files": "src/styles/**/*.scss",
		"tasks": "sass:dev",
		"interrupt": true
	},
	"templates": {
		"options": {
			"livereload": false
		},
		"files": "src/templates/**/*.hbs",
		"tasks": "handlebars:compile",
		"interrupt": true
	},
	"copy": {
		"files": [
			"src/**/*",
			"!src/scripts/*",
			"!src/styles/*",
			"!src/templates/*"
		],
		"tasks": "copy:static",
		"interrupt": true
	},
	"version": {
		"files": ["package.json"],
		"tasks": "version",
		"interrupt": true
	},
	"test": {
		"files": ["test/**/*"],
		"tasks": "mocha_phantomjs:dev",
		"interrupt": true
	}
};
