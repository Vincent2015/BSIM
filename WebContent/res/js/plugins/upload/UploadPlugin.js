var SNSUploadPlugin = function() {
	
	this.name="uploadPlugin";
	
	this.imageUpload;
	this.breakPointUpload;
	this.imageUploadId = "image_upload_input";
	this.breakPointId = "file_upload_input";
		
	this.enable = true;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	
};

SNSUploadPlugin.prototype = new SNSPlugin();

SNSUploadPlugin.prototype._init = function() {
	SNSUploadPlugin._instance = this;
	
	if(isSupportHtml5Upload === true) {
		this.initImageUpload();
		this.initBreakPointUpload();
	}
	else {
		YYIMChat.initUpload(
				{
					button_placeholder_id:"upload",
					button_image_url: "res/skin/default/icons/file_upload.png",
					flash_url: "res/js/swfupload.swf",
					contentType: "file",
					getChatInfo: function() {
						var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster(),
						type = SNS_CHAT_TYPE.CHAT, 
						resource;
						if(activeRoster instanceof SNSChatRoom)
							type = SNS_CHAT_TYPE.GROUP_CHAT;
						if(activeRoster.resource){
							resource = activeRoster.resource;
						}
						return {
							to: activeRoster.getID(),
							type: type,
							resource: resource
						};
					},
					success: function(msg){
						var msgOut = new SNSOutMessage(msg);
						msgOut.setFile(msg.body.content);
						SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
					},
					error: function(){
						alert("文件发送失败");
					}
				},
				{
					button_placeholder_id:"auploadImage",
					button_image_url: "res/skin/default/icons/image_upload.png",
					flash_url: "res/js/swfupload.swf",
					contentType: "image",
					getChatInfo: function() {
						var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster(),
						type = SNS_CHAT_TYPE.CHAT, 
						resource;
						if(activeRoster instanceof SNSChatRoom)
							type = SNS_CHAT_TYPE.GROUP_CHAT;
						if(activeRoster.resource){
							resource = activeRoster.resource;
						}
						return {
							to: activeRoster.getID(),
							type: type,
							resource: resource
						};
					},
					success: function(msg){
						var msgOut = new SNSOutMessage(msg);
						msgOut.setImage(msg.body.content);
						SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
					},
					error: function(){
						alert("图片发送失败");
					}
					
				}
		);
	}
	
	SNSPlugin.prototype._init.call(this);
};

SNSUploadPlugin.prototype.initImageUpload = function(){
	jQuery('#auploadImage').bind("click",{_self:this}, function(e){
		jQuery(e.target).find("#"+e.data._self.imageUploadId).trigger("click");
	});
	jQuery("#" + this.imageUploadId).bind("change", {_slef:this},function(e){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var type = SNS_CHAT_TYPE.CHAT;
		if(activeRoster instanceof SNSChatRoom)
			type = SNS_CHAT_TYPE.GROUP_CHAT;
		var arg = {
			fileInputId: this.id,
			to: activeRoster.getID(),
			type: type,
			success: function(msg){
				var msgOut = new SNSOutMessage(msg);
				msgOut.setImage(msg.body.content);
				SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
			},
			error: function(){
				alert("图片发送失败");
			}
		};
		if(activeRoster.resource){
			arg.resource = activeRoster.resource;
		}
		YYIMChat.sendPic(arg);
	});
};

SNSUploadPlugin.prototype.initBreakPointUpload = function(){
	jQuery('#upload').bind("click",{_self:this}, function(e){
		jQuery(e.target).find("#"+e.data._self.breakPointId).trigger("click");
	});
	jQuery("#" + this.breakPointId).bind("change", {_slef:this},function(e){
		var activeRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		var type = SNS_CHAT_TYPE.CHAT;
		if(activeRoster instanceof SNSChatRoom)
			type = SNS_CHAT_TYPE.GROUP_CHAT;
		var arg = {
			fileInputId: this.id,
			to: activeRoster.getID(),
			type: type,
			success: function(msg){
				var msgOut = new SNSOutMessage(msg);
				msgOut.setFile(msg.body.content);
				SNSIMWindow.getInstance().getChatWindow().afterSendMessage(msgOut);
			},
			error: function(){
				alert("文件发送失败");
			},
			progress: function(arg){
				
			}
		};
		if(activeRoster.resource){
			arg.resource = activeRoster.resource;
		}
		YYIMChat.sendFile(arg);
	});
};

SNSUploadPlugin.getInstance = function(){
	return SNSUploadPlugin._instance;
}
new SNSUploadPlugin().start();





/*YYIMChat.initUpload({
	// 被替换的元素id
	button_placeholder_id : "upload",
	// 替换后的按钮图标
	button_image_url : "res/skin/default/icons/file_upload.png",
	// flash文件所在路径
	flash_url : "res/js/swfupload.swf",
	// 当前发送文件类型 "file" || "image"
	contentType : "file",
	// 获取消息接收方的函数, 需返回: {to: 接收方id, type: "chat" or "groupchat", 默认"chat", resource: 所在端, 可为空} 
	getChatInfo : function() {
		return {
			to : activeRoster.getID(),
			type : type,
			resource : resource
		};
	},
	success : function(msg) {
	},
	error : function() {
	}
}, 
// 第二个可上传附件的按钮
{
	...
}
	...
);*/
