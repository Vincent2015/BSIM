var SNSWorkflowTodoTab = function(roster){
	this.name="todo";
	this.headSelector = "#snsim_tab_head_workflow_todo";
	this.contentSelector = "#snsim_tab_content_workflow_todo";
	this.containerSelector = "#snsim_tab_content_workflow_todo .snsim_workflow_todo_container";
	
	this.workflowTemplate = 
		'<li id="snsim_workflow_item_##{{workflowId}}" class="snsim_workflow_item"><a href="##{{url}}" target="_blank">##{{name}}</a><span class="W_fr">##{{creator}}</span><span class="W_fr">##{{createdate}}</span></li>';
	
	//{"result":[{"createdate":"2014-09-24 14:17:13","creator":"000113100000000008I3","messageId":"2madej7kmaecj2q43pld","name":"费用","url":"http:\/\/172.20.5.212:8090\/portal\/app\/cp_docnode\/cp_docformnode?pk_doc=000113100000000009O2&model=uap.lfw.dbl.cpdoc.base.DefaultCpDocPageModel&taskPk=00001310000000001UD2&pk_freeform=00001310000000001UCY&makeuser=000113100000000008I3&nodecode=dbl_money&$pa_0_appid=cp_docnode&$pa_1_windowid=cp_docformnode&$pa_2_busiid=000113100000000009OS&$pa_3_pk_prodef=00001510000000000AT3&$pa_4_port_id=4&$pa_5_pk_funcnode=000113100000000009OQ","usercode":"000113100000000008IB","workflowId":"00001310000000001UCY"},{"createdate":"2014-09-24 14:17:32","creator":"000113100000000008I3","messageId":"yvtj2ri28jr8y2rtebpf","name":"费用","url":"http:\/\/172.20.5.212:8090\/portal\/app\/cp_docnode\/cp_docformnode?pk_doc=000113100000000009O2&model=uap.lfw.dbl.cpdoc.base.DefaultCpDocPageModel&taskPk=00001310000000001UD9&pk_freeform=00001310000000001UD5&makeuser=000113100000000008I3&nodecode=dbl_money&$pa_0_appid=cp_docnode&$pa_1_windowid=cp_docformnode&$pa_2_busiid=000113100000000009OS&$pa_3_pk_prodef=00001510000000000AT3&$pa_4_port_id=4&$pa_5_pk_funcnode=000113100000000009OQ","usercode":"000113100000000008IB","workflowId":"00001310000000001UD5"}]}
	this.workflowData;
	
	this.publicRoster = roster;
};

SNSWorkflowTodoTab.headTemplate = 
	' <li id="snsim_tab_head_workflow_todo" title="待办" class="snsim_tab_head clearfix">'
		+' <a href="javascript:void(0);" class="process_tab">'
		+'<span class="snsim_icon_tab  ">待办</span>'
		+'</a>'
    +'</li>';

SNSWorkflowTodoTab.contentTemplate = 
	'<div id="snsim_tab_content_workflow_todo" class=" snsim_tab_content snsim_tab_content_roster sns_share_container snsRostersScroll">'
		+'<div style="height: 22px; margin-top: 10px; border-bottom: 1px solid #d6d6d6;display:none;">'
			+'<a class="snsim_workflow_todo_refresh_btn" style="margin-left: 20px;">刷新</a>'
		+'</div>'
		+'<div class="snsim_workflow_todo_container workflow_container  snsim_list_con">'
		+'</div>'
	+'</div>';

SNSWorkflowTodoTab.prototype = new SNSTab();

SNSWorkflowTodoTab.prototype._init = function(){
	this.getContainerDom().find(".snsim_workflow_todo_refresh_btn").bind("click", jQuery.proxy(this.queryWorkflowData, this));
};

SNSWorkflowTodoTab.prototype.getHeadTemplate = function(){
	return SNSWorkflowTodoTab.headTemplate;
};

SNSWorkflowTodoTab.prototype.getContentTemplate = function(){
	return SNSWorkflowTodoTab.contentTemplate;
};

SNSWorkflowTodoTab.prototype.beforeSelect = function(){
	if(this.getContainerDom().html().isEmpty()){
		if(!this.workflowData){
			this.queryWorkflowData();
			return;
		}
		this.showWorkflow();
	}
};

SNSWorkflowTodoTab.prototype.showWorkflow = function(){
	var container =this.getContainerDom();
	container.empty();
	for(var i =0; i< this.workflowData.length;i++){
		var item = this.workflowData[i];
		if(item){
			var html = TemplateUtil.genHtml(this.workflowTemplate , item);
			container.append(html);
		}
	}
	this._bindDomEvent();
};

SNSWorkflowTodoTab.prototype._bindDomEvent = function(){
	this.getContentDom().find(".snsim_workflow_item").bind("click",function(){
		var url = jQuery(this).find("a[url]").attr("url");
		var iframePanel = new SNSIFrameFloatPanel(url, Math.uuid(), 600, 400);
		iframePanel.show();
	});
};

SNSWorkflowTodoTab.prototype.queryWorkflowData = function(){
	var user = SNSApplication.getInstance().getUser();
	jQuery.getJSON(SNSWorkflowPlugin.queryUrl+"?usercode="+user.jid.getNode()+"&callback=?",jQuery.proxy(function(data){
		this.workflowData = data.result;
		this.showWorkflow();
	},this));
};