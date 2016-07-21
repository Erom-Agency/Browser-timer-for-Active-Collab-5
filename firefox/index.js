var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var preferences = require("sdk/simple-prefs").prefs;

pageMod.PageMod({
	//include: /https:\/\/app.activecollab.com\/.*/,
	include: "*",
	contentScriptFile: [data.url("inc/jquery.min.js"), data.url("inc/jquery-ui.min.js"), data.url("inc/main.js"), data.url("bootstrap.js")],
	contentStyleFile: [data.url("inc/main.css")],
	onAttach: function(worker) {
		worker.port.emit("installUrl", preferences.installUrl);
	}
});