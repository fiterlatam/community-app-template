(function (module) {
    mifosX.controllers = _.extend(module, {
        CreateCauseController: function (scope, resourceFactory, location) {
            scope.formData = {};  
            scope.formData.allowOverdraft = false;
            scope.formData.isCashOperation = false;        
            scope.formData.sendAcrm = false;
            scope.formData.isDocument = false;
            scope.currencyOptions=[];

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.causesTemplateResource.get(requestParams, function (data) {
                scope.currencyOptions = data.currencyOptions;
            });

            scope.submit = function () {                            
                resourceFactory.CausesResource.createCause(scope.formData, function (data) {
                    location.path('/causes');
                });
            };

        }
    });
    mifosX.ng.application.controller('CreateCauseController', ['$scope', 'ResourceFactory', '$location', mifosX.controllers.CreateCauseController]).run(function ($log) {
        $log.info("CreateCauseController initialized");
    });
}(mifosX.controllers || {}));