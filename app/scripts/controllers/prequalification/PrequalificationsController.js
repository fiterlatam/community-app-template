(function (module) {
    mifosX.controllers = _.extend(module, {
        PrequalificationsController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.groupsList = [];
            scope.formData = {};
            scope.groupsPerPage=20;
            scope.prequalificationType=routeParams.type;

            scope.getResultsPage = function (pageNumber) {
                var items = resourceFactory.prequalificationResource.getAllGroups({
                    offset: ((pageNumber - 1) * scope.groupsPerPage),
                    limit: scope.groupsPerPage,
                    type: routeParams.type,
                    status: scope.formData.status,
                    searchText:scope.searchText
                }, function (data) {
                    scope.totalGroups = data.totalFilteredRecords;
                    scope.groupsList = data.pageItems;
                });
            }

            resourceFactory.prequalificationTemplateResource.get({type:routeParams.type},function (data) {
                scope.groupStatusOptions = data.groupStatusOptions
            });

            scope.getResultsPage(1);

        }
    });

    mifosX.ng.application.controller('PrequalificationsController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.PrequalificationsController]).run(function ($log) {
        $log.info("PrequalificationsController initialized");
    });
}(mifosX.controllers || {}));
