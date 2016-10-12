var SNSWideWindow = function() {
	this.selector = "#snsim_window_wide";
	
	this.headContainerSelector = "#snsim_wide_tab_head_container ul.tab_list";
	
	this.contentContainerSelector = "#snsim_wide_tab_content_container";
	this.width;
}

SNSWideWindow.prototype = new SNSTabContainer();

SNSWideWindow.prototype._init = function(){
	this.width = this.getDom().width();
	this.addTab(new SNSRosterTab());
	this.addTab(new SNSChatRoomTab());
	this.addTab(new SNSRecentTab());
};

/*SNSWideWindow.prototype.onTabChange = function(oldTab, newTab){
	if(newTab instanceof SNSChatRoomTab){
		var user = SNSApplication.getInstance().getUser();
		if(user.chatRoomList.size()==0){
			user.chatRoomList.queryChatRoom();
		}
	}
};*/