(function(module) {
    mifosX.services = _.extend(module, {
        JSZipService: function() {
            return window.JSZip;
        }
    });
    mifosX.ng.services.service('JSZipService', mifosX.services.JSZipService);
}(mifosX.services || {}));

