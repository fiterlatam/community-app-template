(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewHardPolicyChecklistController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
            scope.prequalificationNumber;
            scope.groupId = routeParams.groupId;
            scope.checklist = [];
            scope.tf = "HH:mm";
            scope.showChecklistTable = true;

            resourceFactory.groupResource.get({groupId: routeParams.groupId, associations: 'all'}, function (data) {

            };

            scope.fetchClientChecklists = function () {
                var items = resourceFactory.prequalificationChecklistResource.get({
                    prequalificationId: scope.routeParams.groupId
                }, function (data) {
                    scope.checklist = data;
                });
            }

        }
    });

    mifosX.ng.application.controller('ViewHardPolicyChecklistController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.ViewHardPolicyChecklistController]).run(function ($log) {
        $log.info("ViewHardPolicyChecklistController initialized");
    });
}(mifosX.controllers || {}));
