(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewAccountingClosureController: function (scope, resourceFactory, location, routeParams,dateFilter, $uibModal) {
            scope.accountClosure = {};
            scope.formData = {};
            scope.choice = 0;
            scope.isEditClosure = false;
            resourceFactory.accountingClosureResource.getView({accId: routeParams.id}, function (data) {
                scope.accountClosure = data;
                scope.formData.closingDate = new Date(data.closingDate);
                scope.formData.comments = data.comments;
            });
            scope.deleteAcc = function () {
                $uibModal.open({
                    templateUrl: 'deleteacc.html',
                    controller: AccDeleteCtrl
                });
            };

            scope.editClosure = function () {
                scope.isEditClosure=!scope.isEditClosure;
            };

            scope.updateClosure = function () {
                var reqDate = dateFilter(scope.formData.closingDate, scope.df);
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                this.formData.closingDate = reqDate;
                resourceFactory.accountingClosureResource.update({accId: routeParams.id},this.formData, function (data) {
                    location.path('/accounts_closure/');
                    scope.isEditClosure=!scope.isEditClosure;
                });
            };

            var AccDeleteCtrl = function ($scope, $uibModalInstance) {
                $scope.delete = function () {
                    resourceFactory.accountingClosureResource.delete({accId: routeParams.id}, {}, function (data) {
                        $uibModalInstance.close('delete');
                        location.path('/accounts_closure');
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

        }
    });
    mifosX.ng.application.controller('ViewAccountingClosureController', ['$scope', 'ResourceFactory', '$location', '$routeParams','dateFilter', '$uibModal', mifosX.controllers.ViewAccountingClosureController]).run(function ($log) {
        $log.info("ViewAccountingClosureController initialized");
    });
}(mifosX.controllers || {}));
