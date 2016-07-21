(function(){
	
	"use strict";

	chrome.storage.sync.get({
		installUrl: ''
	}, function(items) {
		var erm = new Erm();
		erm.init(items.installUrl);
	});

})();