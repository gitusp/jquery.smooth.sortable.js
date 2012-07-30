/*!
 * jQuery app framework
 *
 * Copyright 2012, usp
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * The library requires jQuery Easing Plugin
 * http://gsgd.co.uk/sandbox/jquery/easing/
 * thanks!!
 */

(function(){
	/*
	 *	sortable
	 */
	var sortable = $.sub();
	sortable.fn.extend( {
		startDrag : function(){
			var that =		this,
				prevY =		e.pageY,
				factory =	placeholderGroupFactory( that.outerHeight() ),
				moved =		false;

			$( document ).mousemove( observe );
			$( document ).mouseup( up );

			function observe ( e ) {
				if ( Math.abs( ( prevY - e.pageY ) ) > 10 ) {
					moved = true;
					$( document ).unbind( 'mousemove' , observe );
					$( document ).mousemove( move );
					that.after( factory.get() );
					that.css( 'top' , 'auto' ).addClass( 'ui-drag' );
				}
			}

			function move(e){
				var pos = that.position();

				//ドラッグ
				that.css( 'top' , pos.top + ( e.pageY - prevY ) );
				prevY = e.pageY;

				//入れ替え
				var result = that.lookUp( factory.head() , pos.top - placeHolder.position().top );
				if( result ){
					factory.bye();
					result.target[ result.method ]( factory.get() );
					factory.head().before(that);
				}
			}
			function up(e){
				factory.die();
				that.removeClass('ui-drag').css('top', 'auto');
				$(document).unbind('mousemove', observe);
				$(document).unbind('mousemove',move);
				$(document).unbind('mouseup',up);

				if ( !moved ) {
					that.trigger( 'sortclick' );
				}
				else {
					that.trigger( 'sortend' );
				}
			}
		},
		lookUp : function(target, direction){
			if (direction==0) {
				return false;
			}

			target = direction < 0 ? this.findPrevSibling( target ) : this.findNextSibling( target );
			if( !target ) return false;

			var targetTop=target.position().top,
				subjectTop=this.position().top;

			if( targetTop < subjectTop && direction > 0 )		return {target:target, method:'after'};
			else if( targetTop > subjectTop && direction < 0 )	return {target:target, method:'before'};
			else												return false;

			this.lookUp(target, direction);
		},
		findPrevSibling : function( target ){
			var prev=target.prev();
			if(!prev.length)					return false;
			if(prev.hasClass('ui-placeholder'))	return this.findPrevSibling(prev);
			if(prev.get(0)==this.get(0))		return this.findPrevSibling(prev);
			else								return prev;
		},
		findNextSibling:function(target){
			var next=target.next();
			if(!next.length)					return false;
			if(next.hasClass('ui-placeholder'))	return this.findNextSibling(next);
			else								return next;
		}
	} );

	$.fn.sortable = function(){
		var that = sortable( this );

		that.bind( 'selectstart' , function( e ){
			e.preventDefault();
		} );
		that.bind( 'mousedown' , function( e ){
			that.startDrag();
			e.preventDefault();
		} );

		return that;
	};

	/*
	 *	placeholder
	 */
	function placeholderGroupFactory ( summedHeight ) {
		var siblings = [],
			current,
			dead = false;

		// control placeholders
		(function(){
			var duration = 30,
				summedEasedStat = 0,
				target,
				i;

			for( i = 0; i < siblings.length; i++ ){
				target = siblings[i];
				target.data( 'stat' , target.data( 'stat' ) + target.data( 'statSeed' ) );
				if ( target.data( 'statSeed' ) > 0 ) {
					target.data( 'easedStat' , $.easing.easeOutQuad( undefined , target.data( 'stat' ) , 0 , 1 , duration ) );
				}
				if ( target.data( 'statSeed' ) < 0 ) {
					target.data( 'easedStat' , $.easing.easeInQuad( undefined , target.data( 'stat' ) , 0 , 1 , duration ) );
				}
				summedEasedStat+=target.data( 'easedStat' );

				if ( target.stat >= duration ) {
					target.data( 'statSeed' , 0 );
				}
				else if ( target.stat <= 0 ) {
					siblings.splice( i-- , 1 );
					target.remove();
				}
			}

			var totalHeight=0;
			for( i = 0; i < siblings.length; i++ ){
				var height;

				target = siblings[i];
				if ( i == siblings.length-1 ) {
					height = summedHeight - totalHeight;
				}
				else{
					height = Math.round( summedHeight * ( target.data( 'easedStat' ) / summedEasedStat ) );
					totalHeight += height;
				}
				target.height( height );
			}
			
			if ( !dead ) {
				setTimeout( arguments.callee , 13 );
			}
		})();

		// pseudo instance
		return {
			get : function () {
				// register
				var placeholder = $( '<div class="ui-placeholder">' );
				siblings.push( placeholder );
				current = placeholder;

				// init member
				placeholder.data( 'statSeed' , 1 );
				placeholder.data( 'stat' , 0 );

				return placeholder;
			},
			head : function(){
				return current;
			},
			bye : function( now ){
				if ( now ) {
					current.remove();
				}
				else {
					var stat = current.data( 'stat' );
					//current.data( 'stat' , Math.round( stat * 0.25 ) );
					current.data( 'stat' , stat - 1 );
					current.data( 'statSeed' , -1 );
				}
			},
			die : function(){
				dead = true;
			}
		};
})();
