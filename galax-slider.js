 /*
 * jQuery Galax Slider (Galax)
 *
 * jQuery plugin for creating slider containing images for ex. showing headlines on webpage
 * http://students.oamk.fi/~~t2musa00/galax.html
 *
 * Copyright 2012, Sakari Mursu
 *
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version: 0.1.1 beta
 * @date 2012.11.14
 * @author Sakari Mursu
 * @dependencies:
 * 		jQuery v1.8.2 ( http://jquery.com/ )
 *		droidscroll 1.3 ( http://debeterevormgever.nl/en/software/droidscroll ) *
 *		jQuery Easing Plugin 1.3 ( http://gsgd.co.uk/sandbox/jquery/easing/ ) **
 *
 *		* linking the css-file of droidscroll is not required you need to link only the js-file!
 *      ** easing plugin is only required when using it's easings
 */

 /*
	Changelog:
	12-11-14 Added detection for mobile browser and disabling autoplay if plugin is used with mobile browser
	
	Todo:
	12-09-29 Add arrows to thumbnails to show that there are more thumbnails hidden also add autoscroll with autoplay (every time slide changes -> move thumbs 1 thumb width
*/

(function ($) {
'use strict';
	$.fn.galax = function( options ) {
		// define defaults
		var defaults = {
			width: 920,
			height: 320,
			startPosition: 5,
			jsonUrl: 'example_json.json',
			timerBar: true,
			controls: true,
			overlay: true,
			autoplay: true,
			autoplayDelay: 4500,
			// sliceRight, sliceLeft, sliceUp, sliceDown, sliceRandom
			// blocksUp, blocksDown, blocksUpDiagonal, blocksDownDiagonal, blocksRandom
			// random
			animation: 'blocksDownDiagonal',
			// linear swing (+more if jQuery Easing plugin is available)
			animationEasing: 'swing',
			animationSpeed: 500,
			animationDelay: 0,
			animationBuffer: 20,
			// none fade fold expand expandX expandY random growUp growDown
			// *note: you can't use growUp or growDown with any block-animation
			transition: [ 'expand', 'fade' ],
			slices: 14,
			blocksRows: 4,
			blocksCols: 10,
			blocksSquares: true,
			thumbs: true,
			thumbsMax: 99,
			thumbsInView: 10,
			thumbsKeepRatio:  true,
			thumbsDraggable: true,
			// styles * NOTE: currenlty not working!
			// nome small
			thumbsStyle: '',
			// Be cautious when changing settings below!
			slicesDirection: false,
			debug: true
		};

		var f = {};
		
		// return for each initiated element
		return this.each(function() {

			// merge defaults and user defined settings
			var settings = $.extend( true, defaults, options);

			// define variables
			var $el = $(this),
				$display = $(".galax-wrap", $el),
				//$display = $("div.galax-display", $el),
				$image = $('.galax-image', $el),
				$overlay = $('.galax-overlay', $el),
				$link = $('.galax-wrap', $el),
				$controls,
				$thumbs,
				$timerBar,
				$anim,
				ajaxData = [],
				slides = {
					active: 0,
					total: 0
				},
				animationRunning = false,
				autoplayInterval,
				animationDelay;
				
			/*
			 * Run all needed commands to intialize the plugin
			 * @method init
			 */
			f.init = (function() {

				if ( settings.jsonUrl == '' ){

				}
				else {
					// get data from json
					f.returnJSON();
				}

				// set the slider width and height
				$el.css({ "width": settings.width + "px", "height": settings.height + "px" });
				//$display.css({ "width": settings.width + "px", "height": settings.height + "px" });

				if ( settings.controls ) {
					f.createControls();
				}

				if ( settings.thumbs ) {
					f.createThumbs();
				}

				if ( settings.autoplay ) {
					//if( !/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
						f.autoplayStart();
					//}
				}

				// switch to starting slide
				f.switchSlide( settings.startPosition - 1 );
			});
			
			/*
			 * Fetch data with ajax
			 * @method returnJSON
			 */
			f.returnJSON = (function() {
				$.ajax({
					url: settings.jsonUrl,
					cache: true,
					type: "GET",
					// needed to make json return before continuing
					async: false,
					//data: { search: "searchString" },
					dataType: "json",
					error: function( error ) {
						if ( settings.debug ) {
							console.error( '[returnJSON] Error reading JSON: ' + error );
						}
					},
					success: function( json ) {
						// move received json to array
						for ( var i in json.data ) {
							ajaxData[i] = {
								'id' : parseInt( i ),
								'title' : json.data[i].title,
								'description' : json.data[i].description,
								'date' : json.data[i].date,
								'source': json.data[i].source,
								'thumbnail': json.data[i].thumbnail,
								'image': json.data[i].image,
							};
						}

						// define the total amount of slides
						slides.total = ajaxData.length;

						if ( settings.debug ) {
							console.log( '[returnJSON] JSON loaded succesfully' );
						}

					}
				});
			});
			
			/*
			 * Change to defined slide
			 * @method switchSlide
			 * @param int slideId
			 */
			f.switchSlide = function( slideId ) {

				if ( animationRunning === false ) {
					slides.active = ajaxData[slideId].id;
					
					// set slider link
					$link.attr( 'href', ajaxData[slideId].source );

					if ( settings.overlay ) {

						// if ajax has data for overlay, else hide the overlay
						if ( ajaxData[slideId].title || ajaxData[slideId].description ) {
							$overlay.html( ajaxData[slideId].title );
						} else {
							$overlay.hide();
						}

						// add description text if it is defined
						if ( ajaxData[slideId].description ){
							$overlay.append( '<span class="galax-sub-text">' + ajaxData[slideId].description + '</span>' );
						}

					}

					if ( settings.thumbs ) {
						// Set the active slides thumbnail effect
						if ( $('li', $thumbs).hasClass( 'active' ) ) {
								$('li', $thumbs).removeClass( 'active' ).eq( slideId ).addClass( 'active' );
							} else {
								$('li', $thumbs).eq( slideId ).addClass( 'active');
							}

							if (settings.debug) {
								console.log( '[setActiveThumb] previous active thumb: ' + $('.active', $thumbs).index() );
							}
					}

					f.animateSlide();
					
					if ( settings.debug ) {
						console.log( '[openSlide] ' + slideId );
					}
				} else if ( settings.debug ) {
					console.log( '[switchSlide] switching slides disabled! Animation is still running' );
				}
			};
			
			/*
			 * Change next slide
			 * @method switchNextSlide
			 */
			f.switchNextSlide = function() {
				// if current slide is last one, open first slide, else open next
				var slideToOpen = ( slides.active === slides.total - 1 ) ? 0 : slides.active + 1;

				f.switchSlide( slideToOpen );
			};
			
			/*
			 * Change previous slide
			 * @method switchPrevSlide
			 */
			f.switchPrevSlide = function() {
				// if at the first slide, open last one, else open previous
				var slideToOpen = ( slides.active === 0 ) ? slides.total - 1 : slides.active - 1;

				f.switchSlide( slideToOpen );
			};

			/*
			 * Start automatic slide change
			 * @method autoplayStart
			 */
			 f.autoplayStart = function() {
				// clear existing timeout for autoplay
				clearTimeout(autoplayInterval);
				settings.autoplay = true;
				
				f.startTimerBar();
				
				// set new timeout for changing next slide
				autoplayInterval = setInterval( function() {
					f.startTimerBar();
					f.switchNextSlide();
				}, settings.autoplayDelay );

				if ( settings.debug ) {
					console.log( '[autoplay] enabled, delay: ' + settings.autoplayDelay );
				}
			};

			/*
			 * Stop automatic slide change
			 * @method autoplayStop
			 */
			f.autoplayStop = function() {
				if ( settings.autoplay ) {
					// clear existing timeout for autoplay
					clearTimeout( autoplayInterval );		// Nollaataan ajastin
					settings.autoplay = false;
					f.stopTimerBar();

					if ( settings.debug ) {
						console.log( '[autoplay] disabled' );
					}
				}
			};

			/*
			 * Create and start timerbar, shows the reamining display time of slide
			 * @method startTimerBar
			 */
			f.startTimerBar = (function() {
				if ( $('.galax-timer', $el).length === 0 ) {
					// add the element to page
					$display.after( '<div class="galax-timer"></div>' );

					// assing it to global variable
					$timerBar = $('.galax-timer', $el);
				}

				$timerBar.css({ "width" : '0' }).stop().animate({ "width" : "100%", easing: 'linear' }, settings.autoplayDelay );
			});

			/*
			 * Stop timerbar
			 * @method stopTimerBar
			 */
			f.stopTimerBar = (function() {
				if ( $timerBar.length > 0 ) {
					$timerBar.stop().animate({ opacity: 0 }, 500, function () {
						$timerBar.detach();
					});
				}
			});

			/*
			 * Create thumbs using data from ajax
			 * @method createThumbs
			 */
			f.createThumbs = (function() {
				var htmlWrap = '',
					thumbsTotal = ( slides.total <= settings.thumbsMax ? slides.total : settings.thumbsMax ),
					//thumbsTotal = ( slides.total <= settings.thumbsInView ? slides.total : settings.thumbsInView );
					loopTimes = thumbsTotal;

				$el.append( '<div class="galax-thumbs-wrap"><ul class="galax-thumbs"></ul></div>' );
				$thumbs = $('ul.galax-thumbs', $el);
				
				if (settings.thumbsStyle === 'small') {
					$thumbs.addClass('small-thumbs');
				}

				// if draggable, insert all thumbs, else insert only defined
				if ( settings.thumbsDraggable ) {
					thumbsTotal = settings.thumbsInView;
				}
				
				for ( var i = 0; i < loopTimes; i++ ) {
					if ( settings.thumbsStyle === 'small' ) {
						htmlWrap += '<li></li>';
					} else {
						htmlWrap += '<li><img src="' + ajaxData[i].image + '" /></li>';
					}

				}

				// insert thumbs to dom
				$thumbs.html(htmlWrap);

				// get right marginal of the thumbs
				var mright = parseInt( $('li', $thumbs).css( 'margin-right' ) ),
					twidth = parseInt( $('li', $thumbs).css( 'width' ) ),
					theight = parseInt( $('li', $thumbs).css( 'height' ) );

				if ( settings.thumbsKeepRatio ) {
					 // the original image width & height
					var oheight = $('li img', $thumbs).height(),
						owidth = $('li img', $thumbs).width(),
						ratio = 0,
					//	twidth = ( settings.width - (( thumbsTotal - 1 ) * mright ) ) / thumbsTotal;
						twidth = ( settings.width - ( thumbsTotal * mright )) / thumbsTotal;

					// if original width is smaller than thumb width
					if ( owidth > twidth ) {
						ratio = twidth / owidth;
						twidth = twidth;
						theight = oheight * ratio;
					}

					// if original height is smaller than thumb height
					if ( oheight > theight ){
						ratio = theight / oheight;
						theight = theight;
						twidth = owidth * ratio;
					}
					// to %
					// twidth = ( twidth / settings.width ) * 100;
					// to em
					//twidth = twidth / 16
					//twidth = Math.ceil(twidth);
					theight = Math.ceil(theight);
				} else {
					// to %
					//twidth = (( twidth + mright ) / settings.width ) * 100;
					// to em
					//twidth = ( twidth + mright ) / 16;
					twidth = Math.ceil(twidth);
					theight = Math.ceil(theight);
				}

				$('li', $thumbs).css({ 'width': twidth + 'px', 'height': theight });

				if ( settings.thumbsDraggable ) {
					thumbsTotal = ( slides.total <= settings.thumbsMax ? slides.total : settings.thumbsMax );

					var wrapw = ( twidth * thumbsTotal + (( thumbsTotal - 1 ) * mright ) ),
						draggablew = -(( thumbsTotal * ( twidth + mright )) - settings.width),
						clickCheckTimer;

					$thumbs.css({ width: wrapw });

					$('.galax-thumbs-wrap').droidscroll({ direction: 'h', alignmentX: 'l' });
				}
				
				$('li', $thumbs).bind( 'mouseup', f.thumbClick);

				if ( settings.debug ) {
					console.log( '[createThumbs] created: ' + thumbsTotal + ' thumbs, width: ' + twidth + '%, height: ' + theight + 'px' );
				}
			});

			/*
			 * Open clicked thumb
			 * @method thumbClick
			 */
			f.thumbClick = function() {
				// stop auto sliding if thumbnails is used to change slide
				f.autoplayStop();

				// define index of clicked thumb
				var clicked = $(this, $el).index();

				// if clicked thumb isn't same as currently active, change slide to clicked
				if ( clicked !== $('li.active', $el).index() ) {
					//switch to click slide
					f.switchSlide( clicked );

					if (settings.debug) {
						console.log( '[thumbClick] clicked id: ' + clicked );
					}
				}
			};
   		
			/*
			 * Animate the slide change
			 * @method animateSlide
			 */
			f.animateSlide = function(afterComplete) {
				var animationsList = [ 'blocksUp', 'blocksDown', 'blocksRandom', 'blocksDownDiagonal', 'blocksUpDiagonal', 'fold', 'sliceLeft', 'sliceRight', 'sliceUp', 'sliceDown' ], 
					selectedAnimation = settings.animation;

				// random effect
				if ( selectedAnimation === 'random' ) {
					selectedAnimation = animationsList[ Math.floor( Math.random() * animationsList.length ) ];
				}

				// blocksUp | blocksDown  | blocksRandom | blocksDownDiagonal | blocksUpDiagonal
				if ( selectedAnimation === 'blocksDown' || selectedAnimation === 'blocksUp' || selectedAnimation === 'blocksRandom' || selectedAnimation === 'blocksDownDiagonal' || selectedAnimation === 'blocksUpDiagonal' ) {
					f.createBlocks();

					if ( selectedAnimation === 'blocksUp' ) {
						$anim = $anim.reverse();
					} else if ( selectedAnimation === 'blocksRandom' ) {
						$anim = $anim.shuffle();
					} else if ( selectedAnimation === 'blocksDownDiagonal' ) {
						$anim = f.diagonal( $anim );
					} else if ( selectedAnimation === 'blocksUpDiagonal' ) {
						$anim = f.diagonal( $anim.reverse() );
					}

				} else if ( selectedAnimation == 'sliceLeft' || selectedAnimation == 'sliceRight' || selectedAnimation == 'sliceUp' || selectedAnimation == 'sliceDown' || selectedAnimation == 'sliceRandom' ) {
					// set slicing to horizontal -> then call createSlices(), if otherway around -> slices has already been created
					if ( selectedAnimation === 'sliceUp' || selectedAnimation === 'sliceDown' ) {
						settings.slicesDirection = true;
					}

					f.createSlices();

					if ( selectedAnimation === 'sliceLeft' || selectedAnimation === 'sliceUp' ) {
						$anim = $anim.reverse();
					} else if ( selectedAnimation === 'sliceRandom' ) {
						$anim = $anim.shuffle();
					}	
				}

				f.runAnimation( $anim );

				if ( settings.debug ) {
					console.log('[slideAnimation] animation: '+ selectedAnimation);
					console.log('[slideAnimation] transition: ' + settings.transition);
				}
			};
			
			/*
			 * Set startin css and return ending css for animation transition effect
			 * @method transition
			 * @param element
			 */
			f.transition = function( element ) {
				var trans = {},
					starto = {},
					transitionList = [ 'fade', 'fold', 'expand', 'expandY', 'expandX', 'growUp', 'growDown' ];

				$.each( settings.transition, function( key, effect ) {
					var start = {},
						end = {};

					if ( effect === 'random' ) {
						effect = transitionList[ Math.floor( Math.random() * transitionList.length )];
					}

					if ( effect === 'fade' ) {
						start = { opacity: 0 };
						end = { opacity: 1 };

					} else if ( effect === 'expand' ) {
						start = { height: 0, width: 0 };
						end = { height: element.height(), width: element.width() };

					} else if ( effect === 'expandY' ) {
						start = { height: 0 };
						end = { height: element.height() };
					
					} else if ( effect === 'expandX' || effect === 'fold'  ) {
						start = { width: 0 };
						end = { width: element.width() };

					// ... and animation is not any of the 'blocks'-animations
					} else if ( ( effect === 'growUp' || effect === 'growDown' ) && ( settings.animation.indexOf( 'blocks' ) === - 1 ) ){
						start = { top: $display.height() };
						end = { top: 0 };

						if ( effect === 'growDown' ) {
							start = { top: -($display.height()) };
							end = { top: 0 };
						}
					}

					$.extend( true, starto, start );
					$.extend( true, trans, end );
				});
				
				element.css( starto );
				return trans;
			};
			
			/*
			 * Run animation on selected element
			 * @method runAnimation
			 * @param element
			 * @param startCSS styles set before animation
			 * @param endCSS styles set after animation (aka the animated styles)
			 * @param onComplete function to call after execution
			 */
			f.runAnimation = function( element ) {
				var i = 1,
					animTimerBuff = 0,
					endStyle = f.transition(element);

				$.each(element, function() {
					var ele = $(this, $el);
					animationRunning = true;

					// set delay for animation
					animationDelay = setTimeout( function() {
						ele.animate( endStyle, { queue: false, duration: settings.animationSpeed, easing: settings.animationEasing, complete: function() {

								// if last
								if ( i === element.length ) {
									clearTimeout( animationDelay );
									animationRunning = false;
									element.stop().detach();
									
									//$display.css({ 'background' : 'url(\'' + ajaxData[slides.active].image + '\') no-repeat' });
									$image.attr('src', ajaxData[slides.active].image);

								} else {
									i++;
								}

							}
						});
					}, ( settings.animationDelay + animTimerBuff ));

					animTimerBuff += settings.animationBuffer;
				});
			};

			/*
			 * Create controls
			 * @method createControls
			 */
			f.createControls = (function() {
				// create controls
				var html = '<a class="galax-start" href="#"></a> <a class="galax-stop" href="#"></a> <a class="galax-prev" href="#"></a> <a class="galax-next" href="#"></a>';

				// create container for controls
				$display.append( '<div class="galax-controls">'+ html +'</div>' );

				// define the added element to variable
				var $controls = $('.galax-controls' ,$el);

				// Bind actions
				$('a', $controls).on( 'click', function(event){
					var e = $(this);
					
					// next
					if ( e.is('.galax-next') ) {
						f.switchNextSlide();
					// previous
					} else if ( e.is('.galax-prev') ) {
						f.switchPrevSlide();
					// start
					} else if ( e.is('.galax-start') ) {
						f.autoplayStart();
					// stop
					} else if ( e.is('.galax-stop') ) {
						f.autoplayStop();
					}
					
					// prevent defauly behavior
					event.preventDefault()
				});
				
				
				// hover effect for start and play buttons
				$display.hover( function() {
						$controls.animate({ opacity: 1 }, 150, 'swing' );
					}, function() {
						$controls.animate({ opacity: 0 }, 150, 'swing' ); 
					}
				);
			});

			/*
			 * Create blocks used for slide switch animations
			 * @method createBlocks
			 */
			f.createBlocks = (function() {
				var posY = 0,
					posX = 0,
					w = Math.round( $display.width() / settings.blocksCols ),
					h = Math.round( $display.height() / settings.blocksRows ),
					r = settings.blocksRows,
					c = settings.blocksCols,
					html = '';

				if ( settings.blocksSquares === true ) {
					var wh = 0;

					wh = Math.round( $display.height() / settings.blocksRows );
					c = Math.round( $display.width() / wh );
					w = wh;
					h = wh;
					
					// if the width of the display is bigger than the sum of the widths of blocs creates
					if (( r * wh ) < $display.width() ) {
						if ( settings.debug ) {
							console.log( ( r * wh ) + ' < ' + $display.width() );
						}
						c++;
					}
					
					settings.blocksRows = r;
					settings.blocksCols = c;
					
					if ( settings.debug ) {
						console.log( '[createBlocks] blocksSquares: true' );
						console.log( '[createBlocks] Rows: ' + r );
						console.log( '[createBlocks] Cols: ' + c );
						console.log( '[createBlocks] Total: ' + r * c );
					}
				}

				for ( var rows = 0; rows < r; rows++ ) {
					for ( var cols = 0; cols < c; cols++ ) {
						html += '<div class="galax-anim" name="' + ( cols + 1 ) + '" rel="' + ( rows + 1 ) +'" style="width:' + w + 'px; height:' + h + 'px; background:url(\'' + ajaxData[slides.active].image + '\') no-repeat -' + posX + 'px -' + posY + 'px; top:' + posY + 'px; left:' + posX + 'px;"></div>';
						posX += w;
					}
					posX = 0;
					posY += h;
				}

				$display.append( html );
				
				$anim = $('.galax-anim', $display);
			});

			/*
			 * * Create slices used for slide switch animations
			 * @method createSlices
			 */
			f.createSlices = (function() {
				var posX = 0,
					posY = 0,
					pos = 0,
					w = Math.round( $display.width() / settings.slices ),
					h = $display.height(),
					html = '';

				if ( settings.slicesDirection ) {
					h = Math.round( $display.height() / settings.slices );
					w = $display.width();
				}

				for ( var i = 0; i < settings.slices; i++ ) {
					html += '<div class="galax-anim" name="' + i + '" style="width:' + w + 'px; height:' + h + 'px; background:url(\'' + ajaxData[slides.active].image + '\') no-repeat -' + posX + 'px -' + posY + 'px;  left:' + posX + 'px; top:' + posY + 'px;"></div>';
					//html += '<div class="galax-anim" name="' + ( i +1 ) + '" style="width:' + w + 'px; height:' + h + 'px; background:url(\'' + ajaxData[slides.active].image + '\') no-repeat -' + posX + 'px 0px;  left:' + posX + 'px;"></div>';

					if ( settings.slicesDirection ) {
						posY += h;
					} else {
						posX += w;
					}
				}

				$display.append( html );
				$anim = $('.galax-anim', $display);
			});

			/*
			 * Rearrange array like object to 2d diagonal jQuery array like object
			 * @method shuffle
			 * @param array
			 */
			f.diagonal = (function( arrayObj ){
				var array = $(arrayObj),
					rows = settings.blocksRows,
					cols = settings.blocksCols,
					blocks = [];

				for ( var i = 0; i < rows * cols; i++) {
					blocks.push( i );
				}

				blocks.sort( function( a, b ) {
						return ( a/cols + a%cols - b/cols - b%cols );
					}
				);

				for ( var i = 0; i < ( rows * cols ); i++ ) {
					array[i] = arrayObj[ blocks[i] ];
				}

				return array;
			});

			// Initiate the plugin
			f.init();
		});
		
	};

	/*
	 * Shuffle array
	 * @method shuffle
	 */
	$.fn.shuffle = function() {
		var array = $(this);
		for ( var j, x, i = array.length; i; j = parseInt( Math.random() * i, 10 ), x = array[--i], array[i] = array[j], array[j] = x );
		return array;
	};
	
	// DROPPED!: doesnt work without insertin rows and cols manually
	$.fn.orderDiagonal = function( blocksRows, blocksCols) {
		var array = $(this),
			blocks = [];

		for ( var i = 0; i < blocksRows * blocksCols; i++) {
			blocks.push( i );
		}

		blocks.sort( function( a, b ) {
				return ( a / blocksCols + a % blocksCols - b / blocksCols - b % blocksCols );
			}
		);

		for ( var i = 0; i < ( blocksRows * blocksCols ); i++ ) {
			array[i] = $(this)[ blocks[i] ];
		}

		return array;
	};

	// Add reverse function to jQuery
	$.fn.reverse = [].reverse;
	
})(jQuery);
