var SNSMemberListPanel = function() {
	this.selector = "#chatroom_member_list";
	this.triggerSelector = "#show_chatroom_members";
	this.rosterListContainerSelector = "ul";
	this.closeBtnSelector = ".close_btn";
	this.memberLsitContentSelector = ".member_list_content";
	// dismiss, quit, modify nickname
	this.destoryChatRoomSelector = ".destory";
	this.quitChatRoomSelector = ".quit";
	this.modifyNickNameSelector = ".rename";
	//删除好友
	this.delRosterBtnSelector = ".del-btn";
	
	// chatroom name and photoUrl
	this.chatroomNameSelector = ".chatroom_info .chatroom_name";
	this.chatroomPhotoUrlSelector = ".chatroom_info img";
	
	// info
	this.nickNameInputSelector = ".snsim_members_info";
	this.modifyNickNameBtnSelector = ".snsim_modify_nickname_btn";
	
	this.memberItemIdPrefix = "member_item_";
	
	//this.hideFloat = SNSComponent.HIDE_TYPE.HIDE_IGNORE_SELF;
	
	this.template = 
		'<li id="' + this.memberItemIdPrefix + '##{{getID()}}" rosterId="##{{getID()}}">'
			+'<div>'
				+'<img class="head_icon" src="##{{getPhotoUrl()}}">'
				+'<div class="snsim_members_info" contenteditable="false">'
					+'##{{name}}'
				+'</div>'
				+'<span class="snsim_modify_nickname_btn hide">确定</span>'
			+'</div>'
			+'<div>'
				+'<div class="snsim_members_mail">'
					+'##{{getID()}}'
				+'</div>'
			+'</div>'
			+'<div>'
				+'<div style="float: right;margin-right: 25px;margin-top: -15px;">'
					+'<a title="删除" class="del-btn" style="color:#df1a00;">删除</a>'
//					+'<span title="修改备注" class="edit" onclick="SNSIMWindow.getInstance().getChatroomMembersPanel().editMember"></span>'
//					+'<span title="查看资料" class="see" onclick="SNSIMWindow.getInstance().getChatroomMembersPanel().checkMember"></span>'
				+'</div>'
			+'</div>'
		+'</li>';
};

SNSMemberListPanel.prototype = new SNSFloatPanel();
SNSMemberListPanel.isOdd = true;

SNSMemberListPanel.prototype._init = function(){
	this.getDom().find(this.memberLsitContentSelector).perfectScrollbar({suppressScrollX:true});
	this._bindDomEvent();
	SNSFloatPanel.prototype._init.call(this);
};

SNSMemberListPanel.prototype.show = function(){
	var offset = jQuery(this.triggerSelector).offset();
	this.getDom().css("top", offset.top - 34);
	this.getDom().css("left", offset.left - 134);
	
	this.renderMemberList();
	SNSFloatPanel.prototype.show.call(this);
};

SNSMemberListPanel.prototype.renderMemberList = function(){
	var chatroom = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
	this.getDom().find(this.chatroomNameSelector).text(chatroom.name);
	this.getDom().find(this.chatroomPhotoUrlSelector).attr("src", chatroom.getPhotoUrl());
	
	
	this.getDom().find(this.rosterListContainerSelector).html("");
	if(chatroom instanceof SNSChatRoom){
		// 判断成员列表是否已经获取
		if(!chatroom.rosterList._size || chatroom.rosterList._size < 1 || !chatroom.memberListQueryed){
			YYIMChat.getGroupMembers({
				id: chatroom.getID(),
				success: jQuery.proxy(function(list){
					chatroom.queryMembersHandler(list);
//					chatroom.setMemberList(list);
					var memberList = chatroom.rosterList._list;
					for(var item in memberList){
						this.getDom().find(this.rosterListContainerSelector).append(TemplateUtil.genHtml(this.template, memberList[item]));
						if(SNSMemberListPanel.isOdd){
							this.getDom().find("#" + this.memberItemIdPrefix + memberList[item].getID()).addClass("odd");
							SNSMemberListPanel.isOdd = false;
						}else {
							SNSMemberListPanel.isOdd = true;
						}
					}
					this.bindMembersOperation();
					return;
				},this)
			});
		}
		else{
			var memberList = chatroom.rosterList._list;
			for(var item in memberList){
				this.getDom().find(this.rosterListContainerSelector).append(TemplateUtil.genHtml(this.template, memberList[item]));
				if(SNSMemberListPanel.isOdd){
					this.getDom().find("#" + this.memberItemIdPrefix + memberList[item].getID()).addClass("odd");
					SNSMemberListPanel.isOdd = false;
				}else {
					SNSMemberListPanel.isOdd = true;
				}
			}
			this.bindMembersOperation();
		}
	}
	
};

