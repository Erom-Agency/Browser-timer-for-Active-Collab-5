(function(){

	function SaveOptions() {
		var installUrl = document.getElementById('installUrl').value;

		browser.storage.local.set({
			installUrl: installUrl
		}, function() {
			var status = document.getElementById('status');
			status.textContent = 'Options saved.';
			setTimeout(function() {
				status.textContent = '';
			}, 750);
		});
	}

	function RestoreOptions() {
		browser.storage.local.get({
			installUrl: 'https://app.activecollab.com/'
		}, function(items) {
			document.getElementById('installUrl').value = items.installUrl;
		});
	}

	document.addEventListener('DOMContentLoaded', RestoreOptions);
	document.getElementById('save').addEventListener('click', SaveOptions);
	
})();