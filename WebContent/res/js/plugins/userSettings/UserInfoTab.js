var SNSUserInfoTab = function(){
	this.name="userInfoTab";
	this.selector = "#snsim_user_info_content";
	
	this.headSelector = "#snsim_user_info_head";
	this.contentSelector = "#snsim_user_info_content";
	
	 // flash替换
	this.changeUserPhotoBtnId = "user_change_head_icon";
	
	// 头像设置区域
	this.avatarUploaderSelector = "#snsim_user_avatar_uploader_preview";
	this.avatarUploaderVisiable = false;
	// 个人资料区域
	this.vcardContainerSelector = ".snsim_vcard_container";
	this.vcardContainerVisiable = false;
	
	// 当前头像
	this.headIconSelector = ".user_settings_head_icon";
	
	
	// 编辑资料
	this.vcardEditBtnSelector = ".edit_vcard_content_btn";
	
	// 提交/取消按钮
	this.submitBtnSelector = ".sns_vcard_change_btn";
	this.cancelBtnSelector = ".sns_vcard_change_btn_cancel";
	
	// 头像裁剪
	this.avatarUploader;
	this.avatarCropper;
	this.avatarCropperSelector = "bgDiv_user";//id
	this.avatarCropperWidth = 160;
	this.avatarCropperHeight = 160;
	this.photoUrl;

	this.isUserInfoAcquired = false;
	this.vcardTpl =  (function (){
		var vcard_field = [ "nickname", "email", "telephone", "mobile" ];
		var editBtn = '<a class="edit_vcard_content_btn">修改资料</a><br>'
    	var container_start = '<ul action-data="##{{getID()}}" class="snsim_vcard_info_list">';
		
		container_start += '<li node-type="vcardContentItem" class="snsim_vcard_content_item"><span class="snsim_vcard_content_item_label">帐号:</span>'
		+ '<span class="snsim_vcard_content_item_value">##{{SNSApplication.getInstance().getUser().getID()}}<span/></li>';
		
    	var container_end = '</ul>';
    	var sparate_line = '<li class="snsim_vcard_separate_line"></li>';
    	
    	var html = editBtn + container_start;
    	
    	for(var i=0; i<vcard_field.length; i++){
    		if(vcard_field[i]=="_"){
    			html+=sparate_line;
    			continue;
    		}
			html+='<li node-type="vcardContentItem" class="snsim_vcard_content_item"><span class="snsim_vcard_content_item_label">'+SNS_LANG_TEMPLATE["vcard_" + vcard_field[i].replace(".","_")]+':</span>'
			+ '<input type="text" disabled="disable" name="' + vcard_field[i] + '" class="snsim_vcard_content_item_value" value="##{{vcard.'+vcard_field[i]+'}}"/></li>';
    	}
        	
    	html+= container_end;
    	return html;
	})();
};

SNSUserInfoTab.prototype = new SNSTab();

SNSUserInfoTab.prototype._init = function(){
	var user = SNSApplication.getInstance().getUser();
	if(!user.vcard){
		user.requestVCard();
	}
	this.initAvatarUpload();
	//this.initAvatarCropper();
	//jQuery("#snsim_user_info_settings").perfectScrollbar({suppressScrollX:true});
	SNSTab.prototype._init.call(this);
};

SNSUserInfoTab.prototype.renderUserInfo = function(){
	jQuery(this.avatarUploaderSelector).hide();
	this.avatarUploaderVisiable = false;
	this.getDom().find(this.vcardContainerSelector).show();
	this.vcardContainerVisiable = true;
	
	if(!this.isUserInfoAcquired){
		var html = TemplateUtil.genHtml(this.vcardTpl, SNSApplication.getInstance().getUser());
//		this.getDom().find(this.vcardContainerSelector).append(html);
		this.getDom().find(this.vcardContainerSelector).html(html); //rongqb 20150626
		this.getDom().find(this.headIconSelector).attr("src", SNSApplication.getInstance().getUser().getPhotoUrl());
		this.isUserInfoAcquired = true;
		
		this._bindDomEvent();
	}
};

SNSUserInfoTab.prototype._bindVcardEditBtn = function(){
	jQuery(this.vcardEditBtnSelector).css("cursor","pointer");
	jQuery(this.vcardEditBtnSelector).bind("click",{_self : this},function(event){
		jQuery(this).unbind();
		jQuery(this).css("cursor","not-allowed");
		event.data._self.getDom().find("input").removeAttr("disabled");
		event.data._self.getDom().find("input[name='org.unit']").attr("disabled", "disable");
		event.data._self.getDom().find("input").addClass("vcard_input_edit");
		event.data._self.getDom().find("input[name='org.unit']").removeClass("vcard_input_edit");
	});
};
SNSUserInfoTab.prototype._bindDomEvent = function(){
	this._bindVcardEditBtn();
	
	// submit
	this.getDom().find(this.submitBtnSelector).bind("click", jQuery.proxy(this.submit ,this));
	
	//cancel
	this.getDom().find(this.cancelBtnSelector).bind("click", jQuery.proxy(function(){
		if(this.avatarUploaderVisiable){
			jQuery(this.avatarUploaderSelector).hide();
			this.avatarUploaderVisiable = false;
			this.getDom().find(this.vcardContainerSelector).show();
			this.vcardContainerVisiable = true;
			return;
		}
		
		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	}, this));
};

