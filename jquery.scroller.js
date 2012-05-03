(function() {
	if (!('isArray' in Array)) {
	    Array.isArray = function(o) {
	        return Object.prototype.toString.call(o)==='[object Array]';
	    };
	}

	var Scroller = {};

	/*
	 * class - add or remove a class
	 *
	 * This animation should be used with `shift` because it relies on a
	 * negative scroll value.
	 *
	 * classname: The name of the class to add when the scroll value becomes
	 *            positive, and to remove when it becomes negative. This uses
	 *            the jQuery addClass/removeClass functions, so you can specify
	 *            multiple classnames using spaces.
	 */
	Scroller.class = function(classname) {
		var is_on = false; // this is cheaper than using hasClass
		return function(event, args) {
			console.log([args.t, is_on]);
			if (args.t > 0 && !is_on) {
				$(this).addClass(classname);
				is_on = true;
			}
			else if (args.t <= 0 && is_on) {
				$(this).removeClass(classname);
				is_on = false;
			}
		}
	};

	/*
	 * shift - Shift the scroll position by a number of pixels
	 *
	 * This control is different from `between` because animations will still play
	 * after this one - but they may receive a negative scroll value.
	 *
	 * by: The number of pixels to shift it by. A positive number will cause
	 *     later animations to begin that number of pixels of scroll later than
	 *     it would have.
	 */
	Scroller.shift = function(by) {
		return function(event, args) {
			args.scroll_top -= by;
			by *= args.pixel;
			args.t -= by;
		}
	};

	/*
	 * parallax - Scroll faster or slower than the page to produce a parallax effect.
	 *
	 * layer: The perceived layer the element will be on. The main page is on layer zero.
	 *        Negative layers will be behind the main content; positive in front. (Assuming
	 *        you style it properly so they look like that)
	 */
	Scroller.parallax = function(layer) {
		// use layer as coefficient of t value
		var coef = Math.pow(2, layer) - 1;
		return function(event, args) {
			var $this = $(this);
			
			args.elem_offset.left += 0;
			args.elem_offset.top += 0 - (args.t * coef) / args.pixel;
		};
	};

	/*
	 * slide - Move <x> pixels rightwards and <y> pixels downwards over
	 *         a range of <scroll> pixels of scroll.
	 *
	 * x: Distance to move in X. Positive is rightwards; negative, leftwards.
	 * y: Distance to move in Y. Positive is downwards; negative, upwards.
	 * scroll: Scroll range over which this movement will happen.
	 */
	Scroller.slide = function(dx, dy, dt) {
		return function(event, args) {
			// convert dt out of pixel values
			var t = dt * args.pixel;
			var proportion = args.t/t;

			if (proportion > 1) return;

			args.elem_offset.left += dx * proportion;
			args.elem_offset.top += dy * proportion;
		}
	};

	/* 
	 * between - constrain further animations in the chain to the specified
	 *           scroll region.
	 *
	 * from: Scroll position in pixels at which animation will start, or 
	 *       'onscreen' to wait for the element to scroll into view.
	 * to: Scroll position in pixels at which to stop the animation, or
	 *     'offscreen', as if it matters, to wait for the element to scroll
	 *     out of view.
	 */
	Scroller.between = function(from, to) {
		return function(event, args) {
			var f = from;
			var t = to;

			if (f == 'onscreen') {
				f = elem_offset.top - args.view_height;
			}
			if (t == 'offscreen') {
				t = elem_offset.top + $(this).outerHeight();
			}

			var total_height = t ? t-f : args.scroll_range - f;

			// Subtract the "from" position from scroll position.
			args.scroll_top -= f;
			f *= args.pixel;
			args.t -= f;

			// If the result is > 0 we have scrolled past that
			if (args.t > 0) {
				// We don't subtract the "to" position and test that because it'll 
				// ruin the scroll values for the chain.
				if (t == undefined || args.scroll_top < total_height) {
					return;
				}

				// Stop all scrolling activity past t
				// Don't return false - we actually want to halt further animations, rather than reset them
				args.scroll_top = total_height;
				args.t = total_height * args.pixel;
				return;
			}
			
			// If t < 0 we don't start yet
			return false;
		};
	};

	/*
	 * orbit - revolve around position defined by <centre>, at speed defined by <speed>.
	 *         This animation is *absolute* and will hence undo any positioning done by
	 *         prior animations. To adjust the orbit, apply transformations afterwards.
	 *
	 *         This differs from CSS rotate because it will not affect the orientation of
	 *         the element as it orbits.
	 *
	 *   speed: Number of pixels of scroll to complete one full rotation. Positive numbers
	 *          scroll clockwise; negative numbers, anticlockwise.
	 *   centre: Either an array of [x, y] or a jQuery object, whose centre will be used.
	 *   start_at: Optional distance round the circle to start, in degrees.
	 */
	Scroller.orbit = function(speed, centre, start_at) {
		var self = $(this);

		start_at = start_at || 0;
		
		var cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt, pi = Math.PI, pow = Math.pow;

		var adjust = [self.outerWidth() / 2, self.outerHeight() / 2];
		speed = 2 * pi / speed;
		start_at *= pi / 180; // radians. 

		if (! Array.isArray(centre)) {
			var offset = centre.offset();
			centre = [offset.left + (centre.outerWidth() / 2), offset.top + (centre.outerHeight()/2)];
		}

		return function(event, args) {
			var radius = 
				Math.abs(
					sqrt(
						pow(args.elem_offset.top + adjust[1] - centre[1], 2) 
					  + pow(args.elem_offset.left + adjust[0] - centre[0], 2)
				));

			args.elem_offset.left = radius * cos(args.scroll_top * speed + start_at) - adjust[0] + centre[0];
			args.elem_offset.top = radius * sin(args.scroll_top * speed + start_at) - adjust[1] + centre[1];
		};
	};

	/*
	 * rotate - use CSS rotation transform to rotate around <centre> at a speed defined by
	 *          <speed>.
	 *
	 *   speed: Number of pixels of scroll to complete one full rotation. Positive numbers
	 *          scroll clockwise; negative numbers, anticlockwise.
	 *   centre: Array of [x, y] to set the default centre of rotation as % a la CSS.
	 *   start_at: Optional distance round the circle to start, in degrees.
	 */
	Scroller.rotate = function(speed, centre, start_at) {
		var self = $(this);

		var setup = {}

		if (centre) {
			$.extend(setup, {
				'transform-origin': centre[0] + '% ' + centre[1] + '%',
				'-ms-transform-origin': centre[0] + '% ' + centre[1] + '%',
				'-webkit-transform-origin': centre[0] + '% ' + centre[1] + '%',
				'-moz-transform-origin': centre[0] + '% ' + centre[1] + '%',
				'-o-transform-origin': centre[0] + '% ' + centre[1] + '%'
			});
		}

		if (start_at) {
			$.extend(setup, {
				'transform': 'rotate(' + start_at + 'deg)',
				'-ms-transform': 'rotate(' + start_at + 'deg)',
				'-webkit-transform': 'rotate(' + start_at + 'deg)',
				'-moz-transform': 'rotate(' + start_at + 'deg)',
				'-o-transform': 'rotate(' + start_at + 'deg)'
			});
		}

		self.css(setup);

		start_at = 0;

		return function (event, args) {
			var t_speed = speed * args.pixel;
			
			var deg = 360  * (args.t / t_speed) + start_at;

			var css = {
				'transform': 'rotate(' + deg + 'deg)',
				'-ms-transform': 'rotate(' + deg + 'deg)',
				'-webkit-transform': 'rotate(' + deg + 'deg)',
				'-moz-transform': 'rotate(' + deg + 'deg)',
				'-o-transform': 'rotate(' + deg + 'deg)'
			};

			self.css(css);
		}
	};

	/*
	 * css - tween some CSS attributes over <speed> pixels. For CSS rotate transform, use rotate.
	 *
	 *   speed: Number of pixels of scroll to go from current value to new value.
	 *   attributes: Object with CSS attributes as properties and the target value as values.
	 *               Only numeric values are supported, of course. Units used need to match the
	 *               ones defined by your CSS. CSS values not predefined will be ignored.
	 */
	Scroller.css = function(speed, attr) {
		var self = $(this),
			original_values = {};

		$.each(attr, function(key, value) {
			original_values[key] = self.css(key);
		});

		return function(event, args) {
			var css = {};
			var t_speed = speed * args.pixel;
			$.each(attr, function(key, value) {
				if (! original_values[key]) return;

				var orig = parseFloat(original_values[key]),
					target = parseFloat(value);

				var current = (target - orig) * (args.t / t_speed);
				if (current > target) current = target;

				css[key] = original_values[key].replace(orig, current);
			});

			self.css(css);
		};
	};

	$.fn.scroller = function() {
		var self = this,
			api = {},
			elements = [],
			invariant_values = {};

		api.add = function(elem, anims) {
			var animations = [];
			$.each(anims, function(i,anim) {
				if (typeof anim[0] == 'string') {
					if (!Scroller[anim[0]]) {
						throw anim[0] + " is not a recognised animation function.";
					}
					animations.push(Scroller[anim[0]].apply(elem,anim[1]));
				}
			});

			elements.push(elem);

			// Each chain should start based on the original position of the element.
			var offset = elem.offset();
				
			// Go through the listed animations in order so that each subsequent one
			// sees the changes from the previous one. Don't bind each animation to the
			// event separately because we want synchronicity
			elem.bind('scroller.animate', function(event, args) {
				var new_offset = $.extend({}, offset);

				// The interface to animating the element is to literally change the args
				// object as we go down the chain, or to return false to stop the chain.
				// Hence, we must close over a clone of it.
				var chain_args = $.extend({}, args);
				chain_args.elem_offset = $.extend({}, offset);

				$.each(animations, function(i, anim) {

					// we want elem in $(this)
					var shift = anim.call(elem, event, chain_args);
					
					// Stop doing anything if we return false
					if (shift === false) {
						return false;
					}
				});

				$(this).offset(chain_args.elem_offset);
			});
		};
		
		function scroller(e) {
			var args = $.extend({}, invariant_values);
			var scrollTop = self.scrollTop(),
					t = scrollTop / args.scroll_range;

			args.scroll_top = scrollTop;
			args.t = t;

			// normalise the distance down the document we are scrolled.
			$.each(elements, function() {
				var elem_offset = this.offset();
				var elem_viewport_range = args.view_height + this.outerHeight();
				
				// position of element in scroll range. Elements that can't touch the top of the
				// viewport will have a value >1
				args.elem_t = elem_offset.top / invariant_values.scroll_range;

				// proportion of the scroll range that is the height of the element.
				args.elem_height_t = this.outerHeight() / args.scroll_range;

				// Position of element in the window. Elements appear in the window at 0 and disappear completely
				// at 1; hence they touch the top of the window at slightly more than 1, a margin proportionate to their height.
				args.elem_window_t = ((args.scroll_top + args.view_height - elem_offset.top) / elem_viewport_range);

				this.trigger('scroller.animate', args);
			});

		}

		function compute_invariants() {
			// Normalise all values to be some proportion of scrollRange
			var contentHeight = (self[0] == window) ? $(document).height() : self[0].scrollHeight,
				viewportHeight = (self[0] == window) ? self.height() : self.innerHeight(),
				scrollRange = contentHeight - viewportHeight;
			
			invariant_values = {
				viewport_height_t: viewportHeight / scrollRange,
				doc_height: contentHeight,
				view_height: viewportHeight,
				scroll_range: scrollRange,
				pixel: 1/scrollRange
			};
		}

		compute_invariants();

		this.resize(compute_invariants);
		this.scroll(scroller);
		this.data('scroller', api);

		return this;
	};
})();
