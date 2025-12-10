(function (module) {
    mifosX.controllers = _.extend(module, {
        PaeDocumentationViewController: function (scope, routeParams, resourceFactory, location) {
            scope.requiredDocuments = [];
            scope.newDocument = { name: '', acceptedType: 'PDF', required: false };
            scope.addRequiredDocument = function() {
                if (scope.newDocument.name && scope.newDocument.acceptedType) {
                    scope.requiredDocuments.push({
                        name: scope.newDocument.name,
                        acceptedType: scope.newDocument.acceptedType,
                        required: scope.newDocument.required
                    });
                    scope.newDocument = { name: '', acceptedType: 'PDF', required: false };
                }
            };
            var codeValueId = routeParams.id;
            // Fetch required documents for this code value
            resourceFactory.paeDocumentationResource.get({ codeValueId: codeValueId }).$promise
                .then(function (data) {
                    scope.requiredDocuments = data;
                })
                .catch(function (err) {
                    console.error("Error Fetching Required Documents for codeValueId:", codeValueId, err);
                });
        }
    });

    mifosX.ng.application.controller('PaeDocumentationViewController', ['$scope', '$routeParams', 'ResourceFactory', '$location', mifosX.controllers.PaeDocumentationViewController]).run(function ($log) {
        $log.info("PaeDocumentationViewController initialized");
    });
}(mifosX.controllers || {}));
