/**
 * 聊天窗口对象，包含对聊天窗口的各种操作， 包括添加聊天条目，删除聊天条目
 * @Class SNSChatWindow
 * @extends SNSTabContainer
 * @Constructor
 * @author aviator
 */
var SNSChatWindow = function() {
	this.selector = "#snsim_chat_window";
	this.titleContainerSelector = "#snsim_chat_rt_title";
	// 聊天窗体(包含个人设置，为this.getDom()的父节点)
	this.chatBoxSelector = "#snsim_chat_box";
	// 透明div，拖动时防止鼠标选中其他元素
	//this.transparentPanelSelector = "#snsim_coverlayer";

	this.miniBtnSelector = "#snsim_chat_windown_mini_btn";
	this.closeBtnSelector = "#snsim_chat_windown_close_btn";

	this.headContainerSelector = "#snsim_chat_window_tab_head";
	this.contentContainerSelector = "#snsim_chat_window_tab_content";

	this.currentChatPhotoSelector = ".snsim_current_roster_photo";
	this.currentChatRosterNameSelector = ".sns_curchat_title";

	this.showChatroomMembersSelector = "#show_chatroom_members";
	
	// 正在聊天tab列表向上或向下滚动按钮选择器
	this.scrollTopSelector = ".snsim_scroll_top";
	this.scrollBottomSelector = ".snsim_scroll_bottom";
	
	// 是否使用默认坐标
	//this.useDefaultPosition = true;
	/**
	 * 聊天窗口的输入框
	 * @Field
	 */
	this.sendBox = new SNSSendBox();
	
//	this.drag = false;
};

SNSChatWindow.prototype = new SNSTabContainer();

SNSChatWindow.prototype.getSendBox = function() {
	return this.sendBox;
}

SNSChatWindow.prototype._init = function() {
	YYIMChat.log("SNSChatWindow.prototype._init", 3);
	this.transPosition(true);
	
	this.enableMove();
	
	// 鼠标滚动, 隐藏纵轴滚动条
	jQuery(".snsim_chat_friend_box").perfectScrollbar({suppressScrollX:true,setOffsetRight:true,offsetRight:0});
	// 绑定最小化/关闭/tab列表滚动按钮事件
	this._bindWindowButtonEvent();

	// 绑定接收到消息时的全局事件
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_MESSAGE_IN, true,
			this.onMessageIn, this);
};

/**
 * 向聊天窗口添加消息， 若联系人的聊天窗口未打开， 则忽略消息
 * @param event {Object} 对应的事件对象
 * @param data {Object} 事件数据
 */
SNSChatWindow.prototype.onMessageIn = function(event, data) {
	var message = data.message;
	if(message && message instanceof SNSMessage){
		this.addMessage(message);
	}
};


SNSChatWindow.prototype.addMessage = function(message) {
	var target = message.getRosterOrChatRoom();
	var tab = this.getTab(target);
	if (tab) {
		tab.addMessage(message);
		if (this.getCurrentTab() !== tab) {
			tab.addMsgRemind();
		}else{
			//长连接收到的消息需要发送回执（ 接收回执和已读回执） rongqb 20150908
			if(message.body.receiptsbody && message.body.receiptsbody.type == PACKETTYPE.LONGCONNECT && message.body.receiptsbody.receipts === true){
				var arg = message.body.receiptsbody.arg;
				YYIMChat.sendReceiptsPacket(arg);
				YYIMChat.sendReadedReceiptsPacket(arg);
			}
		}
	}
	if(message.type == 'groupchat') {
		try{
			jQuery('#snsim_tab_content_share_' + message.chatroom.getID()).find('.snsim_share_file_refresh_btn').click();
		}catch(e){
			YYIMChat.log('groupshare_refresh',1,message,e);
		}
	} 
	
};

/**
 * 绑定窗口的最小化、关闭、tab列表滚动等事件
 * @Private
 */
