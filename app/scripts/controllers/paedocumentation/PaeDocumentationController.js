(function (module) {
    mifosX.controllers = _.extend(module, {
        PaeDocumentationController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.requiredGuarantees = [];
            scope.formData = {};
            scope.groupsPerPage=20;
            scope.groupingType=routeParams.groupingType;
            scope.prequalificationType=routeParams.type;
            scope.isIndividual=routeParams.individual;

            resourceFactory.codeValueNameResource.getAllCodeValues({ codeName: 'PaeRequiredGuarantees' }).$promise
                .then(function (data) {
                    scope.requiredGuarantees = data;
                }).catch(function (err) {
                    console.error("Error Fetching Required Documents:", err);
                });
            scope.showRequiredGuaranteeDocumentation = function (item){
                location.path('/paedocumentationview/' + item.id + '/');
            }
        }
    });

    mifosX.ng.application.controller('PaeDocumentationController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.PaeDocumentationController]).run(function ($log) {
        $log.info("PaeDocumentationController initialized");
    });
}(mifosX.controllers || {}));
