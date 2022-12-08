(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewClientCupoController: function (scope, resourceFactory, location, routeParams) {
            
            scope.clientId = routeParams.clientId;
            scope.cupos = [];

            resourceFactory.cuposClientResource.getAll({clientId: scope.clientId}, function (data) {
                scope.cupos = data;
            });

            scope.routeTo = function (cupoId) {
                location.path('/viewcupo/' + cupoId);
            }

        }
    });
    mifosX.ng.application.controller('ViewClientCupoController', ['$scope', 'ResourceFactory', '$location', '$routeParams', mifosX.controllers.ViewClientCupoController]).run(function ($log) {
        $log.info("ViewClientCupoController initialized");
    });
}(mifosX.controllers || {}));