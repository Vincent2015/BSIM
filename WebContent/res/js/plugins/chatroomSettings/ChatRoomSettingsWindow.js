var SNSChatRoomSettignsWindow = function() {
	this.selector = "#chatroom_settings_window";
	this.avatarEditarPreviewSelector = "#snsim_chatroom_avatar_uploader_preview";
	this.headIconSelector = ".head_icon .chatroom_head_icon";
//	this.changeChatroomPhotoBtnSelector = ".change_head_icon";
//	this.changeChatroomPhotoBtnId = "chatroom_change_head_icon";
	// 默认的头像图标
	this.avatarDefaultPreviewSelector = ".avatar_default_preview";
	this.avatarCropperSelector = "bgDiv";//id
	this.avatarCropperWidth = 160;
	this.avatarCropperHeight = 160;
	
	this.chatroomNameInputSelector = ".chatroom_name_input";
	this.chatroomDescInputSelector = ".chatroom_desc_input";
	
	this.submitBtnSelector = ".snsim_btn_a";
	this.cancelBtnSelector = ".snsim_btn_b";

	this.closeBtnSelector = ".chatroom_settings_close_btn";
	
	this.avatarUploader;
	this.avatarCropper;
	this.chatroom;
	this.photoUrl;
};

SNSChatRoomSettignsWindow.prototype = new SNSFloatPanel();

SNSChatRoomSettignsWindow.prototype._init = function(){
	SNSFloatPanel.prototype._init.call(this);
	this._bindDomEvent();
	this.initAvatarUpload();
};

SNSChatRoomSettignsWindow.prototype._bindDomEvent = function() {
	// input
	this.getDom().find(this.chatroomNameInputSelector).bind("focus", function(){
		jQuery(this).removeClass("error_input");
	});
	
	// 保存
	this.getDom().find(this.submitBtnSelector).bind("click", jQuery.proxy(function(){
		if(this.checkInput()){
			this.save();
		}
	},this));
	
	// 取消
	this.getDom().find(this.cancelBtnSelector).bind("click", jQuery.proxy(function(){
		this.getDom().find(this.closeBtnSelector).trigger("click");
	},this));
	
//	jQuery("#"+this.changeChatroomPhotoBtnId).bind("click",jQuery.proxy(function(){
//		jQuery(this.avatarEditarPreviewSelector).css("display","none");
//	},this));
	
	// 关闭
	SNSFloatPanel.prototype._bindDomEvent.call(this);
};

SNSChatRoomSettignsWindow.prototype.show = function(){
	if(!this.chatroom.infoQueryed){
		jQuery.when(this.chatroom.queryInfo()).done(jQuery.proxy(this.show,this));
		return;
	}
	this.getDom().find("#" + this.avatarCropperSelector).hide();
	this.getDom().find(this.avatarDefaultPreviewSelector).show();
	
	var offset = SNSIMWindow.getInstance().getChatroomMembersPanel().getDom().offset();
	this.getDom().css("top", offset.top);
	this.getDom().css("left", offset.left);
	jQuery(this.avatarEditarPreviewSelector).css("display","block");
	
	this.updatePhotoUrl();
	this.getDom().find(this.chatroomNameInputSelector).val(this.chatroom.name);
	this.getDom().find(this.chatroomDescInputSelector).text(this.chatroom.desc);
	
	SNSFloatPanel.prototype.show.call(this);
};

SNSChatRoomSettignsWindow.prototype.updatePhotoUrl = function(url){
	if(url){
		this.photoUrl = url;
		this.getDom().find(this.headIconSelector).attr("src", YYIMChat.getFileUrl(url));
	}else{
		this.getDom().find(this.headIconSelector).attr("src", this.chatroom.getPhotoUrl());
	}
};

SNSChatRoomSettignsWindow.prototype.save = function(){
	if(this.getDom().find(this.avatarDefaultPreviewSelector).is(":visible")){
		this.update();
		return;
	}
	var position = this.avatarCropper.getPos();
	var requestUrl = YYIMChat.getServletPath().AVATAR_SERVLET + "?attachId=" + this.photoUrl + "&width=" + this.avatarCropperWidth 
		+ "&height=" + this.avatarCropperHeight + "&startX=" + position.startX + "&startY=" + position.startY + "&endX=" + position.endX + "&endY=" + position.endY
		+ "&fromUser=" + YYIMChat.getUserNode() + "&token=" + YYIMChat.getToken();
	
	jQuery.ajax({
		url: requestUrl,
		success: jQuery.proxy(this.update, this),
		error:function(XMLHttpRequest, textStatus, errorThrown){  
			YYIMChat.log("ajax error", 3, XMLHttpRequest.status+XMLHttpRequest.readyState+XMLHttpRequest.responseText);
		}
	});
};

