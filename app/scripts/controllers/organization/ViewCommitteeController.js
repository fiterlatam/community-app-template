(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewCommitteeController: function (scope, routeParams, route, location, resourceFactory, $uibModal) {

            resourceFactory.committeeResource.get({committeeId: routeParams.id}, function (data) {
                scope.committee = data;
                // Split approval limits
                scope.belowExceptionLimits = [];
                scope.aboveExceptionLimits = [];
                if (data && Array.isArray(data.committeeApprovalLimits)) {
                    data.committeeApprovalLimits.forEach(function(lim){
                        if (lim.condition === 'LESS_THAN') {
                            scope.belowExceptionLimits.push(lim);
                        } else if (lim.condition === 'GREATER_THAN') {
                            scope.aboveExceptionLimits.push(lim);
                        }
                    });
                    scope.belowExceptionLimits.sort(function(a,b){return a.fromAmount - b.fromAmount;});
                    scope.aboveExceptionLimits.sort(function(a,b){return a.fromAmount - b.fromAmount;});
                }
            });

            scope.deletecommittee = function () {
                $uibModal.open({
                    templateUrl: 'deletecommittee.html',
                    controller: CommitteeDeleteCtrl
                });
            };

            var CommitteeDeleteCtrl = function ($scope, $uibModalInstance) {
                $scope.delete = function () {
                    resourceFactory.committeeResource.delete({committeeId: routeParams.id}, {}, function (data) {
                        $uibModalInstance.close('delete');
                        location.path('/committees');
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };


        }
    });
    mifosX.ng.application.controller('ViewCommitteeController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$uibModal', mifosX.controllers.ViewCommitteeController]).run(function ($log) {
        $log.info("ViewCommitteeController initialized");
    });
}(mifosX.controllers || {}));
