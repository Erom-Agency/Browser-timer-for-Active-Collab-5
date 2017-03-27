(function(){
	
	"use strict";

	browser.storage.local.get({
		installUrl: ''
	}, function(items) {
		var erm = new Erm();
		erm.init(items.installUrl);
	});

})();