SNSChatWindow.prototype._bindWindowButtonEvent = function() {
	//var that = this;
	jQuery(this.miniBtnSelector).on("click", function() {
		SNSIMWindow.getInstance()._toggleMiniChatWindow();
	});
	jQuery(this.closeBtnSelector).on("click", jQuery.proxy(function() {
//		for(var item in this.tabs._list)
//			this.tabs._list[item].getCloseBtnDom().trigger('click');
		this.hide();
	}, this));

	jQuery(this.showChatroomMembersSelector).on("click", jQuery.proxy(function(){
		if(this.getActiveRoster() instanceof SNSChatRoom)
			SNSIMWindow.getInstance().getChatroomMembersPanel().show();
	}, this));
	
	// 窗口拖动事件
	//jQuery(this.titleContainerSelector).bind("mouseenter", this.move);
	/*jQuery(this.titleContainerSelector).bind("mouseenter", function(event) {
		that.move(this);
//		jQuery.proxy(function(){
//			SNSComponent.prototype.move.call(that, this);
//		}, that)
	});*/
/*	jQuery(this.titleContainerSelector).bind("mouseenter", function() {
		SNSComponent.prototype.move.call(that, this);
	});
*/	
	// tab列表的滚动事件
	/*jQuery(this.scrollTopSelector).on("click", jQuery.proxy(function(){
		this.scrollTabList(SNS_DIRECTION.TOP);
	}, this));
	jQuery(this.scrollBottomSelector).on("click", jQuery.proxy(function(){
		this.scrollTabList(SNS_DIRECTION.BOTTOM);
	}, this));*/
}

/**
 * 根据联系人或者聊天室对象，获取对应的聊天Tab页对象
 * @param rosterOrChatRoom {SNSRoster|SNSChatRoom | JSJaCJID|String} 指定的联系人或者聊天室对象或者jid
 * @return {SNSTab}
 */
SNSChatWindow.prototype.getTab = function(rosterOrChatRoom) {
	if(rosterOrChatRoom.id)
		return this.tabs.get(rosterOrChatRoom.id);
	return this.tabs.get(rosterOrChatRoom);
};

/**
 * 返回当前活动的聊天窗口对应的联系人或者聊天室
 * @returns {SNSRoster|SNSChatRoom}
 */
SNSChatWindow.prototype.getActiveRoster = function() {
	var tab = this.getCurrentTab();
	if (tab) {
		if (tab instanceof SNSChatRoomChatTab) {
			return tab.chatroom;
		} else if(tab instanceof SNSPublicRosterChatTab){
			return tab.publicRoster;
		}else{
			return tab.roster;
		}
	}
};

/**
 * 打开指定联系人或者聊天室的对话Tab, 如果聊天窗口最小化或者隐藏，也会恢复显示
 * @param roster {SNSRoster|SNSChatRoom}
 */
SNSChatWindow.prototype.openChatWith = function(roster) {
	var rosterId;
	if(roster.id)
		rosterId = roster.id;
	else
		rosterId = roster;
	
	var tab = this.getTab(rosterId);
	if (!tab) {
		if (typeof roster == "string") {
			roster = SNSApplication.getInstance().getUser().getRosterOrChatRoom(roster);
			if (!roster) {
				throw "invalid roster";
			}
		}
		tab = this._addNewChat(roster);
	}
	
	if (this.getCurrentTab() != tab) {
		
		var old = this.getCurrentTab();
		
		this.changeTabTo(tab);
		// 更换当前聊天人的头像
		this.updateTitle(old, tab);
	}
	this._renderUnreadMessage(roster);
	SNSIMWindow.getInstance().getUnreadMessagePanel().removeUnreadMessage(rosterId);

	if (!this.visible()) {
		this.show();
	}
	
};

SNSChatWindow.prototype.onTabChange = function(oldTab, newTab) {
	newTab.removeMsgRemind();// 取消未读消息闪烁
	this.updateTitle(oldTab, newTab);// 更新聊天窗口的头像（左上角）
	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, [ {
		oldValue : oldTab,
		newValue : newTab
	} ]);
};

/**
 * 更新聊天窗口的头像
 * @param oldTab
 * @param newTab
 */
SNSChatWindow.prototype.updateTitle = function(oldTab, newTab){
	var roster = newTab.getTarget();
	jQuery(this.showChatroomMembersSelector).removeClass();
	if(roster instanceof SNSRoster){
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_roster");
	}else if(roster instanceof SNSChatRoom){
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_group");
	}else{
		jQuery(this.showChatroomMembersSelector).addClass("snsim_current_session_others");
	}
	this.getDom().find(this.currentChatPhotoSelector).attr("src",roster.getPhotoUrl());
	this.getDom().find(this.currentChatRosterNameSelector).text(roster.name)
	//currentChatRosterNameSelector
};

/**
 * 当聊天窗口从最小化或关闭状态打开时调佣
 * @Event afterShow
 */
