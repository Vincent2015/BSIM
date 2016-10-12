var SNSInnerMessageTab = function(chatroom){
	
	this.name = "message";
	
	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_message_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_message_"+chatroom.getID();
};

SNSInnerMessageTab.prototype = new SNSTab();

SNSInnerMessageTab.prototype._init = function(){
	YYIMChat.log("SNSInnerMessageTab.prototype._init ",3);
};