module.exports = {
	options: {
		commonjs: true,
		processName: function(filename) {
			return filename.replace(/src\/templates\/(.*)(\.hbs)/, '$1');
		}
	},
	compile: {
		files: {
			'src/scripts/templates.js' : ['src/templates/**/*.hbs']
		}
	}
}
