if (isFormDataSupport === false) {
	var SNSIMUploadUseFlash = function() {
		this.swfUploadList = new SNSBaseList();
	};

	SNSIMUploadUseFlash.getInstance = function() {
		if (!SNSIMUploadUseFlash._instance) {
			SNSIMUploadUseFlash._instance = new SNSIMUploadUseFlash();
		}
		return SNSIMUploadUseFlash._instance;
	};

	/**
	 * option{ button_placeholder_id: placeHolderId, style: placeHolderStyle}
	 */
	SNSIMUploadUseFlash.prototype.addUploader = function(option) {
		if (this.swfUploadList.get(option.button_placeholder_id))
			return;
		var swfUpload = new SWFUpload(
				{
					upload_url : "", // 处理文件上传的url
					flash_url : option.flash_url, // flash路径
					
					// 按钮设置
					button_placeholder_id : option.button_placeholder_id,
					button_image_url : option.button_image_url,
		            button_width : option.button_width,
		            button_height : option.button_height,
		            button_text : option.button_text,
		            button_text_style : option.button_text_style,
		            button_text_left_padding : option.button_text_left_padding,
		            button_text_top_padding : option.button_text_top_padding,
		            button_disabled: option.button_disabled,
		            button_cursor : option.button_cursor,
		            button_window_mode: option.button_window_mode,
					
					// 上传文件限制设置
					file_size_limit : "30000", // 30MB
					file_types : option.contentType == "image" || option.contentType == "avatar"? "*.jpg;*.gif;*.jpeg;*.png;*.bmp" : "*.*",
					file_types_description : "Image Files",
					file_queue_limit : "1",
					chat_info : {},
					content_type : option.contentType == "avatar"? 'avatar': (option.contentType == "image"? 8 : 4),
					// 在文件选取窗口将要弹出时触发
					file_dialog_start_handler : function() {
					},
					// 当一个文件被添加到上传队列时会触发此事件，提供的唯一参数为包含该文件信息的file object对象
					file_queued_handler : function(file) {
						var chatInfo = (option.getChatInfo && option.getChatInfo()) || {},
							url = YYIMChat.getServletPath().FILE_UPLOAD_SERVLET,
							fromUser, 
							toUser, 
							token;
						var toId = chatInfo.to || YYIMChat.getUserNode();
						if (YYIMChat.isAnonymous()) {
							fromUser = YYIMChat.getUserFullJID();
							token = "anonymous";
						} else {
							fromUser = YYIMChat.getUserNode();
							token = YYIMChat.getToken();
						}

						if (chatInfo.resource && chatInfo.resource.toLowerCase() == "anonymous") {
							toUser = YYIMChat.getJIDUtil().buildUserJID(YYIMChat.getJIDUtil().getID(toId), "ANONYMOUS");
						} else {
							toUser = YYIMChat.getJIDUtil().getNode(toId);
						}
						url = url + "?fileName=" + encodeURI(file.name, "utf-8") + "&uploadedSize=0&fileSize=" + file.size
								+ "&fromUser=" + fromUser + "&toUser=" + toUser + "&token=" + token + "&muc=1";
						if (option.contentType === 'avatar') {
							url += "&isAvatar=true";
						}
						this.settings.chat_info = {
							to: YYIMChat.getJIDUtil().getNode(toId),
							type: chatInfo.type? chatInfo.type : 'chat',
							resource: chatInfo.resource
						};
						this.setUploadURL(url);
					},
					/**
					 * 当文件添加到上传队列失败时触发此事件，失败的原因可能是文件大小超过了你允许的数值、文件是空的或者文件队列已经满员了等。
					 * 该事件提供了三个参数。第一个参数是当前出现问题的文件对象，第二个参数是具体的错误代码，可以参照SWFUpload.QUEUE_ERROR中定义的常量
					 */
					file_queue_error_handler : function() {
						option.error && option.error(arguments);
					},
					/**
					 * 当文件选取完毕且选取的文件经过处理后（指添加到上传队列），会立即触发该事件。可以在该事件中调用this.startUpload()方法来实现文件的自动上传
					 * 参数number of files selected指本次在文件选取框里选取的文件数量 参数number of
					 * files queued指本次被添加到上传队列的文件数量 参数total number of files in
					 * the queued指当前上传队列里共有多少个文件（包括了本次添加进去的文件）
					 */
					file_dialog_complete_handler : function() {
						this.startUpload();
					},
					/**
					 * 当文件即将上传时会触发该事件,该事件给了你在文件上传前的最后一次机会来验证文件信息、增加要随之上传的附加信息或做其他工作。可以通过返回false来取消本次文件的上传
					 * 参数file object为当前要上传的文件的信息对象
					 */
					upload_start_handler : function() {
					},
					/**
					 * 该事件会在文件的上传过程中反复触发，可以利用该事件来实现上传进度条 参数file object为文件信息对象
					 * 参数bytes complete为当前已上传的字节数 参数total bytes为文件总的字节数
					 */
					upload_progress_handler : function() {
					},
					/**
					 * 文件上传被中断或是文件没有成功上传时会触发该事件。停止、取消文件上传或是在uploadStart事件中返回false都会引发这个事件，但是如果某个文件被取消了但仍然还在队列中则不会触发该事件
					 * 参数file object为文件信息对象 参数error
					 * code为错误代码，具体的可参照SWFUpload.UPLOAD_ERROR中定义的常量
					 */
					upload_error_handler : function() {
						option.error && option.error(arguments);
					},
					/**
					 * 当一个文件上传成功后会触发该事件 参数file object为文件信息对象 参数server
					 * data为服务器端输出的数据
					 */
					upload_success_handler : function(file, resp) {
						var settings = this.settings;
						if (JSON.parse(resp).code == "200") {
							var attachId = JSON.parse(resp).result.attachId;
							if(option.contentType === 'avatar'){
								option.success&&option.success(attachId);
							}
							else {
								var arg = {
										id : Math.uuid(),
										body : {
											content : new SNSFile(file.name, attachId, file.size),
											contentType : settings.content_type,
											dateline : new Date().getTime()
										},
										to : settings.chat_info.to,
										type : settings.chat_info.type,
										success : function(msg) {
											var _msg = Object.clone(msg);
											_msg.to = YYIMChat.getJIDUtil().getID(msg.to);
											_msg.body.content.path = YYIMChat.getFileUrl(_msg.body.content.path);
											option.success && option.success(_msg);
										}
								};
								if (settings.chat_info.resource) {
									arg.resource = settings.chat_info.resource;
								}
								YYIMChat.sendMessage(arg);
							}
						}

					},
					/**
					 * 当一次文件上传的流程完成时（不管是成功的还是不成功的）会触发该事件，该事件表明本次上传已经完成，上传队列里的下一个文件可以开始上传了。该事件发生后队列中下一个文件的上传将会开始
					 */
					upload_complete_handler : function() {
					}
				});
		this.swfUploadList.add(option.button_placeholder_id, swfUpload);
	};
}