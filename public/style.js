var currTheme = "yotsuba-b";

function switchStyle(theme = false) {
	var i;
	var tags = document.getElementsByTagName("link");	

	switch(currTheme) {
		case "yotsuba":
			newTheme = "yotsuba-b";
			break;
		case "yotsuba-b":
			newTheme = "cold-snap";
			break;
		case "cold-snap":
			newTheme = "marebucks";
			break;
		case "marebucks":
			newTheme = "tomorrow";
			break;
		case "tomorrow":
			newTheme = "dark-flat";
			break;
		case "dark-flat":
			newTheme = "solarized-dark";
			break;
		case "solarized-dark":
			newTheme = "cn-su";
			break;
		case "cn-su":
			newTheme = "yotsuba";
			break;
	}

	var newTheme = theme ? theme : newTheme;

	for (i = 0; i < tags.length; i++) {
		if ((tags[i].rel.indexOf("stylesheet") != -1) && tags[i].title) {
			tags[i].disabled = true;
			if (tags[i].title == newTheme) {
				tags[i].disabled = false;
			}
		}
	}

	document.cookie = "chattheme=" + newTheme + "; max-age=2147483647; path=/";			
	currTheme = newTheme;
}

function loadTheme() {
	if (document.cookie.length != 0) {
		currTheme = document.cookie.match('(^|;)[\s]*chattheme=([^;]*)')[2];
	}
	switchStyle(currTheme);
}

loadTheme();
