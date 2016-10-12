function IMChatUserVCard(arg){
	this.userId = arg.userId;
	this.nickname = arg.nickname; //昵称
	this.photo = arg.photo;    //头像
	this.email = arg.email;    //邮箱
	this.mobile = arg.mobile;   //移动电话
	this.telephone = arg.telephone;  //电话
	this.showPropList = ["nickname", "email", "mobile", "telephone"]; //默认展示列表
}

/**
 * 构造函数
 * @param {Object} arg
 */
IMChatUserVCard.prototype.construct = function(arg){
	this.nickname = arg.nickname?arg.nickname:this.nickname; //昵称
	this.photo = arg.photo?arg.photo:this.photo;    //头像
	this.email = arg.email?arg.email:this.email;    //邮箱
	this.mobile = arg.mobile?arg.mobile:this.mobile;   //移动电话
	this.telephone = arg.telephone?arg.telephone:this.telephone;  //电话
}

/**
 * 加载头像地址
 */
IMChatUserVCard.prototype.getPhotoUrl = function(){
	return this.photo ? YYIMChat.getFileUrl(this.photo) : SNSConfig.USER.DEFAULT_AVATAR;
};

/**
 * 更新VCard 
 * 	arg {
 * 		vcard : {
 * 			nickname,
 * 			photo,
 * 			email,
 * 			mobile,
 * 			telephone
 * 		},
 * 		success : function,
 * 		error : fcuntion
 */
IMChatUserVCard.prototype.updateVCard = function(arg){
	YYIMChat.setVCard({
		vcard:this,
		success:function(){
			arg.success && arg.success();
		},
		error:function(arg){
			arg.error && arg.error(arg);
		}
	});
};

