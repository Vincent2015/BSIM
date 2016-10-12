var SNSMiniChatWindow = function() {
	this.selector = "#snsim_chat_window_mini";
};

SNSMiniChatWindow.prototype = new SNSWindow();

SNSMiniChatWindow.prototype._init = function() {
	this.getDom().bind("click", function(){
		SNSIMWindow.getInstance()._toggleMiniChatWindow();
	});
};

SNSMiniChatWindow.prototype.beforeShow = function() {
	var roster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	this.setTitle(roster.name);
};

SNSMiniChatWindow.prototype.setTitle = function(title) {
	this.getDom().text(title);
};
