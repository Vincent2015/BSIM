var SNSSelectedListPanel = function(){
	this.selector = "#snsim_selected_container";
	this.selectedListContainerSelector = ".selected_list_container";
	this.selectedListSelector = ".selected_list";
	this.selectedNumSelector = ".selected_num";
	this.deleteBtnSelector = ".delete_btn";
	
	this.list = new SNSBaseRosterList();
	
	this.itemTemplate = 
		'<li rosterId="##{{getID()}}">'
			+ '<img src="##{{getPhotoUrl()}}" class="head_icon">'
			+ '<span style="margin-left: 8px;vertical-align: top;" title="##{{name}}">##{{name}}</span>'
			+ '<span class="remove_btn" onclick="SNSSelectedListPanel.getInstance().remove(\'##{{getID()}}\')">删除</span>'
		+ '</li>';
	
	this._init();
};

SNSSelectedListPanel.prototype = new SNSComponent();

SNSSelectedListPanel.getInstance = function(){
	if(SNSSelectedListPanel._instance)
		return SNSSelectedListPanel._instance;
};

SNSSelectedListPanel.prototype._init = function(){
	YYIMChat.log("SNSInviteMembersSelectedPanel.prototype._init",3);
	SNSSelectedListPanel._instance = this;
	this.getDom().find(this.selectedListContainerSelector).perfectScrollbar();
	//this._bindDomEvent();
};

SNSSelectedListPanel.prototype.add = function(roster){
	if(!roster)
		return;
	if(this.list.add(roster)){
		this.getDom().find(this.selectedListSelector).append(TemplateUtil.genHtml(this.itemTemplate, roster));
		this.getDom().find(this.selectedNumSelector).text(this.list.size());
	}
};

SNSSelectedListPanel.prototype.remove = function(id){
	if(!id)
		return;
	this.getDom().find(this.selectedListSelector + " li[rosterId='" + id + "']").remove();
	this.list.remove(id);
	this.getDom().find(this.selectedNumSelector).text(this.list.size());
};