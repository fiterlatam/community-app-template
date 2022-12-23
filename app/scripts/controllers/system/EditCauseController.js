(function (module) {
    mifosX.controllers = _.extend(module, {
        EditCauseController: function (scope, routeParams, resourceFactory, location) {
            scope.formData = {};
            scope.currencyOptions = [];

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.causesTemplateResource.get(requestParams, function (data) {
                scope.currencyOptions = data.currencyOptions;
            });
           
            resourceFactory.CausesResource.retrieveOne({causeId: routeParams.id}, function (data) {
                delete data.currency;
                scope.formData = data;
            });

            scope.submit = function () {                                                                                
                resourceFactory.CausesResource.updateCause({causeId: routeParams.id}, scope.formData, function (data) {
                    location.path('/causes');
                });
            };
        }
    });
    mifosX.ng.application.controller('EditCauseController', ['$scope', '$routeParams', 'ResourceFactory', '$location', mifosX.controllers.EditCauseController]).run(function ($log) {
        $log.info("EditCauseController initialized");
    });
}(mifosX.controllers || {}));