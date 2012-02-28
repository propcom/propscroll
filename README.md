# Propscroll

## jQuery scroll plugin

### 1. Overview

You set up scroller on a scrollable element (usually the window), and add elements to the scroller
with effects and animations. As the element is scrolled, the animations play out.

### 2. Quick start

#### a. Set up

To set up a scroller, first pick the element that is going to be scrolling. Currently this has
only been tested on the window.

	$(window).scroller();

After this is done, the scroller API is accessible from the normal jQuery data on the window:

	var api = $(window).data('scroller');

You can shorten those steps into one:

	var api = $(window).scroller().data('scroller');

With `api` you can then add elements to be animated when the element (the window) scrolls.

#### b. Add elements

Currently the API exposes only one method: add. This basically does the entirety of the work for
the plugin, since it is where you define what animations to put on each element.

To add an element (presuming you assigned the api to the variable `api`) you simply call `add`:

	api.add($(selector), [
		list of animations
	]);

The first argument is any selector. You can select multiple elements with this selector, but please
note that any animated elements will have their *absolute* positions set, so there is a chance with
some animations that the elements will end up on top of each other.

The second argument is an array of animations, which will be described next.

#### c. Add animations

There are two ways of defining an animation. The first uses the builtin animations and the second 
allows you to define your own.

Since defining your own animation requires an understanding of how the plugin works we'll talk
about that in sections 4 onwards, and talk about using the builtins right here.

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

and then you add this array to the *other* array that you put in `list of animations` when you call
`add`:

	api.add($(selector), [
		['slide', [600, 0, 800]]
	]);

Using this method you can add as many animations as you want into the `add` method, but **be 
aware** that the order in which they are listed often matters.

		api.add($('.orbit'), [
			['between', [400, 600]],
			['orbit', [400, $('.orbit-centre'), 180]],
			['slide', [600, 0, 800]]
		]);

In this example, 'between' comes first because it will affect 'orbit' and 'slide' by preventing
them from happening outside of the range 400-600. If it came after either of them, it would not
affect the ones before it. 

Similarly, 'orbit' sets the position of the element absolutely, but 'slide' adds a position, so
if 'slide' came before 'orbit', 'orbit' would undo any changes 'slide' made.

### 3. Animations and Controls

Animations and controls stack. An animation is a function that moves the element, and a control is
a function that affects the rest of the animation chain. Some animations may completely eradicate
the effects of previous animations in the chain, so be sure you're aware of which these are.

The animation chain is simply a collection of functions that run one after the other when the page
scroll position changes. Controls may prevent the chain from running or may manipulate the values
to alter the behaviour of later functions in the chain.

Generally, an animation will affect the position of the element, and a control will affect the
parameters that animations use.

#### a. `between`

`between` takes 1 or 2 arguments

* from - pixel value of the scroll position of the window at which to begin the chain
* to - optional pixel value of the scroll position of the window at which to end the chain.

This is a control animation and will prevent further animations from taking place if the **top of
the window** is outside the specified range. Outside of the range, other animations remain static.

#### b. `slide`

`slide` takes 3 arguments

* x - The x distance (CSS left) by which to slide the element, in pixels
* y - The y distance (CSS top) by which to slide the element, in pixels
* scroll - The number of pixels of scroll that the element will take to complete the slide

This animation slides the element by a constant distance as the page scrolls. It will slide `x`
pixels across and `y` pixels down, and it will complete the slide when the page has travelled
`scroll` pixels.

#### c. `orbit`

`orbit` takes 2 or 3 arguments

* speed - This is the number of pixels of scroll it takes to complete one revolution, so a larger
  number is a slower orbit. Use a negative value to go backwards.
* centre - This is either another jQuery object, or an array of [x, y] as pixel values.
* start - This optional value is in degrees and describes the position of the start of the orbit.
  0° is directly to the right of the centre element, and 90° is directly below it, unless your
  speed value is negative.

This animation causes the element to orbit another element by 1 revolution every `speed` pixels of 
scroll. The element's orientation is maintained, which makes it different from simply rotating the
element using CSS rotation. A positive value for `speed` will be a clockwise rotation.

The radius of the orbit is defined when the page loads, so moving the centre object will not have
an effect on the orbit. If you want to slide an orbital system, add the slide animation with the
same parameters to all of the components after their orbit animation.

Orbit will reset the x,y position of the element regardless of changes any previous animations may
have made, because it is orbiting a point that is fixed at page load time, so it should always be
the first actual animation in a chain.

#### d. `parallax`

`parallax` takes 1 argument:

* layer - the perceived layer on which the element lies

The document is divided into layers, which tend to correspond to the z-index of the elements. The
layer on which normal content resides is layer 0. Hence, negative layer numbers will be behind the
document layer, and positive layer numbers will be above it.

Higher layer numbers scroll up the screen faster than lower layer numbers; hence, higher layers
appear to be above lower layers by moving faster than them. Negative layers scroll slower than the
document itself.

### 4. Concepts

#### a. A function of t

The primary concept of the scroller is that every element's animation simply specifies an absolute
location for the element as a function of the scroll position.

What does this mean? Well for the less mathematically-inclined, it simply means that if you know
the scroll position, you can figure out the position the element should be in. You shouldn't need
any further data than that.

	(x, y) = func(scroll_position)

You put the scroll position in, and you get an x and y out. Simples. In the API, the scroll
position is called `t`, since traditionally these graphs would report a change over time, so the 
time value got the label `t`.

#### b. Normalisation

The scroll position is reported as both as a pixel position and a normalised position. The 
normalised position can be thought of as a percentage, except instead of being between 0 and 100
it is between 0 and 1.

`t` (above) is reported as a normalised position. The pixel position is reported as `scroll_top`.

Other values are also available as fractions of 1, for example a single pixel is `1/scroll_top`.

#### c. Animation chain

Multiple animations can be applied to a single element. They will be run in a chain, each one 
applied to changes the previous one made.

Some animations will overwrite values completely.

Some animations will stop the chain.

The order in which the animations are listed matters.
