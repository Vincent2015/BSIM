function YYIMCacheVCard(arg){
	this.build(arg);
}

YYIMCacheVCard.prototype.build = function(arg){
	this.id = arg.id || arg.userId || this.id;
	this.mobile = arg.mobile || this.mobile;
	this.name = arg.name || arg.nickname || this.name;
	this.photo = arg.photo || this.photo;
	this.telephone = arg.telephone || this.telephone;
	this.email = arg.email || this.email;
	this.gender = arg.gender || this.gender;
	this.location = arg.location || this.location;
	this.position = arg.position || this.position;
	this.six = arg.six || this.six;
	this.office = arg.office || this.office;
	this.officePhone = arg.officePhone || this.officePhone;
	this.phoneticName = arg.phoneticName || this.phoneticName;
};
