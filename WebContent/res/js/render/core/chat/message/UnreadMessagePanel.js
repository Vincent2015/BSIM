var SNSUnreadMessagePanel = function(){
	this.selector = "#snsim_unread_message_panel";
	this.containerSelector = this.selector+ " ul";
	
	this.ignoreAllBtnSelector = "#ignore_all";
	this.checkAllBtnSelector = "#check_all";
	
	this.indicator = "#snsim_unread_message_indicator";
	
	this.messageTemplate =
  		'<li rosterId="##{{getRosterOrChatRoom().getID()}}" style="cursor: pointer;">'
			+ '<div class="name_content">'
				+ '<div style="display:block;margin-top: 12px;">##{{getRosterOrChatRoom().name}}</div>'
				+ '<div class="remind_message_content">##{{body.content}}</div>'
			+ '</div>'
			+ '<span class="remind_message_num">1</span>'
		+ '</li>';
};


SNSUnreadMessagePanel.prototype = new SNSFloatPanel();

SNSUnreadMessagePanel.prototype._init = function(){
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, true,
			this.onMessageIn, this);
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true,
			this.onChatTabChange, this);
	
	jQuery(this.indicator).bind("mouseenter", jQuery.proxy(function(){
		// 有未读消息，打开相应消息；
		var dom = this.getContainerDom().find("li");
		if(dom && dom.length>0){
			this.show();
		}
	}, this));
	
	jQuery(this.indicator).bind("mouseleave", jQuery.proxy(function(){
		var handled = false;
		this.getDom().bind("mouseenter", jQuery.proxy(function(){
			handled = true;
			this.show();
		}, this));
		this.getDom().bind("mouseleave", jQuery.proxy(function(){
			handled = true;
			this.hide();
		}, this));
		setTimeout(jQuery.proxy(function(){
			if(!handled)
				this.hide();
		},this), 200);
	}, this));
	
	jQuery(this.indicator).bind("click", jQuery.proxy(function(){
		SNSIMWindow.getInstance().getChatWindow().openChatWith(SNSApplication.getInstance().getUser().systemRoster.getID());
	}, this));
	
	// 忽略全部
	jQuery(this.ignoreAllBtnSelector).bind("click", jQuery.proxy(function(){
		this.ignoreAllMsg();
	}, this));
	// 查看全部
	jQuery(this.checkAllBtnSelector).bind("click", jQuery.proxy(function(){
		this.checkAllMsg();
	}, this));
};

SNSUnreadMessagePanel.prototype.onMessageIn = function(event, data){
	var message = data.message;
	var target = message.getRosterOrChatRoom();
	var tab = SNSIMWindow.getInstance().getChatWindow().getTab(target);
	if(!tab || !tab.isHeadVisible()){
		this.renderUnreadMessage(message);
	}
};

SNSUnreadMessagePanel.prototype.onChatTabChange = function(event, data){
	var oldTab = data.oldValue;
	var newTab = data.newValue;
	var rosterId = newTab.getTarget().id;
	var dom = this.getContainerDom().find("li[id='"+rosterId+"']");
	if(!dom || dom.length<=0){
		// dom = this.getContainerDom().find("li[fullJid='"+newTab.getTarget().jid.toString()+"']");
	}
	//if(dom && dom.length>0){
		this.removeUnreadMessage(rosterId);
	//}
};

