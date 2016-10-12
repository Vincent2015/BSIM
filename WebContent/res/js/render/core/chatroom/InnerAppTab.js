var SNSInnerAppTab = function(chatroom){
	this.name = "app";

	/**
	 * Tab标签头部的选择器
	 * @Type {String}
	 * @Field
	 */
	this.headSelector = "#snsim_tab_head_app_"+chatroom.getID();
	
	/**
	 * Tab内容的选择器
	 * @Type {String}
	 * @Field
	 */
	this.contentSelector= "#snsim_tab_content_app_"+chatroom.getID();
};

SNSInnerAppTab.prototype = new SNSTab();

SNSInnerAppTab.prototype._init = function(){
	YYIMChat.log("SNSInnerAppTab.prototype._init",3);
};