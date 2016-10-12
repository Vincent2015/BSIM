var SNSSystemRosterChatTab = function(roster) {
	this.roster = roster;
	this.name = roster ? roster.getID() : "";

	this.headSelector = roster ? "#" + SNSSystemRosterChatTab.headIdPrefix + roster.getID() : "";
	this.contentSelector = roster ? "#" + SNSSystemRosterChatTab.contentIdPrefix + roster.getID() : "";
};

SNSSystemRosterChatTab.headIdPrefix = "snsim_chat_window_system_tab_head_";
SNSSystemRosterChatTab.contentIdPrefix = "snsim_chat_window_system_tab_content_";

SNSSystemRosterChatTab.headTemplate = 
	'<li id="'+SNSSystemRosterChatTab.headIdPrefix+'##{{roster.getID()}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
		+ '<div class="list_head_state">'
			+ '<span class="snsim_roster_presence W_chat_stat snsim_system_roster"></span>'
		+ '</div>'
		+ '<div class="snsim_username">##{{roster.name}}'
			+ '<span class="wbim_icon_vf"></span>'
		+ '</div>'
		+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
	+ '</li>';

SNSSystemRosterChatTab.contentTemplate = 
	'<div id="'+SNSSystemRosterChatTab.contentIdPrefix+'##{{roster.getID()}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'<div class="snsim_message_box_container sns_message_panel"></div>'
		+'</div>'
	+ '</div>';

SNSSystemRosterChatTab.prototype = new SNSRosterChatTab();

SNSSystemRosterChatTab.prototype.getHeadTemplate = function() {
	return SNSSystemRosterChatTab.headTemplate;
};

SNSSystemRosterChatTab.prototype.getContentTemplate = function() {
	return SNSSystemRosterChatTab.contentTemplate;
};