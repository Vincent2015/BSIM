function YYIMCachePresence(arg){
	this.id = arg.id || arg.from || this.id;
	this.presence = {};
	this.build(arg);
}

/**
 * 构造roster Presence
 * @param {Object} arg {
 * 	  id,resource,show
 * }
 */
YYIMCachePresence.prototype.build = function(arg){
	if(arg.show && arg.resource){
		for(var x in YYIMCacheConfig.TERMINAL_TYPE){
			if(arg.resource.toLowerCase().indexOf(YYIMCacheConfig.TERMINAL_TYPE[x]) !== -1){
				this.presence[YYIMCacheConfig.TERMINAL_TYPE[x]] = {
					show:arg.show,
					resource:arg.resource
				};
				break;
			}
		}
	}
};
