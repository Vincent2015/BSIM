angular.module('infiniteScroll', [])
    .directive('infiniteScroll', ["$window", function ($window) {
        return {
            link: function (scope, element, attrs) {
                var offset = parseInt(attrs.threshold) || 0;
                var e = element[0];

                var clock = false;
                element.bind('scroll', function () {
						if(jQuery('.message-entity').height()-jQuery('.IMChat-entity-display').scrollTop()<(120+jQuery('.IMChat-entity-display').height())){
			                scope.latest_btn.show = false;
						}
 
                    if(clock){clearTimeout(clock)}
                    clock = setTimeout(function(){
	                    if (scope.$eval(attrs.canLoad) && e.scrollTop <= 0) {
	                        scope.$apply(attrs.infiniteScroll);
	                    }
                    },100)
 
                });
            }
        };
    } ]);