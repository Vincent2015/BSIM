/**
 * 表示群共享的文件 继承自
 * @See SNSFile
 * @Class SNSChatRoomFile
 */
var SNSChatRoomFile = function(name,path, size) {
	this.downloads = 0;
	this.creator;
	this.time;
};

SNSChatRoomFile.prototype = new SNSFile();

/**
 * 聊天室的上传文件列表
 * @Class SNSChatRoomFileList
 */
var SNSChatRoomFileList = function(id) {
	this._roomId = id;

	/**
	 * 文件列表
	 * @Type{SNSChatRoomFile[]}
	 * @Field
	 */
	this._list = new Array();
	this._requested = false;
}

/**
 * 清空文件列表，用于刷新文件列表
 * @returns {Array}
 */
SNSChatRoomFileList.prototype.clear = function() {
	this._list = [];
	return this._list;
};

SNSChatRoomFileList.prototype.getList = function() {
	return this._list;
};

SNSChatRoomFileList.prototype.addFile = function(file) {
	this._list.push(file);
	this._list.sort(function(a, b) {// 按照上传时间倒序排列
		return b.timestamp - a.timestamp;
	});
	return this._list;
};
/**
 * 获取群共享文件
 */
SNSChatRoomFileList.prototype.requestSharedFiles = function() {
	var defer = jQuery.Deferred(),
		that = this;
	
	YYIMChat.getSharedFiles({
		id : this._roomId,
		start : 0,
		size : 20,
		success : function(sharedFilesResult) {
			that.clear();
			
			that._requested = true;
			var _files = sharedFilesResult.files,
				i = _files.length;
			while (i--) {
				var sharedFile = new SNSChatRoomFile();
				sharedFile.name = _files[i].name;
				sharedFile.size = new SNSFile("","",_files[i].size).size;
				sharedFile.downloads = _files[i].downloads;
				sharedFile.creator = _files[i].creator;
				sharedFile.time = _files[i].createTime;
				sharedFile.type = _files[i].type.toLowerCase();
				sharedFile.path = YYIMChat.getFileUrl(_files[i].attachId);
				that.addFile(sharedFile);
			}

			defer.resolve();
		}
	});

	return defer.promise();
};

SNSChatRoomFileList.prototype.hasRequested = function(){
	return this._requested;
};

/**
 * 消息类型为文件时，加入共享文件
 * @param {SNSMessage} message
 */
SNSChatRoomFileList.prototype.addFileFromMessage = function(message) {
	var sharedFile = new SNSChatRoomFile(message.body.content.name, message.body.content.path, message.body.content.size);
	sharedFile.downloads = 0;
	sharedFile.time = new Date(message.body.dateline).format("yyyy-MM-dd");
	if (message instanceof SNSInMessage) {
		sharedFile.creator = message.from.name;
	} else {
		sharedFile.creator = SNSApplication.getInstance().getUser().name;
	}
	this.addFile(sharedFile);
};
