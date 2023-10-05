(function (module) {
    mifosX.controllers = _.extend(module, {
        PrintChequesController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

             scope.bankAccountOptions = [];
             resourceFactory.chequeBatchTemplateResource.get({}, function (data) {
                 scope.statusOptions = data.statusOptions;
                 scope.agencyOptions = data.agencyOptions;
                 scope.facilitatorOptions = data.facilitatorOptions;
                 scope.centerOptions = data.centerOptions;
                 scope.groupOptions = data.groupOptions;
                 scope.allCenterGroupOptions = data.groupOptions;
             });

             resourceFactory.bankAccountResource.getAllBankAccounts({}, function (data) {
                 scope.totalBankAccounts = data.totalFilteredRecords;
                 scope.bankAccountOptions = data.pageItems;
                 for (var i = 0; i < scope.bankAccountOptions.length; i++ ){
                     var accountName = scope.bankAccountOptions[i].accountNumber + ' - ' + scope.bankAccountOptions[i].agency.name;
                     scope.bankAccountOptions[i].accountName = accountName;
                 }

             });

            scope.cheques = [];
            scope.formData = {};
            scope.chequesPerPage = 100;
            scope.formData.status = 7;
            scope.isAllChequesSelected = false;
            scope.isCollapsed = false;
            scope.getResultsPage = function (pageNumber) {
               resourceFactory.searchChequeResource.get({
                    offset: ((pageNumber - 1) * scope.chequesPerPage),
                    limit: scope.chequesPerPage,
                    orderBy: 'chequeNo',
                    sortOrder: 'ASC',
                    bankAccNo: scope.formData.bankAccNo,
                    chequeNo: scope.formData.chequeNo,
                    agencyId: scope.formData.agencyId,
                    status: scope.formData.status,
                    to: scope.formData.to,
                    from: scope.formData.from,
                    centerId: scope.formData.centerId,
                    groupId: scope.formData.groupId,
                    facilitatorId: scope.formData.facilitatorId
                }, function (data) {
                    scope.totalCheques = data.totalFilteredRecords;
                    scope.cheques = data.pageItems;
                    scope.isAllChequesSelected = false;
               });
            }

            scope.search = function () {
                 scope.getResultsPage(1);
                 scope.isCollapsed = true;
            }

            scope.selectAllCheques = function(){
                for (var i = 0; i < scope.cheques.length; i++ ){
                     scope.cheques[i].isSelected = scope.isAllChequesSelected;
                }
            }

            scope.isExportBtnDisabled = function(){
              var ret = true;
              for (var i = 0; i < scope.cheques.length; i++ ){
                   if(scope.cheques[i].isSelected){
                      ret = false;
                      break;
                   }
               }
               return ret;
            }

            scope.processCsvData = function () {
              var headers = ['Bank Acc No.', 'Bank Name', 'Cheque No.', 'Amount', 'Description', 'Batch No.', 'Client No.'];
              var selectedCheques = [];
                for(var i = 0; i < scope.cheques.length; i++){
                  if(scope.cheques[i].isSelected){
                     selectedCheques.push(scope.cheques[i]);
                  }
               }
              var csvData = [];
              csvData.push(headers);
              for (let i = 0; i < selectedCheques.length; i++) {
                 var row = [selectedCheques[i].bankAccNo, selectedCheques[i].bankName, selectedCheques[i].chequeNo, selectedCheques[i].amount, selectedCheques[i].description, selectedCheques[i].batchNo, selectedCheques[i].clientAccNo];
                 csvData.push(row);
              }
              var date = new Date();
              var year = date.getFullYear();
              var month = date.getMonth() + 1;
              var day = date.getDate();
              var hours = date.getHours();
              var minutes = date.getMinutes();
              var seconds = date.getSeconds();
              var fileName = 'cheques_' + [year, month.toString().padStart(2, '0'), day.toString().padStart(2, '0'), hours.toString().padStart(2, '0'), minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')].join('-');
              scope.fileName = fileName;
             return csvData;
            };

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
                  resourceFactory.chequeBatchResource.authorizeIssuance({ commandParam: 'authorizeissuance'}, selectedCheques, function (data) {
                     route.reload();
                  });
            }

           scope.$watch('formData.bankAccId',function(){
            delete scope.formData.agencyName;
            delete  scope.formData.bankName;
            for (var i = 0; i < scope.bankAccountOptions.length; i++ ){
                if(scope.bankAccountOptions[i].id === scope.formData.bankAccId){
                    scope.formData.agencyName = scope.bankAccountOptions[i].agency.name;
                    scope.formData.bankName = scope.bankAccountOptions[i].bank.name;
                }
             }
           });

           scope.$watch('formData.centerId',function(){
               var selectedCenterGroupOptions = [];
               if(scope.formData.centerId){
                   var centerGroupOptions = [];
                   for (var i = 0; i < scope.groupOptions.length; i++ ){
                        selectedCenterGroupOptions.push(scope.groupOptions[i]);
                    }
                   scope.groupOptions = selectedCenterGroupOptions;
               } else {
                   scope.groupOptions = scope.allCenterGroupOptions;
               }
          });

        }
    });

    mifosX.ng.application.controller('PrintChequesController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.PrintChequesController]).run(function ($log) {
        $log.info("PrintChequesController initialized");
    });
}(mifosX.controllers || {}));
