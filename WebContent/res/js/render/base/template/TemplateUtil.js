var TemplateUtil = {

};

TemplateUtil.genHtml = function(template, datas) {
	if (template == null || template.isEmpty()) {
		YYIMChat.log("template can not be null", 0);
		return;
	}
	
	if(!(datas instanceof Array)){
		datas = [datas];
	}

	var expr = /##\{\{([\w()_.]+)\}\}/g;
	var result = template;
	var matchs = template.match(expr);
	for ( var m in matchs) {
		if (matchs[m].length == template.length) {
			continue;
		}
		result = result.replace(matchs[m], getValue4Tpl(matchs[m], datas));
	}

	return result;

	function getValue4Tpl(name, datas) {

		name = ("" + name).trim().replace(/##{{([\w()_.]+)}}/, "$1");
		
		var value;
		for(var i =0; i<datas.length;i++){
			try {
				value = eval("arguments[1]["+i+"]." + name);
				if (value && (typeof value == "string" && value.notEmpty() || typeof value == "number")) {
					return value;
				}
			} catch (e) {
			//	YYIMChat.log("getValue4Tpl", 2, datas, name);
			}
		}

		if (name.indexOf("LANG_") == 0) {
			return SNS_LANG_TEMPLATE[name.replace("LANG_", "")];
		}

		if (name.indexOf("lang_") == 0) {
			return SNS_LANG_TEMPLATE[name.replace("lang_", "")];
		}

		try {
			var obj = eval(name);
			if (obj && typeof obj == "string") {
				return obj;
			}
		} catch (e) {
			return '';
		}

		return '';
	}
};