/**
 * 改昵称, 查看资料
 */
SNSMemberListPanel.prototype.bindMembersOperation = function(){
	var myInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID());
	// 修改昵称按钮
	myInfo.find(this.modifyNickNameBtnSelector).bind("click", jQuery.proxy(function(event){
		this.modifyNickName(event);
	},this));
	
	// 昵称输入框
	myInfo.find(this.nickNameInputSelector).bind("keydown", {_self: this},function(event){
		if(event.keyCode == SNS_KEY_CODE.ENTER){
			jQuery(this).blur();
			jQuery(this).siblings(event.data._self.modifyNickNameBtnSelector).trigger("click");
		}
	});
};

SNSMemberListPanel.prototype._bindDomEvent = function() {
	// 退群
	this.getDom().find(this.quitChatRoomSelector).bind("click", jQuery.proxy(function(){
		// getActiveRoster()为SNSChatRoom
		YYIMChat.quitChatGroup(SNSIMWindow.getInstance().getChatWindow().getActiveRoster().getID());
		// SNSIMWindow.getInstance().getChatWindow().getActiveRoster().quit();
		this.getDom().hide();
	},this));
	
	// 修改备注
	this.getDom().find(this.modifyNickNameSelector).bind("click", jQuery.proxy(function(){
		var chatroom = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var myItemInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID() + " " + this.nickNameInputSelector);
		if(myItemInfo.attr("contenteditable") == "true"){
			this.renderModifyNickName(false);
		}else{
			this.renderModifyNickName(true);
		}
	},this));
	
	// 销毁群
	this.getDom().find(this.destoryChatRoomSelector).bind("click", jQuery.proxy(function(){
		// getActiveRoster()为SNSChatRoom
		SNSIMWindow.getInstance().getChatWindow().getActiveRoster().destory();
	},this));
	
	var self = this;
	/*
	 * 删除群成员
	 * @author yinjie
	 */
	this.getDom().on("click",this.delRosterBtnSelector, function(e){
		var roomId = SNSIMWindow.getInstance().getChatWindow().getActiveRoster().getID()
		var $rosterLi = jQuery(e.target).closest('li');
		var delid = jQuery(e.target).closest('li').attr('rosterid');
		YYIMChat.delGroupMember(roomId, delid, function(data) {
			$rosterLi.remove();
		});
	});
	
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSMemberListPanel.prototype.modifyNickName = function(event){
	var target = jQuery(event.target);
	var newName = jQuery(event.target).siblings(this.nickNameInputSelector).text();
	
	jQuery.when(SNSIMWindow.getInstance().getChatWindow().getActiveRoster().modifyNickName(target.parents("tr").attr("rosterId") ,newName))
	.done(jQuery.proxy(function(){
		this.renderModifyNickName(false);
	},this));
};

SNSMemberListPanel.prototype.renderModifyNickName = function(contenteditable){
	var myItemInfo = this.getDom().find("#" + this.memberItemIdPrefix + SNSApplication.getInstance().getUser().getID() + " " + this.nickNameInputSelector);
	
	if(contenteditable){
		myItemInfo.addClass("cur");
		myItemInfo.siblings(this.modifyNickNameBtnSelector).removeClass("hide");
		myItemInfo.attr("contenteditable", "true");
	}else{
		myItemInfo.removeClass("cur");
		myItemInfo.siblings(this.modifyNickNameBtnSelector).addClass("hide");
		myItemInfo.attr("contenteditable", "false");
	}
};