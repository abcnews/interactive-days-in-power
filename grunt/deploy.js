module.exports = {
	contentftp: {
		credentials: ".abc-credentials",
		targetName: "contentftp",
		target: "/www/res/sites/news-projects/interactive-captains-knock-charts/",
		files: [{
			expand: true,
			cwd: 'build/',
			src: ["**/*"]
		}]
	}
};
