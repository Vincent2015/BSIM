/**
 * 存储最近联系人列表，渲染的通知事件由其他事件激发
 * @Class SNSRecentList
 */
var SNSRecentList = function() {

	/**
	 * 最近联系人列表，存储联系人的bareJID
	 * 
	 * @Param {object[]} {id,message} jid为bareJID, message为消息对应的content
	 */
	this.list = new Array();

}

SNSRecentList.prototype.getFirstItem= function(){
	if(this.list.length>0){
		return this.list[0];
	}
}

/**
 * 判断最近联系列表中是否有该联系人
 * @param {string | JSJaCJID |SNSRoster} id 被判断的联系人或者联系人的JID
 * @return {boolean}
 */
SNSRecentList.prototype.contains = function(id){
	for(var i=0; i<this.list.length; i++){
		if(id == this.list[i].id){
			return true;
		}
	}
	return false;
}

/**
 * 添加新的联系人
 * @param{SNSMessage}  message 最近发送的消息
 */
SNSRecentList.prototype.addNew = function(message) {
	
	var roster = message.getRosterOrChatRoom();
	
	var rosterId = roster.id;
	
	if (this.list[0] && this.list[0].id == rosterId) {
		return;
	}

	// 添加到数组
	var length = this.list.unshift({id:rosterId, message:message.body.content});

	// 删除之前的位置
	for (var i = 1; i < length; i++) {
		if (this.list[i].id == rosterId) {
			this.list.splice(i, 1);
			break;
		}
	}

	// 如果超出指定长度删除最后一个
	if (this.list.length > SNSConfig.RECENT.MAX_SIZE) {
		this.list.pop();
	}

	SNSApplication.getInstance().getGlobalEventManager().trigger(SNS_EVENT_SUBJECT.ADD_TO_RENCENT, []);

	
}