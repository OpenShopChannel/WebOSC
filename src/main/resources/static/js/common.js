/** @type {boolean} */
const isWiiShop = navigator.userAgent.indexOf("Wii Shop") !== -1;

/**
 * Channel interfaces
 */
var shop = new wiiShop();
var ec = new ECommerceInterface();
var info = ec.getDeviceInfo();
var NWC24 = new wiiNwc24();
var sound = new wiiSound();
var keyboard = new wiiKeyboard();
var sdCard = new wiiSDCard();

/**
 * Enum describing the available wallpapers that show in 16:9.
 * @readonly
 * @enum {number}
 */
const WallpaperType = {
	DOTTED_HORIZONTAL_LINES: 0,
	BLACK: 1,
	WHITE: 2,
	BLUE_VERTICAL_LINES: 3
};

/**
 * Enum describing sounds available to play.
 * @readonly
 * @enum {number}
 */
const SoundType = {
	PUSH: 1,
	HOVER: 2,
	SELECT: 3,
	CANCEL: 4,
	CHOICE_CHANGE: 5,
	ERROR: 6,
	ADD_POINT: 7,
	DOWNLOAD_COMPLETE: 8,
	SMALL_MARIO_JUMP: 9,
	LARGE_MARIO_JUMP: 10,
	FIRE_BALL: 11,
	COIN: 12,
	HIT_BLOCK: 13,
	COPYING: 14,
	LOADING: 15
};

/**
 * Enum describing types of available keyboards.
 * @readonly
 * @enum {number}
 */
const KeyboardType = {
	// The "default" keyboard.
	DEFAULT: 0,
	// Also the "default" keyboard.
	// This may differ across locales, but it does not appear to.
	DEFAULT_TWO: 1,
	// Provides a number entry keyboard.
	NUMBER_PAD: 2,
	// The "default" keyboard, but without word completion or a return key.
	DEFAULT_NO_COMPLETION: 3,
	// Text entered is present within a large font.
	LARGE_FONT: 4,
	// The "default" keyboard, but without word completion, return key,
	// or the switcher to a number pad.
	DEFAULT_NO_COMPLETION_PAD: 5,
	// The large font keyboard, but without word completion, return key,
	// or the switcher to a number pad.
	LARGE_FONT_NO_COMPLETION_PAD: 6,
	// The number pad keyboard, but with a decimal option.
	NUMBER_PAD_DECIMAL: 7,
	// Also the number pad keyboard with decimal option.
	// This may differ across locales, but it does not appear to.
	NUMBER_PAD_DECIMAL_TWO: 8,
	// The keyboard used for friend code entry, dividing every 4 numbers into groups.
	FRIEND_CODE_ENTRY: 9,
	// The "default" keyboard, but without a return key.
	DEFAULT_NO_RETURN: 10
};

/**
 * Hastily displays an error message within logging.
 * Please rewrite this function later.
 *
 * @param {number} code The error code.
 * @param {string} message The message to display.
 */
function error(code, message) {
	// TODO: should this become an enum of errors for easier localization?
	trace("An error occurred: " + message + "(" + code + ")");
	// If debug is enabled, go to console, else show error page
	if (isDevelopment) {
		window.location.href = "/debug";
	} else {
		window.location.href = "/error?code=" + code;
	}
}

/**
 * Gets the browser to redraw the page.
 * A required hack due to a Wii Shop Channel bug with SVGs.
 * 
 * @param {HTMLElement} el Element to perform redraw on.
 * @param {number} ms Time in milliseconds to delay redraw by.
 */
function redrawElement(el, ms) {
	setTimeout(function() {
		var disp = el.style.display;
		el.style.display = "none";
		el.style.display = disp;
	}, ms);
}

/**
 * Apply miscellaneous page fixes for both the Wii Shop and other browsers (for testing).
 */
function pageFixes() {
	if (isWiiShop) {
		// Work around WSC bug where SVGs aren't shown after they're loaded unless page is redrawn
		redrawElement(document.body, $(".btn").length * 100);
	}
}

/**
 * Element to scroll when buttons are pressed.
 * @type {HTMLElement}
 */
var scrollTarget;

/**
 * Amount of pixels to scroll by.
 * @type {number}
 */
var scrollStep = 30;

/**
 * Setup and listen to specific events on the page, as to scroll when the D-pad buttons are pressed,
 * and to set the scroll target to the most recently hovered element that's vertically scrollable.
 */
function setupScrolling() {
	// This isn't great as this doesn't work if you hover over a child of a scrollable element.
	$(document).mouseover(function(e) {
		var el = e.target;
		if (el.scrollHeight > el.clientWidth)
			scrollTarget = el;
	});

	$(document).keypress(function(e) {
		if (!scrollTarget)
			return;

		/* The Wii Shop seems to have weird behaviour regarding scrolling with controller buttons.
		 * Left and right always work fine and fire once when they're pressed as usual, but with up
		 * and down they seem to be on a timer and refire. This is a weird move by Nintendo, as
		 * utilising the keydown and keyup events would be much more appropriate than modifying the
		 * browser behaviour for keypress.
		 * 
		 * Another thing we have to do is preventDefault the event for keyCode 37 (left arrow), as
		 * for some reason that's sent in tandem with the events for the up and down buttons.
		 * Not preventDefaulting it will result in the events for up and down only firing once and
		 * never again unless you focus the element again by pressing A on it, as it seems to
		 * unfocus it. This is odd because this issue is not present on Nintendo's pages.
		 */
		switch (e.keyCode) {
			case 175:
				scrollTarget.scrollTop -= scrollStep; break;
			case 176:
				scrollTarget.scrollTop += scrollStep; break;
			case 178:
				scrollTarget.scrollLeft -= scrollStep; break;
			case 177:
				scrollTarget.scrollLeft += scrollStep; break;
			case 37:
				e.preventDefault(); break;
		}
	});
}

/**
 * Returns an object representing the query string parameters.
 * @returns {Object} Query string split by keys and values. Value will be null if none specified.
 */
function getSplitQueryString() {
	var split = location.search.substring(1).split('&');
	var params = {};

	for (var i = 0; i < split.length; i++) {
		var equalsIndex = split[i].indexOf('=');

		if (equalsIndex == -1) {
			params[split[i]] = null;
			continue;
		} else if (equalsIndex == split[i].length - 1) {
			params[split[i].substring(0, split[i].length - 1)] = null;
			continue;
		}

		params[split[i].substring(0, equalsIndex)] = decodeURIComponent(split[i].substring(equalsIndex + 1));
	}

	return params;
}

/**
 * Performs common page load tasks.
 */
function onLoadCommon() {
	if (isWiiShop)
		initializeEC();
	
	setupButtons();

	setupScrolling();
	scrollTarget = $("#main-content")[0]; // Reasonable assumption to make.

	pageFixes();
}

/**
 * Utility function to retrieve a session value from EC and then remove it.
 * @param {string} name
 * @returns {string}
 */
function getAndClearSessionValue(name) {
	const value = ec.getSessionValue(name);
	ec.setSessionValue(name, "");
	return value;
}

/**
 * Enum describing error codes.
 * @readonly
 * @enum {number}
 */
const ErrorCodes = {
	GENERIC_ERROR: 100,
	EC_ERROR: 200,
	EC_TIMEOUT: 201,
	EC_FAILED_REGISTRATION: 202,
	API_ERROR: 300,
	API_DOWNLOAD_NOTIFICATION_FAILED: 301
}