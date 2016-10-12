/**
 * arg {id, to: id, type: "groupchat"|"chat",body:object, success:function, error:function}
 */
var SNSOutMessage = function(arg){
	this.id = arg.id;
	this.to = SNSApplication.getInstance().getUser().getRosterOrChatRoom(arg.to);
	this.type = arg.type;
	
	if(this.to instanceof SNSChatRoom){
		this.chatroom = this.to;
	}

	this.body = {};
	this.body.dateline = arg.body.dateline;
	this.setBody(arg.body.content, arg.body.contentType);
	
}

SNSOutMessage.prototype = new SNSMessage();

/**
 * 设置要发送的文件
 * @param file @see SNSFile
 */
SNSOutMessage.prototype.setFile = function(file){
	if(file && file instanceof SNSFile){
		if(file.isImage == "true"){
			this.setBody(file, SNS_MESSAGE_CONTENT_TYPE.IMAGE);
			return;
		}
		this.setBody(file, SNS_MESSAGE_CONTENT_TYPE.FILE);
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSFile
 */
SNSOutMessage.prototype.setImage = function(image){
	if(image && image instanceof SNSFile){
		this.setBody(image, SNS_MESSAGE_CONTENT_TYPE.IMAGE);
	}
};

/**
 * 设置要发送的图片
 * @param file @see SNSImage
 */
SNSOutMessage.prototype.setText = function(text){
	if(text && text.notEmpty()){
		this.setBody(text, SNS_MESSAGE_CONTENT_TYPE.TEXT);
	}
};

/**
 * 综合设置message属性
 * @param to @See setTo()
 * @param type @See SNS_MESSAGE_TYPE
 * @param thread	@See setThread();
 * @param subject @See setSubject();
 */
SNSOutMessage.prototype.setMessage = function(to, type, thread, subject){
	this.setTo(to);
	this.type = type;
	this.setThread(thread);
	this.setSubject(subject);
}

/**
 * 设置发送的数据， 不推荐直接调用
 * @param content
 * @param contentType
 */
SNSOutMessage.prototype.setBody = function(content, contentType){
	if(content){
		this.body.content = content;
		if(contentType){
			this.body.contentType = contentType;
		}
	}
	//SNSApplication.getInstance().getMessageOutBox().getFilter().doFilter(this);
};