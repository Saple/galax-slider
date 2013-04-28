# Galax Slider

## What is it?

jQuery plugin for creating slider containing images for ex. showing headlines on webpage or just showing people your awesome pictures!

### How to use

Include jQuery and Galax Slider:

	<script src="//code.jquery.com/jquery-latest.min.js"></script>
	<script src="lib/jquery.droidscroll.js"></script>
	<script src="galax-slider.js"></script>

Include Galax Slider stylesheet

	<link rel="stylesheet" href="lib/jquery.droidscroll.css">
	<link rel="stylesheet" href="galax-slider.css">

Insert the needed HTML:

	<div id="element" class="galax-slider">
		<a class="galax-wrap" href="">
			<img class="galax-image" src="" />
			<div class="galax-overlay"></div>
		</a>
	</div>

Initialize the plugin:

	$("#element").galax();

## Options

Although it’s lightweight, Unslider comes with a range of options to customise your slider. Here’s the default options provided. You can add, remove, or completely skip out the options object. It’s up to you.

	$("#element").galax({
		width: 920,							// Slider width
		height: 320,						// SLider height
		startPosition: 5,					// Starting slide
		jsonUrl: 'example_json.json',		// Url to the json file that contains the data for slides
		timerBar: true,						// Show timerbar
		controls: true,						// Show controls
		overlay: true,						// Show overlay
		autoplay: true,						// Automatically change slides
		autoplayDelay: 4500,				// Delay between the change slides 
		animation: 'blocksDownDiagonal',	// Transition animation (check avaible animations below)
		animationEasing: 'swing',			// Animation easing [ linear / swing ] If jquery.easing plugin is included you can use those easings.
		animationSpeed: 500,				// Animation speed
		animationDelay: 0,					// Delay before starting the animation
		animationBuffer: 20,				// Delay added to the animation of elements in transition animation
		transition: [ 'expand', 'fade' ],	// Animation for the transition elements
		slices: 14,							// How many slice elements on transition
		blocksRows: 4,						// How many blocks per row
		blocksCols: 10,						// How many columns per row
		blocksSquares: true,				// Are the blocks square shaped
		thumbs: true,						// Show thumbs
		thumbsMax: 99,						// Maximum thumbs
		thumbsInView: 10,					// How many thumbs are in view
		thumbsKeepRatio:  true,				// Keep size ratio
		thumbsDraggable: true,				// Is drag-scrollinb enabled
	});

Avaible animation transitions:

	sliceRight
	sliceLeft
	sliceUp
	sliceDown
	sliceRandom
	blocksUp
	blocksDown
	blocksUpDiagonal
	blocksDownDiagonal
	blocksRandom
	random

Avaible	transitions

	none
	fade
	fold
	expand
	expandX
	expandY
	random
	growUp
	growDown

	*note that you can't use growUp or growDown with block-animations

## Features/updates planned (not in any particular order)

* Upgrade to using newest jQuery
* Remove the need for jQuery Droidscroll and rework the thumbnails system
* Allow using the plugin without ajax (rework the needed HTML to support list of slides)
* Add support for mobile and responsive design (with alternate image size sources etc)
* Add support for other content type than images (for ex. videos, html ect)
* Overlay animations
* Rework the animation / transition system

## Licence
Copyright (c) 2012-2013 Sakari Mursu, released under the MIT License.
