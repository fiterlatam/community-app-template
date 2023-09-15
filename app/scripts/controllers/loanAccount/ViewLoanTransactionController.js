(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewLoanTransactionController: function (scope, resourceFactory, location, routeParams, dateFilter, $uibModal, $rootScope) {
            scope.details = [];
            //Get loan rates to be defined in transaction details
            scope.rates = $rootScope.rates;
            //Obtain total rate percentage
            scope.totalRatePercentage = 0;
            var fractionDigits = 2;
            if (scope.rates){
              scope.rates.forEach(function (rate) {
                scope.totalRatePercentage += (rate.percentage/100);
              });
            }
            //get Tax from configuration
            scope.tax = 0;
            resourceFactory.configurationResource.get(function (data) {
                for (var i in data.globalConfiguration) {
                    if('vat-tax' === data.globalConfiguration[i].name){
                        scope.tax = (data.globalConfiguration[i].value/100);
                        break;
                    }
                }
              for (var i in data.globalConfiguration) {
                if('sub-rates' === data.globalConfiguration[i].name){
                  scope.ratesEnabled = (data.globalConfiguration[i].value);
                  break;
                }
              }
            });

            resourceFactory.loanTrxnsResource.get({loanId: routeParams.accountId, transactionId: routeParams.id}, function (data) {
                scope.transaction = data;
                scope.transaction.accountId = routeParams.accountId;
                scope.transaction.amount = scope.transaction.amount.toFixed(fractionDigits);
                scope.generateDetailTable();
            });

            scope.undo = function (accountId, transactionId) {
                $uibModal.open({
                    templateUrl: 'undotransaction.html',
                    controller: UndoTransactionModel,
                    resolve: {
                        accountId: function () {
                          return accountId;
                        },
                        transactionId: function () {
                          return transactionId;
                        }
                    }
                });
            };
            
            var UndoTransactionModel = function ($scope, $uibModalInstance, accountId, transactionId) {
                $scope.undoTransaction = function () {
                    var params = {loanId: accountId, transactionId: transactionId, command: 'undo'};
                    var formData = {dateFormat: scope.df, locale: scope.optlang.code, transactionAmount: 0};
                    formData.transactionDate = dateFilter(new Date(), scope.df);
                    resourceFactory.loanTrxnsResource.save(params, formData, function (data) {
                        $uibModalInstance.close('delete');
                        location.path('/viewloanaccount/' + data.loanId);
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };
          scope.generateDetailTable = function () {
            //add principal amount
            var principalDetail = {
              description: 'label.view.principalpaymentdetail',
              containsAmount: true,
              boldTitle: true,
              align: 'left',
              amount: scope.transaction.principalPortion.toFixed(fractionDigits)
            };
            scope.details.push(principalDetail);

            //Check for interest details
            var rateHeader = {
              description: 'label.view.interestspayment',
              containsAmount: scope.rates? false : true,
              boldTitle: true,
              amount: scope.rates? undefined : scope.transaction.interestPortion.toFixed(fractionDigits)
            };
            scope.details.push(rateHeader);
            if (scope.ratesEnabled && scope.rates) {
              scope.rates.forEach(function (rate) {
                var rateDetail = {
                  description: rate.name,
                  containsAmount: true,
                  boldTitle: false,
                  amount: (((scope.transaction.interestPortion * (rate.percentage / 100)) / (scope.totalRatePercentage))
                      / (1 + (scope.tax ? scope.tax : 0))).toFixed(fractionDigits)
                };
                scope.details.push(rateDetail);
                if (scope.tax) {
                  var rateTaxDetail = {
                    description: 'IVA',
                    containsAmount: true,
                    boldTitle: false,
                    amount: (rateDetail.amount * scope.tax).toFixed(fractionDigits)
                  };
                  scope.details.push(rateTaxDetail);
                }
              });
              //Set total amount for rates
              var totalRateDetail = {
                description: 'label.view.interestspaymentTotal',
                containsAmount: true,
                boldTitle: true,
                isTotal: true,
                align: 'right',
                amount: scope.transaction.interestPortion.toFixed(fractionDigits)
              };
              scope.details.push(totalRateDetail);
            }

              //add VAT interest amount
              if (scope.transaction.vatOnInterest)  {
                    var vatInterestDetail = {
                        description: 'label.view.vatInterestPayment',
                        containsAmount: true,
                        boldTitle: true,
                        align: 'left',
                        amount: scope.transaction.vatOnInterest.toFixed(fractionDigits)
                    };
                    scope.details.push(vatInterestDetail);
              }

              // add VAT charges amount
                if (scope.transaction.vatOnCharges)  {
                    var vatChargesDetail = {
                        description: 'label.view.vatChargesPayment',
                        containsAmount: true,
                        boldTitle: true,
                        align: 'left',
                        amount: scope.transaction.vatOnCharges.toFixed(fractionDigits)
                    };
                    scope.details.push(vatChargesDetail);
                }

                // add VAT penalty charges amount
                if (scope.transaction.vatOnPenaltyCharges)  {
                    var vatPenaltyDetail = {
                        description: 'label.view.vatPenaltyPayment',
                        containsAmount: true,
                        boldTitle: true,
                        align: 'left',
                        amount: scope.transaction.vatOnPenaltyCharges.toFixed(fractionDigits)
                    };
                    scope.details.push(vatPenaltyDetail);
                }


            //Calculate total amount por charges
            scope.availableCharges = {};
                if (scope.transaction.loanChargePaidByList) {
                    scope.transaction.loanChargePaidByList.forEach(function (data) {
                        var chargePaidBy = {
                          id: data['id'],
                          amount: data['amount'],
                          type: data['name']
                      };
                      if (scope.availableCharges.hasOwnProperty(chargePaidBy.type)) {
                          scope.availableCharges[chargePaidBy.type] = (scope.availableCharges[chargePaidBy.type]
                              + chargePaidBy.amount);
                      } else {
                          scope.availableCharges[chargePaidBy.type] = chargePaidBy.amount;
                      }
                  });
              }

              //Add charge header
              if (Object.keys(scope.availableCharges).length >= 1) {
                  var chargeHeaderDetail = {
                      description: 'label.input.charges',
                      containsAmount: false,
                      boldTitle: true
                  };
                  scope.details.push(chargeHeaderDetail);
              }

              for (var key in scope.availableCharges) {
                  var amount = scope.availableCharges[key];
                  var chargeDetail = {
                      description: key,
                      containsAmount: true,
                      boldTitle: false,
                      amount: amount.toFixed(fractionDigits)
                  };
                  scope.details.push(chargeDetail);
                  if (scope.tax) {
                      var chargeTaxDetail = {
                          description: 'IVA',
                          containsAmount: true,
                          boldTitle: false,
                          amount: (chargeDetail.amount * scope.tax).toFixed(fractionDigits)
                      };
                      scope.details.push(chargeTaxDetail);
                  }
              }

              if (Object.keys(scope.availableCharges).length >= 1) {
                  var chargeTotalDetail = {
                      description: 'Total',
                      containsAmount: true,
                      boldTitle: true,
                      align: 'right',
                      amount: scope.transaction.penaltyChargesPortion.toFixed(fractionDigits)
                  };
                  scope.details.push(chargeTotalDetail);
              }
          };
        }
    });
    mifosX.ng.application.controller('ViewLoanTransactionController', ['$scope', 'ResourceFactory', '$location', '$routeParams', 'dateFilter', '$uibModal', '$rootScope', mifosX.controllers.ViewLoanTransactionController]).run(function ($log) {
        $log.info("ViewLoanTransactionController initialized");
    });
}(mifosX.controllers || {}));
