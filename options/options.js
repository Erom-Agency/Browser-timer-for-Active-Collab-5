(function(){
	"use strict";
	
	function SaveOptions(event) {
		var installUrl = document.getElementById('installUrl').value;

		chrome.storage.local.set({
			installUrl: installUrl
		}, function() {
			var status = document.getElementById('status');
			status.textContent = 'Options saved.';
			setTimeout(function() {
				status.textContent = '';
			}, 1000);
		});

		event.preventDefault();
	}

	function RestoreOptions() {
		chrome.storage.local.get({
			installUrl: 'https://app.activecollab.com/'
		}, function(items) {
			document.getElementById('installUrl').value = items.installUrl;
		});
	}

	document.addEventListener('DOMContentLoaded', RestoreOptions);
	document.getElementById('form').addEventListener('submit', SaveOptions);
})();