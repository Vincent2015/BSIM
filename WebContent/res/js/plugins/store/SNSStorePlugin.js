var SNSStorePlugin = function(){
	this.name = "store";
	this.enable = true;
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
	this.chatTabNames = [];
};

SNSStorePlugin.prototype = new SNSPlugin();

SNSStorePlugin.prototype.getChatTabsKey = function(){
	return "chatTabs#" + YYIMChat.getUserBareJID();
};
SNSStorePlugin.prototype.getActiveChatTabKey = function(){
	return "activeChatTab#" + YYIMChat.getUserBareJID();
};

SNSStorePlugin.prototype._init = function(){
	// 打开聊天框时存入LocalStorage
	//SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.TAB_OPENED, true, this.onTabOpened, this);
	
	// 切换聊天框时存入LocalStorage
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, this.onTabChange, this);
	
	// 重新登录成功后还原上次状态
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_ROSTER, true, this.recover, this);
};

//SNSStorePlugin.prototype.onTabOpened = function(e, jid) {
//	if(!jid)
//		return;
//	SNSStorage.setLocal(this.getActiveChatTabKey(), jid);
//	if(!SNSArrayUtil.contains(this.chatTabNames, jid)){
//		this.chatTabNames.push(jid);
//		var jsonValue;
//		try{
//			jsonValue = JSON.stringify(this.chatTabNames);
//		}catch (e) {
//			YYIMChat.log("json parse error", 3, e);
//		}
//		if(jsonValue)
//			SNSStorage.setLocal(this.getChatTabsKey(), jsonValue);
//	}
//};

SNSStorePlugin.prototype.onTabChange = function(e, data) {
	if(data && data.newValue){
		var newTab = data.newValue;
		var jid = YYIMChat.getJIDUtil().getBareJID(newTab.getTarget().jid);
		if(!jid)
			return;
		SNSStorage.setLocal(this.getActiveChatTabKey(), jid);
		if(!SNSArrayUtil.contains(this.chatTabNames, jid)){
			this.chatTabNames.push(jid);
			var jsonValue;
			try{
				jsonValue = JSON.stringify(this.chatTabNames);
			}catch (e) {
				YYIMChat.log("json parse error", 3, e);
			}
			if(jsonValue)
				SNSStorage.setLocal(this.getChatTabsKey(), jsonValue);
		}
	}
};


SNSStorePlugin.prototype.recover = function() {
	// 上次活动的聊天框, 临时保存, 以免openChatWith()的时候被覆盖
	var tmpLastActiveChatTab = SNSStorage.getLocalVal(this.getActiveChatTabKey());
	// 上次打开的聊天框
	var chatTabsValue = SNSStorage.getLocalVal(this.getChatTabsKey());
	var chatTabNames = chatTabsValue? JSON.parse(chatTabsValue) : null;
	if(SNSArrayUtil.isArray(chatTabNames)){
		for(var i = 0; i < chatTabNames.length; i++){
			SNSIMWindow.getInstance().getChatWindow().openChatWith(chatTabNames[i]);
		}
	}
	// 上次活动的聊天框
	if(tmpLastActiveChatTab){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(tmpLastActiveChatTab);
	}
};

SNSStorePlugin.getInstance = function(){
	return SNSStorePlugin._instance;
}
// new SNSStorePlugin().start();