(function(){
	
	"use strict";

	self.port.on("installUrl", function(installUrl) {
		var erm = new Erm();
		erm.init(installUrl);
	});

})();