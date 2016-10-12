var SNSMessageOutBox = function(){
	this.filter = new SNSMessageFilterChain();
};

SNSMessageOutBox.prototype._init = function(){
};

SNSMessageOutBox.prototype.getFilter = function(){
	return this.filter;
}
