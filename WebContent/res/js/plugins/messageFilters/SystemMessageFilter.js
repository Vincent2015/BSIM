var SNSSystemMessageFilter = function() {

	this.name = "systemMessageFilter";
	
	this.priority = 100;
	
	this.contentType = SNS_MESSAGE_CONTENT_TYPE.SYSTEM;
	
	this.type = SNS_FILTER_TYPE.RECEIVED;
	
	this.acceptBtnSelector = ".accept_btn";
	this.ignoreBtnSelector = ".ignore_btn";
	
	this.invitationTemplate = 
		'<div class="snsim_system_message">'
			+ '<img src="##{{roster.getPhotoUrl()}}"/>'
			+ '<div class="snsim_system_message_info">'
				+ '<div style="display: inline-block;">'
					+ '<span>##{{roster.name}}</span>'
					+ '<span style="display: block; color: #A19F9F;">##{{SNS_I18N.chatRoom_invitation}}##{{chatroom.name}}</span>'
				+ '</div>'
				+ '<div class="snsim_system_message_confirm">'
					+ '<a class="accept_btn">接受</a>'
					+ '<a class="ignore_btn">忽略</a>'
				+ '</div>'
			+ '</div>'
		+ '</div>';
	this.requestSubscribeTemplate = 
		'<div class="snsim_system_message">'
			+ '<img src="##{{roster.getPhotoUrl()}}"/>'
			+ '<div class="snsim_system_message_info">'
				+ '<div style="display: inline-block;">'
					+ '<span>##{{roster.name}}</span>'
					+ '<span style="display: block; color: #A19F9F;">##{{SNS_I18N.subscribe_request}}</span>'
				+ '</div>'
				+ '<div class="snsim_system_message_confirm">'
					+ '<a class="accept_btn">接受</a>'
					+ '<a class="ignore_btn">忽略</a>'
				+ '</div>'
			+ '</div>'
		+ '</div>';

	this._doFilter = function(msg) {
		if(msg.type == SNS_MESSAGE_TYPE.INVITE){
			msg.html = TemplateUtil.genHtml(this.invitationTemplate, msg);
		}else if(msg.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			msg.html = TemplateUtil.genHtml(this.requestSubscribeTemplate, msg);
		}
	};
};
SNSSystemMessageFilter.prototype = new SNSMessageFilter();
SNSSystemMessageFilter.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_MESSAGE_SHOW, true, this.bindDomEvent, this);
//	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM, true, this.renderAddChatRoom, this);
	SNSMessageFilter.prototype._init.call(this);
}

SNSSystemMessageFilter.prototype.bindDomEvent = function(event,msg){
	jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + msg.id).find(this.acceptBtnSelector).bind("click", {_msg:msg, _self:this}, function(event){
		var msgContainer = jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + event.data._msg.id);
		var obj = {
			systemFilter: event.data._self, 
			message: event.data._msg,
			container: msgContainer
		};
		if(obj.message.type == SNS_MESSAGE_TYPE.INVITE){
			obj.systemFilter.processInvitation(obj, true);
		}else if (obj.message.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			obj.systemFilter.processSubscription(obj, true);
		}
		
		obj.systemFilter.renderProcessResult(obj, true);
	});
	jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + msg.id).find(this.ignoreBtnSelector).bind("click", {_msg:msg, _self:this}, function(event){
		var msgContainer = jQuery("#" + SNSReceivedMessageBox.ID_PREFIX + event.data._msg.id);
		
		var obj = {
			systemFilter: event.data._self, 
			message: event.data._msg,
			container: msgContainer
		};
		if(obj.message.type == SNS_MESSAGE_TYPE.INVITE){
			obj.systemFilter.processInvitation(obj, false);
		}else if (obj.message.type == SNS_MESSAGE_TYPE.SUBSCRIBE){
			obj.systemFilter.processSubscription(obj, false);
		}
		
		obj.systemFilter.renderProcessResult(obj, false);
	});
};

/**
 * 接受群邀请
 * @param obj [systemFilter, message, container]
 */
SNSSystemMessageFilter.prototype.processInvitation = function(obj, isAccept){
	if(isAccept){
		jQuery.when(obj.message.chatroom.join()).done(function(thisObj){
			SNSApplication.getInstance().getUser().chatRoomList.addChatRoom(thisObj.message.chatroom);
//			SNSIMWindow.getInstance().getWideWindow().getTab("chatroom").addChatRoom(thisObj.message.chatroom);
			SNSIMWindow.getInstance().getChatWindow().openChatWith(thisObj.message.chatroom);
		}(obj));
	}else{
		return;
	}
};

/**
 * 接受好友请求
 * @param obj [systemFilter, message, container]
 */
SNSSystemMessageFilter.prototype.processSubscription = function(obj, isAccept){
	if(isAccept){
		//SNSApplication.getInstance().getUser().subscribe.approveSubscribe(obj.message.roster.getID());
		YYIMChat.approveSubscribe(obj.message.roster.getID());
	}else{
		YYIMChat.rejectSubscribe(obj.message.roster.getID());
	}
};

/**
 * 渲染处理结果
 * @param isAccept boolean
 */
SNSSystemMessageFilter.prototype.renderProcessResult = function(obj, isAccept){
	obj.container.find(obj.systemFilter.acceptBtnSelector).addClass("unuse");
	if(isAccept)
		obj.container.find(obj.systemFilter.acceptBtnSelector).text("已接受");
	else
		obj.container.find(obj.systemFilter.acceptBtnSelector).text("已忽略");
		
	obj.container.find(obj.systemFilter.acceptBtnSelector).unbind();
	obj.container.find(obj.systemFilter.ignoreBtnSelector).remove();
};

new SNSSystemMessageFilter().start();