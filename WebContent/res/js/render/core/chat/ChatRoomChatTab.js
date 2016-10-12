var SNSChatRoomChatTab = function(chatroom) {
	
	this.name = chatroom.id;
	this.chatroom  = chatroom;
	this.tabContainer = new SNSInnerChatTabContainer(chatroom);
	
	this.closeable = true;
	
	this.headSelector = "#"+SNSChatRoomChatTab.headIdPrefix+chatroom.getID();
	this.contentSelector = "#"+SNSChatRoomChatTab.contentIdPrefix+chatroom.getID();
	
};

SNSChatRoomChatTab.headIdPrefix = "snsim_chat_window_inner_tab_head_";
SNSChatRoomChatTab.contentIdPrefix = "snsim_chat_window_inner_tab_content_";

SNSChatRoomChatTab.headTemplate = 
	'<li id="'+SNSChatRoomChatTab.headIdPrefix+'##{{chatroom.getID()}}" title="##{{chatroom.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state" style="margin-left: 12px;margin-right: 2px;">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_chatroom"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{chatroom.name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSChatRoomChatTab.contentTemplate = 
	'<div id="'+SNSChatRoomChatTab.contentIdPrefix+'##{{chatroom.getID()}}"  class="snsim_tab_content snsim_tab_content_container snsim_dia_list snsim_dia_chatroom_list" >'
		+'<div class="snsim_tab sns_chat_inner_tab">'
			+'<ul class="snsim_tab_head_container tab_list clearfix">'
				+'<li id="snsim_tab_head_message_##{{chatroom.getID()}}" title="群消息" class="snsim_tab_head snsim_tab_head_message cur">'
					+'<a class="snsim_dia_chatroom_tab_head">'
						+'<span class="snsim_message_tab_icon"></span>'
						+'<span class="snsim_tab_title">群消息</span>'
					+' </a>'
				+'</li>'
				+'<li id="snsim_tab_head_share_##{{chatroom.getID()}}" title="群共享" class="snsim_tab_head snsim_tab_head_share">'
					+'<a class="snsim_dia_chatroom_tab_head">'
						+'<span class="snsim_share_tab_icon"></span>'
						+'<span class="snsim_tab_title">群共享</span>'
					+'</a>'
				+'</li>'
			+'</ul>'
		+'</div>'
		+'<div id="snsim_tab_content_message_##{{chatroom.getID()}}" class="snsim_tab_content snsim_tab_content_message sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
		+'<div id="snsim_tab_content_share_##{{chatroom.getID()}}" class="snsim_tab_content snsim_tab_content_share sns_share_container">'
			+'<div class="sns_share_panel">'
				+'<div class="snsim_share_panel_head">'
					+'<span>共<span class="snsim_share_file_num">0</span>个文件</span>'
					+'<a id="snsim_share_file_refresh_btn" class="snsim_share_file_refresh_btn"><span class="refresh_icon"></span></a>'
				+'</div>'
				+ '<div id="snsim_sharefile_box" class="snsim_sharefile_box"><ul class="snsim_sharefile_container"></ul></div>'
			+'</div>'
		 +'</div>'
	+ '</div>';

SNSChatRoomChatTab.prototype = new SNSRosterChatTab();

SNSChatRoomChatTab.prototype._init = function (){
	YYIMChat.log("SNSChatRoomChatTab.prototype._init ",3);
	// console.info(this.tabContainer.tabs);
	this.tabContainer._init();
	
	var messageTab = new SNSInnerMessageTab(this.chatroom);
	this.tabContainer.addTab(messageTab);
	
	var shareTab = new SNSInnerShareTab(this.chatroom);
	this.tabContainer.addTab(shareTab);
	
	var appTab = new SNSInnerAppTab(this.chatroom);
	this.tabContainer.addTab(appTab);
	
};

SNSChatRoomChatTab.prototype.getHeadTemplate = function(){
	return SNSChatRoomChatTab.headTemplate;
};

SNSChatRoomChatTab.prototype.getContentTemplate= function(){
	return SNSChatRoomChatTab.contentTemplate;
};

SNSChatRoomChatTab.prototype.getTarget = function(){
	return this.chatroom;
};
