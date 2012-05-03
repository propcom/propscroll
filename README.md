# Propscroll

## jQuery scroll plugin

### 1. Overview

You set up scroller on a scrollable element (usually the window), and add
elements to the scroller with effects and animations. As the element is
scrolled, the animations play out.

### 2. Quick start

#### a. Set up

To set up a scroller, first pick the element that is going to be scrolling.
Currently this has only been tested on the window.

	$(window).scroller();

After this is done, the scroller API is accessible from the normal jQuery data
on the window:

	var api = $(window).data('scroller');

You can shorten those steps into one:

	var api = $(window).scroller().data('scroller');

With `api` you can then add elements to be animated when the element (the
window) scrolls.

#### b. Add elements

Currently the API exposes only one method: add. This basically does the
entirety of the work for the plugin, since it is where you define what
animations to put on each element.

To add an element (presuming you assigned the api to the variable `api`) you
simply call `add`:

	api.add($(selector), [ list of animations ]);

The first argument is any selector. You can select multiple elements with this
selector, but please note that any animated elements will have their *absolute*
positions set, so there is a chance with some animations that the elements will
end up on top of each other.

The second argument is an array of animations, which will be described next.

#### c. Add animations

There are two ways of defining an animation. The first uses the builtin
animations and the second allows you to define your own.

Since defining your own animation requires an understanding of how the plugin
works we'll talk about that in sections 4 onwards, and talk about using the
builtins right here.

Section 3 lists the names of the builtins that you can use here.

To select a builtin animation, create an array:

	[]

and add as the first element, the name of the builtin:

	['slide']

Then create another array:

	[]

and put in that any arguments that the builtin says it accepts:

	[600, 0, 800]

Then you put that array in the first array:

	['slide', [600, 0, 800]]

and then you add this array to the *other* array that you put in `list of
animations` when you call `add`:

	api.add($(selector), [ 
		['slide', [600, 0, 800]] 
	]);

Using this method you can add as many animations as you want into the `add`
method, but **be aware** that the order in which they are listed often matters.

	api.add($('.orbit'), [ 
		['between', [400, 600]], 
		['orbit', [400, $('.orbit-centre'), 180]], 
		['slide', [600, 0, 800]] 
	]);

In this example, 'between' comes first because it will affect 'orbit' and
'slide' by preventing them from happening outside of the range 400-600. If it
came after either of them, it would not affect the ones before it. 

Similarly, 'orbit' sets the position of the element absolutely, but 'slide'
adds a position, so if 'slide' came before 'orbit', 'orbit' would undo any
changes 'slide' made.


	api.add($('.slidey-turny'), [ 
		[ 'rotate', [600, null, 90] ], 
		[ 'between', [50, 200] ], 
		[ 'slide', [-200, 0, 200]] 
	]);

In this example, the rotate animation will play out all the time, but the slide
animation will be constrained to the 50-200 range. Astute readers will note
that the slide animation is constrained to 150 pixels of scroll, but specifies
200 pixels as the range of its animation. That's OK - the slide will simply
stop 3/4 of the way along.

### 3. Animations and Controls

An animation is a function that moves the element, and a control is a function
that affects the rest of the animation chain. Some animations may completely
eradicate the effects of previous animations in the chain, so be sure you're
aware of which these are.

The animation chain is simply a collection of functions that run one after the
other when the page scroll position changes. Controls may prevent the chain
from running or may manipulate the values to alter the behaviour of later
functions in the chain.

Generally, an animation will affect the position of the element, and a control
will affect the parameters that animations use.

#### a. `between`

`between` takes 1 or 2 arguments

* from - pixel value of the scroll position of the window at which to begin the
  chain 
* to - optional pixel value of the scroll position of the window at which to end
  the chain.

This is a control and will prevent further animations from taking place if the
**top of the window** is outside the specified range. Outside of the range,
other animations remain static.

#### b. `shift`

`shift` takes one argument

* by - pixel value to shift scroll position by.

