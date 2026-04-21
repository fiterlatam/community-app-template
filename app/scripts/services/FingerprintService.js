(function(module) {
    mifosX.services = _.extend(module, {
        FingerprintService: function() {
            var fingerprintPromise = null;

            // Returns a promise that resolves to the fingerprint hash
            this.getFingerprint = function() {
                if (fingerprintPromise) {
                    return fingerprintPromise;
                }
                fingerprintPromise = new Promise(function(resolve, reject) {
                    if (window.FingerprintJS) {
                        FingerprintJS.load().then(function(fp) {
                            fp.get().then(function(result) {
                                resolve(result.visitorId);
                            }, reject);
                        }, reject);
                    } else {
                        reject('FingerprintJS not loaded');
                    }
                });
                return fingerprintPromise;
            };

            this.getFingerprintSimulate = function() {
                if (fingerprintPromise) {
                    return fingerprintPromise;
                }
                fingerprintPromise = new Promise(function(resolve, reject) {
                    resolve("bdfcb329bfec8a06892db0e01ae8d8e0");
                });
                return fingerprintPromise;
            };
        }
    });
    mifosX.ng.services.service('FingerprintService', mifosX.services.FingerprintService);
}(mifosX.services || {}));

