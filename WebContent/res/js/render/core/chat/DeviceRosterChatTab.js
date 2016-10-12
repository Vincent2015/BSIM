var SNSDeviceRosterChatTab = function(roster) {

	this.roster = roster;
	this.name = roster ? roster.getID() : "";

	this.headSelector = roster ? "#" + SNSDeviceRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSDeviceRosterChatTab.contentIdPrefix + roster.getID() : "";
};

SNSDeviceRosterChatTab.headIdPrefix = "snsim_chat_window_device_tab_head_";
SNSDeviceRosterChatTab.contentIdPrefix = "snsim_chat_window_device_tab_content_";

SNSDeviceRosterChatTab.headTemplate = 
	'<li id="'+SNSDeviceRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{roster.name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{roster.presence.status}}"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSDeviceRosterChatTab.contentTemplate = 
	'<div id="'+SNSDeviceRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSDeviceRosterChatTab.prototype = new SNSRosterChatTab();

SNSDeviceRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSDeviceRosterChatTab.headTemplate;
};

SNSDeviceRosterChatTab.prototype.getContentTemplate = function() {
	return SNSDeviceRosterChatTab.contentTemplate;
};