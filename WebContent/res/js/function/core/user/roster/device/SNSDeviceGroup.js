var SNSDeviceGroup = function(){
	this.name= SNSConfig.GROUP.GROUP_DEVICE;
	this.editable = false; // 主要用于不能移动和复制好友至该分组
};

SNSDeviceGroup.prototype = new SNSGroup();

SNSDeviceGroup.getInstance = function(){
	if(!SNSDeviceGroup._instance){
		SNSDeviceGroup._instance = new SNSDeviceGroup();
	}
	return SNSDeviceGroup._instance;
};

/**
 * 获取该分组中在线总人数
 * @return {Number}
 */
SNSDeviceGroup.prototype.getOnlineNumber = function(){
	var num = 0;
	var list = SNSApplication.getInstance().getUser().deviceList._list;
	for(var device in list){
		if(list[device] && list[device] instanceof SNSDeviceRoster){
			var status  = list[device].presence.status;
			if (status != SNS_STATUS.UNAVAILABLE){
				num++;
			}
		}
	}
	return num;
};

/**
 * 获取该分组总人数, 设备存在deviceList
 */
SNSDeviceGroup.prototype.size = function(){
	return SNSApplication.getInstance().getUser().deviceList.size();
};