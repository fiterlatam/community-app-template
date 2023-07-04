(function (module) {
    mifosX.controllers = _.extend(module, {
        BlacklistController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
            scope.blacklist = [];
            scope.actualBlacklist = [];

            scope.formData={};
            scope.searchText;
            scope.clientsPerPage=20;

            scope.getResultsPage = function (pageNumber) {
                if(scope.searchText){
                    var startPosition = (pageNumber - 1) * scope.clientsPerPage;
                    scope.blacklist = scope.actualBlacklist.slice(startPosition, startPosition + scope.clientsPerPage);
                    return;
                }
                var items = resourceFactory.blacklistResource.getAllBlacklistClients({
                    offset: ((pageNumber - 1) * scope.clientsPerPage),
                    limit: scope.clientsPerPage,
                    searchText:scope.searchText
                }, function (data) {
                    scope.totalClients = data.totalFilteredRecords;
                    scope.blacklist = data.pageItems;
                });
            }

            resourceFactory.blacklistResource.getAllBlacklistClients({
                offset: 0,
                limit: scope.clientsPerPage,
                searchText:scope.searchText
            }, function (data) {
                scope.totalClients = data.totalFilteredRecords;
                scope.blacklist = data.pageItems;
            });

            scope.routeTo = function (path) {
                location.path(path);
            }

        }
    });

    mifosX.ng.application.controller('BlacklistController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.BlacklistController]).run(function ($log) {
        $log.info("BlacklistController initialized");
    });
}(mifosX.controllers || {}));
