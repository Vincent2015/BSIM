function IMChatPubAccount(arg){
	this._id = arg.id;
	this._name = arg.name;
	this._type = arg.type;
}

IMChatPubAccount.prototype.construct = function(arg){
	this._name = arg.name ?arg.name:this.name;
	this._type = arg.type ?arg.type:this.type;	
};