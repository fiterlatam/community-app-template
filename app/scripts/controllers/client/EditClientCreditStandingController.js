(function (module) {
    mifosX.controllers = _.extend(module, {
        EditClientCreditStandingController: function (scope, resourceFactory, routeParams, location) {

            scope.formData = {};
            scope.clientId = routeParams.id;
            scope.creditStandingDataRequestBody = {};
            scope.existsCreditStanding = false;

            resourceFactory.creditStandingClientResource.get({clientId: scope.clientId}, function (data) {
                if (data && data.id && data.id != null) {
                    scope.formData.mra = data.mra;
                    scope.formData.mraAvailable = data.mraAvailable;
                    scope.formData.rciMax = data.rciMax;
                    scope.formData.monthlyCommitment = data.monthlyCommitment;
                    scope.formData.totalDebt = data.totalDebt;
                    scope.formData.currentDebt = data.currentDebt;
                    scope.formData.expiredDebt = data.expiredDebt;
                    scope.formData.delayInDays = data.delayInDays;
                    // update scope variable
                    scope.existsCreditStanding = true;
                }
            });

            scope.cancel = function () {
                location.path('/viewclient/' + scope.clientId);
            };

            scope.submit = function () {
                this.formData.locale = scope.optlang.code;
                scope.creditStandingDataRequestBody.mra = this.formData.mra;
                scope.creditStandingDataRequestBody.rciMax = this.formData.rciMax;
                scope.creditStandingDataRequestBody.locale = scope.optlang.code;
                scope.creditStandingDataRequestBody.clientId = scope.clientId;

                if(scope.existsCreditStanding === true)
                {
                    resourceFactory.creditStandingClientResource.update({clientId: scope.clientId}, scope.creditStandingDataRequestBody, function (data) {
                        location.path('/viewclient/' + scope.clientId);
                    });
                }  else {
                    resourceFactory.creditStandingResource.save({clientId: scope.clientId}, scope.creditStandingDataRequestBody, function (data) {
                        location.path('/viewclient/' + scope.clientId);
                    })
                }

            };

        }
    });
    mifosX.ng.application.controller('EditClientCreditStandingController', ['$scope', 'ResourceFactory', '$routeParams', '$location', mifosX.controllers.EditClientCreditStandingController]).run(function ($log) {
        $log.info("EditClientCreditStandingController initialized");
    });
}(mifosX.controllers || {}));

