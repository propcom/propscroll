(function() {
	var Scroller = {};

	Scroller.parallax = function(layer) {
		// use layer as coefficient of t value
		var coef = Math.pow(2, layer) - 1;
		return function(event, args) {
			var $this = $(this);
			
			var ret = [0, 0 - (args.t * coef) / args.pixel];
			console.log(ret);
			return ret;
		};
	};

	// Slide by (dx, dy) pixels over dt pixels of scrolling.
	Scroller.slide = function(dx, dy, dt) {
		return function(event, args) {
			// convert dt out of pixel values
			var t = dt * args.pixel;
			var proportion = args.t/t;

			if (proportion > 1) return [dx, dy];

			return [dx * proportion, dy * proportion];
		}
	};

	// TODO: use position: fixed
	Scroller.holdstill = function(from, to) {
		return function(event, args){
			return [0,args.t/args.pixel];	
		};
	};

	Scroller.wait = function(until) {
		return function(event, args) {
			var til = until;
			if (til == 'onscreen') {
				til = $(this).offset().top - args.view_height;
			}

			til *= args.pixel;
			// Cheekily pretend to the next function that we haven't really scrolled
			args.t -= til;
			console.log(args.t);
			if (args.t < 0) return false;
			return [0,0];
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

			// Apply the [x,y] to the original position of the element at all times.
			var offset = elem.offset();
				
			// Go through the listed animations in order so that each subsequent one
			// sees the changes from the previous one. Don't bind each animation to the
			// event separately because we want synchronicity
			elem.bind('scroller.animate', function(event, args) {
				var new_offset = $.extend({}, offset);
				// clone the args for each animation chain, so any animation can alter it
				// without buggering it up for everyone else.
				var chain_args = $.extend({}, args);
				$.each(animations, function(i, anim) {

					// we want elem in $(this)
					var shift = anim.call(elem, event, chain_args);
					
					// Stop doing anything if we return false
					if (shift === false) {
						return false;
					}

					new_offset.left += shift[0];
					new_offset.top += shift[1];
				});

				$(this).offset(new_offset);
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
