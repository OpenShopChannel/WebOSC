/**
 * Completes an operation with helpful debugging output regarding state.
 *
 * @param {ECProgress} progress
 * @param {function} callback
 */
function completeOp(progress, callback) {
	trace("hi! " + logProgress(progress));

	const watchdog = new ECWatchdog(3000);
	watchdog.complete(callback);
}

/**
 * ECWatchdog is designed to monitor the gradual progression of an asynchronous EC operation.
 * It operates by comparing state across poll intervals.
 * If it has not made progress for an amount of time, it errors.
 *
 * @param timeout {number} The amount of milliseconds to wait until calling it quits
 * @constructor
 */
function ECWatchdog(timeout) {
	/**
	 * The amount of milliseconds this function should poll throughout until timeout.
	 */
	this.pollInterval = 1000;

	// However, we can't listen beneath the minimal poll interval.
	if (this.pollInterval > timeout) {
		error(ErrorCodes.GENERIC_ERROR, "You can't watch beneath the minimal poll interval, every 1 second.");
	}

	/**
	 * Amount of time to sleep in total.
	 */
	this.timeout = timeout;

	/**
	 * Current amount of time spent without progress.
	 */
	var elapsedLackOfProgress = 0;

	/**
	 * Cached state of operation.
	 */
	var cachedPhase = 0;

	/**
	 * Cached download amount.
	 */
	var cachedDownloadSize = 0;

	/**
	 * Run a Watchdog lifecycle.
	 *
	 * @param callback {function} What to call on success
	 */
	this.complete = function(callback) {
		// Get the foremost operation's progress.
		const progress = ec.getProgress();

		trace("Milliseconds since last accident: " + elapsedLackOfProgress + "\n" +
			"Current status: " + progress.status);

		// See if this already has a state in some way that isn't STILL_WORKING.
		const status = progress.status;
		if (status < 0 && status !== ECReturnCodes.ONGOING) {
			// Uh oh...
			trace("Operation failed - " + logProgress(progress));
			error(ErrorCodes.EC_ERROR, "requested operation to complete came in with status " + status);
			return;
		} else if (status === 0) {
			// We're free!
			trace("Operation completed - running callback.");
			callback();
			return;
		}
		// status should never be above zero.
		// Here's hoping no bits flip...

		var didProgress;
		// Progress means one of two states:
		if (progress.totalSize !== 0) {
			// ...one, that we are a download operation with a total size,
			// and our attributed downloaded size is different from before.
			didProgress = (progress.downloadedSize !== cachedDownloadSize);
			trace("Did progress: " + didProgress + ", Downloaded size: " + progress.downloadedSize + ", Cached downloaded size: " + cachedDownloadSize);
		} else {
			// ...two, that we are waiting for the proper response of an action
			// and our phase has changed.
			didProgress = (progress.phase !== cachedPhase);
			trace("Did progress: " + didProgress + ", New Phase: " + progress.phase + ", Old Phase: " + cachedPhase);
		}

		// If we've progressed, we need to update our cache and reset our failure timer.
		if (didProgress) {
			cachedDownloadSize = progress.downloadedSize;
			cachedPhase = progress.phase;
			elapsedLackOfProgress = 0;
			trace("Resetting lack of progress timer.");
		} else {
			// If we didn't, we need to add this poll to our failure timer.
			elapsedLackOfProgress += this.pollInterval;
			trace("Adding " + this.pollInterval + "ms to lack of progress timer.");
		}

		// Check if we've gone over our allocated time.
		if (elapsedLackOfProgress >= this.timeout) {
			error(ErrorCodes.EC_TIMEOUT, "running operation timed out after " + elapsedLackOfProgress + "ms");
			return;
		}

		// Continue the cycle as we're not completed.
		var currentObject = this;
		setTimeout(function() {
			currentObject.complete(callback);
		}, this.pollInterval);
	};
}

function logProgress(progress) {
	return "progress: status: " + progress.status + ", operation: " + progress.operation +
		", description: " + progress.description + ", phase: " + progress.phase +
		", isCancelRequested: " + progress.isCancelRequested + ", downloadedSize: " + progress.downloadedSize +
		", totalSize: " + progress.totalSize + ", errCode: " + progress.errCode + ", errInfo: " + progress.errInfo;
}