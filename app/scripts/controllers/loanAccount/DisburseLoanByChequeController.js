(function (module) {
    mifosX.controllers = _.extend(module, {

        DisburseLoanByChequeController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $rootScope, dateFilter) {
            scope.isCollapsed = false;
            scope.isChequeAssigned = false;
            scope.allLoansSelected = false;
            scope.approvedLoanAccounts = [];
            scope.selectedLoanAccounts= [];
            scope.availableCheques= [];
            scope.formData = {};
            scope.uiValidationErrors = [];
            resourceFactory.loanTemplateResource.get({templateType: 'cheque'}, function (data) {
                scope.agencyOptions = data.agencyOptions;
                scope.centerOptions = data.centerOptions;
                scope.groupOptions = data.groupOptions;
                scope.facilitatorOptions = data.facilitatorOptions;
                scope.disbursementMethodOptions = data.disbursementMethodOptions;
            });

            scope.searchApprovedLoanAccounts = function () {
                   this.formData.limit = 2147483647;
                   this.formData.sqlSearch = 'l.loan_status_id IN (200)';
                   this.formData.locale =  scope.optlang.code;
                   this.formData.dateFormat = scope.df;
                   if(this.formData.approvalEndDate){
                       this.formData.approvalEndDate = dateFilter(this.formData.approvalEndDate,  scope.df);
                   }
                   if(this.formData.approvalStartDate){
                      this.formData.approvalStartDate = dateFilter(this.formData.approvalStartDate,  scope.df);
                   }
                   if(this.formData.disbursementStartDate){
                      this.formData.disbursementStartDate = dateFilter(this.formData.disbursementStartDate,  scope.df);
                   }
                   if(this.formData.disbursementEndDate){
                      this.formData.disbursementEndDate = dateFilter(this.formData.disbursementEndDate,  scope.df);
                   }
                   resourceFactory.loanResource.getAllLoans(this.formData, function (data) {
                        scope.approvedLoanAccounts = data.pageItems;
                   });
            }

            scope.search = function () {
                 scope.searchApprovedLoanAccounts();
                 scope.fetchAvailableCheques();
                 scope.isCollapsed = true;
                 scope.allLoansSelected = false;
                 console.log(scope.availableCheques);
            }

            scope.fetchAvailableCheques = function () {
                resourceFactory.searchChequeResource.get({
                    orderBy: 'chequeNo',
                    sortOrder: 'ASC',
                    agencyId: scope.formData.checkAgencyId,
                    status: 1
                }, function (data) {
                        scope.totalAvailableCheques = data.totalFilteredRecords;
                        scope.availableCheques = data.pageItems;
                   });
            }

            scope.assignCheques = function(){
                var selectedLoanAccounts = [];
                console.log(scope.approvedLoanAccounts);
                for(var i = 0; i < scope.approvedLoanAccounts.length; i++){
                     delete scope.approvedLoanAccounts[i].chequeData;
                     if(scope.approvedLoanAccounts[i].isSelected){
                        selectedLoanAccounts.push(scope.approvedLoanAccounts[i]);
                     }
                }
                console.log(selectedLoanAccounts);
                console.log(scope.availableCheques);
                scope.uiValidationErrors = [];
                if(selectedLoanAccounts.length < 1){
                  scope.uiValidationErrors.push({
                        message: 'error.message.select.at.least.one.cheque'
                   });
                } else if (selectedLoanAccounts.length > scope.availableCheques.length){
                      scope.uiValidationErrors.push({
                          message: 'error.message.insufficient.amount.of.cheques'
                       });
                } else {
                    for (var i = 0; i < scope.approvedLoanAccounts.length; i++ ){
                       if(scope.approvedLoanAccounts[i].isSelected){
                           scope.approvedLoanAccounts[i].chequeData = scope.availableCheques[i];
                           var chequeName = scope.approvedLoanAccounts[i].chequeData.chequeNo + ' |' +  scope.approvedLoanAccounts[i].chequeData .batchNo + '| ' +  scope.approvedLoanAccounts[i].chequeData .bankAccNo +  '| ' +  scope.approvedLoanAccounts[i].chequeData.bankName;
                           scope.approvedLoanAccounts[i].chequeData.chequeName = chequeName;
                       }
                    }
                    scope.uiValidationErrors = [];
                    scope.isChequeAssigned = true;
               }
            }

          scope.isAssignBtnDisabled = function (){
                var selectedLoanAccounts = [];
                for(var i = 0; i < scope.approvedLoanAccounts.length; i++){
                     if(scope.approvedLoanAccounts[i].isSelected){
                        selectedLoanAccounts.push(scope.approvedLoanAccounts[i]);
                     }
                }
                return selectedLoanAccounts.length < 1;

          }

           scope.selectAllLoans = function(){
                for (var i = 0; i < scope.approvedLoanAccounts.length; i++ ){
                     scope.approvedLoanAccounts[i].isSelected = scope.allLoansSelected;
                }
            }

            scope.disburseByCheques = function(){
                var selectedLoanAccounts = [];
                for(var i = 0; i < scope.approvedLoanAccounts.length; i++){
                     if(scope.approvedLoanAccounts[i].isSelected){
                         var selectedLoanAccount = {
                            loanId: scope.approvedLoanAccounts[i].id,
                            chequeId: scope.approvedLoanAccounts[i].chequeData.id,
                            description: scope.approvedLoanAccounts[i].description,
                            guaranteeAmount: scope.approvedLoanAccounts[i].guaranteeAmount,
                            locale: scope.optlang.code
                         }
                        selectedLoanAccounts.push(selectedLoanAccount);
                     }
                }
               resourceFactory.loanResource.save({command: 'disbursebycheques'}, selectedLoanAccounts, function (data) {
                     route.reload();
                });
            }
        }
    });

    mifosX.ng.application.controller('DisburseLoanByChequeController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$rootScope', 'dateFilter', mifosX.controllers.DisburseLoanByChequeController]).run(function ($log) {
        $log.info("DisburseLoanByChequeController initialized");
    });
}(mifosX.controllers || {}));