This is a control that shifts the scroll position for further animations. It does
this by faking the position of the window. This means that animations won't start
for `by` pixels more than they would have originally.

The differences between this and `between` are

* a) there is no upper limit for the shift, and
* b) the rest of the chain will still carry on if the scroll position is less than
     `by`. This means that animations further in the chain can receive a negative
	 scroll value, which can be interesting.

#### c. `slide`

`slide` takes 3 arguments

* x - The x distance (CSS left) by which to slide the element, in pixels 
* y - The y distance (CSS top) by which to slide the element, in pixels 
* scroll - The number of pixels of scroll that the element will take to 
  complete the slide

This animation slides the element by a constant distance as the page scrolls.
It will slide `x` pixels across and `y` pixels down, and it will complete the
slide when the page has travelled `scroll` pixels.

#### d. `orbit`

`orbit` takes 2 or 3 arguments

* speed - This is the number of pixels of scroll it takes to complete one
  revolution, so a larger number is a slower orbit. Use a negative value to go 
  backwards.
* centre - This is either another jQuery object, or an array of [x, y] as pixel
  values.  start - This optional value is in degrees and describes the position
  of the start of the orbit. 0° is directly to the right of the centre element,
  and 90° is directly below it, unless your speed value is negative.

This animation causes the element to orbit another element by 1 revolution
every `speed` pixels of scroll. The element's orientation is maintained, which
makes it different from simply rotating the element using CSS rotation. A
positive value for `speed` will be a clockwise rotation.

The radius of the orbit is defined when the page loads, so moving the centre
object will not have an effect on the orbit. If you want to slide an orbital
system, add the slide animation after the orbit animation on all relevant 
elements (including the centre if you wish).

Orbit will reset the x,y position of the element regardless of changes any
previous animations may have made, because it is orbiting a point that is fixed
at page load time, so it should always be the first actual animation in a
chain.

#### e. `parallax`

`parallax` takes 1 argument:

* layer - the perceived layer on which the element lies

The document is divided into layers, which tend to correspond to the z-index of
the elements. The layer on which normal content resides is layer 0. Hence,
negative layer numbers will be behind the document layer, and positive layer
numbers will be above it.

Higher layer numbers scroll up the screen faster than lower layer numbers;
hence, higher layers appear to be above lower layers by moving faster than
them. Negative layers scroll slower than the document itself.

#### f. `rotate`

`rotate` takes 1 argument and 2 further optional ones:

* speed - Number of pixels of scroll to complete 1 rotation. Positive numbers
  rotate clockwise; negative numbers rotate anticlockwise. Note this means a
  larger number is a slower movement, so "speed" is not really the best word, 
  I guess.
* centre - Optional array as [x, y] specifying the CSS transformation offset.
  Pass in `null` if you want to set start_at but not this.
* start_at - A value in degrees to be the starting orientation of the element.
  If you have set a starting orientation in your CSS you must set this to match.
  
#### g. `css`

`css` takes 2 arguments:

* speed - Number of pixels of scroll over which to play out the animation.
* attrs - A map of CSS properties to their target values.

This animation changes numeric CSS values over time. It is currently experimental,
which means it doesn't work very well. The starting values of the attributes are
taken from the element itself - which is why you shouldn't use this for rotations.

Any requested property not already on the element is currently ignored. Defaulting
these to zero is a todo.

#### h. `class`

`class` takes 1 argument:

* classname - a jQuery-style string of classnames to apply/remove

This animation adds a class when the scroll value goes above zero, and removes it
again when the scroll value goes below (or becomes equal to) zero. Obviously this is
not a whole lot of use *per se* because it would add the class as soon as any
scrolling happened, but if you use `shift` before it then it will add the class at
that scroll position:

	api.add($('.show-at-50px'), [
		['shift', [50]],
		['class', ['show']]
	]);

If you add CSS transitions to the `.show` class and the class the element already
has, you can do things like make the element fade in and out based on time instead
of scroll.

### 4. Concepts

#### a. A function of t

The primary concept of the scroller is that every element's animation simply
specifies an absolute location for the element as a function of the scroll
position.

