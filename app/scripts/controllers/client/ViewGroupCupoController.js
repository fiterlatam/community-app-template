(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewGroupCupoController: function (scope, resourceFactory, location, routeParams) {
            
            scope.groupId = routeParams.groupId;
            scope.cupos = [];

            resourceFactory.cuposGroupResource.getAll({groupId: scope.groupId}, function (data) {
                scope.cupos = data;
            });

            scope.routeTo = function (cupoId) {
                location.path('/viewcupo/' + cupoId);
            }

        }
    });
    mifosX.ng.application.controller('ViewGroupCupoController', ['$scope', 'ResourceFactory', '$location', '$routeParams', mifosX.controllers.ViewGroupCupoController]).run(function ($log) {
        $log.info("ViewGroupCupoController initialized");
    });
}(mifosX.controllers || {}));