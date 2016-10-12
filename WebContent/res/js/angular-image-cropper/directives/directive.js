(function(angular) {
	'use strict';

	angular
		.module('imageCropper')
		.directive('imageCropper', directive);

	function directive() {
		return {
			'restrict': 'AE',
			'scope': {
				'image': '@',
				'showControls': '='
			},
			'template': [
				'<span></span>',
				'<img ng-src="{{image}}">',
				'<div id="img_viewer_toolbar" ng-if="showControls">',
				'<ul>',
				'<li ng-click="zoomIn()" class="zoomin"><a>放大</a></li>',
				'<li ng-click="zoomOut()" class="zoomout"><a>缩小</a></li>',
				'<li class="download"> <a href="{{image}}" noopen="true">下载</a></li>',
				'<li ng-click="rotateRight()"  class="rotate"><a>旋转</a></li>',
				'</ul>',
				'</div>'
			].join(''),
			'link': link
		};

        function link(scope, element, attributes) {
             
            var body = angular.element('body');

            var gImage = element.find('img');
           	var rotateNum = 0;
            
		   var   imageview =  new ImageView(gImage[0], {
		   movingCheck: false, // 可选， 当移动的时候，是否检查边界，达到的效果就是当到边界的时候，
			                    // 可不可以继续拖拽等效果 实验下就明白了 默认true
			    scaleNum: 1 // 可选，缩放比例 当进行缩放时 scale 时的比例 默认2
		      });
		    scope.rotateRight=function(){
		    	
		    	 
		        imageview.rotate(rotateNum += 90);
		     	  
		    }
           
             scope.zoomIn = function() {
		        imageview.scale(0.1);
		        
            };
            scope.zoomOut = function() {	
		        imageview.scale(-0.1);
		      	  
             
            };
		   console.log(scope)
		  

			// calls


			gImage[0].onload = function() {

				imageview = new ImageView(gImage[0], {
					movingCheck: false, // 可选， 当移动的时候，是否检查边界，达到的效果就是当到边界的时候，
					// 可不可以继续拖拽等效果 实验下就明白了 默认true
					scaleNum: 1 // 可选，缩放比例 当进行缩放时 scale 时的比例 默认2
				});
				//if(gImage[0])
               // element.css("position","fixed");
                element.css("top","5%");
                 element.css("bottom","5%");
			};

		}
	}
})(angular);