SNSChatRoomSettignsWindow.prototype.update = function(pathObj){
	var path;
	if(pathObj) {
		path = pathObj.result.attachId;
	}
	this.photoUrl = path? path : this.chatroom.photoUrl;
	jQuery.when(this.chatroom.update({//oArg {name, desc, photoUrl}
		name: this.getDom().find(this.chatroomNameInputSelector).val(),
		photoUrl: this.photoUrl
	})).done(jQuery.proxy(function(){
		var chatwindow = SNSIMWindow.getInstance().getChatWindow();
		// 聊天框
		if(this.chatroom.getID() == chatwindow.getActiveRoster().getID()){
			chatwindow.getDom().find(chatwindow.currentChatPhotoSelector).attr("src", this.chatroom.getPhotoUrl());
		}
		chatwindow.getTab(this.chatroom.getID()).getHeadDom().find(".snsim_username").text(this.chatroom.name);
		// 群列表
		var chatroomtab = SNSIMWindow.getInstance().getWideWindow().getTab("chatroom");
		chatroomtab.getContentDom().find("#" + chatroomtab.roomItemIdPrefix + this.chatroom.getID() + " .head_pic img").attr("src", this.chatroom.getPhotoUrl());
		chatroomtab.getContentDom().find("#" + chatroomtab.roomItemIdPrefix + this.chatroom.getID() + " .user_name").attr("title",this.chatroom.name).text(this.chatroom.name);
		this.getDom().hide();
	},this));
};
/**
 * 提交之前检查
 */
SNSChatRoomSettignsWindow.prototype.checkInput = function(){
	var chatroomNameDom = this.getDom().find(this.chatroomNameInputSelector);
	var chatroomDescDom = this.getDom().find(this.chatroomDescInputSelector);
	
	if(!chatroomNameDom.val()){
		chatroomNameDom.addClass("error_input");
		return false;
	}
	return true;
};

/**
 * 头像裁剪
 * @param url
 */
SNSChatRoomSettignsWindow.prototype.cropAvatar = function(url){
	this.getDom().find(this.avatarDefaultPreviewSelector).hide();
	this.getDom().find("#" + this.avatarCropperSelector).show();
	this.photoUrl = url;
	if(this.avatarCropper){
		this.avatarCropper.Url = YYIMChat.getFileUrl(url);
		this.avatarCropper.init();
	}else{
		this.avatarCropper = new SNSAvatarCropper(this.avatarCropperSelector,"dragDiv",YYIMChat.getFileUrl(url),{
			Width : this.avatarCropperWidth,
			Height : this.avatarCropperHeight,
			Color : "#000",
			Resize : true,
			Right : "rRight",
			Left : "rLeft",
			Up : "rUp",
			Down : "rDown",
			RightDown : "rRightDown",
			LeftDown : "rLeftDown",
			RightUp : "rRightUp",
			LeftUp : "rLeftUp",
			//Preview : "viewDiv",
			viewWidth : 100,
			viewHeight : 100
		});
	}
};

SNSChatRoomSettignsWindow.prototype.initAvatarUpload = function(){
	var that = this;
	if(isSupportHtml5Upload === true) {
		jQuery('#chatroom_change_head_icon').bind("click",{_self:this}, function(e){
			jQuery("#room_avatar_upload_input").trigger("click");
		});
		jQuery("#room_avatar_upload_input").bind("change", {_self:this},function(e){
			var arg = {
				fileInputId: this.id,
				to: YYIMChat.getUserBareJID(),
				success: function(arg){
					e.data._self.photoUrl = arg.attachId;
					e.data._self.cropAvatar(arg.attachId);
				},
				error: function(){
					alert("头像上传失败");
				}
			};
			YYIMChat.uploadAvatar(arg);
		});
	}
	else {
		YYIMChat.initUpload({
			button_placeholder_id:"chatroom_change_head_icon",
			flash_url: "res/js/swfupload.swf",
			contentType: "avatar",
			button_text : "<span class='room_change_head'>更改头像</span>",
			button_text_style : ".room_change_head { margin-left: 13px; color: #ffffff;}",
			button_width : 80,
			button_height : 22,
			button_cursor : SWFUpload.CURSOR.HAND,
			button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
			success: function(attachId){
				that.photoUrl = attachId;
				that.cropAvatar(attachId);
			},
			error: function(){
				alert("头像上传失败");
			}
			
		});
	}
};