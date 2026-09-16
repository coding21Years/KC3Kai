(function(){
	"use strict";
	_gaq.push(['_trackEvent', "DevTools Opened", 'clicked']);
	
	const initialize = function(){
		// Load the shared config after chrome.storage.local has been mirrored.
		try {
			ConfigManager.load();
			
			// Check if theme exists
			$.ajax({
				type: "HEAD",
				url: "themes/" + ConfigManager.pan_theme + "/" + ConfigManager.pan_theme + ".html",
				success: function(){
					createPanel( ConfigManager.pan_theme );
				},
				error: function(){
					createFailPanel();
				}
			});
			
			if (ConfigManager.apiRecorder) {
				createApiRecorderPanel();
			}
			
		} catch (e) {
			// Catch any exceptions in the attempt
			createFailPanel();
		}
	};

	// Document ready
	$(document).on("ready", function(){
		ConfigManager.ready(initialize);
	});
	
	// Execute Chrome API to add panels to devtools
	function createPanel( theme ) {
		chrome.devtools.panels.create("DevKC3Kai",
			"../../assets/img/logo/16.png",
			"pages/devtools/themes/" + theme + "/" + theme + ".html",
			function(panel){}
		);
	}
	
	function createFailPanel() {
		chrome.devtools.panels.create("DevKC3Kai",
			"../../assets/img/logo/16.png",
			"pages/devtools/fail.html",
			function(panel){}
		);
	}
	
	function createApiRecorderPanel() {
		chrome.devtools.panels.create("KCSAPI",
			"../../assets/img/logo/16.png",
			"pages/devtools/recorder/recorder.html",
			function(panel){}
		);
	}
	
})();
