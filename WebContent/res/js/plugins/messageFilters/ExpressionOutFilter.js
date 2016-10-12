/**
 * 对输入框内的表情进行编码，减少发送字节数，并适配移动端等
 */
var SNSExpressionOutFilter = function(){
	
	this.name = "expressionoutFilter";
	
	this.priority = 10;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.SEND;
	
	SNSExpressionOutFilter.pattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	
	this._doFilter_ = function(message) {
		var content = message.body.content;
		var matchs = content.match(SNSExpressionOutFilter.pattern);
		if(!matchs) return;
		for(var m = 0; m<matchs.length;m++){
			var match = matchs[m];
			match = match.match(/([\w_]+?\.gif)/ig);
			var expressions = SNSExpressionData.DEFAULT.data;
			for(var i  = 0; i< expressions.length; i++){
				var item = expressions[i];
				if(item.url == match ){
					content = content.replace(matchs[m], item.actionData);
					message.body.expression++;//更改expression字段值， 减少消息中的字符误判
					break;
				}
			}
		}
		message.body.content = content;
	}
}
SNSExpressionOutFilter.prototype = new SNSMessageFilter();
//new SNSExpressionOutFilter().start();
//SNSMessageFilterChain.registerFilter(new SNSExpressionOutFilter());

SNSExpressionOutFilter.genContent = function(content){
	var pattern = /<img[\w\W]+?node-type=\"expression\"[\w\W]+?>/ig;
	var matchs = content.match(pattern);
	if(!matchs) return content;
	for(var m = 0; m<matchs.length;m++){
		var match = matchs[m];
		match = match.match(/([\w_]+?\.gif)/ig);
		var expressions = SNSExpressionData.DEFAULT.data;
		for(var i  = 0; i< expressions.length; i++){
			var item = expressions[i];
			if(item.url == match ){
				content = content.replace(matchs[m], item.actionData);
			}
		}
	}
	return content;
};