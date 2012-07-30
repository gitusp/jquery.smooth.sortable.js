(function(){
	var duration = 30,
		sortable = $.sub();

	sortable.fn.extend( {
		lookUp : function(target, direction){
			if(direction==0) return;

			target=direction<0 ? this.findPrevSibling(target) : this.findNextSibling(target);
			if(!target) return;

			var targetTop=target.position().top,
				subjectTop=this.position().top;

			if(targetTop<subjectTop && direction>0)			return {target:target, method:'after'};
			else if(targetTop>subjectTop && direction<0)	return {target:target, method:'before'};
			else											return;

			this.lookUp(target, direction);
		},
		findPrevSibling:function(target){
			var prev=target.prev();
			if(!prev.length)					return;
			if(prev.hasClass('placeHolder'))	return this.findPrevSibling(prev);
			if(prev.get(0)==this.get(0))		return this.findPrevSibling(prev);
			else								return prev;
		},
		findNextSibling:function(target){
			var next=target.next();
			if(!next.length)					return;
			if(next.hasClass('placeHolder'))	return this.findNextSibling(next);
			else								return next;
		}
	} );

	// expression
	$.createSortableGroup = function() {
		var placeHolder = $.sub();
		placeHolder.fn.extend( {
			stat : 0,
			env : {
				siblings : [] ,
				summedHeight : 0
			},
			bye : function ( dead ) {
				this.stat = Math.round( this.stat * 0.25 );
				this.statSeed = -1;

				if(dead){
					this.remove();
				}
			},
		} );

		// animation func
		var poller = $.polling( function(){
			var summedEasedStat = 0,
				siblings = placeHolder.fn.env.siblings,
				target,
				i;

			for( i = 0; i < siblings.length; i++ ){
				target=siblings[i];
				target.stat+=target.statSeed;
				if(target.statSeed>0){
					target.easedStat=$.easing.easeOutQuad(undefined,target.stat, 0, 1, duration);
				}
				if(target.statSeed<0){
					target.easedStat=$.easing.easeInQuad(undefined,target.stat, 0, 1, duration);
				}
				summedEasedStat+=target.easedStat;

				if(target.stat>=duration){
					target.statSeed=0;
				}
				else if(target.stat <= 0){
					siblings.splice(i--, 1);
					target.remove();
				}
			}

			var totalHeight=0;
			for(i=0; i < siblings.length; i++){
				target=siblings[i];
				var height;
				if(i == siblings.length-1){
					height=target.env.summedHeight-totalHeight;
				}
				else{
					height=Math.round(target.env.summedHeight * (target.easedStat/summedEasedStat));
					totalHeight+=height;
				}
				target.height(height);
			}
		} , 13 );

		return {
			wakeup : poller.wakeup,
			sleep : poller.sleep,
			sortablize : sortablize,
		};

		function sortablize( target ){
			var self = sortable( target );

			self.bind( 'selectstart' , function( e ){
				e.preventDefault();
			} );

			self.mousedown( function( e ){
				var prevY=e.pageY,
					placeHolder= createPlaceHolder( self.outerHeight() ),
					moved=false;

				$(document).mousemove(observe);
				$(document).mouseup(up);
				e.preventDefault();

				function observe(e){
					if(Math.abs((prevY-e.pageY)) > 10){
						moved=true;
						$(document).unbind('mousemove', observe);
						$(document).mousemove(move);
						self.after(placeHolder);
						self.css('top', 'auto').addClass('drag');
					}
				}

				function move(e){
					var pos=self.position();

					//ドラッグ
					self.css('top', pos.top + (e.pageY-prevY));
					prevY=e.pageY;

					//入れ替え
					var result=self.lookUp(placeHolder, pos.top-placeHolder.position().top);
					if(result){
						placeHolder.bye();
						placeHolder=createPlaceHolder( self.outerHeight() );
						result.target[result.method](placeHolder);
						placeHolder.before(self);
					}
				}
				function up(e){
					placeHolder.bye(true);
					self.removeClass('drag').css('top', 'auto');
					$(document).unbind('mousemove', observe);
					$(document).unbind('mousemove',move);
					$(document).unbind('mouseup',up);

					if ( !moved ) {
						self.trigger( 'sortclick' );
					}
					else {
						self.trigger( 'sortend' );
					}
				}
			} );

			return self;
		}

		function createPlaceHolder ( height ){
			var result = placeHolder( '<li class="placeHolder">');

			result.env.summedHeight = height;
			result.env.siblings.push( result );
			result.statSeed = 1;
			
			return result;
		}
	};
})();
