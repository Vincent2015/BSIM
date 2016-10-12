/**
 * 表示用户的出席信息 可以使用presence出席状态报文对该类进行初始化，注意和subscribe报文进行区别
 * @Class SNSPresence
 * @param arg {from, type, show: "available", status}
 */
var SNSPresence = function(arg) {
	this.status = SNS_STATUS.UNAVAILABLE;
	if (arg) {
		this.resource = arg.resource;
		this.type = arg.type;
		this.status = arg.status;
	}
};

SNSPresence.prototype.equals = function(presence) {
	if (presence && presence instanceof SNSPresence) {
		if (presence.status == this.status && this.priority == presence.priority) {
			return true;
		}
		return false;
	}
	return false;
};

/**
 * 更改出席状态，若status为null, 默认将status和show均设置为show status字符串长度不超过30个字符
 * @param show {string} 出席状态
 * @See SNSPresence.SNS_STATUS
 * @param status {string} 自定义状态信息
 */
SNSPresence.prototype.setStatus = function(status) {
	for ( var i in SNS_STATUS) {
		if (status == SNS_STATUS[i]) {
			this.status = status;
			return;
		}
	}
};