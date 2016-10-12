var SNSInviteFromOrgTab = function(){
	this.name = "inviteFromOrg";

	this.headSelector = "#snsim_tab_head_invite_from_org";
	this.contentSelector= "#snsim_tab_content_invite_from_org";
	
	this.ztreeSelector = "#invite_from_org_tree";
	
	this.ztree;
	
	this.zTreeSetting = {
			data : {
				simpleData : {
					enable : true
				}
			},
			view : {
				nameIsHTML : true,
				showLine : false,
				showTitle : false
			},
			callback : {
				onExpand : jQuery.proxy(this.onNodeExpand, this)
			}
		};
	
	this.operationMenuTemplate = 
		'##{{name}} <span jid="##{{jid}}" class="organization_list_opt" hidefloat="true" style="display:none;"></span>';
};

SNSInviteFromOrgTab.prototype = new SNSTab();

SNSInviteFromOrgTab.prototype._init = function(){
	YYIMChat.log("SNSInviteFromOrgTab.prototype._init",3);
	// 添加滚动条
	jQuery(this.contentSelector).perfectScrollbar();
	SNSTab.prototype._init.call(this);
};

SNSInviteFromOrgTab.prototype.beforeSelect = function(){
	if(!this.ztree){
		this.loadRootNode();
	};
};

SNSInviteFromOrgTab.prototype.loadRootNode = function() {
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo("1@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet) {
		if (packet.isError()) {
			YYIMChat.log("SNSInviteFromOrgTab.prototype.loadNodeByParent ", 0);
			return;
		}
		
		var zRootNode =[];
		
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSIMWindow.getInstance().getInvitationWindow().selectToInvite('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
			zRootNode.push({
				id:node.id,
				name:node.name,
				open:false,
				isParent:node.isParent,
				iconSkin:node.iconSkin
			});
		}
		this.ztree =  jQuery.fn.zTree.init(jQuery(this.ztreeSelector), this.zTreeSetting, zRootNode);
	}, this));
};

/**
 * 加载父节点对应子节点数据
 * @param parent		父节点对象，类型为treeNode, 为ztree内置类型
 */
SNSInviteFromOrgTab.prototype.loadNodeByParent = function(parent) {
	
	if(parent.loaded ||parent.loading) return;
	this.addLoadingNode(parent);//显示正在加载
	parent.loading = true;
	var iq = new JSJaCIQ();
	iq.setType(SNS_TYPE.GET);
	iq.setTo(parent.id + "@org." + SNSApplication.getInstance().getDomain());
	var query = iq.buildNode("query", {
		xmlns : NS_ORGANIZATION
	});
	iq.appendNode(query);
	YYIMChat.send(iq, jQuery.proxy(function(packet, data) {
		if (packet.isError()) {
			YYIMChat.log("SNSInviteFromOrgTab.prototype.loadNodeByParent ", 0, data);
			return;
		}
		var json = new Array();
		var xml = packet.doc.xml;
		var items = jQuery(xml).find("item[id]");
		for (var i = 0; i < items.length; i++) {
			var item = jQuery(items[i]);
			var node = new Object();
			node.id = item.attr("id");
			node.name = item.attr("name");
			var isUser = item.attr("isUser");
			var isLeaf = item.attr("isLeaf");
			if (isLeaf == "false" ) {
				node.isParent = true;
				node.iconSkin = "department"
			} else {
				node.isParent = false;
			}
			if( isUser =="true"){
				node.iconSkin = "person";
				node.name = this.getOperationHtml(node);
				node.click = "SNSIMWindow.getInstance().getInvitationWindow().selectToInvite('"+ item.attr("id") + "','" + item.attr("name") +"\')";
			}
			json.push(node);
		}
		parent.loaded = true;
		parent.loading = false;
		this.ztree.addNodes(data.parent, json);
		this.removeLoadingNode(data.parent);//加载完成后，删除正在加载按钮
	}, this), {
		parent: parent
	});
};

/**
 * 展开父节点时被激发的事件,并显示正在加载
 */
SNSInviteFromOrgTab.prototype.onNodeExpand = function(event, treeId, treeNode) {
	var tid = treeNode.tId;
	this.loadNodeByParent(treeNode);
};

/**
 * 添加正在加载节点
 */
SNSInviteFromOrgTab.prototype.addLoadingNode = function(parentNode){
	var node = new Object();
	node.id = Math.round(Math.random()*1000)+1000;
	node.iconSkin="loading";
	node.name="正在加载...";
	this.ztree.addNodes(parentNode, node,false);
};

/**
 * 删除正在加载节点
 */
SNSInviteFromOrgTab.prototype.removeLoadingNode = function(parentNode){
	var nodes = this.ztree.getNodesByParam("iconSkin","loading", parentNode);
	for(var i=0; i<nodes.length;i++){
		this.ztree.removeNode(nodes[i]);
	}
};

SNSInviteFromOrgTab.prototype.getOperationHtml = function(node){
	return TemplateUtil.genHtml(this.operationMenuTemplate, {jid:node.id ,name:node.name});
};

SNSInviteFromOrgTab.prototype.chatWithRoster = function(jid, name){
	var roster = new SNSRoster(jid, name);
	SNSIMWindow.getInstance().getChatWindow().openChatWith(roster);
};