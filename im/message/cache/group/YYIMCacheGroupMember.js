function YYIMCacheGroupMember(arg){
	this.build(arg);
}

YYIMCacheGroupMember.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || this.name;
	this.photo = arg.photo || this.photo;
	this.affiliation = arg.affiliation || this.affiliation;
	this.role = arg.role || this.role;
	
	this.init();
};

YYIMCacheGroupMember.prototype.init = function(){
	this.syncInfo();
};

YYIMCacheGroupMember.prototype.syncInfo = function(){
    if(!this.photo){
		this.photo =  YYIMCacheConfig.DEFAULT_PHOTO.GROUPMEMEBER;
	}
};

YYIMCacheGroupMember.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};
