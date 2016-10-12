var SNSHistoryMessagePlugin = function() {
	
	this.name="historyMessagePlugin";
	
	this.enable = true;

	this.historyMessageList;
	
	this.showHistoryMessageBtnSelector = "#history_message";
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSHistoryMessagePlugin.prototype = new SNSPlugin();

SNSHistoryMessagePlugin.prototype._init = function() {
	SNSHistoryMessagePlugin._instance = this;
	this.historyMessageList = new SNSHistoryMessageList();
	this._bindDomEvent();
	
	SNSPlugin.prototype._init.call(this);
};

SNSHistoryMessagePlugin.prototype._bindDomEvent = function(){
	jQuery(this.showHistoryMessageBtnSelector).bind("click", jQuery.proxy(function(){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		this.historyMessageList.showHistoryMessage(activeRoster);
	},this));
	// 鼠标向上滑显示历史消息
	/*jQuery("#snsim_chat_window_tab_content").bind("mousewheel", jQuery.proxy(function(event, delta, deltaX, deltaY){
		// 向下滑
		if(deltaY <= 0)
			return;
		var firstMsgDom = SNSIMWindow.getInstance().getChatWindow().getCurrentTab().getContentDom().find(".snsim_message_box_container").children(":first");
		if(firstMsgDom.length > 0){
			var firstMsgDomOffsetTop = firstMsgDom.offset().top;
			// 聊天框右边头部
			var chatRtTitleOffsetTop = jQuery("#snsim_chat_rt_title").offset().top;
			// 50为右边头部的大致高度
			if(firstMsgDomOffsetTop > chatRtTitleOffsetTop + 40){
				var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
				this.historyMessageList.showHistoryMessage(activeRoster);
			}
		}else{
			var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
			this.historyMessageList.showHistoryMessage(activeRoster);
		}
	},this));*/
};

SNSHistoryMessagePlugin.getInstance = function(){
	return SNSHistoryMessagePlugin._instance;
}
new SNSHistoryMessagePlugin().start();