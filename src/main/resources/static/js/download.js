/**
 * Whether an existing download operation is ongoing.
 */
var startingDownload = false;

/**
 * Current title ID for download
 */
var _titleId = "";

function preDownload(titleId, callback) {
	_titleId = titleId;
	// TODO: Allow installation to the SD Card.
	/*
	ec.setParameter("SPACE_CHECK_POLICY", "SPACE_CHECK_ENTIRE_FS");
	sdCard.isJournaling();
	const journalRet = sdCard.setJournalFlag(titleId);
	if (journalRet !== 0) {
		error("setJournalFlag failed with " + journalRet);
	}

	pollSDProgress(noop, installChannel);
	 */
	installChannel(callback);
}

/**
 * Installs a channel for the given title ID.
 */
function installChannel(callback) {
	if (!startingDownload) {
		startingDownload = true;

		// We do not actually support paying for titles.
		const price = new ECPrice("0.00", "POINTS");
		const method = new ECAccountPayment();

		// Apply empty limits.
		const limits = new ECTitleLimits();

		const result = ec.purchaseTitle(_titleId, '0', price, method, limits, true);
		completeOp(result, callback);
		// TODO ranks
		shop.setSCARank(1);
	}
}

function notifyDownload(title, token) {
	$.ajax({
		type: "POST",
		url: "/stat/download/" + title + "?token=" + token,
		success: function () {
			trace("Successfully notified download to API for title: " + title);
		},
		error: function (req) {
			trace("Failed to notify download to API for title: \"" + title + "\" with status: " + req.status);
			if(isDevelopment) {
				error(ErrorCodes.API_DOWNLOAD_NOTIFICATION_FAILED, "Failed to notify download to API for title: \"" +
					title + "\" (" + req.status + ")");
			}
		}
	});
}