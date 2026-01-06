(function(module) {
    mifosX.services = _.extend(module, {
        JSZipService: function() {
            this.getJSZip = function(){
                return new window.JSZip;
            }
        }
    });
    mifosX.ng.services.service('JSZipService', mifosX.services.JSZipService);
}(mifosX.services || {}));

