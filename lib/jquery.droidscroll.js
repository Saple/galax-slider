/*!
 * DroidScroll v1.3
 * 
 * CSS-transition based momentum scroller in jQuery Plugin format.
 *   http://debeterevormgever.nl/software/droidscroll
 * 
 * Copyright 2011 Elco Klingen.
 * 
 * Licensed under the GNU General Public License 3.0 (GPLv3):
 *   http://www.opensource.org/licenses/gpl-3.0
 * 
 * Requires jQuery JavaScript Library (preferably v1.5.2+):
 *   http://jquery.com/
 * 
 * Features:
 *   - Uses CSS transitions.
 *   - Degrades gracefully in IE and other non-capable/older browsers.
 * 
 * Usage:
 *   $(element).droidscroll(); or $(element).droidscroll({ option: value });
 * 
 * Options:
 *   option			default	type		description
 *   direction		null	string		'v' for vertical, 'h' for horizontal or null for both
 *   alignmentX		null	string		'l' or none for left, 'r' for right, 'c' for center
 *   alignmentY		null	string		't' or none for top, 'b' for bottom', 'c' for center
 *   transDelay		500		int (msec)	should be the same amount of time the css transitions last
 *   barsDelay		1500	int (msec)	how long the scrollbars should stay visible
 *   shootMax		15		int	(msec)	how long the dragging should last before it no longer overshoots
 *   scrollDist		100		int (px)	how much distance should be covered with one tick of the scrollwheel
 *   keyDist		50		int (px)	how much distance should be covered with one keypress
 *   dragDist		3		int (px)	how much distance should be covered before dragging kicks in
 *   focusAdd		10		int (px)	how much margin to add when tabbing through anchors
 *   useKeys		false	boolean		if the keys should be captured for this instance
 *   									(can be overridden by using $(element).data('ds-scr', false);)
 * 
 * History:
 *   1.0	Initial release.
 *   1.1	Removed non-CSS animation cruft; older/incompetent browsers don't need fancy tweens.
 *   1.2	Addition of Anchor Focus and MouseClick event handlers.
 *   1.3	Bugfixes.
 * 
 * Known Issues:
 *   - Mousedown event handler might get 'stuck' in IE8 until you mousedown and mouseup again.
 *   - The shootMax variable isn't correctly implemented; it should be polled instead for correct 'throw' effect.
 *   - Bars might show/hide when firing multiple keyPress events ~500ms after each other. Should re-arrange the bars timeout to fix this.
 *   - Find a way to track the current momentum to enable correct acceleration effect. The way it is now is usable, but not perfect.
 *   - When tabbing through anchors, those above the current view will not be scrolled into view. Should be easy to fix.
 *   - The override for useKeys is 'ds-scr' instead of something like 'ds-useKeys'. Should fix.
 *   - Right-clicking a link makes it scroll to the bottom by activating AnchorFocus. That ain't right. Should fix.
 */

