function YYIMCacheVCard(arg){
	this.build(arg);
}

YYIMCacheVCard.prototype.build = function(arg){
	this.id = arg.id || arg.userId || this.id;
	this.name = arg.name || arg.nickname || this.name;
	this.nickname = this.name;
	this.photo = arg.photo || this.photo;
	this.organization = arg.organization || this.organization;
	this.mobile = arg.mobile || this.mobile;
	this.telephone = arg.telephone || this.telephone;
	this.email = arg.email || this.email;
	this.gender = arg.gender || this.gender;
	this.number = arg.number || this.number;
	this.remarks = arg.remarks || this.remarks;
	this.location = arg.location || this.location;
	this.position = arg.position || this.position;
	this.six = arg.six || this.six;
	this.office = arg.office || this.office;
	this.officePhone = arg.officePhone || this.officePhone;
	this.phoneticName = arg.phoneticName || this.phoneticName;
};
