var SNSExpressionPlugin = function(){
	this.name = "exrepssion";
	
	this.panel = new SNSExpressionPanel(SNSExpressionData);
};

SNSExpressionPlugin.prototype = new SNSPlugin();

SNSExpressionPlugin.prototype._init = function(){
	this.panel._init();
	SNSPlugin.prototype._init.call(this);
};

new SNSExpressionPlugin().start();