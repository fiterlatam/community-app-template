(function (module) {
    mifosX.controllers = _.extend(module, {
        CreateCupoController: function (scope, resourceFactory, location, routeParams, dateFilter) {
            
            scope.entityName = routeParams.entityName;
            scope.entityId = routeParams.entityId;
            scope.formData = {};
            scope.date = {};
            scope.date.first = new Date();
            scope.date.minDate = new Date();

            if(scope.entityName === "client"){
                resourceFactory.cuposTemplateResource.template({clientId: scope.entityId}, function (data) {
                    scope.cupoTemplateData = data;
                    scope.currencyOptions = data.currencyOptions;
                });
            } else {
                resourceFactory.cuposTemplateResource.template({groupId: scope.entityId}, function (data) {
                    scope.cupoTemplateData = data;
                    scope.currencyOptions = data.currencyOptions;
                });
            }

            scope.submit = function(){
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                let expirationDate = dateFilter(scope.date.first, scope.df);
                this.formData.expirationDate = expirationDate;
                if(scope.entityName === "client"){
                    this.formData.clientId = scope.entityId;
                } else {
                    this.formData.groupId = scope.entityId;
                }

                resourceFactory.cuposResource.save(this.formData, function (data) {
                    location.path('/viewcupo/' + data.resourceId);
                });
            }
        }
    });
    mifosX.ng.application.controller('CreateCupoController', ['$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter', mifosX.controllers.CreateCupoController]).run(function ($log) {
        $log.info("CreateCupoController initialized");
    });
}(mifosX.controllers || {}));