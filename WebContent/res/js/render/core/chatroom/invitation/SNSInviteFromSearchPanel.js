var SNSInviteFromSearchPanel = function(){
	this.selector = "#snsim_invite_from_search";
	this.searchInputSelector = "#snsim_invite_search_input";
	this.searchResultListSelector = "#snsim_invite_search_result_list";
	this.searchResultContainerSelector = "#invite_roster_list_box";
	
	this.searchResultTemplate =     	
		'<li class="search_result_item" rosterId="##{{getID()}}" name="##{{name}}" onclick="SNSIMWindow.getInstance().getInvitationWindow().selectToInvite(this)">'
			+ '<span title="##{{name}}">##{{name}}</span>'
		+ '</li>';
	
	this._init();
};

SNSInviteFromSearchPanel.prototype = new SNSComponent();

SNSInviteFromSearchPanel.getInstance = function(){
	if(SNSInviteFromSearchPanel._instance)
		return SNSInviteFromSearchPanel._instance;
};
SNSInviteFromSearchPanel.prototype._init = function(){
	YYIMChat.log("SNSInviteFromOrgTab.prototype._init",3);
	SNSInviteFromSearchPanel._instance = this;
	jQuery(this.searchResultContainerSelector).perfectScrollbar({suppressScrollX:true});
	this._bindDomEvent();
};

SNSInviteFromSearchPanel.prototype._bindDomEvent = function(){
	jQuery(this.searchInputSelector).bind("keydown",jQuery.proxy(function(event) {
		var keyword = jQuery(this.searchInputSelector).val();
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			this.clearSearchResult();
			// 搜索结果返回之后再进行页面渲染
			YYIMChat.queryRosterItem( {
				keyword: keyword,
				success: jQuery.proxy(this.showSearchResult, this)
			});
		}
	}, this));
	
	jQuery(this.searchInputSelector).bind("keyup",jQuery.proxy(function(event) {
		var keyword = jQuery(this.searchInputSelector).val();
		if(!keyword){
			this.getDom().find(this.searchResultContainerSelector).hide();
			SNSIMWindow.getInstance().getInvitationWindow().tabContainer.getDom().show();
		}
	}, this));
};

/**
 * 显示搜索到的用户
 */
SNSInviteFromSearchPanel.prototype.showSearchResult = function(jsonList){
	this.getDom().find(this.searchResultContainerSelector).show();
	SNSIMWindow.getInstance().getInvitationWindow().tabContainer.getDom().hide();
	
	var resultList = jsonList.items;
	for(var i = 0; i< resultList.length; i++){
		resultList[i] = jQuery.extend(new SNSRoster(resultList[i].id), resultList[i]);
		//resultList[i].jid = new JSJaCJID(resultList[i].jid);
		
		jQuery(this.searchResultListSelector).append(TemplateUtil.genHtml(this.searchResultTemplate, resultList[i]));
	}
};

/**
 * 再次搜索之前，清空上次搜索结果
 */
SNSInviteFromSearchPanel.prototype.clearSearchResult = function(){
	jQuery(this.searchResultListSelector).html("");
};
