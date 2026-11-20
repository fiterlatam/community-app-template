(function (module) {
    mifosX.controllers = _.extend(module, {
        LoanDocumentController: function (scope, resourceFactory, location, http, routeParams, API_VERSION, Upload, $rootScope) {
            scope.loanId = routeParams.loanId;
            scope.docType = routeParams.docType;
            resourceFactory.loanResource.get({resourceType: 'template', templateType: 'groupAdditionals'}, function (data) {
                scope.documentTypeOptions = data.documentTypeOptions || [];
            });
            scope.onFileSelect = function (files) {
                let file = files[0];
                scope.formData.file = file;

                if (file && file.type && file.type.startsWith('image/')) {
                    // Extract EXIF metadata from the image
                    if (typeof EXIF !== 'undefined') {
                        EXIF.getData(file, function() {
                            var metaData = {};
                            var allMetaData = EXIF.getAllTags(this);

                            // Copy all EXIF tags to metaData object
                            if (allMetaData){
                                metaData['DateTime'] = allMetaData.DateTime;
                                allMetaData.GPSLatitudeRef?metaData['GPSLatitudeRef']=allMetaData.GPSLatitudeRef:"N/A";
                                allMetaData.GPSLatitude?metaData['GPSLatitude']=allMetaData.GPSLatitude:"N/A";
                                allMetaData.GPSLongitudeRef?metaData['GPSLongitudeRef']=allMetaData.GPSLongitudeRef:"N/A";
                                allMetaData.GPSLongitude?metaData['GPSLongitude']=allMetaData.GPSLongitude:"N/A";
                            }

                            // Add metadata to document data
                            scope.formData.metaData = metaData;
                            console.log("EXIF metadata extracted:", metaData);

                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                    } else {
                        console.warn("EXIF library not loaded");
                    }
                }
            };

            scope.submit = function () {
                if (scope.docType=='PAE'){
                    return scope.submitPaeDocumentation()
                }
                console.log(scope.formData);
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/loans/' + scope.loanId + '/documents',
                    data: { name : scope.formData.name, documentType: scope.formData.documentType, description : scope.formData.description, file: scope.formData.file},
                }).then(function (data) {
                        // to fix IE not refreshing the model
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                        location.path('/viewloanaccount/' + scope.loanId);
                    });
            };

            scope.submitPaeDocumentation = function () {

                let exifdata = scope.formData.file.exifdata;
                let metaData=undefined;
                if (exifdata){
                    metaData = {};
                    metaData['DateTime'] = exifdata.DateTime;
                    exifdata.GPSLatitudeRef?metaData['GPSLatitudeRef']=exifdata.GPSLatitudeRef:"N/A";
                    exifdata.GPSLatitude?metaData['GPSLatitude']=exifdata.GPSLatitude:"N/A";
                    exifdata.GPSLongitudeRef?metaData['GPSLongitudeRef']=exifdata.GPSLongitudeRef:"N/A";
                    exifdata.GPSLongitude?metaData['GPSLongitude']=exifdata.GPSLongitude:"N/A";
                }
                console.log(scope.formData);
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/paedocumentation/' + scope.loanId + '/paedocument',
                    data: {
                        name : scope.formData.name,
                        documentType: scope.formData.documentType,
                        description : scope.formData.description,
                        categoryId: scope.formData.documentType,
                        guaranteeNo: 1,
                        file: scope.formData.file,
                        metaData: JSON.stringify(metaData)
                    },
                }).then(function (data) {
                        // to fix IE not refreshing the model
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                        location.path('/viewloanaccount/' + scope.loanId);
                    });
            };
        }
    });
    mifosX.ng.application.controller('LoanDocumentController', ['$scope', 'ResourceFactory', '$location', '$http', '$routeParams', 'API_VERSION', 'Upload', '$rootScope', mifosX.controllers.LoanDocumentController]).run(function ($log) {
        $log.info("LoanDocumentController initialized");
    });
}(mifosX.controllers || {}));
