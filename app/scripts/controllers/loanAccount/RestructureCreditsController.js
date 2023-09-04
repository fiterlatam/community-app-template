(function (module) {
    mifosX.controllers = _.extend(module, {
        RestructureCreditsController: function (scope, resourceFactory, routeParams, location, dateFilter) {
            scope.clientId = routeParams.clientId;
            scope.formData = {};
            scope.outstandingBalance=0;
            scope.restructureData;
            scope.formData.submittedOnDate = new Date();

            resourceFactory.restructurecreditsResource.template({clientId:scope.clientId,anotherResource:'template'},function(data){

                scope.activeLoans = data.activeLoans;
                scope.clientData = data.clientData;
                scope.requestData = data.requestData;
                scope.loanProductData = data.loanProductData;
            });
            scope.cancel = function () {
                location.path('/viewclient/' + scope.clientId);
            };
            scope.computeTotalBalance = function () {
                for (let i=0; i<scope.activeLoans.length; i++) {
                    if (scope.activeLoans[i].selected){
                        console.log("going to update balance")
                        scope.outstandingBalance = scope.outstandingBalance+ Number(scope.activeLoans[i].summary.totalOutstanding)
                    }
                }

                console.log("updated: "+ scope.outstandingBalance)
            };

            scope.submit = function () {
                console.log("selected loans: \n\n"+ JSON.stringify(scope.activeLoans))
                let selectedLoans = []
                for (let i=0; i<scope.activeLoans.length; i++){
                    if (scope.activeLoans[i].selected){
                        selectedLoans.push(scope.activeLoans[i].id)
                    }
                };

                let formData = {
                    clientId:scope.clientId,
                    selectedLoanIds: selectedLoans
                }

                resourceFactory.restructurecreditsResource.save({clientId:scope.clientId},formData,function(data){

                });


            };

        }
    });
    mifosX.ng.application.controller('RestructureCreditsController', ['$scope', 'ResourceFactory', '$routeParams', '$location', 'dateFilter', mifosX.controllers.RestructureCreditsController]).run(function ($log) {
        $log.info("RestructureCreditsController initialized");
    });
}(mifosX.controllers || {}));
