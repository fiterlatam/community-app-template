(function (module) {
    mifosX.controllers = _.extend(module, {
        EditCupoController: function (scope, resourceFactory, location, routeParams, dateFilter) {

            scope.cupoId = routeParams.cupoId;
            scope.formData = {};
            scope.date = {};
            scope.date.minDate = new Date();

            resourceFactory.cuposResource.get({cupoId: scope.cupoId}, function (data) {
                scope.cupo = data;
                scope.formData.amount = scope.cupo.amount;
                let expirationDate = dateFilter(scope.cupo.expirationDate, scope.df);
                scope.formData.expirationDate = new Date(expirationDate);
            });


            scope.submit = function(){
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                let expirationDate = dateFilter(scope.formData.expirationDate, scope.df);
                this.formData.expirationDate = expirationDate;

                resourceFactory.cuposResource.update({cupoId: scope.cupoId},this.formData, function (data) {
                    location.path('/viewcupo/' + data.resourceId);
                });
            }
        }
    });
    mifosX.ng.application.controller('EditCupoController', ['$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter', mifosX.controllers.EditCupoController]).run(function ($log) {
        $log.info("EditCupoController initialized");
    });
}(mifosX.controllers || {}));