(function($, window, document, undefined) {
	
	function DroidScroll(e, opt) {
		var that = this;
		
		// Options object
		this.opt = $.extend({ direction: null, alignmentX: null, alignmentY: null, transDelay: 500, barsDelay: 1500, shootMax: 15, scrollDist: 100, keyDist: 50, dragDist: 3, focusAdd: 10, useKeys: false }, opt);
		
		// Wrap the element and save both
		this.$wrap = $(e).addClass('droidscroll').wrapInner('<div class="ds-view' + ((this.opt.direction) ? (' ds-view-' + this.opt.direction) : '') + '"/>');
		this.$view = this.$wrap.children('.ds-view');
		
		// Take existing scroll position and reset it, while setting the starting position
		this.left = -(e.scrollLeft || this.$wrap[0].scrollLeft);
		this.top = -(e.scrollTop || this.$wrap[0].scrollTop);
		
		this.$view.css({ 'left': this.left, 'top': this.top });
		this.$wrap[0].scrollTop = this.$wrap[0].scrollLeft = e.scrollTop = e.scrollLeft = 0; 
		
		// Initialize momentum(s)
		this.mH = (this.opt.direction !== 'v') ? true : false;
		this.mV = (this.opt.direction !== 'h') ? true : false;
		
		// Set data
		this.$wrap.data('ds-moving', false);
		
		// Create horizontal scrollbar
		if (this.mH) {
			this.$hBar = $('<div class="ds-bar ds-bar-h"/>').appendTo(this.$wrap);
			this.$hTrack = $('<div class="ds-track"/>').appendTo(this.$hBar);
			this.$hThumb = $('<div class="ds-thumb"/>').appendTo(this.$hTrack);
		}
		
		// Create vertical scrollbar
		if (this.mV) {
			this.$vBar = $('<div class="ds-bar ds-bar-v"/>').appendTo(this.$wrap);
			this.$vTrack = $('<div class="ds-track"/>').appendTo(this.$vBar);
			this.$vThumb = $('<div class="ds-thumb"/>').appendTo(this.$vTrack);
		}
		
		// Get wrap and view dimensions and bind an event on resize. Way faster then individual width() and height() calls, especially in setPos()
		$(window).bind('resize', function() { that.onResize(); });
		
		// Then fire the event
		this.onResize();
		
		// Add event handlers
		// Bind MouseDown and MouseScroll handlers
		this.$view.bind('click', function(evt) { return that.onMouseClick(evt); });
		this.$view.bind('mousedown', function(evt) { return that.onMouseDown(evt); });
		this.$wrap.bind('DOMMouseScroll mousewheel', function(evt) { return that.onMouseScroll(evt); });
		
		// Set data and bind KeyPress handler if needed
		if (this.opt.useKeys) {
			this.$wrap.data('ds-scr', true);
			
			$(document).keydown(function(evt) { return that.onKeyPress(evt); });
		}
		
		// Bind Anchor Focus handler on any anchors
		this.$view.find('a').each(function() {
			$(this).focus(function(evt) { return that.onAnchorFocus(evt); });
		});
		
	}
	
	$.extend(DroidScroll.prototype, {
		
		// Set the position of the view @ params x: int, y: int
		setPos: function(x, y) {
			
			// Prevent x/y from being undefined
			x = (x == undefined) ? null : x;
			y = (y == undefined) ? null : y;
			
			// Set the horizontal position
			if (x !== null) {
				this.left = x;
				this.$view.css({ 'left': this.left + 'px' });
			}
			
			// Set the vertical position
			if (y !== null) {
				this.top = y;
				this.$view.css({ 'top': this.top + 'px' });
			}
			
			// Show scrollbars
			this.positionThumbs();
			this.showBars();
			
		},
		
		// Check position for possible overshooting and re-set position if needed
		checkPos: function() {
			var x = null, y = null;
			
			// Check for overshooting on the X-axis, but only if we can scroll that way
			x = (this.mH && this.left > 0) ? 0 : x; // overshot left
			//x = (this.mH && this.left < 0 && this.vW < this.wW) ? 0 : x; // view is smaller then wrap; reset
			x = (this.mH && this.left < -(this.vW - this.wW)) ? -(this.vW - this.wW) : x; // overshot right
			
			// Check for overshooting on the Y-axis, but only if we can scroll that way
			y = (this.mV && this.top > 0) ? 0 : y; // overshot top
			//y = (this.mV && this.top < 0 && this.vH < this.wH) ? 0 : y; // view is smaller then wrap; reset
			y = (this.mV && this.top < -(this.vH - this.wH)) ? -(this.vH - this.wH) : y; // overshot bottom
			
			// If view is smaller then wrap in width, center based on alignment
			if (this.mH && this.vW < this.wW) {
				switch (this.opt.alignmentX) {
					case null: case 'l': x = 0; break;
					case 'r': x = this.wW - this.vW; break;
					case 'c': x = (this.wW - this.vW) / 2; break;
				}
			}
			
			// If view is smaller then wrap in height, center based on alignment
			if (this.mV && this.vH < this.wH) {
				switch (this.opt.alignmentY) {
					case null: case 't': y = 0; break;
					case 'b': y = this.wH - this.vH; break;
					case 'c': y = (this.wH - this.vH) / 2; break;
				}
			}
			
			// Return if there is no new value
			if (x == null && y == null) return;
			
			// If so, set the new position
			this.setPos(x, y, true);
			
		},
		
		// KeyPress handler @params event
		onKeyPress: function(evt) {
			var x = null, y = null;
			
			// Return if the data is not set - this way, the keyhandler can be prevented from the outside when a different instance needs the handler
			if (!this.$wrap.data('ds-scr')) return;
			
			// Return if the user wants to interact with a select, input or textarea element
			if ((target = evt.target.nodeName.toLowerCase()) && (target === 'select' || target === 'input' || target === 'textarea')) return true;
			
			// Increase or decrease x or y based on keyCode
			switch (evt.keyCode) {
				case 33: y = (this.mV) ? ((this.top + this.wH) - this.opt.keyDist) : null; break; // pgup
				case 34: y = (this.mV) ? ((this.top - this.wH) + this.opt.keyDist) : null; break; // pgdn
				case 35: y = (this.mV) ? -(this.vH - this.wH) : null; break; // end
				case 36: y = (this.mV) ? 0 : null; break; // home
				case 37: x = (this.mH) ? (this.left + this.opt.keyDist) : null; break; // left arrow
				case 38: y = (this.mV) ? (this.top + this.opt.keyDist) : null; break; // top arrow
				case 39: x = (this.mH) ? (this.left - this.opt.keyDist) : null; break; // right arrow
				case 40: y = (this.mV) ? (this.top - this.opt.keyDist) : null; break; // bottom arrow
				default: return;
			}
			
			// Return if there is no new value - for example, when right arrow is pressed but scrolling is only vertical
			if (x == null && y == null) return;
			
			// Set and check position
			this.setPos(x, y);
			this.checkPos();
			
		},
		
		// MouseScroll handler @params event
		onMouseScroll: function(evt) {
			var delta, x = null, y = null;
			
			// Get the correct delta (positive or negative)
			delta = (evt.wheelDelta) ? evt.wheelDelta : -evt.detail / 3;
			delta = (delta < -1) ? -1 : (delta > 1) ? 1 : delta;
			
			// Return if delta is zero
			// NOTE: dead code?
			if (delta == 0) return;
			
			// Get the distance
			distance = (delta * delta) * ((delta > 0) ? this.opt.scrollDist : -(this.opt.scrollDist));
			
			// Return if distance is zero
			// NOTE: dead code?
			if (distance == 0) return;
			
			// Get the position based on the event axis (horizontal or vertical)
			x = (this.mH && evt.originalEvent.axis === 1) ? this.left + distance : null;
			y = (this.mV && evt.originalEvent.axis !== 1) ? this.top + distance : null;
			
			// Return if no new position
			if (x == null && y == null) return;
			
			// Set and check position
			this.setPos(x, y);
			this.checkPos();
			
		},
		
		// MouseDown handler @params event @return false
		onMouseDown: function(evt) {
			var that = this;
			
			// Prevent dragging so text selection is possible when needed
			if ((target = evt.target.nodeName.toLowerCase()) && (target === 'pre' || target === 'code' || target === 'input' || target === 'textarea')) return true;
			
			// Add className for custom cursor
			this.$wrap.addClass('ds-grabbing');
			
			// Set first and last positions
			this.lastX = this.firstX = (this.mH) ? evt.clientX : null;
			this.lastY = this.firstY = (this.mV) ? evt.clientY : null;
			
			// Bind event handlers
			$(document).bind({ 'mousemove': function(evt) { return that.onMouseMove(evt); }, 'mouseup' : function(evt) { return that.onMouseUp(evt); } });
			this.$wrap.mouseleave(function(evt) { return that.onMouseLeave(evt); }); // Fix multiple mousout events firing in some browsers like FF4
			
			// Prevent selection of text etc
			// NOTE: Doing this on touch devices disables generation of 'click' events!
			// FIXME: Incorporate touch devices?
			evt.preventDefault ? evt.preventDefault() : evt.returnValue = false;
			
			return false;
		},
		
		// MouseMove handler @params event @return false
		onMouseMove: function(evt) {
			var distance, x = null, y = null, now = (new Date()).getTime();
			
			// Only if horizontal scrolling is enabled
			if (this.mH) {
				// Calculate the distance
				distance = evt.clientX - this.lastX;
				
				// Return if the distance is less then the minimum - for those who aren't quite as gifted with handling a mouse
				if (!this.$wrap.data('ds-moving') && distance < this.opt.dragDist && distance > -this.opt.dragDist) return;
				
				// Calculate new position
				x = this.left + distance;
				
				// Set the first and last positions
				this.firstX = (!this.lastTime || !(now - this.lastTime < this.opt.shootMax)) ? evt.clientX : this.firstX;
				this.lastX = evt.clientX;
			}
			
			// Only if vertical scrolling is enabled
			if (this.mV) {
				// Calculate the distance
				distance = evt.clientY - this.lastY;
				
				// Return if the distance is less then the minimum - for those who aren't quite as gifted with handling a mouse
				if (!this.$wrap.data('ds-moving') && distance < this.opt.dragDist && distance > -this.opt.dragDist) return;
				
				// Calculate new position
				y = this.top + distance;
				
				// Set the first and last positions
				this.firstY = (!this.lastTime || !(now - this.lastTime < this.opt.shootMax)) ? evt.clientY : this.firstY;
				this.lastY = evt.clientY;
			}
			
			// Set data
			this.$wrap.data('ds-moving', true);
			
			// Set new position; no need to check position since it's checked in the mouseup handler. This is to allow dragging outside boundaries
			this.setPos(x, y);
			
			// Save the timestamp for next time
			this.lastTime = now;
			
			// Prevent selection of text etc
			// NOTE: Doing this on touch devices disables generation of 'click' events!
			// FIXME: Incorporate touch devices?
			evt.preventDefault ? evt.preventDefault() : evt.returnValue = false;
			
			return false;
		},
		
		// MouseUp handler @params event
		onMouseUp: function(evt) {
			var that = this, x = null, y = null;
			
			// Accelerate by magnifying the increase depending on the difference between client and first (ie: drag speed)
			x = (this.mH) ? this.left + (evt.clientX - this.firstX) : null;
			y = (this.mV) ? this.top + (evt.clientY - this.firstY) : null;
			
			// Set and check new positions
			this.setPos(x, y);
			this.checkPos();
			
			// Unbind event handlers
			$(document).unbind('mousemove mouseup');
			this.$wrap.mouseleave(function() {}); // Fix multiple mouseout events firing in some browsers like FF4
			
			// Set data - do it in a timeout because of the CSS transitions
			this.moveT = setTimeout(function() {
				that.$wrap.data('ds-moving', false);
				
				clearTimeout(that.moveT);
				that.moveT = null;
			}, this.opt.transDelay);
			
			// Remove class for custom cursor
			this.$wrap.removeClass('ds-grabbing');
			
		},
		
		// MouseLeave handler @params event
		onMouseLeave: function(evt) {
			
			// Return if not currently being grabbed
			if (!this.$wrap.hasClass('ds-grabbing')) return;
			
			// Fire MouseUp handler
			this.onMouseUp(evt);
			
		},
		
		// MouseClick handler @params event
		onMouseClick: function(evt) {
			var $e, offset, x = null, y = null;
			
			// Intercept clicking on anchors when movement is in progress - for people with less then satisfactory hand-eye coordination
			if (this.$wrap.data('ds-moving')) {
				// Prevent default
				evt.preventDefault();
				evt.stopPropagation();
				
				return false;
			}
			
			// Intercept in-page anchors; handle this ourselves
			if ((target = evt.target) && target.href && (target.href.indexOf('#') !== -1)) {
				// Get the element and it's offset
				$e = $(target.href.substring(target.href.indexOf('#')));
				offset = $e.offset();
				
				// Return if the anchor points to a non-existing element
				if (offset == null) return;
				
				// Get the values
				x = -((this.mH) ? ((offset.left - this.left) - parseInt($e.css('marginLeft'), 10)) : this.left);
				y = -((this.mV) ? ((offset.top - this.top) - parseInt($e.css('marginTop'), 10)) : this.top);
				
				// Set new position
				this.setPos(x, y);
				
				// Prevent default
				evt.preventDefault();
				evt.stopPropagation();
				
				return false;
			}
			
		},
		
		// Resize handler
		onResize: function() {
			
			// Save width and height values to shorten processing time, especially in setPos()
			this.wH = this.$wrap.height();
			this.wW = this.$wrap.width();
			this.vH = this.$view.height();
			this.vW = this.$view.width();
			
			// Resize scrollbar thumbs
			if (this.$hBar) this.$hThumb.css({ width: (this.wW >= this.vW ? '100%' : Math.round(this.wW / this.vW * 100) + '%') });
			if (this.$vBar) this.$vThumb.css({ height: (this.wH >= this.vH ? '100%' : Math.round(this.wH / this.vH * 100) + '%') });
			
			// Position scrollbar thumbs
			this.positionThumbs();
			
			// Check position
			this.checkPos();
			
		},
		
		// Focus handler for anchors; so that dragging links will not trigger a location change. @params event
		onAnchorFocus: function(evt) {
			var x = null, y = null;
			
			// Reset scroll position since we will use absolute positioning
			if (this.$wrap.scrollTop() > 0) {
				this.$wrap.scrollTop(0);
			}
			
			// Check if the anchors are in the allowed viewport
			if ((target = evt.target) && (target.offsetTop + target.offsetHeight) > this.wH) {
				// Adds a few pixels (this.opt.focusAdd) so the anchors aren't flush with the bottom or rightmost border of the viewport
				x = (this.mH) ? (this.wW - (target.offsetLeft + target.offsetWidth)) - this.opt.focusAdd : null;
				y = (this.mV) ? (this.wH - (target.offsetTop + target.offsetHeight)) - this.opt.focusAdd : null;
				
				// Set new position
				this.setPos(x, y);
			}
			
			// Prevent default
			evt.preventDefault();
			
			return false;
		},
		
		// Show scrollbars
		showBars: function() {
			var that = this;
			
			// Return if the view is smaller then the wrap - for alignment purposes
			// FIXME: Perhaps better to recalculate the scrollbars?
			if ((this.mV && this.vH < this.wH) || (this.mH && this.vW < this.wW)) return;
			
			// Return if the scrollbars are visible already
			if (((this.$hBar) && this.$hBar.hasClass('ds-bar-visible')) || ((this.$vBar) && this.$vBar.hasClass('ds-bar-visible'))) return;
			
			// Add visible class
			if (this.$hBar) this.$hBar.addClass('ds-bar-visible');
			if (this.$vBar) this.$vBar.addClass('ds-bar-visible');
			
			// Clear previous timeout
			// NOTE: dead code?
			// FIXME: Rearrange timeout code - as of right now, it is being binded and unbinded continuously when grabbing - not a good thing.
			if (this.barT) {
				clearTimeout(this.barT);
				this.barT = null;
			}
			
			// Set timeout so the bars can disappear after a while
			this.barT = setTimeout(function() {
				that.hideBars();
				
				clearTimeout(that.barT);
				that.barT = null;
			}, this.opt.barsDelay);
			
		},
		
		// Hide scrollbars
		hideBars: function() {
			
			// Remove visible class
			if (this.$hBar) this.$hBar.removeClass('ds-bar-visible');
			if (this.$vBar) this.$vBar.removeClass('ds-bar-visible');
			
		},
		
		// Position scrollbar thumbs
		positionThumbs: function() {
			
			if (this.$hBar) this.$hThumb.css('left', (-this.left / this.vW * 100) + '%');
			if (this.$vBar) this.$vThumb.css('top', (-this.top / this.vH * 100) + '%');
			
		}
		
	});
	
	$.fn.extend({
		
		droidscroll: function(opt) {
			
			this.each(function() {
				$(this).data('ds', new DroidScroll(this, opt));
			});
			
			return this;
		}
		
	});
	
})(jQuery, window, document);