What does this mean? Well for the less mathematically-inclined, it simply means
that for every single scroll position the page can be in, there is one specific
x and y value the element will be in.

	(x, y) = func(scroll_position)

You put the scroll position in, and you get an x and y out. Simples. In the
API, the scroll position is called `t`, since traditionally these graphs would
report a change over time, so the time value got the label `t`.

The same concept applies to any other animation you might apply, like CSS
values and rotations. When you move the scroll bar to a position t, all elements
will be able to work out, from that, what their positions and CSS values and
rotations should be.

#### b. Normalisation

The scroll position is reported as both as a pixel position and a normalised
position. The normalised position can be thought of as a percentage, except
instead of being between 0 and 100 it is between 0 and 1.

`t` values are reported as these normalised values. There are several:

* t - normalised scroll distance down the page
* viewport_height_t - height of the viewport relative to the max scroll range
* elem_t - position of the element in the scroll range
* elem_height_t - height of the element in question relative to the max scroll
  range
* elem_window_t - normalised distance up the window the element is.

Other values are reported as actual pixels:

* doc_height - pixel height of the content
* view_height - pixel height of the viewport
* scroll_range - actual movement range of the viewport (doc_height - view_height)

More on those later.

Having t values is akin to having % or pt sizes for your CSS, and having pixel 
values is obviously like having pixel values in the CSS. The former allows you to
make animations that are proportional to the size of the page and the latter
allows you to make fixed-size animations.

#### c. Animation chain

Multiple animations can be applied to a single element. They will be run in a
chain, each one applied to changes the previous one made.

Some animations will overwrite values completely.

Some animations will stop the chain.

The order in which the animations are listed matters. Recall that each scroll
position is associated with exactly one state of the animation - thus, when the
animation runs, it uses this scroll position to set the position, rotation or
whatever directly on the element.

The order matters for two reasons. First, some animations (like `orbit`) 
completely ignore any existing positioning the element may have, but animations
that run afterwards will apply to the new position of it.

Second, controls affect the animation chain from their position onwards, so
their position in the chain determines which animations are affected.

#### d. Writing an animation.

To write an animation, simply create a function like this:

	function (event, args) {}

This function is the animation itself. You can manipulate the element, which is
in `this` (in the jQuery way - use `$(this)` to get the jQuery object), directly.
You can change args as much as you like, and changes will be passed on down the
chain. You can return `false`, and the animation chain will stop.

##### args

`args` contains:

* t - normalised scroll distance down the page
* viewport_height_t - height of the viewport relative to the max scroll range
* elem_t - position of the element in the scroll range
* elem_height_t - height of the element in question relative to the max scroll
  range
* elem_window_t - normalised distance up the window the element is.
* doc_height - pixel height of the content
* view_height - pixel height of the viewport
* scroll_range - actual movement range of the viewport (doc_height - view_height)
* elem_offset - an object containing `left` and `top` that will be used to set
  the position of the element when the chain is finished.

If you alter any of these, only the current chain will see the changes. Other
chains (even those that incorporate the same element) will have the args reset.

Most animations can get away with simply altering elem_offset. Controls usually
alter t. However, you can alter anything to give future animations the illusion
that things are other than they be.

##### Naming it

To name, and hence use, your new animation, return it from a new function that 
you set on Scroller:

	Scroller.myanim = function() {
		return function(event, args) {};
	}

Now you can use 'myanim' just like you'd use any of the existing animations when
adding an animation to an element

	api.add($(selector), [
		['myanim'],
		['slide', [600, 0, 400]]
	]);

You will notice that the slide animation takes three parameters in that extra
array there. Yours can also take parameters. They are given to the *outer*
function that you defined.

	Scroller.myanim = function(arg1, arg2) {
		return function(event, args) {};
	}

	api.add($(selector), [
		['myanim', [600, 600]],
		['slide', [600, 0, 400]]
	]);

Then you can use normal JS scoping rules to use arg1 and arg2 either in the 
inner function or as setup in between them.
