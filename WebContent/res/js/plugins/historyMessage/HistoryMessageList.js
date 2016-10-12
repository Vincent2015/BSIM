/**
 * 存放历史消息列表，key为chatroom或roster的jid
 */
var SNSHistoryMessageList = function(){
	this.pageSize = 5;
	this.currentRosterOrChatroom;
	this.requesting = false;
	this._init();
};

SNSHistoryMessageList.prototype = new SNSBaseList();

SNSHistoryMessageList.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, function(e, data) {
		if(data && data.newValue){
			var newTab = data.newValue;
			var id = newTab.getTarget().getID();
			if(!id)
				return;
			//if(!this.get(id) || !this.get(id).messages || this.get(id).messages.length <= 0){
				var hisMsgArray = new SNSHistoryMessageArray();
				this.add(id,hisMsgArray);
				hisMsgArray.scrollToBottom = true;
				this.showHistoryMessage(SNSApplication.getInstance().getUser().getRosterOrChatRoom(id));
//				SNSIMWindow.getInstance().getChatWindow().getTab(jid).scrollToBottom();
			//}
		}
	}, this);

	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.TAB_CLOSED, true, function(e, tab) {
		var bareJid;
		if(!tab)
			return;
		if(tab.chatroom)
			bareJid = YYIMChat.getJIDUtil().getBareJID(tab.chatroom);
		if(tab.roster)
			bareJid = YYIMChat.getJIDUtil().getBareJID(tab.roster);
		this.get(bareJid) && this.get(bareJid).messages? this.get(bareJid).messages = new Array():null;
	}, this);
};

/**
 * 显示历史消息后，请求下次即将显示的历史消息
 * @param rosterOrChatroom
 */
SNSHistoryMessageList.prototype.showHistoryMessage = function(rosterOrChatroom){
	if(typeof rosterOrChatroom == "string"){
		this.currentRosterOrChatroom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterOrChatroom);
	}else{
		this.currentRosterOrChatroom = rosterOrChatroom;
	}
	var curId;
	if(this.currentRosterOrChatroom)
		curId = this.currentRosterOrChatroom.getID();
	if(!curId)
		return;
	if(!this.get(curId)){
		var hisMsgArray = new SNSHistoryMessageArray();
		this.add(curId,hisMsgArray);
	}
	
	var _self = this;
	// 没有预请求的消息
	if(this.get(curId).messages.length <= 0){
		this.requestHistoryMessage(this.currentRosterOrChatroom, function(msgArr){
			_self.get(_self.currentRosterOrChatroom.getID()).show(_self.currentRosterOrChatroom);
			_self.requestHistoryMessage(_self.currentRosterOrChatroom);
		});
	} else {
		// 显示
		jQuery.when(this.get(this.currentRosterOrChatroom.getID()).show(this.currentRosterOrChatroom))
		// 预请求
		.done(jQuery.proxy(function(){
			this.requestHistoryMessage(this.currentRosterOrChatroom);
		},this));
	}
};

SNSHistoryMessageList.prototype.requestHistoryMessage = function(rosterOrChatroom, successFunc){
	this.get(rosterOrChatroom.getID()).currentCount = this.getStart();
	
	var hisMsgArr = this.get(rosterOrChatroom.getID());
	if(hisMsgArr && hisMsgArr.count > 0 && this.getStart() >= hisMsgArr.count){
		hisMsgArr.showNoMsgInfoHtml(rosterOrChatroom);
		return;
	}
	if(this.requesting)
		return;
	this.requesting = true;

	var _self = this;
	var arg = {
		id: rosterOrChatroom.getID(),
		start: this.getStart(),
		num: this.pageSize,
		success: function(data) {
			_self.requesting = false;
			var hisMsgArray = _self.get(_self.currentRosterOrChatroom.getID());
			hisMsgArray.count = data.count;
			var user = SNSApplication.getInstance().getUser();
			for(var i = 0; i < data.result.length; i++){
				var msgItem = data.result[i];
				var hisMsg = new SNSHistoryMessage();
				hisMsg.id = msgItem.msgId;
				
				if(msgItem.fromId == user.getID()){
					hisMsg.type = SNS_FILTER_TYPE.SEND;
					hisMsg.from = user;
					hisMsg.to = user.getRosterOrChatRoom(msgItem.toId);
				}else{
					hisMsg.type = SNS_FILTER_TYPE.RECEIVED;
					hisMsg.from = user.getRosterOrChatRoom(msgItem.fromId);
					
					if(hisMsg.from instanceof SNSChatRoom){
						hisMsg.member = new SNSRoster(msgItem.memberId);
					}
					
					hisMsg.to = user;
				}
				hisMsg.body = Object.clone(msgItem.body);
				if(hisMsg.body){
					if(hisMsg.body.style)
						hisMsg.body.style = jQuery.extend(new SNSMessageStyle(), hisMsg.body.style);
					hisMsgArray.messages.push(hisMsg);
				}
			}
			
			if(SNSCommonUtil.isFunction(successFunc))
				successFunc(hisMsgArray);
		}
	}
	if(rosterOrChatroom instanceof SNSRoster){
		arg.chatType = 'chat';
	}else{
		arg.chatType = 'groupchat';
	}
	
	YYIMChat.getHistoryMessage(arg);
	
};

/**
 * 已经显示的消息条数
 */
SNSHistoryMessageList.prototype.getStart = function(){
	var msgContainer = SNSIMWindow.getInstance().getChatWindow().getTab(this.currentRosterOrChatroom).getContentDom().find(".snsim_message_box_container");
	var start = msgContainer.children().length;
	
	var msgInfoDom = jQuery("#" + SNSHistoryMessageArray.msgInfoIdPrefix + this.currentRosterOrChatroom.getID());
	if(msgInfoDom.length > 0){
		start -= msgInfoDom.length;
	}
	
	return start? start : 0;
};
