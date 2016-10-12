var SNSToGroupChatPlugin = function(){
	this.name = "toGroupChat";
	this.enable = true;

	this.searchWindow;
	this.localSearchPanel;

	this.triggerBtn;
	
	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
};

SNSToGroupChatPlugin.prototype = new SNSPlugin();

SNSToGroupChatPlugin.prototype._init = function(){
	// 转为群聊
	jQuery("#transToMUC").bind("click", jQuery.proxy(function() {
		var curRoster = SNSIMWindow.getInstance().getChatWindow().getActiveRoster();
		if (curRoster instanceof SNSRoster) {
			var uuid = Math.uuid().replace(/\-/g, "").toLowerCase().substr(0, 8);
			var name = (curRoster.name + "、" +SNSApplication.getInstance().getUser().name + "_" + uuid).substr(0, 8);
			YYIMChat.addChatGroup({
				name: name,
				node: uuid,
				//nickName: SNSApplication.getInstance().getUser().getID(),
				success: jQuery.proxy(function(arg) {
					var room = SNSApplication.getInstance().getUser().chatRoomList.createRoomHandler(arg);
					YYIMChat.addGroupMember({roomId:room.getID(), ids:[this.getID()]});
					SNSIMWindow.getInstance().getChatWindow().openChatWith(room);
					SNSIMWindow.getInstance().getInvitationWindow().show(room.getID());
				}, curRoster)
			});
		}
	}, this));
	
	SNSApplication.getInstance().getGlobalEventManager().registerEventHandler(SNS_EVENT_SUBJECT.ON_CURRENT_CHAT_CHANGE, true, function(e, data){
		if(data && data.newValue){
			var roster = data.newValue.getTarget();
			
			if(roster instanceof SNSRoster && !(roster instanceof SNSDeviceRoster)){
				jQuery("#transToMUC").show();
			}else{
				jQuery("#transToMUC").hide();
			}
		}
	}, this);
};

SNSToGroupChatPlugin.getInstance = function(){
	return SNSToGroupChatPlugin._instance;
}
new SNSToGroupChatPlugin().start();