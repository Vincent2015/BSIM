/**
 * 发送消息的样式
 * @Class IMChatStyle
 */
var IMChatStyle = function(font, size, color, biu) {

	/**
	 * font-family对应的代码，
	 * 
	 * @See IMChatStyle.FONT_FAMILYS
	 * @Type {Number}
	 */
	this.font = font? font: 0;

	/**
	 * 发送消息的字体大小
	 * 
	 * @Type {Number}
	 */
	this.size = size? size: 12;

	/**
	 * 字体颜色值
	 * 
	 * @Type {string}
	 */
	this.color = color? color: "#470404";

	/**
	 * 字体样式，是否为粗体，斜体，下划线
	 * 
	 * @Type {Number}
	 * @See IMChatStyle.BIU_TYPE
	 */
	this.biu = biu? biu: 0;
};

IMChatStyle.used = false;

IMChatStyle.getInstance = function(){
	IMChatStyle.used = true;
	
	if(!IMChatStyle._instance){
		IMChatStyle._instance = new IMChatStyle();
	}
	return IMChatStyle._instance;
};

/**
 * 获取样式style声明字符串
 * 
 * @returns {String} style=""中的内容
 */
IMChatStyle.prototype.getStyleStr = function() {
	var styleStr = "";
	var fontFamily = IMChatStyle.FONT_FAMILYS[this.font];
	if (fontFamily) {
		styleStr += "font-family:" + fontFamily + ";";
	}
	styleStr += "font-size: "+this.size + "px;";
	if ((this.biu & IMChatStyle.BIU_TYPE.BOLD)!=0) {
		styleStr += "font-weight: bold;";
	}
	if ((this.biu & IMChatStyle.BIU_TYPE.ITALIC)!=0) {
		styleStr += "font-style: italic;";
	}

	if ((this.biu & IMChatStyle.BIU_TYPE.UNDERLINE)!=0) {
		styleStr += "text-decoration: underline;";
	}

	styleStr += "color: " + this.color + ";";

	return styleStr;
}

IMChatStyle.BIU_TYPE = {
	BOLD : 1,
	ITALIC : 2,
	UNDERLINE : 4
};

IMChatStyle.FONT_FAMILYS = {
	1 : "宋体",
	2 : "新宋体",
	3 : "黑体",
	4 : "微软雅黑",
	5 : "Arial",
	6 : "Verdana",
	7 : "simsun",
	8 : "Helvetica",
	9 : "Trebuchet MS",
	10 : "Tahoma",
	11 : "Impact",
	12 : "Times New Roman",
	13 : "仿宋,仿宋_GB2312",
	14 : "楷体,楷体_GB2312"
};