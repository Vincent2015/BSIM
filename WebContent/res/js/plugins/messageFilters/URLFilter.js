/**
 * 对消息中的url字符串进行处理, 为url形式的字符串添加链接
 * 消息的类型为text
 * @Class SNSURLFilter
 */
var SNSURLFilter = function() {

	this.name="urlFilter";
	
	this.priority = 20;
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.RECEIVED | SNS_FILTER_TYPE.SEND;
	
	this.pattern = /(http|https|ftp)\:\/\/([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|localhost|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(\:[0-9]+)*(\/($|[a-zA-Z0-9\.\,\?\'\\\+&%\$#\=~_\-]+))*/g

	this._doFilter = function(msg) {
		var content = msg.body.content;
		if(!content){
			return;
		}
		var matchs = content.match(this.pattern);
		for ( var m in matchs) {
			content = content.replace(matchs[m], "<a target='_blank' href='" + matchs[m] + "'>"+matchs[m]+"</a>")
		}
		msg.body.content = content;
	};
};
SNSURLFilter.prototype = new SNSMessageFilter();
//new SNSURLFilter().start();