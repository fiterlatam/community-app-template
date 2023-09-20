(function (module) {
    mifosX.controllers = _.extend(module, {

        ViewChequeController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
             scope.batchId = routeParams.batchId;
             scope.chequeId = routeParams.chequeId;
             scope.chequeData = {};
             scope.showVoidButton = false;
             scope.showPrintButton = false;
             scope.showReassignButton = false;
             scope.showAuthorizeVoidanceButton = false;
             scope.showAuthorizeIssuanceButton = false;
             scope.showIssueButton = false;
             resourceFactory.searchChequeResource.get({batchId: scope.batchId, chequeId: scope.chequeId}, function (data) {
                 if (data.pageItems.length > 0 ) {
                    scope.chequeData = data.pageItems[0];
                    var status = scope.chequeData.status.id;
                    switch (status) {
                      case 1:
                        scope.showVoidButton = true;
                        scope.showIssueButton = true;
                        break;
                      case 2:
                        scope.showPrintButton = true;
                        scope.showReassignButton = true;
                        break;
                      case 3:
                        break;
                      case 4:
                        scope.showAuthorizeVoidanceButton = true;
                        break;
                      case 5:
                          scope.showAuthorizeIssuanceButton = true;
                        break;
                      default:
                    }
                 }
            });
            scope.authorizeVoidance = function(){
               resourceFactory.chequeBatchResource.authorizeVoidance({chequeId: scope.chequeId}, function (data) {
                    location.path('/viewchequebatch/' +  scope.batchId);
               });
            }

        }
    });

    mifosX.ng.application.controller('ViewChequeController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.ViewChequeController]).run(function ($log) {
        $log.info("ViewChequeController initialized");
    });
}(mifosX.controllers || {}));
