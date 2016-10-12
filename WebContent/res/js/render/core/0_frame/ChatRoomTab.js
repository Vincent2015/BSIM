/**
 * 宽版窗口中聊天室对应的类， 包含了对该Tab的操作
 * @Class SNSChatRoomTab
 */
var SNSChatRoomTab = function() {
	this.name = "chatroom";
	this.selector = "#snsim_wide_tab_container";
	this.headSelector = "#snsim_tab_head_chatroom";
	this.contentSelector = "#snsim_tab_content_chatroom";
	this.chatroomContainerSelector = "#snsim_chatroom_list_container";

	this.roomItemIdPrefix = "snsim_window_wide_tab_chatroom_";
	
	this.createChatroomPanel = new SNSCreateChatroomPanel();

	this.chatroomItemTemplate = 
		'<li id="' + this.roomItemIdPrefix + '##{{getID()}}" class="clearfix">'
			+ '<div class="snsim_list_head sns_roster_list_wide_head">' 
				+ '<span class="head_pic">'
					+ '<img src="##{{getPhotoUrl()}}" onerror="YYIMChat.defaultImg(this)"/>' 
				+ '</span>'
				+ '<span node-type="chatRoomItemNewMsg" class="WBIM_icon_new"></span>' 
			+ '</div>'
			+ '<div class="snsim_list_name">' 
				+ '<span class="user_name" title="##{{name}}">##{{name}}</span>' 
			+ '</div>'
			+ '<div style="float:right; cursor: pointer;margin: 16px 10px 0 0;">' 
				+ '<a class="snsim_chatroom_invite_btn" onclick="SNSIMWindow.getInstance().getInvitationWindow().show(\'##{{getID()}}\')">'
					+ '<span class="invite_btn"></span>' 
				+ '</a>' 
			+ '</div>' 
		+ '</li>';
};

SNSChatRoomTab.prototype = new SNSTab();

/**
 * 初始化Tab页，包括绑定全局事件，绑定DOM事件
 * @private
 */
SNSChatRoomTab.prototype._init = function() {

	this.createChatroomPanel._init();
	
	/**
	 * 注册AFTER_CONNECT全局事件，将自己添加到tabContainer中
	 */
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.AFTER_LOAD_CHATROOM, false,
			this.renderChatRoomList, this);
	// 新房间的渲染
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_ADD_CHATROOM, true,
			this.renderAddChatRoom, this);
	
	// 退群
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_QUIT_CHATROOM, true,
			this.renderRemoveChatRoom, this);
	
	
};

/**
 * @param event
 * @param chatroom
 */
SNSChatRoomTab.prototype.renderAddChatRoom = function(event, chatroom){
	this.addChatRoom(chatroom);
};

SNSChatRoomTab.prototype.renderRemoveChatRoom = function(event, chatroom){
	jQuery(this.chatroomContainerSelector).find("#" + this.roomItemIdPrefix + chatroom.getID()).remove();
	SNSIMWindow.getInstance().getChatWindow().getTab(chatroom).getCloseBtnDom().trigger("click");
};

/**
 * 渲染User的ChatRoom列表
 */
SNSChatRoomTab.prototype.renderChatRoomList = function() {
	var list = SNSApplication.getInstance().getUser().chatRoomList.toArray();
	for ( var i in list) {
		var item = list[i];
		if (item && item instanceof SNSChatRoom) {
			this.addChatRoom(item);
		}
	}
};

SNSChatRoomTab.prototype.addChatRoom = function(chatroom) {
	if(jQuery("#" + this.roomItemIdPrefix + chatroom.getID()).length > 0)
		return;
	
	var html = TemplateUtil.genHtml(this.chatroomItemTemplate, chatroom);
	var container = jQuery(this.chatroomContainerSelector);
	container.append(html);
	this._bindChatRoomItemEvent(chatroom);
};

SNSChatRoomTab.prototype._bindChatRoomItemEvent = function(chatroom) {
	var chatroomDoms = this.getDom().find("#" + this.roomItemIdPrefix + chatroom.getID());

	// 单击联系人条目， 打开聊天窗口
	chatroomDoms.bind("click", {
		chatroom : chatroom
	}, function(event) {
		SNSIMWindow.getInstance().getChatWindow().openChatWith(event.data.chatroom);
	});
};

/**
 * 显示未读消息数目
 * @param room
 * @param num
 */
SNSChatRoomTab.prototype.renderUnreadMsgNum = function(room, num){
	var doms = this.getDom().find("#" + this.roomItemIdPrefix + room.getID());
	doms.find(this.unreadMsgNumSelector).text(num);
	doms.find(this.unreadMsgNumSelector).show();
};

/**
 * 隐藏未读消息数目
 * @param room
 */
SNSChatRoomTab.prototype.clearUnreadMsgNum = function(room){
	this.getDom().find("#" + this.roomItemIdPrefix + room.getID()).find(this.unreadMsgNumSelector).hide();
};