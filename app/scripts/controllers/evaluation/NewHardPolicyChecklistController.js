(function (module) {
    mifosX.controllers = _.extend(module, {
        NewHardPolicyChecklistController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.prequalificationNumber;
            scope.groupId = routeParams.groupId;
            scope.checklist = [];
            scope.tf = "HH:mm";

            scope.fetchChecklist = function () {
                var items = resourceFactory.prequalificationChecklistResource.get({
                    precalnumber: scope.prequalificationNumber
                }, function (data) {
                    scope.checklist = data;
                });
            }

        }
    });

    mifosX.ng.application.controller('NewHardPolicyChecklistController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.NewHardPolicyChecklistController]).run(function ($log) {
        $log.info("NewHardPolicyChecklistController initialized");
    });
}(mifosX.controllers || {}));