SNSUserInfoTab.prototype.initAvatarCropper = function(url){
	this.avatarCropper = new SNSAvatarCropper(this.avatarCropperSelector,"dragDiv_user",YYIMChat.getFileUrl(url),{
		Width : this.avatarCropperWidth,
		Height : this.avatarCropperHeight,
		Color : "#000",
		Resize : true,
		Right : "rRight_user",
		Left : "rLeft_user",
		Up : "rUp_user",
		Down : "rDown_user",
		RightDown : "rRightDown_user",
		LeftDown : "rLeftDown_user",
		RightUp : "rRightUp_user",
		LeftUp : "rLeftUp_user",
		//Preview : "viewDiv",
		viewWidth : 100,
		viewHeight : 100
	});
};

SNSUserInfoTab.prototype.initAvatarUpload = function(){
	var that = this;
	if(isSupportHtml5Upload === true) {
		jQuery('#user_change_head_icon').bind("click",{_self:this}, function(e){
			jQuery("#user_avatar_upload_input").trigger("click");
		});
		jQuery("#user_avatar_upload_input").bind("change", {_self:this},function(e){
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
			button_placeholder_id:"user_change_head_icon",
			//button_image_url: "res/skin/default/icons/image_upload.png",
			flash_url: "res/js/swfupload.swf",
			contentType: "avatar",
			button_text : "<span class='user_change_head'>更改头像</span>",
			button_text_style : ".user_change_head { margin-left: 13px; color: #ffffff;}",
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

/**
 * 头像裁剪
 * @param url
 */
SNSUserInfoTab.prototype.cropAvatar = function(url){
	jQuery(this.avatarUploaderSelector).show();
	this.avatarUploaderVisiable = true;
	this.getDom().find(this.vcardContainerSelector).hide();
	this.vcardContainerVisiable = false;
	
	this.photoUrl = url;
	if(this.avatarCropper){
		this.avatarCropper.Url = YYIMChat.getFileUrl(url);
		this.avatarCropper.init();
	}else{
		this.initAvatarCropper(url);
	}
};

/**
 * 上传头像
 */
SNSUserInfoTab.prototype.submitPhoto = function(){
	var position = this.avatarCropper.getPos();
	var requestUrl = YYIMChat.getServletPath().AVATAR_SERVLET + "?attachId=" + this.photoUrl + "&width=" + this.avatarCropperWidth 
		+ "&height=" + this.avatarCropperHeight + "&startX=" + position.startX + "&startY=" + position.startY + "&endX=" + position.endX + "&endY=" + position.endY
		+ "&fromUser=" + YYIMChat.getUserNode() + "&token=" + YYIMChat.getToken();
	
	jQuery.ajax({
		url: requestUrl,
		// 头像上传成功
		success: jQuery.proxy(function(pathObj){
			var path = pathObj.result.attachId;
			this.photoUrl = path;
			var vcardCopy = Object.clone(SNSApplication.getInstance().getUser().vcard);
			
			vcardCopy.updateUserPhotoUrl(path, {
				// vcard更新成功
				success: jQuery.proxy(function(){
					this.getDom().find(this.headIconSelector).attr("src", YYIMChat.getFileUrl(path));
					SNSApplication.getInstance().getUser().vcard.photo.binval = path;
				}, this)
			});
		}, this),
		error:function(XMLHttpRequest, textStatus, errorThrown){  
			YYIMChat.log("ajax error", 3, XMLHttpRequest.status+XMLHttpRequest.readyState+XMLHttpRequest.responseText);
		}
	});
};

SNSUserInfoTab.prototype.submitUserInfo = function(){
	this.getDom().find("input").attr("disabled", "disable");
	this.getDom().find("input").removeClass("vcard_input_edit");
	this._bindVcardEditBtn();
	
	var propList = this.getDom().find("input");
	var vcardCopy = Object.clone(SNSApplication.getInstance().getUser().vcard);
	for (var i = 0; i < propList.length; i++) {
		var splitIndex = propList[i].name.indexOf(".");
		if (splitIndex != -1) {
			vcardCopy[propList[i].name.substr(0, splitIndex)][propList[i].name.substr(splitIndex + 1)] = propList[i].value;
		} else {
			vcardCopy[propList[i].name] = propList[i].value;
		}
	}
	vcardCopy.update({success: jQuery.proxy(function(){
		SNSApplication.getInstance().getUser().vcard = vcardCopy;
		alert('修改成功！');
		var settingsWindow = SNSSettingsPlugin.getInstance().settingsWindow;
		settingsWindow.getDom().find(settingsWindow.closeBtnSelector).trigger("click");
	},this)});
};

SNSUserInfoTab.prototype.submit = function(){
	if(this.vcardContainerVisiable){
		this.submitUserInfo();
	}else{
		this.submitPhoto();
		jQuery(this.avatarUploaderSelector).hide();
		this.avatarUploaderVisiable = false;
		this.getDom().find(this.vcardContainerSelector).show();
		this.vcardContainerVisiable = true;
	}
};