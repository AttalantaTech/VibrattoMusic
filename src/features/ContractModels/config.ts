/**
 * false while production doesn't have the base contract: the models live in
 * the browser (demo) and proposals go with Vibratto's standard contract, so
 * no id that exists only in the browser reaches the server. true when the
 * screens are switched to Cunha's API
 */
export const CONTRACT_MODELS_LIVE = false;
