var SNSIFrameChatTab = function(name, url){
	
	this.type = "iframeChatTab";
	
	this.name = name;
	this.url = url;
	
	this.headSelector  = "#"+SNSIFrameChatTab.idPrefix+"head_"+name;
	this.contentSelector = "#"+SNSIFrameChatTab.idPrefix+"content_"+name;
	
	this.iframePanel = new SNSIFrameFloatPanel(url, name, 410, 377);
	
	this.closeable = true;
	
};

SNSIFrameChatTab.idPrefix = "snsim_iframe_chat_tab_";

SNSIFrameChatTab.headTemplate = 
	'<li id="'+SNSIFrameChatTab.idPrefix+'head_##{{name}}" title="##{{name}}" class="snsim_tab_head">'
	+'<div class="list_head_item">'
	+ '<div class="list_head_state">'
		+ '<span class="snsim_roster_presence W_chat_stat snsim_##{{type}}"></span>'
	+ '</div>'
	+ '<div class="snsim_username">##{{name}}'
		+ '<span class="wbim_icon_vf"></span>'
	+ '</div>'
	+ '<a hidefloat="true" class="snsim_chat_window_tab_close_btn"></a>'
	+'</div>'
+ '</li>';

SNSIFrameChatTab.contentTemplate = 
	'<div id="'+SNSIFrameChatTab.idPrefix+'content_##{{name}}" class="snsim_tab_content snsim_dia_list">'
		+'<div class="sns_message_container cur">'
			+'##{{iframePanel.buildHtml()}}'
		+'</div>'
	+ '</div>';

SNSIFrameChatTab.prototype = new SNSRosterChatTab();

SNSIFrameChatTab.prototype.getHeadTemplate = function(){
	return SNSIFrameChatTab.headTemplate;
};

SNSIFrameChatTab.prototype.getContentTemplate= function(){
	return SNSIFrameChatTab.contentTemplate;
};