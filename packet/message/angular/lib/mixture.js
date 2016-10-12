var snsLoginConflict = false;

function getSNSBasePath() {
	return location.href.replace('index.html', '');
};

function imgErr(target) {
	target.attr('src', 'message/angular/style/images/filetype/file_default.jpg');
}

$(document).on('click', function(e) {
	var _target = jQuery(e.target);

	if (!_target.closest('.trigger').length) {
		jQuery('.fold-menu').addClass('hidden');
		if (_target.closest('.setting-item').length) {
			_target.closest('.setting-item').find('.fold-menu').removeClass('hidden');
		}
		if (!_target.closest('.IMChat-model-bd,input.ui-select-search,.ui-select-choices-group,.ui-select-match,.ui-select-match-close').length) {
			jQuery('.IMChat-model-cover,.IMChat-model-bd').addClass('hidden');
		}
	}
	if (_target.parent().hasClass('IMChat-menu-items')) {
		jQuery('.IMChat-menu-items>li').removeClass('cur');
		_target.addClass('cur');
	}
	if (_target.closest('.list-item').length) {
		jQuery('.list-item').removeClass('cur');
		_target.closest('.list-item').addClass('cur');
	}

	if (_target.is('.IMChat-create')) {
		jQuery('#create-dialog').css({
			left: (_target.width() - jQuery('#create-dialog').width()) / 2 + e.clientX,
			top: e.clientY + 15
		}).show();
	} else {
		jQuery('#create-dialog').hide();
	}


	if (!_target.is('.IMChat-group-slide *') && !_target.is('.operate-item li:nth-child(3)') && !_target.is('#prodetail')) {
		jQuery('.IMChat-group-slide').addClass('beforeHide');
		setTimeout(function() {
			jQuery('.IMChat-group-slide').removeClass('beforeHide').addClass('hidden')
		}, 500);
	}

	if (!_target.is('.IMChat-entity-list')) {
		jQuery('.IMChat-entity-list').addClass('hidden');
	}
});
$(window).on('dragover', function(e) {
	e.preventDefault();
	e.originalEvent.dataTransfer.dropEffect = 'none';
});
$(window).on('drop', function(e) {
	e.preventDefault();
});
$(window).on("keydown", function(e) {
	var list = ["input", "textarea"];
	var key = e.which; //e.which是按键的值
	var ctrl = e.ctrlKey;

	var shift = e.shiftKey;

	console.log(e);
	if (ctrl) {

		window.ctrlpress = true;
	}

	//				if(shift)
	//				{
	//					window.shiftpress=true;
	//					
	//				}
	if (key == 8) {
		var tag = e.target.tagName.toLowerCase();
		if (tag) {
			if (jQuery.inArray(tag, list) < 0) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}
	if (iswin) {
		if (e.ctrlKey && key == 86) {
			var copyinfo = "";
			var text = cli.get("text");
			if (text) {
				copyinfo = text;

			} else {
				copyinfo = cli.get();

			}
			console.log(copyinfo);
			if (e.target.id == "IMChat_msg_cont") {
				jQuery('#IMChat_msg_cont').val(jQuery('#IMChat_msg_cont').val().trim() + copyinfo);
				e.preventDefault();
				e.stopPropagation();
			}
		}
		if (e.ctrlKey && key == 67) {
			var selecttext = document.getSelection().toString();
			console.log(selecttext);
			cli.set(selecttext, "text");
		}
	} else if (ismac) {
		if (e.metaKey && key == 86) {
			var copyinfo = "";
			var text = cli.get("text");
			if (text) {
				copyinfo = text;

			} else {
				copyinfo = cli.get();

			}
			console.log(copyinfo);
			if (e.target.id == "IMChat_msg_cont") {
				jQuery('#IMChat_msg_cont').val(jQuery('#IMChat_msg_cont').val().trim() + copyinfo);
				e.preventDefault();
				e.stopPropagation();
			}
		}
		if (e.metaKey && key == 67) {
			var selecttext = document.getSelection().toString();
			console.log(selecttext);
			cli.set(selecttext, "text");
		}
	}

});

$(document).on('click', '.screenshot-tool span', function(e) {
	e.preventDefault();
	e.stopPropagation();
	jQuery(e.target).siblings('ul').toggleClass('hidden');
});