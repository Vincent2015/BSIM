/**
 * 消息的字数filter, 若超出字数，则抛出异常，终止发送
 * @Class SNSCharacterCountFilter
 */
var SNSCharacterCountFilter = function(){
	
	this.name = "characterCountFilter";
	
	this.priority = 40;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.TEXT;
	
	this.type = SNS_FILTER_TYPE.SEND;
	
	this._doFilter = function(msg) {
		var content = msg.body.content;
		if(content){
			if(typeof content == "string" && content.notEmpty()){
				if(content.length>SNSConfig.MESSAGE.MAX_CHARACTER){
					throw SNS_I18N.message_character_exceed;
				}
			}
		}
	}
};
SNSCharacterCountFilter.prototype = new SNSMessageFilter();
new SNSCharacterCountFilter().start();