var SNSFontPlugin = function(){
	this.name = "font";
	
	this.panel = new SNSFontPanel();
};

SNSFontPlugin.prototype = new SNSPlugin();

SNSFontPlugin.prototype._init = function(){
	this.panel._init();
	SNSPlugin.prototype._init.call(this);
};

new SNSFontPlugin().start();