SNSUnreadMessagePanel.prototype.renderUnreadMessage = function(message){
	var roster = message.getRosterOrChatRoom();
	var rosterId = roster.getID();
	if(roster instanceof SNSDeviceRoster){
		// rosterId = roster.jid.toString();
	}
	
	var dom = this.getContainerDom().find("li[rosterId='"+rosterId+"']");
	if(!dom || dom.length < 1){
		// dom = this.getContainerDom().find("li[fullJid='"+rosterId+"']");
	}
	
	var tab;
	if(roster instanceof SNSChatRoom){
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
	}else{
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	}

	if(dom && dom.length>0){//unreadMessage 已经存在
		var unreadMessageNum = parseInt(dom.find(".remind_message_num").text());
		dom.find(".remind_message_num").text(unreadMessageNum+1);
		dom.find(".remind_message_content").text(message.body.content);
		// roster|chatroom tab 中进行消息数量提示
		tab.renderUnreadMsgNum(roster, unreadMessageNum+1);
		return;
	}else{
		var html = TemplateUtil.genHtml(this.messageTemplate, message);
		this.getContainerDom().append(html);
		this._bindClickEvent(rosterId);
		this.updateUnreadMessageIndicator();
		tab.renderUnreadMsgNum(roster, 1);
	}
};

/**
 * 我的设备的时候，bareJid为全jid
 * @param rosterId
 */
SNSUnreadMessagePanel.prototype._bindClickEvent = function(rosterId){
	var dom = this.getContainerDom().find("li[rosterId='"+rosterId+"']");
	if(!dom || dom.length < 1){
		// dom = this.getContainerDom().find("li[fullJid='"+bareJid+"']");
	}
	
	dom.bind("click", {self:this,rId:rosterId},function(event){
		var self = event.data.self;
		var rId = event.data.rId;
		var user = SNSApplication.getInstance().getUser();
		if(!user.getRosterOrChatRoom(rId)){
			user.rosterList.add(new SNSRoster(rId));
		}
		var tab = SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.rId);
		self.removeUnreadMessage(rId);
	});
};

SNSUnreadMessagePanel.prototype.beforeShow = function(){
	var dom = this.getDom();
	var offset = jQuery(this.indicator).offset();
	var num = this.getContainerDom().find("li").length;
	num > 4? num = 4:null;
	dom.css("top", offset.top-30-num*66);
	dom.css("left", offset.left-62);
};

/**
 * 
 * @param rosterId {JSJaCJID|SNSRoster|String} 
 */
SNSUnreadMessagePanel.prototype.removeUnreadMessage  = function(rosterId){
	// var rosterId = YYIMChat.getJIDUtil().getBareJID(jid);
	this.getContainerDom().find("li[rosterId='"+rosterId+"']").remove();
	// this.getContainerDom().find("li[fullJid='"+rosterId+"']").remove();
	
	this.updateUnreadMessageIndicator();
	var roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(rosterId);
	var tab;
	if(roster instanceof SNSChatRoom){
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
	}else{
		tab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	}
	tab.clearUnreadMsgNum(roster);
	
	var items = this.getContainerDom().find("li");
	if(!items || items.length==0){
		this.hide();
	}
};

SNSUnreadMessagePanel.prototype.updateUnreadMessageIndicator = function(){
	var items = this.getContainerDom().find("li");
	if(!items || items.length==0){
		jQuery(this.indicator).find("span").removeClass("unread_system_messages");
		jQuery(this.indicator).addClass("system_messages_bg");
	}else{
		jQuery(this.indicator).find("span").addClass("unread_system_messages");
		jQuery(this.indicator).removeClass("system_messages_bg");
	}
};

SNSUnreadMessagePanel.prototype.ignoreAllMsg = function(){
	var doms = this.getContainerDom().find("li");
	var user = SNSApplication.getInstance().getUser();
	for(var i = 0; i < doms.length; i++){
		var rosterId = jQuery(doms[i]).attr("rosterId");
		if(!user.getRosterOrChatRoom(rosterId)){
			// jid = jQuery(doms[i]).attr("fullJid")
		}
		this.removeUnreadMessage(rosterId);
		SNSApplication.getInstance().getMessageInBox().popUnreadMessageByRoster(user.getRosterOrChatRoom(rosterId));
	}
};
SNSUnreadMessagePanel.prototype.checkAllMsg = function(){
	var doms = this.getContainerDom().find("li");
	for(var i = 0; i < doms.length; i++){
		jQuery(doms[i]).trigger("click");
	}
};