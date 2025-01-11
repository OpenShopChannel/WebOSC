/**
 * Enum describing possible error codes via ECProgress.
 * @readonly
 * @enum {number}
 */
const ECReturnCodes = {
	COMPLETE: 0,
	NO_OPERATION: -4007,
	ONGOING: -4009,
	TITLE_NOT_INSTALLED: -4050
};

/**
 * Enum describing possible registration states for this console.
 * @readonly
 * @enum {string}
 */
const ECRegistrationStates = {
	REGISTERED: 'R',
	UNREGISTERED: 'U'
};

/**
 * Returns a usable subdomain for the given service type.
 * This is useful for getting domains such as ias, ecs and cas.
 *
 * @param serviceType Name of service to return
 * @return {string} Domain name usable for other usage
 */
function getSubdomain(serviceType) {
	// Get the base domain.
	const currentDomain = window.location.hostname;

	// Strip the first subdomain.
	// We could expect this to be "oss-auth", but it can be anything.
	const baseDomain = currentDomain.substring(currentDomain.indexOf('.'));

	return "https://" + serviceType + baseDomain;
}

/**
 * Returns a usable URL for the ECommerce Services SOAP endpoint.
 *
 * @return {string}
 */
function getECS() {
	return getSubdomain("ecs") + "/ecs/services/ECommerceSOAP";
}

/**
 * Returns a usable URL for the Identity/Authentication SOAP endpoint.
 *
 * @returns {string}
 */
function getIAS() {
	return getSubdomain("ias") + "/ias/services/IdentityAuthenticationSOAP";
}

/**
 * Returns a usable URL for the Cataloguing SOAP endpoint.
 *
 * @returns {string}
 */
function getCAS() {
	return getSubdomain("cas") + "/cas/services/CatalogingSOAP";
}

/**
 * Returns a usable URL for the cached content domain, used
 * to download titles and their contents over http.
 *
 * @returns {string}
 */
function getCCS() {
	return getSubdomain("ccs");
}

/**
 * Returns a usable URL for the uncached content domain, used
 * to download titles and their contents over https.
 *
 * @returns {string}
 */
function getUCS() {
	return getSubdomain("ucs");
}

/**
 * Initially populates EC URLs.
 */
function initializeEC() {
	ec.setWebSvcUrls(getECS(), getIAS(), getCAS());
	ec.setContentUrls(getCCS(), getUCS());
}

/**
 * Registers the console to WiiSOAP, if necessary.
 *
 * @param {function} callback
 */
function doRegistrationDosido(callback) {
	trace("Registration status: " + info.registrationStatus);
	completeOp(ec.checkRegistration(), function() {
		// We need to call ec.getDeviceInfo() once more to ensure
		// we have the latest registration status.
		var status = ec.getDeviceInfo().registrationStatus;
		if (status === ECRegistrationStates.UNREGISTERED) {
			trace("Console is unregistered, registering now...");
			// We need to register this console.
			// This challenge - "NintyWhyPls" - is hardcoded
			// within WiiSOAP, as requesting a challenge from the server
			// and immediately sending it back is useless.
			completeOp(ec.register("NintyWhyPls"), function() {
				// We're done here!
				callback();
			});
		} else if (status === ECRegistrationStates.REGISTERED) {
			trace("Console is already registered, syncing registration...");
			// syncRegistration ensures that the client has the latest token from the server.
			// We could potentially allow token updating at a point, but do not currently.
			// TODO(spotlightishere): Determine the best approach
			completeOp(ec.syncRegistration("NintyWhyPls"), function() {
				// Finished at last.
				callback();
			});
		} else {
			trace("Unknown registration state: " + status + ". Cannot continue.");
			error(ErrorCodes.EC_FAILED_REGISTRATION, "Unknown EC registration state passed.");
		}
	});
}