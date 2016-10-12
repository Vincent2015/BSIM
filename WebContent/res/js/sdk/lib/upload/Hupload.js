var browserSys = {};	
var browserUa = navigator.userAgent.toLowerCase();
var b;
(b = browserUa.match(/msie ([\d.]+)/)) ? browserSys.ie = b[1] :
(b = browserUa.match(/firefox\/([\d.]+)/)) ? browserSys.firefox = b[1] :
(b = browserUa.match(/chrome\/([\d.]+)/)) ? browserSys.chrome = b[1] :
(b = browserUa.match(/version\/([\d.]+).*safari/)) ? browserSys.safari = b[1] : 0;

var isFormDataSupport = !!window.FormData && Object.prototype.toString.call(FormData) === '[object Function]';
//var isFormDataSupport = false;

if(isFormDataSupport === true) {
	jQuery.fn._Huploadify = snsimUploadUseXHR;
} else {
	jQuery.fn._Huploadify = function(){};
}
/**
 * 发送消息时, 若内容为file类型，则使用此类进行封装到message.body.content
 */
var SNSFile = function(name,path, size){
	this.path = path;
	this.name = name;
	this.size = size;
	this.type = getFileSuffix(name);
	//this.isImage = isImage;
	
	//获取文件后缀名
	function getFileSuffix(filename){
		if(filename){
			var index = filename.lastIndexOf(".");
			if(index!=-1){
				var suffix =  filename.substring(index+1).toLowerCase();
				return suffix;
			}
			return "unknown";
		}
	}
	
};

SNSFile.prototype.renderSize = function(){
	return SNSFile.renderSize(this.size);
};

SNSFile.roundFun = function(numberRound, roundDigit) {
	if (numberRound >= 0) {
		var tempNumber = parseInt((numberRound * Math.pow(10, roundDigit) + 0.5)) / Math.pow(10, roundDigit);
		return tempNumber;
	} else {
		numberRound1 = -numberRound;
		var tempNumber = parseInt((numberRound1 * Math.pow(10, roundDigit) + 0.5)) / Math.pow(10, roundDigit);
		return -tempNumber;
	}
};
/* 附件大小格式人性化显示处理 */
SNSFile.renderSize = function(value) {
	if (null == value || value == '') {
		return "";
	}
	var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
	var index = 0;

	var srcsize = parseFloat(value);
	var size = SNSFile.roundFun(srcsize / Math.pow(1024, (index = Math.floor(Math.log(srcsize) / Math.log(1024)))), 0);
	return size + unitArr[index];
};

var FileUpload = function(inputId){
	this.inputId = inputId;
	this.fileObj;
};

/**
 * 获取FileUpload实例，并更新配置
 * @param inputId input file的id
 * @param opts 配置
 * @returns
 */
FileUpload.getInstance = function(inputId,opts){
	if(!FileUpload.list)
		FileUpload.list = new SNSBaseList();
	var fileUpload = FileUpload.list.get(inputId);
	// 防止多次执行Huploadify
	//if(fileUpload)
	//	return fileUpload;
	if(!fileUpload){
		fileUpload = new FileUpload(inputId);
		FileUpload.list.add(inputId, fileUpload);
	}
	if(opts){
		jQuery('#' + inputId)._Huploadify(opts);
	}
	return fileUpload;
};

/**
 * jQuery.fn.Huploadify中使用
 * @param inputId
 * @returns
 */
FileUpload.getInstanceByInputId = function(inputId){
	return FileUpload.list.get(inputId);
};

FileUpload.prototype.sendFile = function(target){
	this.fileObj.funSendFile(target);
};

//将文件的单位由bytes转换为KB或MB，若第二个参数指定为true，则永远转换为KB
FileUpload.formatFileSize = function(size,byKB){
	if (size> 1024 * 1024&&!byKB){
		size = (Math.round(size * 100 / (1024 * 1024)) / 100).toString() + 'MB';
	}
	else{
		size = (Math.round(size * 100 / 1024) / 100).toString() + 'KB';
	}
	return size;
};

//根据文件序号获取文件
FileUpload.getFile = function(index,files){
	for(var i=0;i<files.length;i++){	   
	  if(files[i].index == index){
		  return files[i];
		}
	}
	return false;
};