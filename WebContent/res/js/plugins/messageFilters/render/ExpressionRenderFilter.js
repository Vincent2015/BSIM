
/**
 * 对接收到的消息中表情进行html元素替换， 保证渲染效果
 * 消息的类型为text
 */
var SNSExpressionRenderFilter = function() {

	this.name = "expressionInFilter";
	
	this.priority = 30;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	SNSExpressionRenderFilter.pattern = /\[\:[\u4e00-\u9fa5_a-zA-Z0-9]+?\]/g;

	this._doFilter = function(msg) {
		var source = msg.body.content;
		//if(msg.body.expression>0){//对expression字段进行检测，尽量减少误判
			msg.body.content = SNSExpressionRenderFilter.decode(source);
		//}
	};
	
	SNSExpressionRenderFilter.decode = function(source){
		if (typeof source == 'number') {
			source = source + '';
		}
		if(!source){	
			return null;
		}
		var matchs = source.match(SNSExpressionRenderFilter.pattern);
		if(matchs && matchs.length > 0){
			matchs = YYIMChat.getArrayUtil().unique(matchs);
		}
		for ( var m in matchs) {
			var img = jQuery("a[action-data='" + matchs[m] + "'] img");
			if (img.length > 0) {
				source = source.replace(new RegExp(matchs[m].replace("[","\\[").replace("]","\\]"),"g"), "<img node-type=\"expression\" src=\"" + img.attr('src') + "\"/>")
			}
		}
		return source;
	}
};
SNSExpressionRenderFilter.prototype = new SNSMessageFilter();
new SNSExpressionRenderFilter().start();
//SNSMessageFilterChain.registerFilter(new SNSExpressionInFilter());