SNSChatWindow.prototype.afterShow = function() {
	SNSIMWindow.getInstance().getMiniChatWindow().hide();
}

/**
 * 新建聊天Tab页
 * @param roster {SNSRoster|SNSChatRoom}联系人或者聊天室对象
 * @returns {SNSTab}
 */
SNSChatWindow.prototype._addNewChat = function(roster) {
	if (roster) {
		var tab;
		if (roster instanceof SNSPublicServiceRoster) {
			tab = new SNSPublicRosterChatTab(roster);
		} else if(roster instanceof SNSDeviceRoster) {
			tab = new SNSDeviceRosterChatTab(roster);
		} else if (roster instanceof SNSRoster) {
			tab = new SNSRosterChatTab(roster);
		} else if (roster instanceof SNSChatRoom) {
			tab = new SNSChatRoomChatTab(roster);
		} else if (roster instanceof SNSSystemRoster) {
			tab = new SNSSystemRosterChatTab(roster);
		} 
		if (tab) {
			this.addTab(tab);
			tab.scrollContent();
			this._bindTabHeadEvent(tab);
			return tab;
		}
	}
};

SNSChatWindow.prototype._renderUnreadMessage = function(roster){
	var messageArray =  SNSApplication.getInstance().getMessageInBox().popUnreadMessageByRoster(roster);
	if(messageArray){
		for(var i in messageArray){
			var msg = messageArray[i];
			if(msg && msg instanceof SNSInMessage){
				this.addMessage(msg);
			}
		}
	}
};

/**
 * 绑定聊天Tab页头部的点击切换和关闭按钮事件; 关闭tab页时， 若剩余tab页为0, 则关闭聊天窗口；若关闭tab为当前选中的，则从剩下的tab页中随机返回一个作为当前Tab
 * @param tab {SNSTab}
 */
SNSChatWindow.prototype._bindTabHeadEvent = function(tab) {
	// 点击关闭按钮
	tab.getCloseBtnDom().bind("click", {
		tab : tab
	}, jQuery.proxy(function(event) {
		event.data.tab.getHeadDom().remove();
		event.data.tab.getContentDom().remove();
		var next = this.removeTab(tab);
		if (this.tabs.size() == 0) {// 关闭最后一个tab
			this.hide();
		}
		if (next) {// 关闭当前打开的tab
			this.changeTabTo(next);
		}
		SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.TAB_CLOSED, [tab]);
	}, this));
	// 鼠标悬浮显示关闭按钮
	tab.getHeadDom().bind("mouseenter",{tab:tab},function(event){
		if(!event.data.tab.getHeadDom().hasClass("snsim_active"))
			event.data.tab.getCloseBtnDom().css("display","block");
	});
	tab.getHeadDom().bind("mouseleave",{tab:tab},function(event){
		event.data.tab.getCloseBtnDom().css("display","none");
	});
};

SNSChatWindow.prototype.afterSendMessage = function(message){
	var recentList = SNSApplication.getInstance().getUser().recentList;
	recentList.addNew(message);
	
	SNSApplication.getInstance().getMessageInBox().filter.doFilter(message);
	SNSIMWindow.getInstance().getChatWindow().getTab(message.to).addMessage(message);
	
	if(message.type == 'groupchat') {
		try{
			jQuery('#snsim_tab_content_share_' + message.chatroom.getID()).find('.snsim_share_file_refresh_btn').click();
		}catch(e){
			YYIMChat.log('groupshare_refresh',1,message,e);
		}
	} 
};

/**
 * 
 * @param direction SNS_DIRECTION[TOP,RIGHT,BOTTOM,LEFT]
 */
SNSChatWindow.prototype.scrollTabList = function(direction){
	// 每个tab的高度
	var span = 59;
	// 最后一个tab的最大top坐标
	var lastTabMaxTop = this.getDom().find(this.scrollTopSelector).offset().top - span;
	if(direction == SNS_DIRECTION.TOP && this._headContainer.offset().top < 45){
		this._headContainer.offset({top:this._headContainer.offset().top+span});
	}else if(direction == SNS_DIRECTION.BOTTOM && lastTabMaxTop < this._headContainer.children().last().offset().top){
		this._headContainer.offset({top:this._headContainer.offset().top-span});
	}
};

/**
 * 变换聊天窗口的坐标，宽版和窄板的默认位置
 * @param transToWide
 */
