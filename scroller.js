(function() {
	if (!('isArray' in Array)) {
	    Array.isArray = function(o) {
	        return Object.prototype.toString.call(o)==='[object Array]';
	    };
	}

	var Scroller = {};

	Scroller.parallax = function(layer) {
		// use layer as coefficient of t value
		var coef = Math.pow(2, layer) - 1;
		return function(event, args) {
			var $this = $(this);
			
			args.elem_offset.left += 0;
			args.elem_offset.top += 0 - (args.t * coef) / args.pixel;
		};
	};

	// Slide by (dx, dy) pixels over dt pixels of scrolling.
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

	Scroller.wait = function(until) {
		return function(event, args) {
			var til = until;
			if (til == 'onscreen') {
				til = $(this).offset().top - args.view_height;
			}

			// Cheekily pretend to the next function that the scroll really started
			// at our wait-until location! Hax.
			args.scroll_top -= til;

			til *= args.pixel;
			args.t -= til;

			if (args.t < 0) return false;
			return;
		};
	};

	/*
	 * orbit - revolve around position defined by <centre>, at speed defined by <speed>
	 *         This animation is *absolute* and will hence undo any positioning done by
	 *         prior animations. To adjust the orbit, apply transformations afterwards.
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
