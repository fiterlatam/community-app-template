(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewChequeBatchController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
            scope.batchId = routeParams.batchId;
            resourceFactory.chequeBatchResource.get({batchId: routeParams.batchId}, function (data) {
                scope.batchData = data;
                var accountName = scope.batchData.bankAccNo + ' - ' + scope.batchData.agencyName;
                scope.accountName = accountName;
                scope.batchData.accountName = scope.accountName;
                scope.bankAccId = scope.batchData.bankAccId;
            });

            var DeleteChequeBatchController = function ($scope, $uibModalInstance) {
                $scope.delete = function () {
                    resourceFactory.chequeBatchResource.delete({batchId: scope.batchId }, function (data) {
                      $uibModalInstance.close('delete');
                      location.path('/viewchequeaccount/' + scope.bankAccId);
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.deleteChequeBatch = function () {
                 $uibModal.open({
                    templateUrl: 'deleteChequeBatch.html',
                    controller: DeleteChequeBatchController
                });
            };
        }
    });

    mifosX.ng.application.controller('ViewChequeBatchController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.ViewChequeBatchController]).run(function ($log) {
        $log.info("ViewChequeBatchController initialized");
    });
}(mifosX.controllers || {}));
