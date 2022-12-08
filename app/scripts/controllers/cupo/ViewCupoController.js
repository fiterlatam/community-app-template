(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewCupoController: function (scope, resourceFactory, location, routeParams, dateFilter, $uibModal, route) {
            scope.cupoId = routeParams.cupoId;

            resourceFactory.cuposResource.get({cupoId: scope.cupoId}, function (data) {
                scope.cupo = data;
            });

            scope.approveCupo = function(){
                $uibModal.open({
                    templateUrl: 'approvecupo.html',
                    controller: ApproveCupoCtrl
                });
            }
            
            var ApproveCupoCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {}
                $scope.approve = function () {
                    $scope.formData.locale = scope.optlang.code;
                    $scope.formData.dateFormat = scope.df;
                    let approvalDate = dateFilter($scope.formData.approvalDate, scope.df);
                    $scope.formData.approvalDate = approvalDate;
                    resourceFactory.cuposResource.approve({cupoId: scope.cupoId}, $scope.formData, function (data) {
                        $uibModalInstance.close('approve');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.rejectCupo = function(){
                $uibModal.open({
                    templateUrl: 'rejectcupo.html',
                    controller: RejectCupoCtrl
                });
            }

            var RejectCupoCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {}
                $scope.reject = function () {
                    $scope.formData.locale = scope.optlang.code;
                    $scope.formData.dateFormat = scope.df;
                    let rejectDate = dateFilter($scope.formData.rejectDate, scope.df);
                    $scope.formData.rejectDate = rejectDate;
                    resourceFactory.cuposResource.reject({cupoId: scope.cupoId}, $scope.formData, function (data) {
                        $uibModalInstance.close('reject');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.getCupoTransactions = function() {
                resourceFactory.cupoTransactionsResource.getAll({cupoId: scope.cupoId}, function (data) {
                    scope.transactions = data;
                });
            }

            scope.extensionCupo = function(){
                $uibModal.open({
                    templateUrl: 'extensioncupo.html',
                    controller: ExtensionCupoCtrl
                });
            }

            var ExtensionCupoCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {}
                $scope.extension = function () {
                    $scope.formData.locale = scope.optlang.code;
                    $scope.formData.dateFormat = scope.df;
                    let expirationDate = dateFilter($scope.formData.expirationDate, scope.df);
                    $scope.formData.expirationDate = expirationDate;
                    resourceFactory.cuposResource.extension({cupoId: scope.cupoId}, $scope.formData, function (data) {
                        $uibModalInstance.close('extension');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.cancelCupo = function(){
                $uibModal.open({
                    templateUrl: 'cancelcupo.html',
                    controller: CancelCupoCtrl
                });
            }

            var CancelCupoCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {}
                $scope.cancelation = function () {
                    $scope.formData.locale = scope.optlang.code;
                    $scope.formData.dateFormat = scope.df;
                    let transactionDate = dateFilter($scope.formData.transactionDate, scope.df);
                    $scope.formData.transactionDate = transactionDate;
                    resourceFactory.cuposResource.cancel({cupoId: scope.cupoId}, $scope.formData, function (data) {
                        $uibModalInstance.close('cancelation');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.reductionCupo = function(){
                $uibModal.open({
                    templateUrl: 'reductioncupo.html',
                    controller: ReductionCupoCtrl
                });
            }

            var ReductionCupoCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {}
                $scope.reduction = function () {
                    $scope.formData.locale = scope.optlang.code;
                    resourceFactory.cuposResource.reduction({cupoId: scope.cupoId}, $scope.formData, function (data) {
                        $uibModalInstance.close('reduction');
                        route.reload();
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };
        }
    });
    mifosX.ng.application.controller('ViewCupoController', ['$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter', '$uibModal', '$route', mifosX.controllers.ViewCupoController]).run(function ($log) {
        $log.info("ViewCupoController initialized");
    });
}(mifosX.controllers || {}));