var SNSMessage = function(packet) {
	/**
	 * 消息的id, 使用UUID，全局唯一
	 * @Type{String}
	 */
	this.id = Math.uuid();

	/**
	 * 消息的接收人，若是接收到的消息，则to为undefined
	 * @Type {SNSRoster|SNSChatRoom}
	 */
	this.to = null;

	/**
	 * 消息的发送人，若是发送的消息，则from为undefined; 若为groupchat, 则from为发送消息的那个联系人
	 * @Type {SNSRoster}
	 */
	this.from = null;

	/**
	 * groupchat消息的对应chatroom
	 * @Type {SNSChatRoom}
	 */
	this.chatroom = null;
	this.roster = null;
	this.thread = null;
	this.subject = null;
	this.type = SNS_MESSAGE_TYPE.CHAT;

	/**
	 * 消息的内容， 该属性会被序列化为jSON字符串发送
	 * @Field
	 */
	this.body = {
		/**
		 * 消息的样式，包括字体，颜色，大小
		 */
		//style : SNSMessageStyle.getInstance(),
		/**
		 * 是否包含表情， 减少因匹配表情的正则表达式而导致的误判
		 */
		expression : 0,
		contentType : SNS_MESSAGE_CONTENT_TYPE.TEXT,

		/**
		 * 该属性根据contentType的不同而改变： 若type为text, 该属性为string字符串 若type为file或者image， 该属性为SNSFile对象
		 */
		content : null,// 当content_type为file的时候 content为SNSFile对象

		/**
		 * 消息发送的时间 //TODO 删除该属性， 由服务器计算，或者直接根据接收时间计算
		 */
		dateline : new Date().getTime()
	};
	/**
	 * 消息在界面展示的HTML字符串，可能会被filters处理和生成
	 */
	this.html;
};

/**
 * 获取此消息的展示HTML， 在templateRender中被调用
 * @returns
 */
SNSMessage.prototype.getBodyHtml = function() {
	if (!this.html || this.html.isEmpty()) {
		return this.body.content;
	}
	return this.html;
};

/**
 * 获取发送消息或接收消息的联系人， 即消息的另一方; 此方法不常用.
 * @SEE getRosterOrChatRoom()
 * @returns 消息相关的联系人
 */
SNSMessage.prototype.getRoster = function() {
	if (this.to && this.to instanceof SNSRoster) {
		return this.to;
	} else if (this.from && this.from instanceof SNSRoster) {
		return this.from;
	} else {
		YYIMChat.log("snsMessage.getRoster", 1, this.to, this.from);
	}
};

/**
 * 获取消息相关的联系人或者聊天室
 * @returns 如果是一对一消息，返回联系人；如果是groupchat， 返回chatroom
 */
SNSMessage.prototype.getRosterOrChatRoom = function() {
	if (this.type == SNS_MESSAGE_TYPE.CHAT || this.type == SNS_MESSAGE_TYPE.PUBACCOUNT) {
		return this.getRoster();
	}
	else if(this.type == SNS_MESSAGE_TYPE.GROUPCHAT){
		return this.chatroom;
	}
	return this.from;
};

/**
 * 设置消息的thread属性
 * @param thread
 */
SNSMessage.prototype.setThread = function(thread) {
	if (thread && thread.notEmpty()) {
		this.thread = thread;
	}
};

/**
 * 设置消息的subject属性
 * @param subject
 */
SNSMessage.prototype.setSubject = function(subject) {
	if (subject && subject.notEmpty()) {
		this.subject = subject;
	}
};

/**
 * 获取人性化时间显示， 未对时区进行处理
 * @returns
 */
SNSMessage.prototype.getHumanizeDateString = function() {
	var dateline = this.body.dateline;
	
	if(!dateline){
		dataline = new Date();
	}
	
	if (typeof dateline == "number") {
		var d = new Date();
		d.setTime(dateline);
		dateline = d;
	}
	if (dateline && dateline instanceof Date) {
		var year = dateline.getYear();
		var month = doubleDigit(dateline.getMonth() + 1);
		var date = doubleDigit(dateline.getDate());
		var hours = doubleDigit(dateline.getHours());
		var minutes = doubleDigit(dateline.getMinutes());

		var d = new Date();

		if (year != d.getYear()) {
			return year + "-" + month + "-" + date + " " + hours + ":" + minutes;
		} else {
			if (month != d.getMonth() || date != d.getDate()) {
				return month + "-" + date + " " + hours + ":" + minutes;
			} else {
				if (hours < 12) {
					return SNS_I18N.am + hours + ":" + minutes;
				} else {
					return SNS_I18N.pm + hours + ":" + minutes;
				}
			}
		}
	}
	YYIMChat.log("snsMessage.getHumanizeDateString:invalid dateline", 1, this.dateline);
	return null;

	function doubleDigit(source) {
		if (source > 9)
			return source;
		return "0" + source;
	}
};

SNSMessage.prototype.decodeMessageStyle = function(style){
	if(style){
		return jQuery.extend(new SNSMessageStyle(), style);
	}
	return style;
};