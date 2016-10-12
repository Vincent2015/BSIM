var SNSSystemRoster = function(){
	this.name = "系统消息";
	this.id = "system";
	this.show= "systemroster";
	this.messageList = new Array();
	this.photoUrl = SNSConfig.SYSTEM_ROSTER.DEFAULT_AVATAR;
};

SNSSystemRoster.prototype = new SNSRoster();

SNSSystemRoster.prototype.getPhotoUrl = function(){
	return this.photoUrl;
};

SNSSystemRoster.prototype.addMsg = function(uuid, msg){
	msg.from = this.id;
	var systemMsg = new Object();
	systemMsg.uuid = uuid;
	systemMsg.msg = msg;
	this._messageList.push(systemMsg);
	if(SNSRosterRender.findActiveRoster() instanceof SNSSystemRoster){
		SNSMessageRender.showMessage(msg);
		SNSWindow.changeCurrentChatTo(this.id);
	}else{
		if(SNSRosterRender.isChatWindowLeftItemOpened(this.id)){
			SNSMessageRender.showMessage(msg);
		}
		SNSMessageRender.twinkle(msg, this.id);
	}
};

SNSSystemRoster.prototype.showMsg = function(){
	SNSWindow.changeCurrentChatTo(this.id);
	for(var i in this._messageList){
		if(!this.isMsgRendered(this._messageList[i].uuid)){
			SNSMessageRender.showMessage(this._messageList[i].msg);
		}
	}
	// 去掉未读消息标志
	SNSInitBinder.systemMessageBtn.find("span").attr("class","");
};

SNSSystemRoster.prototype.updateMsgContent = function(msgUuid, content){
	for(var i in this._messageList){
		if(this._messageList[i].uuid == msgUuid){
			this._messageList[i].msg.body.content = content;
		}
	}
};

SNSSystemRoster.prototype.isMsgRendered = function(msgUuid){
	return jQuery("div[action-data='" + msgUuid + "']").length > 0;
};

SNSSystemRoster.prototype.clearMsg = function(){
	this._messageList.splice(0,this._messageList.length);
};

SNSSystemRoster.prototype.getID = function(){
	return this.id;
};