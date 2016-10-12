var SNSReceivedMessageBox = function(message){
	this.message;
	if(message && message instanceof SNSMessage){
		this.message = message;
	}else{
		throw "SNSReceivedMessageBox: Constructor: invalid param: message:"+message;
	}
	
	this.selector = "#"+SNSReceivedMessageBox.ID_PREFIX+message.id;
};

SNSReceivedMessageBox.ID_PREFIX = "snsim_message_box_received_";

SNSReceivedMessageBox.prototype = new SNSMessageBox();

SNSReceivedMessageBox.template = 
	'<div id="' + SNSReceivedMessageBox.ID_PREFIX + '##{{id}}" class="snsim_message_box_received snsim_dia_box snsim_dia_l">'
		+ '<div class="dia_info">'
			+ '<span class="info_date">##{{getHumanizeDateString()}}</span>'
		+ '</div>'
		+'<div style="margin:10px 0 0 10px;" class="clearfix">'
			+'<p style="color:#b3b3b3;">##{{getRoster().name}}</p>'
			+'<img style="border-radius:30px; width:35px;height:35px;float:left;" src="##{{getRoster().getPhotoUrl()}}"/>'
			+ '<div class="snsim_dia_bg">'
				+ '<div class="dia_txt">##{{getBodyHtml()}}</div>'
				+ '<div class="msg_arr"></div>'
			+'</div>'
		+'</div>'
	+ '</div>';

SNSReceivedMessageBox.prototype.getTemplate = function(){
	return SNSReceivedMessageBox.template;
}
