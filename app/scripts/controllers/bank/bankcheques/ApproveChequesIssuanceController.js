(function (module) {
    mifosX.controllers = _.extend(module, {
        ApproveChequesIssuanceController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

             resourceFactory.chequeBatchTemplateResource.get({}, function (data) {
                 scope.statusOptions = data.statusOptions;
                 scope.agencyOptions = data.agencyOptions;
             });

            scope.routeTo = function (chequeId, batchId){
                location.path('/viewdetails/' + chequeId  + '/cheque/' + batchId);
            };

            scope.cheques = [];
            scope.formData = {};
            scope.chequesPerPage = 100;
            scope.formData.status = 5;
            scope.isAllChequesSelected = false;
            scope.disableApproveButton = true;
            scope.getResultsPage = function (pageNumber) {
               resourceFactory.searchChequeResource.get({
                    offset: ((pageNumber - 1) * scope.chequesPerPage),
                    limit: scope.chequesPerPage,
                    orderBy: 'chequeNo',
                    sortOrder: 'ASC',
                    bankAccNo: scope.formData.bankAccNo,
                    chequeNo: scope.formData.chequeNo,
                    agencyId: scope.formData.agencyId,
                    status: scope.formData.status
                }, function (data) {
                    scope.totalCheques = data.totalFilteredRecords;
                    scope.cheques = data.pageItems;
                    scope.isAllChequesSelected = false;
               });
            }

            scope.search = function () {
                 scope.getResultsPage(1);
            }

            scope.selectAllCheques = function(){
                for (var i = 0; i < scope.cheques.length; i++ ){
                     scope.cheques[i].isSelected = scope.isAllChequesSelected;
                }
            }

            scope.isApproveBtnDisabled = function(){
              var ret = true;
              for (var i = 0; i < scope.cheques.length; i++ ){
                   if(scope.cheques[i].isSelected){
                      ret = false;
                      break;
                   }
               }
               return ret;
            }

            scope.submit = function (){
                  var selectedCheques = [];
                   for(var i = 0; i < scope.cheques.length; i++){
                        if(scope.cheques[i].isSelected){
                            var selectedCheque = {
                               chequeId: scope.cheques[i].id
                            }
                           selectedCheques.push(selectedCheque);
                        }
                   }
                  resourceFactory.chequeBatchResource.approveIssuance({ commandParam: 'approveissuance'}, selectedCheques, function (data) {
                     route.reload();
                  });
            }

        }
    });

    mifosX.ng.application.controller('ApproveChequesIssuanceController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.ApproveChequesIssuanceController]).run(function ($log) {
        $log.info("ApproveChequesIssuanceController initialized");
    });
}(mifosX.controllers || {}));
