var SNSPublicRosterChatTab = function(publicRoster) {
	
	this.name = publicRoster.jid.getBareJID();
	this.publicRoster  = publicRoster;
	this.tabContainer = new SNSInnerChatTabContainer(publicRoster);
	
	this.closeable = true;
	
	this.headSelector = "#"+SNSPublicRosterChatTab.headIdPrefix+publicRoster.getID();
	this.contentSelector = "#"+SNSPublicRosterChatTab.contentIdPrefix+publicRoster.getID();
	
};
SNSPublicRosterChatTab.prototype = new SNSRosterChatTab();

SNSPublicRosterChatTab.headIdPrefix = "snsim_chat_window_inner_tab_head_";
SNSPublicRosterChatTab.contentIdPrefix = "snsim_chat_window_inner_tab_content_";

SNSPublicRosterChatTab.headTemplate = 
	'<li id="'+SNSPublicRosterChatTab.headIdPrefix+'##{{publicRoster.getID()}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_chatroom"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{publicRoster.name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSPublicRosterChatTab.contentTemplate = 
	'<div id="'+SNSPublicRosterChatTab.contentIdPrefix+'##{{publicRoster.getID()}}" jid="##{{publicRoster.jid.getBareJID()}}" class="snsim_tab_content snsim_tab_content_container snsim_dia_list snsim_dia_chatroom_list" >'
		+'<div class="snsim_tab sns_chat_inner_tab">'
			+'<ul class="snsim_tab_head_container tab_list clearfix">'
				+'<li id="snsim_tab_head_message_##{{publicRoster.getID()}}" title="流程消息" class="snsim_tab_head snsim_tab_head_message cur">'
					+'<a href="javascript:void(0);" class="process_tab">'
						+'<span class="snsim_icon_tab ">任务消息</span>'
					+' </a>'
				+'</li>'
				/*+'<li id="snsim_tab_head_share_##{{publicRoster.getID()}}" title="待办流程" class="snsim_tab_head snsim_tab_head_share">'
					+'<a href="javascript:void(0);">'
						+'<span class="snsim_icon_tab  ">待办</span>'
					+'</a>'
				+'</li>'*/
				/*+'<li id="snsim_tab_head_app_##{{publicRoster.getID()}}" title="已办流程" class="snsim_tab_head snsim_tab_head_app">'
					+'<a href="javascript:void(0);">'
						+'<span class="snsim_icon_tab ">已办</span>'
					+'</a>'
				+'</li>'*/
			+'</ul>'
		+'</div>'
		+'<div id="snsim_tab_content_message_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_message sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
		/*+'<div id="snsim_tab_content_share_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_share sns_share_container">'
			+'<div class="sns_share_panel">'
				+'<div style="height: 22px; margin-top: 10px; border-bottom: 1px solid #d6d6d6;">'
					+'<a id="snsim_share_file_refresh_btn" class="snsim_share_file_refresh_btn" style="margin-left: 20px;">刷新</a>'
				+'</div>'
				+ '<ul class="snsim_sharefile_container"></ul>'
			+'</div>'
		 +'</div>'*/
		/* +'<div id="snsim_tab_content_app_##{{publicRoster.getID()}}" class="snsim_tab_content snsim_tab_content_app sns_app_container">'
		 	+'<div class="sns_photo_panel">sns_app_panel</div>'
	 	+'</div>'*/
	+ '</div>';

SNSPublicRosterChatTab.prototype = new SNSRosterChatTab();

SNSPublicRosterChatTab.prototype._init = function (){
	YYIMChat.log("SNSPublicRosterChatTab.prototype._init ",3);
	//console.info(this.tabContainer.tabs);
	this.tabContainer._init();
};

SNSPublicRosterChatTab.prototype.getHeadTemplate = function(){
	return SNSPublicRosterChatTab.headTemplate;
};

SNSPublicRosterChatTab.prototype.getContentTemplate= function(){
	return SNSPublicRosterChatTab.contentTemplate;
};

SNSPublicRosterChatTab.prototype.getTarget = function(){
	return this.publicRoster;
};
