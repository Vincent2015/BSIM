var isDelete=false;
var filesIndex = "" ;
var deletefilesIndex = "" ;

/**支持图标显示的文件类型**/
var FILE_TYPES = ["rar","zip","pdf","txt","html"];
var IMAGE_TYPES = ["png", "gif","jpg","jpeg","bmp"];

var UPLOAD_AVATAR = "snsim_upload_avatar";

function snsimUploadUseXHR(opts){
	var itemTemp = '<div id="${fileID}" class="uploadify-queue-item"><div class="upload_file_icon"><img src="${fileTypeIcon}" /></div><div class="uploadify-progress"><div id="udn_uploadify_progress_bar" class="uploadify-progress-bar"></div></div><span class="up_filename">${fileName}</span><span class="uploadbtn" style="display:none;">上传</span><button id="btnstop" style="display:none;" >stop</button><button id="${continueUpload}" style="display:none;">续传</button><span class="delfilebtn" ></span></div>';
	var defaults = {
		fileTypeExts:'*',//允许上传的文件类型，指定类型格式：'jpg;doc'，所有：'*'
		uploader:'',//文件提交的地址
		auto:true,//是否开启自动上传
		method:'post',//发送请求的方式，get或post
		formData:{},//发送给服务端的参数，格式：{key1:value1,key2:value2}
		fileObjName:'file',//在后端接受文件的参数名称，如PHP中的$_FILES['file']
		fileSizeLimit:2048,//允许上传的文件大小，单位KB
		showUploadedPercent:true,//是否实时显示上传的百分比，如20%
		showUploadedSize:true,//是否实时显示已上传的文件大小，如1M/2M
		buttonText:'',//上传按钮上的文字
		removeTimeout: 100,//上传完成后进度条的消失时间
		itemTemplate:itemTemp,//上传队列显示的模板
		breakPoints:true,//是否开启断点续传
		fileSplitSize:1024*1024*10,//断点续传的文件块大小，单位Byte，默认1M
		getUploadedSize:null,//类型：function，自定义获取已上传文件的大小函数，用于开启断点续传模式，可传入一个参数file，即当前上传的文件对象，需返回number类型
		saveUploadedSize:null,//类型：function，自定义保存已上传文件的大小函数，用于开启断点续传模式，可传入两个参数：file：当前上传的文件对象，value：已上传文件的大小，单位Byte
		saveInfoLocal:true,//用于开启断点续传模式，是否使用localStorage存储已上传文件大小
		onUploadStart:null,//上传开始时的动作
		onUploadSuccess:null,//上传成功的动作
		onUploadComplete:null,//上传完成的动作
		onUploadError:null, //上传失败的动作
		onInit:null,//初始化时的动作
		onCancel:null,//删除掉某个文件后的回调函数，可传入参数file
		onSelect:null,//选择文件后执行的动作，可传入参数files，文件列表
		uploadIdPrefix:"file_upload_",
		inputId:null,// 文件输入框的id
		to: null,// 文件发送对象
		type: 4,// 发送文件的类型：file | image | avatar
		chatType: 'chat',
		showProcess: false,
		processId: null,
		resource:null
	}
	var option = jQuery.extend(defaults,opts);	
	
	//发送文件块函数
	var sendBlob = function(url,xhr,file,formdata,originalFileSize, userJid){
		var jid = userJid;
		// 不是设备
		// if(!SNSApplication.getInstance().getUser().deviceList.get(jid)){
		// jid = new JSJaCJID(userJid).getBareJID();
		// }
		var isUploadSize=parseInt(SNSStorage.getLocalVal(file.name)) || 0;
		var fromUser, toUser, token;
		if(YYIMChat.isAnonymous()){
			fromUser = YYIMChat.getUserFullJID();
			token = "anonymous";
		}else{
			fromUser = YYIMChat.getUserNode();
			token = YYIMChat.getToken();
		}
		
		if(option.resource && option.resource.toLowerCase() == "anonymous"){
			toUser = YYIMChat.getJIDUtil().buildUserJID(YYIMChat.getJIDUtil().getID(jid),"ANONYMOUS");
		}else{
			if(option.chatType == 'groupchat')
				toUser = YYIMChat.getJIDUtil().buildChatGroupJID(YYIMChat.getJIDUtil().getNode(jid));
			else
				toUser = YYIMChat.getJIDUtil().buildUserJID(YYIMChat.getJIDUtil().getNode(jid));
		}
		url = url+"?fileName=" + encodeURI(file.name,"utf-8") + "&uploadedSize=" + isUploadSize + "&fileSize=" + originalFileSize 
		+ "&fromUser=" + fromUser + "&toUser=" + toUser + "&token=" + token + "&muc=1";
		//console.info(url);
		if(option.type == UPLOAD_AVATAR){
			url += "&isAvatar=true";
		}
		YYIMChat.log("file upload url", 2, url);
		xhr.open(option.method, url, true);
	 	xhr.withCredentials = true;
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		var fd = new FormData();
		fd.append(option.fileObjName,file);
		if(formdata){
		  	for(key in formdata){
		  		fd.append(key,formdata[key]);
		  	}
		}
		xhr.send(fd);
	}

	this.each(function(){
		var _this = jQuery(this);
		//先添加上file按钮和上传列表
		var instanceNumber = jQuery('.uploadify').length+1;
		var uploadFileListStr = '<span id="'+option.uploadIdPrefix +instanceNumber+'-queue" class="uploadify-queue"></span>';
		var udnObj = jQuery("#" + option.processId);
		// 防止append uploadFileListStr 多次
		if(jQuery('#' + option.uploadIdPrefix +instanceNumber+'-queue').length <= 0 && option.showProcess){
			udnObj.append(uploadFileListStr);
			jQuery("#" + option.processId).perfectScrollbar({suppressScrollX:true});
		}
		
		//创建文件对象
	 	FileUpload.getInstanceByInputId(option.inputId).fileObj = {
		  uploadAllowed: true,
		  fileInput: _this,				//html file控件
		  uploadFileList : udnObj.find('#'+option.uploadIdPrefix +instanceNumber+'-queue'),
		  url: option.uploader,						//ajax地址
		  fileFilter: [],					//过滤后的文件数组
		  uploadOver:false, //一次上传是否真正结束，用于断点续传的情况
		  filter: function(files) {		//选择文件组的过滤方法
			  var arr = [];
			  var typeArray = option.fileTypeExts.split(";");
			  for(var i=0,len=files.length;i<len;i++){
				  	var thisFile = files[i];
			  		if(parseInt(FileUpload.formatFileSize(thisFile.size,true))>option.fileSizeLimit){
			  			alert('文件'+thisFile.name+'大小超出限制！');
			  			continue;
			  		}
					if(option.fileTypeExts == "*" || jQuery.inArray(thisFile.name.split('.').pop().toLowerCase(),typeArray)>=0){
						arr.push(thisFile);
					}else{
						alert('文件'+thisFile.name+'类型不允许！');
					}  	
				}	
			  return arr;  	
		  },
		  //文件选择后
		  funSelect: function(files){
				for(var i=0,len=files.length;i<len;i++){
					var file = files[i];
					filesIndex += ","+file.index;
					
					// file type
					var type = "unknown";
					if(file.name){
						type = file.name.substr(file.name.lastIndexOf(".") + 1);
					}
					//处理模板中使用的变量
					var $html = jQuery(option.itemTemplate.replace(/\${fileID}/g,'fileupload_'+instanceNumber+'_'+file.index).replace(/\${fileTypeIcon}/g, "res/skin/default/icons/filetype/" + type + ".png").replace(/\${fileName}/g,file.name).replace(/\${fileSize}/g,FileUpload.formatFileSize(file.size)).replace(/\${instanceID}/g,_this.attr('id')).replace(/\${continueUpload}/g,"continueUpload_"+instanceNumber+"_"+file.index));
					//如果是自动上传，去掉上传按钮
					if(option.auto){
						$html.find('.uploadbtn').remove();
					}

					//如果开启断点续传，先初始化原来上传的文件大小
					var initWidth = 0,initFileSize = '0KB',initUppercent = '0%';
					if(option.breakPoints){
						var uploadedSize = this.funGetUploadedSize(file);	
					  	//先设置进度条为原来已上传的文件大小
					  	initWidth = (uploadedSize / file.size * 100) + '%';
					  	initFileSize = FileUpload.formatFileSize(uploadedSize);
					  	initUppercent = (uploadedSize / file.size * 100).toFixed(2) + '%';
					  	$html.find('.uploadify-progress-bar').css('width',initWidth);
					}

					this.uploadFileList.append($html);
					
					//判断是否显示已上传文件大小
					if(option.showUploadedSize){
						var num = '<span class="progressnum"><span id="isUploadingFileSize_'+instanceNumber+'_'+file.index+'" class="uploadedsize">'+initFileSize+'</span>/<span class="totalsize">${fileSize}</span></span>'.replace(/\${fileSize}/g,FileUpload.formatFileSize(file.size));
						$html.find('.uploadify-progress').after(num);
					}
					
					//判断是否显示上传百分比	
					if(option.showUploadedPercent){
						var percentText = '<span class="up_percent" style="display:none">'+initUppercent+'</span>';
						$html.find('.uploadify-progress').after(percentText);
						
					}

					option.onSelect&&option.onSelect(files);

					//判断是否是自动上传
					if(option.auto){
						this.funUploadFile(file);
					}
					else{
						//如果配置非自动上传，绑定上传事件
					 	$html.find('.uploadbtn').click(function(file){
					 			return function(){FileUpload.getInstanceByInputId(option.inputId).fileObj.funUploadFile(file);}
					 		}(file));
					}
					//为删除文件按钮绑定删除文件事件
			 		$html.find('.delfilebtn').click(function(file){
					 			return function(){
					 				FileUpload.getInstanceByInputId(option.inputId).fileObj.funDeleteFile(file);
					 			}
					 		}(file));
			 		
			 		$html.find('#btnstop').click(function(file){
			 			return function(){
			 				deletefilesIndex +=","+file.index;
			 			}
			 		}(file));
			 		
			 		$html.find('#continueUpload_'+instanceNumber+"_"+file.index).click(function(file){
			 			var fileIndex = file.index;
			 			return function(){
			 				if(deletefilesIndex.length > 0 && deletefilesIndex.indexOf(","+fileIndex) > -1){
			 					var arrIndex = deletefilesIndex.split(",");
			 					var strIndex="";
			 					for(var j=0;j<arrIndex.length;j++){
			 						if(arrIndex[j] != fileIndex && arrIndex[j] != ""){
			 							strIndex +=","+arrIndex[j];
			 						}
			 					}
			 					deletefilesIndex = strIndex;
			 				}
			 				var file = FileUpload.getFile(fileIndex,FileUpload.getInstanceByInputId(option.inputId).fileObj.fileFilter);
							file && FileUpload.getInstanceByInputId(option.inputId).fileObj.funUploadFile(file);
			 			}
			 		}(file));
			 		
			 	}

			 
			},				
		  onProgress: function(file, loaded, total) {
				var eleProgress = udnObj.find('#fileupload_'+instanceNumber+'_'+file.index+' .uploadify-progress');
				var thisLoaded = loaded;
				//根据上一次触发progress时上传的大小，得到本次的增量
				var lastLoaded = eleProgress.attr('lastLoaded') || 0;
				if(loaded < lastLoaded)
					lastLoaded =0;
				
				loaded -= parseInt(lastLoaded);
				var progressBar = eleProgress.children('.uploadify-progress-bar');
				var oldWidth = parseFloat(progressBar.get(0).style.width || 0);
				var percent = ((loaded / total) * 100 + oldWidth).toFixed(2);
				var percentText = percent > 100 ? '99.99%' : percent+'%';//校正四舍五入的计算误差
				if(option.showUploadedSize){
					eleProgress.nextAll('.progressnum .uploadedsize').text(FileUpload.formatFileSize(loaded));
					eleProgress.nextAll('.progressnum .totalsize').text(FileUpload.formatFileSize(total));
				}
				if(option.showUploadedPercent){
					eleProgress.nextAll('.up_percent').text(percentText);
					var uploadSize = FileUpload.formatFileSize((percent*total)/100);
					if((percent*total)/100 > total)
						uploadSize = FileUpload.formatFileSize(total);
					document.getElementById("isUploadingFileSize_"+instanceNumber+"_"+file.index).innerHTML=uploadSize;
				}
				progressBar.css('width',percentText);

				//记录本次触发progress时已上传的大小，用来计算下次需增加的数量
				if(thisLoaded<option.fileSplitSize){
					eleProgress.attr('lastLoaded',thisLoaded);
				}
				else{
					eleProgress.removeAttr('lastLoaded');	
				}

	  	},		//文件上传进度
	  	
		  /* 开发参数和内置方法分界线 */

		  //获取当前进度条的宽度，返回字符串如90%
		  funGetProgressWidth: function(index){
		  	var eleProgressBar = udnObj.find('#fileupload_'+instanceNumber+'_'+index+' .uploadify-progress-bar');
		  	return eleProgressBar.get(0).style.width || '';
		  },

		  //获取已上传的文件片大小，当开启断点续传模式
		  funGetUploadedSize: function(file){
		  	if(option.getUploadedSize){
		  		return option.getUploadedSize(file);
		  	}
		  	else{
		  		if(option.saveInfoLocal){
		  			return parseInt(SNSStorage.getLocalVal(file.name)) || 0;	
		  		}
		  	}
		  },

		  funSaveUploadedSize: function(file,value,deleteStorage){
		  	if(option.saveUploadedSize){
		  		option.saveUploadedSize(file,value);
		  	}
		  	else{
		  		if(option.saveInfoLocal && !deleteStorage){
		  			SNSStorage.setLocal(file.name, value);
		  		}
		  	}
		  },
		  
		  //获取选择文件，file控件
		  funSendFile: function(target) {
			  // 获取文件列表对象
			  var files = target.files;
			  //继续添加文件
			  files = this.filter(files);
			  for(var i=0,len=files.length;i<len;i++){
			  	this.fileFilter.push(files[i]);	
			  }
			  this.funDealFiles(files);
			  return this;
		  },
		  
		  //选中文件的处理与回调
		  funDealFiles: function(files) {
			  var fileCount = udnObj.find('.uploadify-queue .uploadify-queue-item').length;//队列中已经有的文件个数
			  for(var i=0,len=files.length;i<len;i++){
				  files[i].index = ++fileCount;
				  files[i].id = 'fileupload_'+instanceNumber+'_'+files[i].index;
				  }
			  //执行选择回调
			  this.funSelect(files);
			  
			  return this;
		  },
		  
		  //删除对应的文件
		  funDeleteFile: function(file) {
			  if(option.breakPoints){
				  deletefilesIndex += ","+ file.index;
			  }
						  
			  udnObj.find('#fileupload_'+instanceNumber+'_'+file.index).fadeOut();
			  FileUpload.getInstanceByInputId(option.inputId).fileObj.fileInput.val('');
			  option.onCancel&&option.onCancel(file);	
			  
			  var url = YYIMChat.getServletPath().FILE_DELETE_SERVLET;
			  var datas={"fileName":file.name,"toUser":option.to,"fromUser": YYIMChat.getUserNode(),"token":YYIMChat.getToken(), "muc":1};
			  
			  $.ajax({  
			        url : url,  
			        async : false, // 注意此处需要同步，因为返回完数据后，下面才能让结果的第一条selected  
			        type : "POST",  
			        data:datas,
			        dataType : "text",  
			        success : function(content) {
			        	if(content == "success"){
							//删除localstorage
							 SNSStorage.removeLocal(file.name);
							 isDelete=true;
						  }
			        },error:function(){
			        	//删除localstorage
						 SNSStorage.removeLocal(file.name);
						 isDelete=true;
			        }  
			    });
			  return this;
		  },
		  
		  //文件上传
		  funUploadFile: function(file) {
			  var xhr = false;
			  var originalFile = file;//保存原始为切割的文件
			  var thisfile = udnObj.find('#fileupload_'+instanceNumber+'_'+file.index);
			  var regulateView = function(){
			  	if(FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver){
			  		thisfile.find('.uploadify-progress-bar').css('width','100%');
						option.showUploadedSize&&thisfile.find('.uploadedsize').text(thisfile.find('.totalsize').text());
						option.showUploadedPercent&&thisfile.find('.up_percent').text('100%');	
			  	}
			  } //校正进度条和上传比例的误差

			  try{
				 xhr=new XMLHttpRequest();//尝试创建 XMLHttpRequest 对象，除 IE 外的浏览器都支持这个方法。
			  }catch(e){	  
				xhr=ActiveXobject("Msxml12.XMLHTTP");//使用较新版本的 IE 创建 IE 兼容的对象（Msxml2.XMLHTTP）。
			  }
			  if(xhr == "undefined"){
				  alert("浏览器版本不支持，请更新版本");
				  return;
			  }
			  //判断文件大小，小于30M时 或者 为图片时，不走断点续传
			  if(originalFile.size <= 30 *1024*1024 || originalFile.type.indexOf("image/") > -1 ){
				  option.breakPoints =false;
			  }else{
				  option.breakPoints = true;
			  }
			  if(option.breakPoints){
			  	var fileName = file.name,fileId = file.id,fileIndex = file.index, fileSize = file.size; //先保存原来的文件名称
			  	var uploadedSize = parseInt(this.funGetUploadedSize(originalFile));	
			  	//对文件进行切割，并保留原来的信息		
			  	//判断浏览器版本
			  	
			  	if (browserSys.firefox) {
					  var arr = browserSys.firefox.split(".");
					  if( arr[0] > 6 && arr[0] < 15){
						  file = originalFile.mozSlice(uploadedSize,uploadedSize + option.fileSplitSize);
					  }else{
						  file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
					  }
				}else if (browserSys.chrome) {
					  var arr = browserSys.chrome.split(".");
					  if(arr[0] > 10 && arr[0] < 21){
						  file = originalFile.webkitSlice(uploadedSize,uploadedSize + option.fileSplitSize);
					  }else{
						  file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
					  }
				}else{
					 file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
				}
			  	
			  	file.name = fileName;file.id = fileId;file.index = fileIndex;
			  }
			  		
			  if (xhr.upload && uploadedSize !== false) {
				  // 上传中
				  xhr.upload.addEventListener("progress", function(e) {
					  FileUpload.getInstanceByInputId(option.inputId).fileObj.onProgress(file, e.loaded, originalFile.size);
				  }, false);
			  }	
			  var userJid = option.to;
			  originalFile.userJid=userJid;
			  
			  // 文件上传成功或是失败
			  xhr.onreadystatechange = function(e) {
				  if (xhr.readyState == 4) {
					  FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver = true;
					  if (xhr.status == 200) {
						  var returnData = JSON.parse(xhr.responseText) ;
						  if(returnData.status == "success"){
							  //在指定的间隔时间后删掉进度条
							  setTimeout(function(){
								  udnObj.find('#fileupload_'+instanceNumber+'_'+originalFile.index).fadeOut();
							  },100);
							  SNSStorage.removeLocal(file.name);
						  }
						  var findex = originalFile.index;
						  //将文件块数据更新到本地记录
						  if(true){
							  if(option.breakPoints){
								  //更新已上传文件大小，保存到本地
								  uploadedSize += option.fileSplitSize;
								  if(returnData.status == "success" || isDelete){
									  FileUpload.getInstanceByInputId(option.inputId).fileObj.funSaveUploadedSize(originalFile,uploadedSize,true);	
									  isDelete = false;
								  }else {
									  FileUpload.getInstanceByInputId(option.inputId).fileObj.funSaveUploadedSize(originalFile,uploadedSize,false);
								  }
								  
								  //再次清空一下storage
								  if(deletefilesIndex.indexOf(findex) > -1){
									  SNSStorage.removeLocal(originalFile.name);
								  }
								  
								  //继续上传其他片段
								  if(uploadedSize< fileSize ){
									  FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver = false;
									  //if(FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadAllowed){
									  if(filesIndex.indexOf(","+findex) > -1 && deletefilesIndex.indexOf(findex) == -1){
										  if (browserSys.firefox) {
											  var arr = browserSys.firefox.split(".");
											  if( arr[0] > 6 && arr[0] < 15){
												  file = originalFile.mozSlice(uploadedSize,uploadedSize + option.fileSplitSize);
											  }else{
												  file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
											  }
										  }else if (browserSys.chrome) {
											  var arr = browserSys.chrome.split(".");
											  if(arr[0] > 10 && arr[0] < 21){
												  file = originalFile.webkitSlice(uploadedSize,uploadedSize + option.fileSplitSize);
											  }else{
												  file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
											  }
										  }else{
											  file = originalFile.slice(uploadedSize,uploadedSize + option.fileSplitSize);
										  }
										  //file = originalFile.webkitSlice(uploadedSize,uploadedSize + option.fileSplitSize);
										  file.name = fileName;file.id = fileId;file.index = fileIndex;file.size = fileSize;
										  sendBlob(FileUpload.getInstanceByInputId(option.inputId).fileObj.url,xhr,file,option.formData,originalFile.size,userJid);	
									  }
								  }
								  else{
									  regulateView();
								  }
							  }
							  else{
								  regulateView();
							  }
							  
						  }
						  
						  if(FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver){
							  if(option.type == UPLOAD_AVATAR){
								  option.onUploadSuccess&&option.onUploadSuccess(returnData.result);
							  } else {
								  // 成功后发送文件并执行回调函数，一般回调函数用于界面的渲染
								  // var type = "chat";
								  // if(new JSJaCJID(returnData.toUser).getDomain() != YYIMChat.getServerName()){
								  //	 type = "groupchat";
								  // }
								  // TODO if pubAccount	
								  var rspContent = returnData.result;
								  var arg = {
										  id: Math.uuid(),
										  body: {
											  content: new SNSFile(file.name, rspContent.attachId, file.size),
											  contentType: option.type,
											  dateline: new Date().getTime()
										  },
										  to: option.to,
										  type: option.chatType,
										  success: function(msg){
											  var _msg = Object.clone(msg);
											  _msg.to = YYIMChat.getJIDUtil().getID(msg.to);
											  _msg.body.content.path = YYIMChat.getFileUrl(_msg.body.content.path);
											  option.onUploadSuccess&&option.onUploadSuccess(_msg);
										  }
								  };
								  if(option.resource){
									  arg.resource = option.resource;
								  }
								  YYIMChat.sendMessage(arg);
							  }
							  //在指定的间隔时间后删掉进度条
							  setTimeout(function(){
								  udnObj.find('#fileupload_'+instanceNumber+'_'+originalFile.index).fadeOut();
							  },option.removeTimeout);	
						  }
						  
					  } else {
						  FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver&&option.onUploadError&&option.onUploadError(originalFile, xhr.responseText);		
						  setTimeout(function(){
							  udnObj.find('#fileupload_'+instanceNumber+'_'+originalFile.index).fadeOut();
						  },100);
						  SNSStorage.removeLocal(file.name);
					  }
					  
					  if (FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadOver) {
						  option.onUploadComplete&&option.onUploadComplete(originalFile,xhr.responseText);
						  //清除文件选择框中的已有值
						  FileUpload.getInstanceByInputId(option.inputId).fileObj.fileInput.val('');	
					  };
					  
				  }
			  };
			  
			  option.onUploadStart&&option.onUploadStart();	
			  
			  FileUpload.getInstanceByInputId(option.inputId).fileObj.uploadAllowed = true;//重置允许上传为true
			  sendBlob(this.url,xhr,file,option.formData,originalFile.size, userJid);
		  }
	 	};
	 	option.onInit&&option.onInit();
	}); 
};