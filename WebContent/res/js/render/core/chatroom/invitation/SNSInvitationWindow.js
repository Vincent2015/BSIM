var SNSInvitationWindow = function(data){
	// 邀请好友加入的房间
	this.currentChatroom;
	
	this.selector = "#snsim_invite_window";
	this.closeBtnSelector = "#snsim_invite_window .invite_window_close";
	this.invitationSubmitBtnSelector  = "#snsim_invite_footer .submit_btn";
	this.invitationCancelBtnSelector  = "#snsim_invite_footer .cancel_btn";
	
	// 房间信息
	this.currentChatroomHeadSelector = "#sns_invite_chatroom_head_icon";
	this.currentChatroomNameSelector = "#sns_invite_chatroom_name";
	
	// tab list 好友、组织, 搜索的结果
	this.tabContainer = new SNSInviteTabContainer();
	this.inviteFromRosterTab;
	this.inviteFromOrgTab;
	this.inviteFromSearchPanel = new SNSInviteFromSearchPanel();
	this.selectedListPanel = new SNSSelectedListPanel();
	
	// 打开时其他窗口禁止操作
	this.maskOthers = true;
};

SNSInvitationWindow.prototype = new SNSFloatPanel();

SNSInvitationWindow.prototype._init = function(){
	SNSFloatPanel.prototype._init.call(this);
	
	this.tabContainer._init();
	
	this.inviteFromRosterTab = new SNSInviteFromRosterTab();
	this.tabContainer.addTab(this.inviteFromRosterTab);
	
	this.inviteFromOrgTab = new SNSInviteFromOrgTab();
	this.tabContainer.addTab(this.inviteFromOrgTab);
	
	this._bindInvitationEvent();
};

/**
 * 绑定搜索相关的事件
 */
SNSInvitationWindow.prototype._bindInvitationEvent = function(){
	var self = this;
	
	// 确认邀请按钮
	jQuery(this.invitationSubmitBtnSelector).on("click",jQuery.proxy(function(){
		var list = this.selectedListPanel.list._list;
		var selectedJidList = new Array();
		for(var item in list){
			selectedJidList.push(list[item].getID());
		}
		YYIMChat.addGroupMember({
			roomId: this.currentChatroom.getID(), 
			ids: selectedJidList
		});
		this.hide();
	},this));
	
	
	jQuery(this.invitationCancelBtnSelector).on("click", jQuery.proxy(function(){
		jQuery(this.closeBtnSelector).trigger("click");
	},this));
	// 关闭邀请窗口
	jQuery(this.closeBtnSelector).on("click", jQuery.proxy(this.hide, this));
};

SNSInvitationWindow.prototype.show = function(chatroomJid){
	this.currentChatroom = SNSApplication.getInstance().getUser().getRosterOrChatRoom(chatroomJid);
	// 显示当前房间名和头像
	jQuery(this.currentChatroomHeadSelector).attr("src", this.currentChatroom.getPhotoUrl());
	jQuery(this.currentChatroomNameSelector).text(this.currentChatroom.name);
	
	this.inviteFromRosterTab.show();
	
	SNSFloatPanel.prototype.show.call(this);
};

SNSInvitationWindow.prototype.selectToInvite = function(obj){
	var _id = jQuery(obj).attr('rosterId');
	var _name = jQuery(obj).attr('name');
	var roster = SNSApplication.getInstance().getUser().getRoster(_id);
	if(!roster)
		roster = new SNSRoster(_id, _name);
	SNSIMWindow.getInstance().getInvitationWindow().selectedListPanel.add(roster);
};