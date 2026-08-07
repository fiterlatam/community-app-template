(function (module) {
    mifosX.controllers = _.extend(module, {
        BatchChequeRequestsController: function (scope, resourceFactory, $interval) {

            scope.batchRequests = [];
            scope.formData = {};
            scope.statusOptions = [
                {id: 'PENDING', code: 'label.batchchequerequest.status.PENDING'},
                {id: 'PROCESSING', code: 'label.batchchequerequest.status.PROCESSING'},
                {id: 'COMPLETED', code: 'label.batchchequerequest.status.COMPLETED'},
                {id: 'FAILED', code: 'label.batchchequerequest.status.FAILED'}
            ];

            var refreshPromise = null;

            scope.chequeCount = function (chequeIds) {
                if (!chequeIds) {
                    return 0;
                }
                return chequeIds.split(',').filter(function (id) {
                    return id && id.trim().length > 0;
                }).length;
            };

            scope.hasInProgressRequests = function () {
                for (var i = 0; i < scope.batchRequests.length; i++) {
                    var status = scope.batchRequests[i].status;
                    if (status === 'PENDING' || status === 'PROCESSING') {
                        return true;
                    }
                }
                return false;
            };

            scope.loadBatchRequests = function () {
                var params = {};
                if (scope.formData.status) {
                    params.status = scope.formData.status;
                }
                resourceFactory.batchChequeRequestResource.getAll(params, function (data) {
                    scope.batchRequests = data;
                    scope.manageAutoRefresh();
                });
            };

            scope.search = function () {
                scope.loadBatchRequests();
            };

            scope.refresh = function () {
                scope.loadBatchRequests();
            };

            scope.manageAutoRefresh = function () {
                if (scope.hasInProgressRequests()) {
                    if (!refreshPromise) {
                        refreshPromise = $interval(function () {
                            scope.loadBatchRequests();
                        }, 10000);
                    }
                } else if (refreshPromise) {
                    $interval.cancel(refreshPromise);
                    refreshPromise = null;
                }
            };

            scope.$on('$destroy', function () {
                if (refreshPromise) {
                    $interval.cancel(refreshPromise);
                    refreshPromise = null;
                }
            });

            scope.loadBatchRequests();
        }
    });

    mifosX.ng.application.controller('BatchChequeRequestsController', ['$scope', 'ResourceFactory', '$interval', mifosX.controllers.BatchChequeRequestsController]).run(function ($log) {
        $log.info("BatchChequeRequestsController initialized");
    });
}(mifosX.controllers || {}));
