function YYIMCacheGroup(arg){
	this.build(arg);
}

YYIMCacheGroup.prototype = new YYIMCacheList();

YYIMCacheGroup.prototype.init = function(){
	this.syncInfo();
	this.updateMemberList();
};

YYIMCacheGroup.prototype.build = function(arg){
	this.id = arg.id || this.id;
	this.name = arg.name || this.name;
	this.numberOfMembers = arg.numberOfMembers || this.numberOfMembers;
	this.superLarge = arg.superLarge || this.superLarge;
	this.collected = arg.collected > 0 ? arg.collected:0;
	this.creater = arg.creater || this.creater;
	this.photo = arg.photo || this.photo;
	this.members = arg.members || this.members;
	
	this.init();
};

YYIMCacheGroup.prototype.syncInfo = function(){
    if(!this.photo){
		this.photo = YYIMCacheConfig.DEFAULT_PHOTO.GROUP;
	}
};

YYIMCacheGroup.prototype.getPhotoUrl = function(){
	return YYIMChat.getFileUrl(this.photo);
};

YYIMCacheGroup.prototype.updateMemberList = function(){
	if(this.members instanceof Array && this.members.length){
		this.clear();
		
		var temp = [];
		for(var i = 0;i < this.members.length;i++){
			var member = this.get(this.members[i].id);
			if(!member){
				member = new YYIMCacheGroupMember(this.members[i]);
				this.set(member.id,member);
			}else{
				try{
					member.build(this.members[i]);
				}catch(e){
					console.error(member,this.members[i]);
				}
			}
			
			temp.push(member);
			
			if(member.affiliation === 'owner'){
				this.owner = member;
			}
		}
		this.numberOfMembers = this.members.length;
		this.members = temp;
	}
};

YYIMCacheGroup.prototype.removeMember = function(key){
	var member = this.get(key);
	if(!!member){
		this.remove(key);
		var t = this.numberOfMembers - 1;
		this.numberOfMembers = t >= 0? t:0;
	}
};

YYIMCacheGroup.prototype.transferOwner = function(key){
	var newOwner = this.get(key);
	if(newOwner){
		this.owner.affiliation = 'member';
		this.owner = newOwner;
		this.owner.affiliation = 'owner';
	}
};
