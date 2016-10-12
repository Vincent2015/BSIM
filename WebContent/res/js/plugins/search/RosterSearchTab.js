var SNSRosterSearchTab = function(){
	this.name="rosterSearchTab";
	
	this.headSelector = "#snsim_roster_search_tab_head";
	this.contentSelector = "#snsim_roster_search_tab_content";
	
	this.containerSelector = "#snsim_roster_search_tab_container";
	
	this.searchBtn = ".multi_search_btn";
	
	this.searchResultHeadSelector = ".search_result_head";
	
	
	this.searchInputBox = ".multi_search_input";
	this.searchResultItemIdPrefix = "snsim_roster_search_item";
	
	this.rosterTemplate = 
	 	'<li id="'+ this.searchResultItemIdPrefix +'##{{roster.getID()}}">'
			+ '<div class="head_icon">'
				+ '<img src="##{{roster.getPhotoUrl()}}">'
			+ '</div>'
			+ '<div class="item_info">'
				+ '<span class="name">##{{roster.name}}</span>'
				+ '<a class="btn" style="color:##{{color}};" title="##{{title}}" onclick="##{{clickFunc}}">##{{info}}</a>'
				+ '<div class="info">##{{roster.getID()}}</div>'
			+ '</div>'
		+ '</li>';
};

SNSRosterSearchTab.prototype = new SNSTab();

SNSRosterSearchTab.prototype._init = function(){
	this.getContainerDom().parent().perfectScrollbar();
	this._bindDomEvent();
};

SNSRosterSearchTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(this.searchInputBox).bind("keydown",{self:this}, function(event){
		if (event.keyCode == SNS_KEY_CODE.ENTER) {
			event.data.self.sendSearchRequest();
		};
	});
	
	this.getContentDom().find(this.searchInputBox).bind("keyup",jQuery.proxy(function(event){
		var keyword = this.getSearchText();
		if(!keyword){
			this.getContainerDom().empty();
			this.getContentDom().find(this.searchResultHeadSelector).hide();
		}
	}, this));
	
	this.getContentDom().find(this.searchBtn).bind("click", {self:this},function(event){
		event.data.self.sendSearchRequest();
	});
};

SNSRosterSearchTab.prototype.sendSearchRequest = function(){
	YYIMChat.queryRosterItem({
		keyword: this.getSearchText(), 
		success: jQuery.proxy(this.showSearchResult, this)
	});
};

SNSRosterSearchTab.prototype.showSearchResult = function(resultObj){
	var result = resultObj.items;
	this.getContainerDom().empty();
	this.getContentDom().find(this.searchResultHeadSelector).show();
	var friendHtml = "";
	var strangerHtml = "";
	for(var i=0; i<result.length;i++){

		result[i] = jQuery.extend(new SNSRoster(result[i].id), result[i]);
		result[i].id = result[i].id;
		result[i].photoUrl = result[i].photo;
		
		var roster = SNSApplication.getInstance().getUser().getRoster(result[i].getID());
		if(roster && roster.subscription == SNS_SUBSCRIBE.BOTH){
			friendHtml += TemplateUtil.genHtml(this.rosterTemplate, 
				{
					roster: result[i], 
					clickFunc: "SNSIMWindow.getInstance().getChatWindow().openChatWith('"+ result[i].id +"')", 
					title: "聊天", 
					info: "聊天",
					color: "#36c048"
				}
			);
		}else{
			strangerHtml += TemplateUtil.genHtml(this.rosterTemplate, 
				{
					roster: result[i], 
					clickFunc: "SNSPlugin.pluginList.get('searchPlugin').searchWindow.addFriend('"+ result[i].id +"', '" + result[i].name + "')", 
					title: "添加", 
					info: "添加",
					color: "#ffa00a"
				}
			);
		}
	}
	var _html = friendHtml + strangerHtml;
	if(_html.length === 0){
		_html = '<li>没有符合条件的用户...</li>';
	}
	this.getContainerDom().append(_html);
};

SNSRosterSearchTab.prototype.getSearchText = function(){
	return this.getContentDom().find(this.searchInputBox).val().trim();
};