var SNSVCard = function(vcard) {
	this.nickname = vcard.nickname;
	this.photo = vcard.photo;
	this.email = vcard.email;
	this.mobile = vcard.mobile;
	this.telephone = vcard.telephone;
	this.showpropList = [ "nickname", "email", "mobile", "telephone"];
}

SNSVCard.prototype.hasPhoto = function(){
	return !!(this.photo && this.photo.notEmpty())
};

SNSVCard.prototype.getPhotoUrl = function() {
	if (this.hasPhoto()) {
		return YYIMChat.getFileUrl(this.photo);
	}
	return SNSConfig.USER.DEFAULT_AVATAR;
};

/**
 * 更新用户头像
 * @param newUrl
 * @param arg{success: function, error: success}
 */
SNSVCard.prototype.updateUserPhotoUrl = function(newUrl, arg) {
	this.photo = newUrl;
	this.update(arg);
};

/**
 * 更新vcard，发包到服务器
 */
SNSVCard.prototype.update = function(arg){
	YYIMChat.setVCard({
		vcard : this,
		success : function() {
			arg.success && arg.success();
		},
		error : function(packet) {
			var errorInfo = {
				info: "获取好友列表失败",
				packet: packet
			};
			arg.error && arg.error(errorInfo);
		}
	});
};
