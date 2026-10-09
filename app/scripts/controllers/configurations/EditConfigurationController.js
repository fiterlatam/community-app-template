(function (module) {
    mifosX.controllers = _.extend(module, {
        EditConfigurationController: function (scope, resourceFactory, routeParams, location) {

            scope.currencies = [];
            scope.configName = '';
            scope.configId = routeParams.configId;
            scope.selectedCurrency = undefined;

            // Trae la config
            resourceFactory.configurationResource.get({ id: scope.configId }, function (data) {

                scope.configName = data.name;

                scope.formData = {
                    value: data.value,
                    stringValue: data.stringValue
                };

                resourceFactory.currencyConfigResource.get(function (datax) {
                    scope.currencies = datax.selectedCurrencyOptions;
                    if (scope.configName === 'limit_amount' && scope.currencies.length > 0) {
                        scope.selectedCurrency = scope.currencies.find(c => c.code === data.stringValue);
                        scope.formData.stringValue = scope.selectedCurrency.code;
                    }
                });
            });


            scope.cancel = function () {
                location.path('/global');
            };

            scope.submit = function () {
                resourceFactory.configurationResource.update(
                    { resourceType: 'configurations', id: scope.configId },
                    scope.formData,
                    function (data) {
                        location.path('/global');
                    }
                );
            };

        }
    });

    mifosX.ng.application.controller(
        'EditConfigurationController',
        ['$scope', 'ResourceFactory', '$routeParams', '$location', mifosX.controllers.EditConfigurationController]
    ).run(function ($log) {
        $log.info("EditConfigurationController initialized");
    });
}(mifosX.controllers || {}));
