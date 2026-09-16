/* Messengers.js
KC3改 Messengers

Handles a message passed between KC3改 extension components.
https://developer.chrome.com/extensions/messaging
Instantiate to sends a single messages from current module to another.
Listening and receiving messages should be handled by the other module.

Sample Usage:

(new RMsg("gamescreen", "activate_game")).execute();

(new RMsg("service", "set_api_link", { swfsrc:"1234" }, function(response){
	console.log(response);
})).execute();

(new TMsg(123, "gamescreen", "activate_game")).execute();

(new TMsg(123, "gamescreen", "activate_game", { redirect: false }, function(response){
	console.log(response);
})).execute();

*/
(function(){
	"use strict";
	
	console.info("KC3改 Messengers loaded");
	
	// Error messages are safe to be ignored set by chrome later versions
	const chromeWarningsToIgnore = [
		"The message port closed before a response was received.",
		"A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"
	];
	const defaultCallback = function(response) {
		const lastError = chrome.runtime.lastError;
		const lastErrorMsg = (lastError || {}).message;
		if(lastErrorMsg && !chromeWarningsToIgnore.includes(lastErrorMsg))
			console.warn("Unexpected runtime.lastError: " + lastErrorMsg, lastError, response);
	};
	const defaultMessageHandler = function(request, sender, response) {
		if(request && (request.identifier || "").startsWith("kc3_")) {
			response(request, sender);
		}
		return true;
	};
	
	/* RUNTIME MESSAGE
	Send message to all components, which will only execute on "target"
	------------------------------------------*/
	window.RMsg = function(target, action, params, callback){
		// Compile params with required fields and sender's own data
		this.params = $.extend({
			identifier: "kc3_"+target,
			action: action
		}, params);
		
		// Save callback for later
		this.callback = (callback || defaultCallback);
		
		return true; // for async callbacks
	};
	
	RMsg.prototype.execute = function(){
		// Execute required Chrome APIs
		chrome.runtime.sendMessage(this.params, this.callback);
		return true; // for async callbacks
	};
	
	RMsg.addListener = function(messageHandler){
		return chrome.runtime.onMessage.addListener(messageHandler || defaultMessageHandler);
	};

	/* TAB MESSAGE
	Send message to a specific Chrome tab
	------------------------------------------*/
	window.TMsg = function(tabId, target, action, params, callback){
		// Remember tabId to send it to
		this.tabId = tabId;
		
		// Compile params with required fields and sender's own data
		this.params = $.extend({
			identifier: "kc3_"+target,
			action: action
		}, params);
		
		// Save callback for later
		this.callback = (callback || defaultCallback);
		
		return true; // for async callbacks
	};
	
	TMsg.prototype.execute = function(){
		// Execute required Chrome APIs
		chrome.tabs.sendMessage(this.tabId, this.params, this.callback);
		return true; // for async callbacks
	};
	

	/* STRATEGY ROOM INSIDE THE REAL DEVTOOLS PANEL
	Only a KC3Kai theme page handles this message. This prevents the popup
	from hosting Strategy Room in Electron's separate popup storage context.
	------------------------------------------*/
	const isDevToolsThemePage = function(){
		return /^\/pages\/devtools\/themes\/[^/]+\/[^/]+\.html$/.test(
			window.location.pathname
		);
	};

	const openStrategyRoomInDevTools = function(tabPath){
		const frameId = "kc3kai-strategy-room-frame";
		const closeId = "kc3kai-strategy-room-close";
		const targetUrl = chrome.runtime.getURL(
			"pages/strategy/strategy.html#" + (tabPath || "profile")
		);
		let frame = document.getElementById(frameId);

		if(frame){
			frame.src = targetUrl;
			frame.style.display = "block";
			const closeButton = document.getElementById(closeId);
			if(closeButton) closeButton.style.display = "block";
			return;
		}

		frame = document.createElement("iframe");
		frame.id = frameId;
		frame.src = targetUrl;
		frame.setAttribute("allow", "clipboard-read; clipboard-write");
		Object.assign(frame.style, {
			position: "fixed",
			inset: "0",
			width: "100%",
			height: "100%",
			border: "0",
			background: "#fff",
			zIndex: "2147483646"
		});

		const closeButton = document.createElement("button");
		closeButton.id = closeId;
		closeButton.type = "button";
		closeButton.textContent = "×";
		closeButton.title = "Close Strategy Room";
		Object.assign(closeButton.style, {
			position: "fixed",
			top: "8px",
			right: "8px",
			width: "36px",
			height: "36px",
			padding: "0",
			border: "1px solid rgba(255,255,255,.4)",
			borderRadius: "4px",
			background: "rgba(0,0,0,.75)",
			color: "#fff",
			fontSize: "28px",
			lineHeight: "30px",
			cursor: "pointer",
			zIndex: "2147483647"
		});
		closeButton.addEventListener("click", function(){
			frame.style.display = "none";
			closeButton.style.display = "none";
		});

		document.body.appendChild(frame);
		document.body.appendChild(closeButton);
	};

	chrome.runtime.onMessage.addListener(function(request, sender, response){
		if(
			request &&
			request.identifier === "kc3_devtools" &&
			request.action === "strategyRoomPage" &&
			isDevToolsThemePage()
		){
			openStrategyRoomInDevTools(request.tabPath);
			response({ opened: true });
		}
	});

})();