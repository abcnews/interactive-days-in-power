module.exports = {
	"options": {
		"transform": ["brfs"]
	},
	"dev": {
		"options": {
			debug: true
		},
		cwd: 'src/scripts/',
		src: ['*.js', '!templates.js'],
		expand: true,
		dest: 'build/scripts/'
	},
	"prod": {
		"options": {
			debug: false
		},
		cwd: 'src/scripts/',
		src: ['*.js', '!templates.js'],
		expand: true,
		dest: 'build/scripts/'
	}
};
