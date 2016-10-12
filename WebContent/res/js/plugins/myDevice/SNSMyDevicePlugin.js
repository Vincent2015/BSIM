var SNSMyDevicePlugin = function() {

	this.name = "myDevice";

	this.loadPeriod = SNS_EVENT_SUBJECT.AFTER_CONNECT;
	this.enable = true;

	this.myDeviceGroup;
	this.myDeviceRoster;
};

SNSMyDevicePlugin.prototype = new SNSPlugin();

SNSMyDevicePlugin.prototype._init = function() {
	if(!SNSMyDevicePlugin._instance)
		SNSMyDevicePlugin._instance = this;
	
	this.myDeviceGroup = new SNSDeviceGroup();
	this.renderDeviceGroup();
	var myAndroid = new SNSDeviceRoster("android-v2.0","我的设备");
	myAndroid.groups = [SNSDeviceGroup.getInstance()];
	this.addDevice(myAndroid);
	
	SNSPlugin.prototype._init.call(this);
};

SNSMyDevicePlugin.prototype.renderDeviceGroup = function(){
	// render
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	var groupDom = rosterTab.getGroupDom(this.myDeviceGroup);
	if (!groupDom) {
		var html = TemplateUtil.genHtml(rosterTab.groupTempalte, [ this.myDeviceGroup ]);
		var container = rosterTab.getDom().find(rosterTab.groupContainerSelector);
		container.prepend(html);
		rosterTab._bindGroupFoldEvent(this.myDeviceGroup);
	}
};

/**
 * core中的addRoster会根据bareJID进行过滤，不能添加多个设备
 * @param device
 */
SNSMyDevicePlugin.prototype.addDevice = function(device){
	var rosterTab = SNSIMWindow.getInstance().getWideWindow().getTab("roster");
	SNSApplication.getInstance().getUser().deviceList.add(device);
	if (device.groups.length > 0) {
		for (var i = 0; i < device.groups.length; i++) {
			var group = device.groups[i];
			var groupDom = rosterTab.addGroup(group);

			var html = TemplateUtil.genHtml(rosterTab.rosterTemplate, [ device, {
				groupname : group.name
			} ]);

			var container = jQuery("#list_content_" + group.name);
			container.append(html);
			
			rosterTab._bindRosterEvent(device, group);
		}
	}
};

SNSMyDevicePlugin.getInstance = function(){
	return SNSMyDevicePlugin._instance;
};
new SNSMyDevicePlugin().start();