SNSChatWindow.prototype.transPosition = function(transToWide){
	if(!this.useDefaultPosition)
		return;
	
	var left = jQuery(window).width() - this.getDom().width() - 44;
	var top = jQuery(window).height() - this.getDom().height() - 47;
	if (transToWide) {
		left -= SNSIMWindow.getInstance().getWideWindow().width;// wideWindow的宽度
	} else {
		left -= SNSIMWindow.getInstance().getNarrowWindow().width;// narrowWindow的宽度
	}
	jQuery(this.chatBoxSelector).css("top", top);
	jQuery(this.chatBoxSelector).css("left", left);
};

/**
 * 窗口移动
 * @param event
 */
/*SNSChatWindow.prototype.move = function(event){
	var _self = SNSIMWindow.getInstance().getChatWindow();
	
	var x,y;
	this.onmousedown = function(e){
		if(!_self.checkMouseDownPosition(e)){
			return;
		}
		jQuery(_self.transparentPanelSelector).show();
		if(!!e === false) {
			e = window.event;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		SNSChatWindow.drag = true;
		x = e.clientX;
		y = e.clientY;
		document.onmousemove = function(e){
			SNSIMWindow.getInstance().getChatWindow().useDefaultPosition = false;
			if(!!e === false) {
				e = window.event;
			}
			var deltaX = e.clientX - x;
			var deltaY = e.clientY - y;
			if(!SNSChatWindow.drag){
				deltaX = deltaY = 0;
				jQuery(SNSIMWindow.getInstance().getChatWindow().transparentPanelSelector).hide();
				return;
			}
			
			var chatBox = jQuery(SNSIMWindow.getInstance().getChatWindow().chatBoxSelector);
			// 到达左（右）边界并继续左（右）移
			if((chatBox.offset().left <= 0 && deltaX < 0) || (jQuery(window).width() - chatBox.width() <= chatBox.offset().left && deltaX > 0)){
				deltaX = 0;
			}else{
				x = e.clientX;
			}
			// 到达上边界并继续上移
			if(chatBox.offset().top <= 0 && deltaY < 0 || (jQuery(window).height() - chatBox.height() <= chatBox.offset().top && deltaY > 0)){
				deltaY = 0;
			}else{
				y = e.clientY;
			}
			chatBox.css("left", chatBox.offset().left + deltaX);
			chatBox.css("top", chatBox.offset().top + deltaY);
		};
	};
	document.onmouseup = function(){
		var chatBox = jQuery(SNSIMWindow.getInstance().getChatWindow().chatBoxSelector);
		var left = chatBox.offset().left,top = chatBox.offset().top;
		// 到达左（右）边界并继续左（右）移
		if( chatBox.offset().left < 0){
			left = 0;
		}else if(jQuery(window).width() - chatBox.width() < chatBox.offset().left){
			left = jQuery(window).width() - chatBox.width();
		}
		// 到达上边界并继续上移
		if(chatBox.offset().top < 0){
			top = 0;
		}else if( jQuery(window).height() - chatBox.height() < chatBox.offset().top){
			top = jQuery(window).height() - chatBox.height();
		}
		chatBox.css("left", left);
		chatBox.css("top", top);
		SNSChatWindow.drag = false;
		jQuery(SNSIMWindow.getInstance().getChatWindow().transparentPanelSelector).hide();
	};
};*/

/**
 * @override
 * 
 * 当前鼠标点击位置是否触发拖动
 * @param event
 * @returns {Boolean}
 */
SNSChatWindow.prototype.validateMovability = function(event){
	var idSelector;
	if(!!event && event.target) {
		idSelector = "#" + jQuery(event.target).attr("id");
	} else {
		idSelector = "#" + jQuery(window.event.srcElement).attr("id");
	}
	
	if(idSelector == this.miniBtnSelector || idSelector == this.closeBtnSelector || idSelector == this.showChatroomMembersSelector){
		return false;
	}
	return true;
};

/**
 * @override
 * 
 * 拖动的部分
 */
SNSChatWindow.prototype.getDragComponentSelector = function(){
	return SNSIMWindow.getInstance().getChatWindow().titleContainerSelector;
};

/**
 * @override
 * 
 * 移动的部分
 */
SNSChatWindow.prototype.getMoveComponentSelector = function(){
	return SNSIMWindow.getInstance().getChatWindow().chatBoxSelector;
};
