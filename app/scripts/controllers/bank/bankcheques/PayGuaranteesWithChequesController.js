(function (module) {
    mifosX.controllers = _.extend(module, {

        PayGuaranteesWithChequesController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $rootScope, dateFilter) {
            scope.isChequeAssigned = false;
            scope.isAllGuaranteeSelected = false;
            scope.guaranteeDataList = [];
            scope.availableCheques= [];
            scope.formData = {};
            scope.uiValidationErrors = [];

            scope.searchByCaseId = function () {
                   var params = {
                       caseId: this.searchText,
                       locale: scope.optlang.code
                   };
                   resourceFactory.chequeGuaranteeResource.getAllGuarantees(params, function (data) {
                        scope.guaranteeDataList = data;
                   });
            }

            scope.search = function () {
                 scope.searchByCaseId();
                 scope.fetchAvailableCheques();
                 scope.isChequeAssigned = false;
                 scope.isAllGuaranteeSelected = false;
            }

            scope.fetchAvailableCheques = function () {
                resourceFactory.searchChequeResource.get({
                    orderBy: 'chequeNo',
                    sortOrder: 'ASC',
                    agencyId: scope.formData.agencyId,
                    status: 1
                }, function (data) {
                        scope.totalAvailableCheques = data.totalFilteredRecords;
                        scope.availableCheques = data.pageItems;
                   });
            }

            scope.assignCheques = function(){
                var selectedGuaranteeDataList = [];
                for(var i = 0; i < scope.guaranteeDataList.length; i++){
                     delete scope.guaranteeDataList[i].chequeData;
                     if(scope.guaranteeDataList[i].isSelected){
                        selectedGuaranteeDataList.push(scope.guaranteeDataList[i]);
                     }
                }
                scope.uiValidationErrors = [];
                if(selectedGuaranteeDataList.length < 1){
                  scope.uiValidationErrors.push({
                        message: 'error.message.select.at.least.one.guarantee'
                   });
                } else if (selectedGuaranteeDataList.length > this.availableCheques.length){
                      scope.uiValidationErrors.push({
                          message: 'error.message.insufficient.amount.of.cheques'
                       });
                } else {
                    for (var i = 0; i < scope.guaranteeDataList.length; i++ ){
                       if(scope.guaranteeDataList[i].isSelected){
                           scope.guaranteeDataList[i].chequeData = scope.availableCheques[i];
                           var chequeName = scope.guaranteeDataList[i].chequeData.chequeNo + ' |' +  scope.guaranteeDataList[i].chequeData .batchNo + '| ' +  scope.guaranteeDataList[i].chequeData .bankAccNo +  '| ' +  scope.guaranteeDataList[i].chequeData.bankName;
                           var accountName = scope.guaranteeDataList[i].chequeData.bankAccNo + ' - ' + scope.guaranteeDataList[i].chequeData.agencyName;
                           scope.guaranteeDataList[i].chequeData.chequeName = chequeName;
                           scope.guaranteeDataList[i].chequeData.accountName = accountName;
                       }
                    }
                    scope.uiValidationErrors = [];
                    scope.isChequeAssigned = true;
               }
            }

          scope.isAssignBtnDisabled = function (){
                var selectedGuaranteeDataList = [];
                for(var i = 0; i < scope.guaranteeDataList.length; i++){
                     if(scope.guaranteeDataList[i].isSelected){
                        selectedGuaranteeDataList.push(scope.guaranteeDataList[i]);
                     }
                }
                return selectedGuaranteeDataList.length < 1;

          }

           scope.selectAllGuarantees = function(){
                for (var i = 0; i < scope.guaranteeDataList.length; i++ ){
                     scope.guaranteeDataList[i].isSelected = scope.isAllGuaranteeSelected;
                }
            }

            scope.payGuaranteesByCheques = function(){
                var selectedGuaranteeDataList = [];
                for(var i = 0; i < scope.guaranteeDataList.length; i++){
                     if(scope.guaranteeDataList[i].isSelected){
                         var selectedGuarantee = {
                            guaranteeId: scope.guaranteeDataList[i].id,
                            caseId: scope.guaranteeDataList[i].caseId,
                            chequeId: scope.guaranteeDataList[i].chequeData.id,
                            guaranteeAmount: scope.guaranteeDataList[i].requestedAmount,
                            guaranteeName: scope.guaranteeDataList[i].clientName,
                         }
                        selectedGuaranteeDataList.push(selectedGuarantee);
                     }
                }
                var request = {
                   locale: scope.optlang.code,
                   guarantees: selectedGuaranteeDataList
                }
                resourceFactory.chequeBatchResource.payGuarantees({ commandParam: 'payguaranteesbycheques'}, request, function (data) {
                     route.reload();
                });
            }
        }
    });

    mifosX.ng.application.controller('PayGuaranteesWithChequesController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$rootScope', 'dateFilter', mifosX.controllers.PayGuaranteesWithChequesController]).run(function ($log) {
        $log.info("PayGuaranteesWithChequesController initialized");
    });
}(mifosX.controllers || {}));
