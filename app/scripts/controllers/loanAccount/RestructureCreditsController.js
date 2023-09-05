(function (module) {
    mifosX.controllers = _.extend(module, {
        RestructureCreditsController: function (scope, resourceFactory, routeParams, location, dateFilter,$uibModal) {
            scope.clientId = routeParams.clientId;
            scope.formData = {};
            scope.outstandingBalance=0;
            scope.restructureData;

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
                        scope.outstandingBalance = scope.outstandingBalance+ Number(scope.activeLoans[i].summary.totalOutstanding)
                    }
                }

            };


            scope.resolveDateTime = function (dateTime) {
                if (dateTime){
                    let year = dateTime[0]
                    let month = dateTime[1].toString().padStart(2,'0');
                    let date = dateTime[2].toString().padStart(2,'0');
                    let hour = dateTime[3].toString().padStart(2,'0');
                    let minute = dateTime[4].toString().padStart(2,'0');
                    let seconds = dateTime[5].toString().padStart(2,'0');
                    return ""+ year +"-"+ month+"-"+ date+" "+ hour+":"+ minute+":"+ seconds;
                }
            };

            scope.submit = function () {
                console.log("selected loans: \n\n"+ JSON.stringify(scope.activeLoans))
                let selectedLoans = []
                for (let i=0; i<scope.activeLoans.length; i++){
                    if (scope.activeLoans[i].selected){
                        selectedLoans.push(scope.activeLoans[i].id)
                    }
                };

                var disbursementDate = dateFilter(scope.formData.disbursementDate, scope.dft);


                let formData = {
                    ...this.formData,
                    clientId:scope.clientId,
                    selectedLoanIds: selectedLoans,
                    disbursementDate: disbursementDate,
                    outstandingBalance: scope.outstandingBalance,
                    locale : scope.optlang.code,
                    dateFormat: scope.dft
                }

                resourceFactory.restructurecreditsResource.save({clientId:scope.clientId},formData,function(data){
                    location.path('/viewclient/' + scope.clientId);
                });


            };

            scope.processRequest = function (action) {
                scope.action = action;
                $uibModal.open({
                    templateUrl: 'processRequest.html',
                    controller: ProcessRequestCtrl
                });
            }

            var ProcessRequestCtrl = function ($scope, $uibModalInstance) {
                $scope.action = scope.action;

                $scope.processRequest = function () {
                    let formData = {
                        requestId:scope.requestData.id,
                        transactionDate : dateFilter(new Date(), scope.df),
                        notes : scope.requestData.comments,
                        locale : scope.optlang.code,
                        dateFormat: scope.df
                    };
                    resourceFactory.restructurecreditsResource.save({clientId:scope.clientId, anotherresource: scope.action}, formData, function (data) {
                        $uibModalInstance.close('delete');
                        location.path('/viewclient/' + scope.clientId);
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

        }
    });
    mifosX.ng.application.controller('RestructureCreditsController', ['$scope', 'ResourceFactory', '$routeParams', '$location', 'dateFilter','$uibModal', mifosX.controllers.RestructureCreditsController]).run(function ($log) {
        $log.info("RestructureCreditsController initialized");
    });
}(mifosX.controllers || {}));
