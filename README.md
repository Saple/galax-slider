# Galax Slider

## What is it?

jQuery plugin for creating slider containing images for ex. showing headlines on webpage or just showing people your awesome pictures!

### How do I use it?

First you need to include all the needed files:

	<link rel="stylesheet" href="lib/jquery.droidscroll.css">
	<link rel="stylesheet" href="galax-slider.css">
	
	<script src="lib/jquery.droidscroll.js"></script>
	<script src="galax-slider.js"></script>

After including the necessary files, you need to insert the basic html:

	<div id="element" class="galax-slider">
		<a class="galax-wrap" href="">
			<img class="galax-image" src="" />
			<div class="galax-overlay"></div>
		</a>
	</div>

After that you just need to initialize the plugin:

	$("#first").galax();

## Features/updates planned

* Upgrade to using newest jQuery
* Remove the need for jQuery Droidscroll and rework the thumbnails system
* Allow using the plugin without ajax
* Add support for mobile
* Add support for responsive design (with alternate image size sources etc.)

## Licence
Copyright (c) 2012-2013 Sakari Mursu, released under the MIT License.
