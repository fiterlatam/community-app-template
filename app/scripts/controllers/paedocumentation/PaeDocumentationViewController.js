(function (module) {
    mifosX.controllers = _.extend(module, {
        PaeDocumentationViewController: function (scope, routeParams, resourceFactory, location) {
            scope.categoryName;
            scope.requiredDocuments = [];
            scope.newDocument = { name: '', acceptedType: '.pdf', required: false };

            resourceFactory.codeValueNameResource.getAllCodeValues({ codeName: 'PaeRequiredGuarantees' }).$promise
                .then(function (data) {
                    //if data is not empty, find the category name for the current id
                    if (data && data.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].id == routeParams.id) {
                                scope.categoryName = data[i].name;
                                break;
                            }
                        }
                    }
                }).catch(function (err) {
                console.error("Error Fetching Required Documents:", err);
            });
            // Fetch required documents for this code value
            scope.fetchAllRequiredDocuments = function (){
                resourceFactory.paeDocumentationResource.getAll({ categoryId: routeParams.id }).$promise
                    .then(function (data) {
                        console.log("Fetched Required Documents for codeValueId:", routeParams.id);
                        scope.requiredDocuments = data;
                    })
                    .catch(function (err) {
                        console.error("Error Fetching Required Documents for codeValueId:", routeParams.id, err);
                    });
            }

            scope.fetchAllRequiredDocuments();


            scope.addRequiredDocument = function() {
                if (scope.newDocument.name && scope.newDocument.acceptedType) {
                    var payload = {
                        categoryId: routeParams.id,
                        documentName: scope.newDocument.name,
                        description: scope.newDocument.name,
                        acceptedFormat: scope.newDocument.acceptedType,
                        required: scope.newDocument.required
                    };

                    resourceFactory.paeDocumentationResource.save(payload).$promise
                        .then(function (createdDoc) {
                            // Push the created document returned from the API
                            scope.fetchAllRequiredDocuments();
                            // Reset form model
                            scope.newDocument = { name: '', acceptedType: '.pdf', required: false };
                        })
                        .catch(function (err) {
                            console.error("Error saving required document:", err);
                        });
                }
            };

            // Add removeDocument implementation
            scope.removeDocument = function (doc, index) {
                if (!doc || !doc.id) {
                    console.error('Cannot delete required document: missing document id', doc);
                    return;
                }

                resourceFactory.paeDocumentationResource.delete({ documentId: doc.id }, '').$promise
                    .then(function () {
                        if (angular.isNumber(index) && index > -1 && index < scope.requiredDocuments.length) {
                            scope.requiredDocuments.splice(index, 1);
                        } else {
                            var i = scope.requiredDocuments.indexOf(doc);
                            if (i > -1) {
                                scope.requiredDocuments.splice(i, 1);
                            } else {
                                // Fallback to full refresh if we can't find the element locally
                                scope.fetchAllRequiredDocuments();
                            }
                        }
                    })
                    .catch(function (err) {
                        console.error('Error deleting required document with id', doc.id, err);
                    });
            };

        }
    });

    mifosX.ng.application.controller('PaeDocumentationViewController', ['$scope', '$routeParams', 'ResourceFactory', '$location', mifosX.controllers.PaeDocumentationViewController]).run(function ($log) {
        $log.info("PaeDocumentationViewController initialized");
    });
}(mifosX.controllers || {}));
