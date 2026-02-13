(function (module) {
    mifosX.controllers = _.extend(module, {
        NewLoanAccAppController: function (scope, routeParams, resourceFactory, location,$uibModal, dateFilter, uiConfigService, WizardHandler, translate, API_VERSION, Upload, $rootScope, $timeout) {
            scope.previewRepayment = false;
            scope.clientId = routeParams.clientId;
            scope.draftId = routeParams.draftId;
            scope.draftpayload = {};
            scope.groupId = routeParams.groupId;
            scope.restrictDate = new Date();
            scope.formData = {};
            scope.loandetails = {};
            scope.chargeFormData = {}; //For charges
            scope.collateralFormData = {}; //For collaterals
            scope.inparams = {resourceType: 'template', activeOnly: 'true'};
            scope.date = {};
            scope.formDat = {};
            scope.datatables = [];
            scope.noOfTabs = 1;
            scope.step = '-';
            scope.draftStep = '-';
            scope.formData.datatables = [];
            scope.formDat.datatables = [];
            scope.tf = "HH:mm";
            scope.loanApp = "LoanApp";
            scope.customSteps = [];
            scope.tempDataTables = [];
            scope.disabled = true;
            scope.translate = translate;
            scope.rateFlag = false;
            scope.collateralAddedDataArray = [];
            scope.currentLoans = [];
            scope.collateralsData = {};
            scope.addedCollateral = {};
            scope.currentLoanData = {};
            scope.currentLoanDocs = {}
            scope.loanDocuments = [];
            scope.draftDocuments = [];
            scope.paeLoandocuments = [];
            scope.draftPaeDocuments = {};
            scope.guarantyFiles = [];
            scope.paeRequiredGuaranteeOptions;
            scope.paeRequiredGuaranteeDocuments=[];
            scope.requiresGuaranteeDocuments = false;
            scope.product;
            scope.clientHousingType;
            scope.formData.totalExternalLoanAmount =0;
            scope.formData.totalInstallments =0
            scope.unrestrictedDateOptions = {
                minDate: null,
                maxDate: null
            };
            scope.institutionTypeOptions = [
                {id:1,code:"MICROFINANCE",description:"Micro Finance"}
            ];
            scope.loanStatusOptions = [
                {id:1,code:"ACTIVE",description:"ACTIVE"}
            ];

            scope.date.first = new Date();
            scope.date.fifth = new Date();

            if (scope.clientId) {
                scope.inparams.clientId = routeParams.clientId;
                scope.formData.clientId = routeParams.clientId;
            }


            if (scope.groupId) {
                scope.inparams.groupId = scope.groupId;
                scope.formData.groupId = scope.groupId;
            }

            if (scope.clientId && scope.groupId) {
                scope.inparams.templateType = 'jlg';
            } else if (scope.groupId) {
                scope.inparams.templateType = 'group';
            } else if (scope.clientId) {
                scope.inparams.templateType = 'individual';
            }

            scope.inparams.staffInSelectedOfficeOnly = true;
            scope.currencyType;

            scope.validateAgeLimit = function (productId) {

                if (scope.clientId) {
                    resourceFactory.loanAgeLimitResource.validateAge({clientId: routeParams.clientId, productId: productId}, function (data) {
                        console.log("age limit response: "+ data.value)
                        if (data.value === 'WARNING') {
                            $uibModal.open({
                                templateUrl: 'ageLimitWarning.html',
                                controller: AgeLimitCtrl,
                            });
                        } else if (data.value === 'BLOCK') {
                            $uibModal.open({
                                templateUrl: 'ageLimitBlock.html',
                                controller: AgeLimitCtrl,
                            });
                            scope.cancel();
                        }
                    });
                }
            }

            scope.onGuarantorTypeChange = function(columnHeader, datatable){

                console.log(columnHeader);
            

                if(columnHeader.columnName !== 'guarantorType_cd_tipo_fiador_tercero' && columnHeader.columnName !== 'guarantee_cd_tipo_garantia'){
                    return;
                }

                let dtIndex = scope.datatables.indexOf(datatable);

                let selectedId =
                    scope.formData.datatables[dtIndex]
                    .data[columnHeader.columnName];

                let selectedOption = columnHeader.columnValues.find(v => v.id == selectedId);

                if(!selectedOption) return;

                let guarantorName = selectedOption.value.toLowerCase().trim();
                scope.paeRequiredGuaranteeOptions.forEach(function(option){

                    let optionName = option.name.toLowerCase().trim();

                    if(optionName === guarantorName){
                        option.selected = true;
                    }

                    if(optionName === 'documentacion deudora'){
                        option.selected = true;
                        option.locked = true;
                        return;
                    }

                });

            };


            scope.setAllNo = function () {

                if(!scope.datatables || !scope.formData.datatables){
                    return;
                }

                angular.forEach(scope.datatables, function(datatable, dtIndex){

                    let tableData = scope.formData.datatables[dtIndex];
                    if(!tableData || !tableData.data) return;

                    angular.forEach(datatable.columnHeaderData, function(column){

                        // BOOLEAN
                        if(column.columnDisplayType === 'BOOLEAN'){
                            tableData.data[column.columnName] = false;
                        }

                        // SELECT (SI / NO)
                        if(column.columnValues && column.columnValues.length){

                            let noOption = column.columnValues.find(function(opt){

                                if(!opt.value) return false;

                                let v = opt.value.toString().toLowerCase();

                                return v === 'no'
                                    || v === 'false'
                                    || v === 'n';
                            });

                            if(noOption){
                                tableData.data[column.columnName] =
                                    noOption.id !== undefined
                                        ? noOption.id
                                        : noOption.value;
                            }
                        }

                    });

                });
            };


            var AgeLimitCtrl = function ($scope, $uibModalInstance) {
                $scope.loanProduct = scope.product;

                $scope.continue = function () {
                    $uibModalInstance.dismiss('cancel');
                };

                $scope.doNothing = function (){
                    if (scope.groupId) {
                        location.path('/viewgroup/' + scope.groupId);
                    } else if (scope.clientId) {
                        location.path('/viewclient/' + scope.clientId);
                    }
                    $uibModalInstance.dismiss('cancel');
                }

                $scope.cancel = function () {
                    if (scope.groupId) {
                        location.path('/viewgroup/' + scope.groupId);
                    } else if (scope.clientId) {
                        location.path('/viewclient/' + scope.clientId);
                    }
                    $uibModalInstance.dismiss('cancel');
                };
            }

            resourceFactory.loanResource.get(scope.inparams, function (data) {
                scope.products = data.productOptions;
                scope.ratesEnabled = data.isRatesEnabled;

                if (data.clientName) {
                    scope.clientName = data.clientName;
                }
                if (data.group) {
                    scope.groupName = data.group.name;
                }
            });

            if(scope.groupId){
                resourceFactory.groupResource.get({groupId: scope.groupId, associations: 'all'}, function (data) {
                    scope.prequalificationOptions = data.prequalificationGroups;
                });
            }

            if(scope.clientId){
              resourceFactory.clientResource.get({clientId: scope.clientId}, function (data) {
                 scope.prequalificationOptions = data.clientPrequalifications;
                 scope.clientData = data;

                 scope.formData.fullName = data.displayName;
                 scope.formData.maidenName = data.detailData.maidenName;
                 scope.formData.nationality = data.detailData.nationality;
                 scope.formData.language = data.detailData.languages;
                 scope.formData.occupancyClassification = Number(data.detailData.economicSector);
                  let clientContactInformation = data.clientContactInformation;
                  if (clientContactInformation){
                     scope.clientHousingType = clientContactInformation.housingType;
                     scope.formData.yearsInCommunity = Number(clientContactInformation.communityYears);
                 }
                 scope.date.sixth = new Date(data.dateOfBirth);
                 scope.formData.phoneNumber = data.mobileNo;
                 scope.formData.dpi = data.dpiNumber;
                 scope.formData.nit = data.nit;
                 scope.formData.jobType = data.jobType;
                 scope.formData.educationLevel = data.educationLevel;
                 scope.formData.maritalStatus = data.maritalStatus;
              });
            }

            scope.prequalificationChange = function (prequalificationId){
                resourceFactory.prequalificationResource.get({groupId: prequalificationId}, function (data) {
                    var loanProductId = data.productId;
                    scope.groupId = data.linkedGroupId
                    if(data.prequalificationType){
                        scope.prequalificationType = data.prequalificationType.value;
                    }
                    if(scope.clientId){
                        var groupMembers = data.groupMembers;
                        if(groupMembers.length > 0){
                            for(var i = 0; i < groupMembers.length; i++){
                                if(groupMembers[i].dpi === scope.clientData.dpiNumber){
                                   scope.totalApprovedAmount = groupMembers[i].requestedAmount;
                                }
                            }
                        }
                    } else {
                       scope.totalApprovedAmount = data.totalApprovedAmount ? data.totalApprovedAmount : data.totalApprovedAmount;
                    }
                    scope.loanProductChange(loanProductId);
                });
            }
           scope.resolveFrequencyDayOfWeek = function (meetingDay){
               if(meetingDay == 'Lunes'){
                    scope.disableDaySelect = true;
                    return 1;
                }if(meetingDay == 'Martes'){
                   scope.disableDaySelect = true;
                   return 2;
                }if(meetingDay == 'Miércoles'){
                   scope.disableDaySelect = true;
                   return 3;
                }if(meetingDay == 'Jueves'){
                   scope.disableDaySelect = true;
                   return 4;
                }
            } ;

            scope.loanProductChange = function (loanProductId) {
                // _.isUndefined(scope.datatables) ? scope.tempDataTables = [] : scope.tempDataTables = scope.datatables;
                // WizardHandler.wizard().removeSteps(1, scope.tempDataTables.length);
                scope.inparams.productId = loanProductId;
                scope.inparams.groupId = scope.groupId;
                resourceFactory.clientcollateralTemplateResource.getAllCollaterals({
                    clientId: routeParams.clientId,
                    prodId: loanProductId
                }, function (data) {
                    scope.collateralsData = data;
                    scope.collateralsData = scope.collateralsData.filter((collateral) => collateral.quantity != 0);
                });
                // scope.datatables = [];
                resourceFactory.loanResource.get(scope.inparams, function (data) {
                    scope.loanaccountinfo = data;
                    scope.product = data.product;
                    scope.validateAgeLimit(loanProductId);
                    scope.previewClientLoanAccInfo();
                    scope.fetchAdditinalDataTemplate();
                    if (data.product.ownerTypeOption.value ==='Group'){
                        if (data.group){
                            scope.formData.repaymentFrequencyDayOfWeekType = scope.resolveFrequencyDayOfWeek(data.group.meetingDayName)
                            if (data.group.meetingFrequencyRange){
                                scope.disableFrequencySelect = true;
                                scope.formData.repaymentFrequencyNthDayType = data.group.meetingFrequencyRange
                            }
                        }
                    }
                    scope.loandetails.interestValue = scope.loanaccountinfo.interestType.code;
                    scope.loandetails.amortizationValue = scope.loanaccountinfo.amortizationType.code;
                    scope.loandetails.interestCalculationPeriodValue = scope.loanaccountinfo.interestCalculationPeriodType.code;
                    scope.loandetails.transactionProcessingStrategyValue = scope.formValue(scope.loanaccountinfo.transactionProcessingStrategyOptions, scope.formData.transactionProcessingStrategyId, 'id', 'code');
                    scope.datatables = data.datatables;
                    scope.handleDatatables(scope.datatables);
                    if (scope.draftPayload?.datatables && scope.formData.datatables) {
                        scope.draftPayload.datatables.forEach(savedDt => {

                            const liveDt = scope.formData.datatables
                                .find(dt => dt.registeredTableName === savedDt.registeredTableName);

                            if (liveDt) {
                                liveDt.data = angular.copy(savedDt.data);
                            }
                        });
                    }

                    scope.disabled = false;
                    scope.paeRequiredGuaranteeOptions = data.paeRequiredGuaranteeOptions;

                    if (scope.draftPayload) {
                        $timeout(function () {
                            hydrateDraft(scope.draftPayload);
                            if (scope.draftStep) {
                                WizardHandler.wizard().goTo(scope.draftStep);
                            }
                        }, 0);
                    }

                    scope.paeRequiredGuaranteeOptions.forEach(function(option) {
                        if(option.name === 'Documentacion Deudora'){
                            option.selected = true;
                            option.locked = true;
                        }
                    });

                });

                resourceFactory.loanResource.get({
                    resourceType: 'template',
                    templateType: 'collateral',
                    productId: loanProductId,
                    fields: 'id,loanCollateralOptions'
                }, function (data) {
                    scope.collateralOptions = data.loanCollateralOptions || [];
                });

            }

            scope.$watch(
                function () {
                    return scope.loanaccountinfo && scope.loanaccountinfo.loanPurposeOptions;
                },
                function (options) {
                    if (!options || !options.length || !scope.draftPayload) {
                        return;
                    }

                    var id = Number(scope.draftPayload.loanPurposeId);

                    if (options.some(o => o.id === id)) {
                        scope.formData.loanPurposeId = id;
                    }
                }
            );


            scope.goNext = function (form) {
                WizardHandler.wizard().checkValid(form);
            }
            scope.extractExtraData = function (extraData) {
                return extraData;
            }

            scope.fetchAdditinalDataTemplate = function () {
                resourceFactory.loanResource.get({
                    resourceType: 'template',
                    templateType: 'groupAdditionals'
                }, function (data) {
                    scope.loanCycleCompletedOptions = data.loanCycleCompletedOptions || [];
                    scope.loanPurposeOptions = data.loanPurposeOptions || [];
                    scope.businessEvolutionOptions = data.businessEvolutionOptions || [];
                    scope.yesnoOptions = data.yesnoOptions || [];
                    scope.businessExperienceOptions = data.businessExperienceOptions || [];
                    scope.businessLocationOptions = data.businessLocationOptions || [];
                    scope.clientTypeOptions = data.clientTypeOptions || [];
                    scope.loanStatusOptions = data.loanStatusOptions || [];
                    scope.institutionTypeOptions = data.institutionTypeOptions || [];
                    scope.housingTypeOptions = data.housingTypeOptions || [];
                    if (data.housingTypeOptions && scope.clientHousingType){
                        console.log("going to set housing type: "+ scope.clientHousingType)
                        scope.housingTypeOptions.filter((housingType) => {
                            if (housingType.description === scope.clientHousingType){
                                scope.formData.housingType = housingType.id;
                            }
                        });

                    }
                    scope.classificationOptions = data.classificationOptions || [];
                    scope.economicSectorOptions = data.economicSectorOptions || [];
                    scope.jobTypeOptions = data.jobTypeOptions || [];
                    scope.educationLevelOptions = data.educationLevelOptions || [];
                    scope.maritalStatusOptions = data.maritalStatusOptions || [];
                    scope.groupPositionOptions = data.groupPositionOptions || [];
                    scope.sourceOfFundsOptions = data.sourceOfFundsOptions || [];
                    scope.cancellationReasonOptions = data.cancellationReasonOptions || [];
                    scope.facilitatorOptions = data.facilitatorOptions || [];
                    scope.documentTypeOptions = data.documentTypeOptions || [];
                });
            }

            scope.addCurrentLoansDetails = function () {
                scope.currentLoans.push(scope.currentLoanData);
                scope.currentLoanData = {}

                scope.formData.externalLoans = scope.currentLoans;
                scope.calculateTotals();
            }

            scope.addLoanDocuments = function () {
                scope.loanDocuments.push(scope.currentLoanDocs);
                scope.currentLoanDocs = {}
            }

            scope.onFileSelect = function (files) {
                scope.currentLoanDocs.file = files[0];
            };

            scope.removeDoc = function (files) {
                scope.currentLoanDocs.file = files[0];
                scope.loanDocuments.splice(Number(index), 1)
            };

            scope.calculateTotals = function (){
                scope.formData.totalExternalLoanAmount = 0;
                scope.formData.totalInstallments = 0;
                angular.forEach(scope.currentLoans, function (currentLoan, index) {
                    scope.formData.totalExternalLoanAmount += Number(currentLoan.totalLoanBalance?Number(currentLoan.totalLoanBalance):0);
                    scope.formData.totalInstallments += Number(currentLoan.charges?Number(currentLoan.charges):0);
                });
            }

            scope.handleDatatables = function (datatables) {
                if (!_.isUndefined(datatables) && datatables.length > 0) {
                    scope.formData.datatables = [];
                    scope.formDat.datatables = [];
                    scope.noOfTabs = datatables.length + 1;
                    angular.forEach(datatables, function (datatable, index) {
                        scope.updateColumnHeaders(datatable.columnHeaderData);
                        angular.forEach(datatable.columnHeaderData, function (colHeader, i) {
                            if (_.isEmpty(scope.formDat.datatables[index])) {
                                scope.formDat.datatables[index] = {data: {}};
                            }

                            if (_.isEmpty(scope.formData.datatables[index])) {
                                scope.formData.datatables[index] = {
                                    registeredTableName: datatable.registeredTableName,
                                    data: {locale: scope.optlang.code}
                                };
                            }

                            if (datatable.columnHeaderData[i].columnDisplayType == 'DATETIME' ||datatable.columnHeaderData[i].columnDisplayType == 'DATE' ) {
                                let column = datatable.columnHeaderData[i];
                                let columnName = column.columnName;

                                // FECHA DE HOY SIN HORA
                                let today = new Date();
                                today.setHours(0,0,0,0);


                                // DATE
                                if (column.columnDisplayType === 'DATE') {

                                    scope.formDat.datatables[index].data[columnName] = new Date(today);
                                }


                                // DATETIME
                                if (column.columnDisplayType === 'DATETIME') {

                                    scope.formDat.datatables[index].data[columnName] = {
                                        date: new Date(today),
                                        time: new Date()
                                    };
                                }
                            }
                        });
                    });
                }
            };

            scope.updateColumnHeaders = function (columnHeaderData) {
                var colName = columnHeaderData[0].columnName;
                if (colName == 'id') {
                    columnHeaderData.splice(0, 1);
                }

                colName = columnHeaderData[0].columnName;
                if (colName == 'client_id' || colName == 'office_id' || colName == 'group_id' || colName == 'center_id' || colName == 'loan_id' || colName == 'savings_account_id') {
                    columnHeaderData.splice(0, 1);
                }
            };
            //Wizard is creating new scope on every step. So resetting the variable here
            scope.resetPreviewFlag = function () {
                scope.previewRepayment = !scope.previewRepayment;
            };

            scope.previewClientLoanAccInfo = function () {
                scope.previewRepayment = false;
                scope.charges = scope.loanaccountinfo.charges || [];
                scope.formData.disbursementData = scope.loanaccountinfo.disbursementDetails || [];
                scope.collaterals = [];

                if (scope.loanaccountinfo.calendarOptions) {
                    scope.formData.syncRepaymentsWithMeeting = true;
                    scope.formData.syncDisbursementWithMeeting = true;
                }
                scope.multiDisburseLoan = scope.loanaccountinfo.multiDisburseLoan;
                scope.formData.productId = scope.loanaccountinfo.loanProductId;
                scope.formData.fundId = scope.loanaccountinfo.fundId;
                scope.formData.principal = scope.totalApprovedAmount ? scope.totalApprovedAmount : scope.loanaccountinfo.principal;
                scope.formData.loanTermFrequency = scope.loanaccountinfo.termFrequency;
                scope.formData.loanTermFrequencyType = scope.loanaccountinfo.termPeriodFrequencyType.id;
                scope.loandetails.loanTermFrequencyValue = scope.loanaccountinfo.termPeriodFrequencyType.value;
                scope.formData.numberOfRepayments = scope.loanaccountinfo.numberOfRepayments;
                scope.formData.repaymentEvery = scope.loanaccountinfo.repaymentEvery;
                scope.formData.repaymentFrequencyType = scope.loanaccountinfo.repaymentFrequencyType.id;
                scope.loandetails.repaymentFrequencyValue = scope.loanaccountinfo.repaymentFrequencyType.value;
                scope.formData.interestRatePerPeriod = scope.loanaccountinfo.interestRatePerPeriod;
                scope.formData.amortizationType = scope.loanaccountinfo.amortizationType.id;
                scope.formData.fixedPrincipalPercentagePerInstallment = scope.loanaccountinfo.fixedPrincipalPercentagePerInstallment;
                scope.formData.isEqualAmortization = scope.loanaccountinfo.isEqualAmortization;
                scope.loandetails.amortizationValue = scope.loanaccountinfo.amortizationType.value;
                scope.formData.interestType = scope.loanaccountinfo.interestType.id;
                scope.loandetails.interestValue = scope.loanaccountinfo.interestType.code;
                scope.formData.interestCalculationPeriodType = scope.loanaccountinfo.interestCalculationPeriodType.id;
                scope.loandetails.interestCalculationPeriodValue = scope.loanaccountinfo.interestCalculationPeriodType.code;
                scope.formData.allowPartialPeriodInterestCalcualtion = scope.loanaccountinfo.allowPartialPeriodInterestCalcualtion;
                scope.formData.inArrearsTolerance = scope.loanaccountinfo.inArrearsTolerance;
                scope.formData.graceOnPrincipalPayment = scope.loanaccountinfo.graceOnPrincipalPayment;
                scope.formData.graceOnInterestPayment = scope.loanaccountinfo.graceOnInterestPayment;
                scope.formData.graceOnArrearsAgeing = scope.loanaccountinfo.graceOnArrearsAgeing;
                scope.formData.transactionProcessingStrategyId = scope.loanaccountinfo.transactionProcessingStrategyId;
                scope.loandetails.transactionProcessingStrategyValue = scope.formValue(scope.loanaccountinfo.transactionProcessingStrategyOptions, scope.formData.transactionProcessingStrategyId, 'id', 'code');
                scope.formData.graceOnInterestCharged = scope.loanaccountinfo.graceOnInterestCharged;
                scope.formData.fixedEmiAmount = scope.loanaccountinfo.fixedEmiAmount;
                scope.formData.maxOutstandingLoanBalance = scope.loanaccountinfo.maxOutstandingLoanBalance;

                if (scope.loanaccountinfo.isInterestRecalculationEnabled && scope.loanaccountinfo.interestRecalculationData.recalculationRestFrequencyDate) {
                    scope.date.recalculationRestFrequencyDate = new Date(scope.loanaccountinfo.interestRecalculationData.recalculationRestFrequencyDate);
                }
                if (scope.loanaccountinfo.isInterestRecalculationEnabled && scope.loanaccountinfo.interestRecalculationData.recalculationCompoundingFrequencyDate) {
                    scope.date.recalculationCompoundingFrequencyDate = new Date(scope.loanaccountinfo.interestRecalculationData.recalculationCompoundingFrequencyDate);
                }

                if (scope.loanaccountinfo.isLoanProductLinkedToFloatingRate) {
                    scope.formData.isFloatingInterestRate = false;
                }

                scope.loandetails = angular.copy(scope.formData);
                scope.loandetails.productName = scope.formValue(scope.products, scope.formData.productId, 'id', 'name');
                scope.formData.rates = scope.loanaccountinfo.product.rates;
                if (scope.formData.rates && scope.formData.rates.length > 0) {
                    scope.rateFlag = true;
                }
                scope.rateOptions = [];
                if(scope.clientId && scope.formData.caseId){
                    scope.searchText = scope.formData.caseId;
                    scope.searchByCaseId();
                }
            };

            //Rate
            scope.rateSelected = function (currentRate) {

                if (currentRate && !scope.checkIfRateAlreadyExist(currentRate)) {
                    scope.rateFlag = true;
                    scope.formData.rates.push(currentRate);
                    scope.rateOptions.splice(scope.rateOptions.indexOf(currentRate), 1);
                    scope.currentRate = '';
                    currentRate = '';
                    scope.calculateRates();
                }
            };

            scope.checkIfRateAlreadyExist = function (currentRate) {
                var exist = false;
                scope.formData.rates.forEach(function (rate) {
                    if (rate.id === currentRate.id) {
                        exist = true;
                    }
                });

                return exist
            };

            scope.calculateRates = function () {
                var total = 0;
                scope.formData.rates.forEach(function (rate) {
                    total += rate.percentage;
                });
                if (total === 0) {
                    total = undefined;
                    scope.rateFlag = false;
                }
                scope.formData.interestRatePerPeriod = total;


            };

            scope.deleteRate = function (index) {
                scope.rateOptions.push(scope.formData.rates[index]);
                scope.formData.rates.splice(index, 1);
                scope.calculateRates();
            };

            scope.$watch('formData', function (newVal) {
                scope.loandetails = angular.extend(scope.loandetails, newVal);
            }, true);

            scope.formValue = function (array, model, findattr, retAttr) {
                findattr = findattr ? findattr : 'id';
                retAttr = retAttr ? retAttr : 'value';
                console.log(findattr, retAttr, model);
                return _.find(array, function (obj) {
                    return obj[findattr] === model;
                })[retAttr];
            };

            scope.addCharge = function () {
                if (scope.chargeFormData.chargeId) {
                    resourceFactory.chargeResource.get({
                        chargeId: this.chargeFormData.chargeId,
                        template: 'true'
                    }, function (data) {
                        data.chargeId = data.id;
                        scope.charges.push(data);
                        scope.chargeFormData.chargeId = undefined;
                    });
                }
            }

            scope.deleteCharge = function (index) {
                scope.charges.splice(index, 1);
            }


            scope.addTranches = function () {
                scope.formData.disbursementData.push({});
            };
            scope.deleteTranches = function (index) {
                scope.formData.disbursementData.splice(index, 1);
            }

            scope.syncRepaymentsWithMeetingchange = function () {
                if (!scope.formData.syncRepaymentsWithMeeting) {
                    scope.formData.syncDisbursementWithMeeting = false;
                }
            };

            scope.syncDisbursementWithMeetingchange = function () {
                if (scope.formData.syncDisbursementWithMeeting) {
                    scope.formData.syncRepaymentsWithMeeting = true;
                }
            };

            scope.addCollateral = function () {
                scope.collateralAddedDataArray.push(scope.collateralsData.filter((collateral) => scope.collateralFormData.collateralId == collateral.collateralId)[0]);
                scope.collateralsData = scope.collateralsData.filter((collateral) => scope.collateralFormData.collateralId != collateral.collateralId);
                scope.collaterals.push({
                    collateralId: scope.collateralFormData.collateralId,
                    quantity: scope.collateralFormData.quantity,
                    total: scope.collateralFormData.total,
                    totalCollateral: scope.collateralFormData.totalCollateral
                });
            };

            scope.updateValues = function () {
                scope.collateralObject = scope.collateralsData.filter((collateral) => collateral.collateralId == scope.collateralFormData.collateralId)[0];
                scope.collateralFormData.total = scope.collateralFormData.quantity * scope.collateralObject.basePrice;
                scope.collateralFormData.totalCollateral = scope.collateralFormData.total * scope.collateralObject.pctToBase / 100.0;
            }

            scope.deleteCollateral = function (index) {
                scope.collateralId = scope.collaterals[index].collateralId;
                scope.collateralObject = scope.collateralAddedDataArray.filter((collateral) => collateral.collateralId == scope.collateralId)[0];
                scope.collateralsData.push(scope.collateralObject);
                scope.collaterals.splice(index, 1);
            };

            scope.previewRepayments = function () {
                // Make sure charges and collaterals are empty before initializing.
                delete scope.formData.charges;
                delete scope.formData.collateral;
                if (_.isUndefined(scope.formData.datatables) || (!_.isUndefined(scope.formData.datatables) && scope.formData.datatables.length == 0)) {
                    delete scope.formData.datatables;
                }

                var reqFirstDate = dateFilter(scope.date.first, scope.df);
                var reqSecondDate = dateFilter(scope.date.second, scope.df);
                var reqThirdDate = dateFilter(scope.date.third, scope.df);
                var reqFourthDate = dateFilter(scope.date.fourth, scope.df);
                var reqFifthDate = dateFilter(scope.date.fifth, scope.df);
                var reqSixthDate = dateFilter(scope.date.sixth, scope.df);
                if (scope.charges.length > 0) {
                    scope.formData.charges = [];
                    for (var i in scope.charges) {
                        scope.formData.charges.push({
                            chargeId: scope.charges[i].chargeId,
                            amount: scope.charges[i].amount,
                            dueDate: dateFilter(scope.charges[i].dueDate, scope.df)
                        });
                    }
                }

                if (scope.formData.disbursementData.length > 0) {
                    for (var i in scope.formData.disbursementData) {
                        scope.formData.disbursementData[i].expectedDisbursementDate = dateFilter(scope.formData.disbursementData[i].expectedDisbursementDate, scope.df);
                    }
                }

                if (scope.collaterals.length > 0) {
                    scope.formData.collateral = [];
                    for (var i in scope.collaterals) {
                        scope.formData.collateral.push({
                            type: scope.collaterals[i].type,
                            value: scope.collaterals[i].value,
                            description: scope.collaterals[i].description
                        });
                    }
                    ;
                }

                if (this.formData.syncRepaymentsWithMeeting) {
                    this.formData.calendarId = scope.loanaccountinfo.calendarOptions[0].id;
                    scope.syncRepaymentsWithMeeting = this.formData.syncRepaymentsWithMeeting;
                }
                delete this.formData.syncRepaymentsWithMeeting;

                this.formData.interestChargedFromDate = reqThirdDate;
                this.formData.repaymentsStartingFromDate = reqFourthDate;
                if (reqFifthDate){
                    this.formData.dateRequested = reqFifthDate;
                }
                if (reqSixthDate){
                    this.formData.dateOfBirth = reqSixthDate;
                }
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                this.formData.loanType = scope.inparams.templateType;
                this.formData.expectedDisbursementDate = reqSecondDate;
                this.formData.submittedOnDate = reqFirstDate;
                if (this.formData.interestCalculationPeriodType == 0) {
                    this.formData.allowPartialPeriodInterestCalcualtion = false;
                }
                resourceFactory.loanResource.save({command: 'calculateLoanSchedule'}, this.formData, function (data) {
                    scope.repaymentscheduleinfo = data;
                    scope.previewRepayment = true;
                    scope.formData.syncRepaymentsWithMeeting = scope.syncRepaymentsWithMeeting;
                });

            }

            uiConfigService.appendConfigToScope(scope);

            //return input type
            scope.fieldType = function (type) {
                var fieldType = "";
                if (type) {
                    if (type == 'CODELOOKUP' || type == 'CODEVALUE') {
                        fieldType = 'SELECT';
                    } else if (type == 'DATE') {
                        fieldType = 'DATE';
                    } else if (type == 'DATETIME') {
                        fieldType = 'DATETIME';
                    } else if (type == 'BOOLEAN') {
                        fieldType = 'BOOLEAN';
                    } else {
                        fieldType = 'TEXT';
                    }
                }
                return fieldType;
            };

            scope.submit = function (justAssignValues) {
                // if (WizardHandler.wizard().getCurrentStep() != scope.noOfTabs) {
                //     WizardHandler.wizard().next();
                //     return;
                // }
                // Make sure charges and collaterals are empty before initializing.
                delete scope.formData.charges;
                delete scope.formData.collateral;
                var reqFirstDate = dateFilter(scope.date.first, scope.df);
                var reqSecondDate = dateFilter(scope.date.second, scope.df);
                var reqThirdDate = dateFilter(scope.date.third, scope.df);
                var reqFourthDate = dateFilter(scope.date.fourth, scope.df);
                var reqFifthDate = dateFilter(scope.date.fifth, scope.df);
                var reqSixthDate = dateFilter(scope.date.sixth, scope.df);

                if (scope.charges.length > 0) {
                    scope.formData.charges = [];
                    for (var i in scope.charges) {
                        scope.formData.charges.push({
                            chargeId: scope.charges[i].chargeId,
                            amount: scope.charges[i].amount,
                            dueDate: dateFilter(scope.charges[i].dueDate, scope.df)
                        });
                    }
                }

                if (scope.formData.disbursementData.length > 0) {
                    for (var i in scope.formData.disbursementData) {
                        scope.formData.disbursementData[i].expectedDisbursementDate = dateFilter(scope.formData.disbursementData[i].expectedDisbursementDate, scope.df);
                    }
                }
                if (scope.collaterals.length > 0) {
                    scope.formData.collateral = [];
                    for (var i in scope.collaterals) {
                        scope.formData.collateral.push({
                            clientCollateralId: scope.collaterals[i].collateralId,
                            quantity: scope.collaterals[i].quantity * 1.0
                        });
                    }
                }

                if(this.formData.loanAdditionalData){
                    this.formData.loanAdditionalData.caseId = this.formData.caseId;
                    for (var propertyName in this.formData.loanAdditionalData) {
                        if (this.formData.loanAdditionalData.hasOwnProperty(propertyName)) {
                            if(scope.isAdditionalDateProperty(propertyName)){
                                var propertyValue =  scope.formData.loanAdditionalData[propertyName];
                                scope.formData.loanAdditionalData[propertyName] = dateFilter(propertyValue, scope.df);
                            }
                        }
                    }
                }

                if (this.formData.syncRepaymentsWithMeeting) {
                    this.formData.calendarId = scope.loanaccountinfo.calendarOptions[0].id;
                }
                if(this.formData.loanAdditionalData){
                    this.formData.loanAdditionalData.caseId = this.formData.caseId;
                }
                delete this.formData.syncRepaymentsWithMeeting;
                this.formData.interestChargedFromDate = reqThirdDate;
                this.formData.repaymentsStartingFromDate = reqFourthDate;
                this.formData.dateRequested = reqFifthDate;
                this.formData.dateOfBirth = reqSixthDate;
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                this.formData.loanType = scope.inparams.templateType;
                this.formData.expectedDisbursementDate = reqSecondDate;
                this.formData.submittedOnDate = reqFirstDate;
                this.formData.createStandingInstructionAtDisbursement = scope.formData.createStandingInstructionAtDisbursement;
                if (scope.date.recalculationRestFrequencyDate) {
                    var restFrequencyDate = dateFilter(scope.date.recalculationRestFrequencyDate, scope.df);
                    scope.formData.recalculationRestFrequencyDate = restFrequencyDate;
                }
                if (scope.date.recalculationCompoundingFrequencyDate) {
                    var restFrequencyDate = dateFilter(scope.date.recalculationCompoundingFrequencyDate, scope.df);
                    scope.formData.recalculationCompoundingFrequencyDate = restFrequencyDate;
                }
                if (this.formData.interestCalculationPeriodType == 0) {
                    this.formData.allowPartialPeriodInterestCalcualtion = false;
                }
                if (!_.isUndefined(scope.datatables) && scope.datatables.length > 0) {
                    angular.forEach(scope.datatables, function (datatable, index) {
                        scope.columnHeaders = datatable.columnHeaderData;
                        angular.forEach(scope.columnHeaders, function (colHeader, i) {
                            scope.dateFormat = scope.df + " " + scope.tf
                            if (scope.columnHeaders[i].columnDisplayType == 'DATE') {
                                if (!_.isUndefined(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName])) {
                                    scope.formData.datatables[index].data[scope.columnHeaders[i].columnName] = dateFilter(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName],
                                        scope.dateFormat);
                                    scope.formData.datatables[index].data.dateFormat = scope.dateFormat;
                                }
                            } else if (scope.columnHeaders[i].columnDisplayType == 'DATETIME') {
                                if (!_.isUndefined(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName].date) && !_.isUndefined(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName].time)) {
                                    scope.formData.datatables[index].data[scope.columnHeaders[i].columnName] = dateFilter(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName].date, scope.df)
                                        + " " + dateFilter(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName].time, scope.tf);
                                    scope.formData.datatables[index].data.dateFormat = scope.dateFormat;
                                }
                            }
                        });
                    });
                } else {
                    delete scope.formData.datatables;
                }
                
                if (!justAssignValues) {

                    if (!scope.validatRequiredPaeDocs()){
                        return;
                    } 
                    
                    if (scope.draftId) {
                        this.formData.draftId = scope.draftId;
                    }

                    resourceFactory.loanResource.save(this.formData, function (data) {
                        if(data.loanId){
                            scope.uploadDocuments(data.loanId)
                            scope.uploadPaeDocuments(data.loanId)
                        }
                        location.path('/viewloanaccount/' + data.loanId);
                    });
                } else {
                    scope.uploadDraftDocuments(scope.draftId);
                    scope.uploadDraftPaeDocuments(scope.draftId)
                    .then(function () {
                        scope.partialSave();
                    })
                }
            };

            scope.uploadDocuments = function (loanId){
                for (let i=0; i<scope.loanDocuments.length; i++){
                    let loanDocument = scope.loanDocuments[i];
                    Upload.upload({
                        url: $rootScope.hostUrl + API_VERSION + '/loans/' + loanId + '/documents',
                        data: { name : loanDocument.name, description : loanDocument.description, documentType : loanDocument.documentType, file: loanDocument.file},
                    }).then(function (data) {
                        if (!scope.$$phase) {
                            scope.$apply();
                        }
                    });
                }
            }

            scope.uploadPaeDocuments = function (loanId){
                if (scope.paeRequiredGuaranteeOptions && scope.paeRequiredGuaranteeOptions.length > 0){
                    for (let i=0; i<scope.paeRequiredGuaranteeOptions.length; i++){
                        if (scope.paeRequiredGuaranteeOptions[i].selected){
                            let extraData = scope.paeRequiredGuaranteeOptions[i].extraData;
                            for (let j=0; j<scope.paeRequiredGuaranteeOptions[i].quantity; j++) {
                                if (extraData && extraData.length > 0) {
                                    for (let k = 0; k < extraData.length; k++) {
                                        let requiredDoc = extraData[k];
                                        let key = "GUARANTEEDOC_" + (requiredDoc.id);
                                        let guaranteeDocFile; 
                                        if ( !scope.paeRequiredGuaranteeDocuments[key] || !scope.paeRequiredGuaranteeDocuments[key][j]) {
                                                continue;
                                        }
                                        guaranteeDocFile = scope.paeRequiredGuaranteeDocuments[key][j];

                                        if (!guaranteeDocFile || !guaranteeDocFile.file) {
                                            if (guaranteeDocFile && guaranteeDocFile.name && !guaranteeDocFile.file) {
                                                console.log("Do not save document, it is from draft")
                                                continue;
                                            }
                                            alert('Required guarantee document is not uploaded for guarantee no. ' + (j + 1) + ': ' + requiredDoc.documentName);
                                            return;
                                        }
                                        console.log("\n\n\n===>Uploading guarantee document: ", guaranteeDocFile);

                                        let metaData = guaranteeDocFile.metaData;
                                        let exifdata = guaranteeDocFile.file.exifdata;
                                        if (!metaData && exifdata){
                                            metaData = {};
                                            metaData['DateTime'] = exifdata.DateTime;
                                            exifdata.GPSLatitudeRef?metaData['GPSLatitudeRef']=exifdata.GPSLatitudeRef:"N/A";
                                            exifdata.GPSLatitude?metaData['GPSLatitude']=exifdata.GPSLatitude:"N/A";
                                            exifdata.GPSLongitudeRef?metaData['GPSLongitudeRef']=exifdata.GPSLongitudeRef:"N/A";
                                            exifdata.GPSLongitude?metaData['GPSLongitude']=exifdata.GPSLongitude:"N/A";
                                        }
                                        Upload.upload({
                                            url: $rootScope.hostUrl + API_VERSION + '/paedocumentation/' + loanId + '/paedocument',
                                            data: {
                                                name: guaranteeDocFile.name,
                                                description: `${guaranteeDocFile.name}(GUARANTEE_${j + 1})`,
                                                categoryId: guaranteeDocFile.categoryId,
                                                guaranteeNo: (j+1),
                                                file: guaranteeDocFile.file,
                                                metaData: JSON.stringify(metaData)
                                            },
                                        }).then(function (data) {
                                            if (!scope.$$phase) {
                                                scope.$apply();
                                            }
                                        });
                                    }
                                }

                            }
                        }
                    }
                }
            }

            scope.validatRequiredPaeDocs = function (loanId){
                
                if (scope.paeRequiredGuaranteeOptions && scope.paeRequiredGuaranteeOptions.length > 0){
                    for (let i=0; i<scope.paeRequiredGuaranteeOptions.length; i++){
                        if (scope.paeRequiredGuaranteeOptions[i].selected){
                            let extraData = scope.paeRequiredGuaranteeOptions[i].extraData;
                            if (extraData && extraData.length > 0) {
                                for (let j = 0; j < scope.paeRequiredGuaranteeOptions[i].quantity; j++) {
                                    for (let k = 0; k < extraData.length; k++) {
                                        let requiredDoc = extraData[k];
                                        let key = "GUARANTEEDOC_" + requiredDoc.id;
                                        let guaranteeDocFile;

                                        if (scope.paeRequiredGuaranteeDocuments[key] && scope.paeRequiredGuaranteeDocuments[key][j]) {
                                            guaranteeDocFile = scope.paeRequiredGuaranteeDocuments[key][j];
                                        } 
                                        console.log("guaranteeDocFile: ", guaranteeDocFile)
                                        if (scope.draftId) {

                                            if (requiredDoc.required && (!guaranteeDocFile || !guaranteeDocFile.name)) {
                                                alert('Required guarantee document is not uploaded for guarantee no. ' + (j + 1) + ': ' + requiredDoc.documentName);
                                                return false;
                                            }
                                        } else {
                                            if (requiredDoc.required && (!guaranteeDocFile || !guaranteeDocFile.file)) {
                                                alert('Required guarantee document is not uploaded for guarantee no. ' + (j + 1) + ': ' + requiredDoc.documentName);
                                                return false;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return true;
            }

           scope.searchByCaseId = function () {
               var caseId = this.searchText;
               if(scope.clientId && caseId){
                    delete scope.formData.loanAdditionalData;
                    resourceFactory.individualPrequalificationResource.loanAdditionalData({productId: scope.formData.productId, clientId: scope.clientId, caseId: caseId, locale: scope.optlang.code}, function(data){
                        scope.formData.loanAdditionalData = data;
                        scope.formData.caseId = caseId;
                        if(scope.formData.loanAdditionalData){
                            for (var propertyName in scope.formData.loanAdditionalData) {
                                if (scope.formData.loanAdditionalData.hasOwnProperty(propertyName)) {
                                    if(scope.isAdditionalDateProperty(propertyName)){
                                        var propertyValue =  scope.formData.loanAdditionalData[propertyName];
                                        scope.formData.loanAdditionalData[propertyName] = new Date(propertyValue);
                                        if (propertyName === 'dateOpened') {
                                            scope.formData.loanAdditionalData[propertyName] = new Date(propertyValue.slice(0,3));
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
           }

           scope.isAdditionalDateProperty = function(propertyName){
               var dateFields = ["fechaInicio", "cFechaNacimiento", "fechaPrimeraReunion", "dateOpened", "fechaSolicitud", "fecha_solicitud", "fechaFin", "fecha_estacionalidad", "fecha_inico_operaciones", "fecha_integraciones", "fecha_inventario", "fecha_nacimiento_solicitante", "fecha_nacimiento_solicitante", "fecha_visita","fecha_inicio_negocio"];
                return dateFields.includes(propertyName);
           }
           scope.isDecimalProperty = function(propertyName){
               var decimalFields = ["activoCorriente","activoNocorriente","alimentacion","alquilerCliente","alquilerGasto",
                   "alquilerLocal","bienesInmuebles","bienesInmueblesFamiliares","capacidadPago","comunalVigente",
                   "costoUnitario","costoVenta","cuantoPagar","cuentasPorPagar","cuota","cuotaOtros","cuotaPuente",
                   "cuotasPendientesBc","educacion","efectivo","endeudamientoActual","endeudamientoFuturo","flujoDisponible",
                   "gastosFamiliares","gastosNegocio","herramientas","impuestos","ingresoFamiliar","inventarios","inversionTotal",
                   "menajeDelHogar","mobiliarioYequipo","montoSolicitado","pasivoCorriente","pasivoNoCorriente","pensiones",
                   "prestamoPuente","propuestaFacilitador","relacionGastos","rentabilidadNeta","rotacionInventario","salarioCliente",
                   "salarios","serviciosBasicos","serviciosGasto","serviciosMedicos","tarjetas","totalActivo","totalIngresos",
                   "totalIngresosFamiliares","totalPasivo","transporteGasto","transporteNegocio","utilidadBruta","utilidadNeta",
                   "valorGarantia","vehiculos","vestimenta","ventas","cuentasPorCobrar","hipotecas","montoAutorizado",
                   "capitalDdeTrabajo","montoOtrosIngresos","relacionOtrosIngresos","detalle_compras","detalle_otros_ingresos",
                   "detalle_recuperacion_cuentas","detalle_ventas","efectivo_uso_familia","efectivo_uso_negocio","otros_activos_familia",
                   "otros_activos_negocio","tasa","total_costo_ventas","total_cuentas_por_cobrar","total_cuota_mensual","total_deuda",
                   "total_efectivo","total_gastos_negocio","total_gastos_vivienda","total_inmueble_familia","total_inmueble_negocio",
                   "total_inmuebles","total_inventario","total_maquinaria","total_menaje_de_hogar","total_mobiliario_equipo","total_otros_activos",
                   "total_precio_ventas","total_recibido","total_vehiculos"
               ];
                return decimalFields.includes(propertyName);
           }

            scope.cancel = function () {
                if (scope.groupId) {
                    location.path('/viewgroup/' + scope.groupId);
                } else if (scope.clientId) {
                    location.path('/viewclient/' + scope.clientId);
                }
            }

            scope.countIndex = function (index) {
                return Number(index)+1;
            }

            scope.removeLoan = function (index) {
                scope.currentLoans.splice(Number(index), 1)
                scope.calculateTotals()
            }

            scope.$watch('formData.monthlyIncome', function(){
                scope.calculateTotalIncome();
            });

            scope.$watch('formData.otherIncome', function(){
                scope.calculateTotalIncome();
            });
            scope.$watch('formData.businessProfit', function(){
                scope.calculateTotalIncome();
            });
            scope.$watch('formData.clientProfit', function(){
                scope.calculateTotalIncome();
            });

            scope.calculateTotalIncome = function () {
                scope.formData.totalIncome=0;
                let monthlyIncome = Number(scope.formData.monthlyIncome?scope.formData.monthlyIncome:0);
                let otherIncome = Number(scope.formData.otherIncome?scope.formData.otherIncome:0);
                let businessProfit = Number(scope.formData.businessProfit?scope.formData.businessProfit:0);
                let clientProfit = Number(scope.formData.clientProfit?scope.formData.clientProfit:0);
                scope.formData.totalIncome=(monthlyIncome + otherIncome + (businessProfit< clientProfit?businessProfit:clientProfit));

                return scope.formData.totalIncome;
            }

            scope.$watch('formData.rentFee', function(){
                scope.calculateTotalExpenditure();
            });
            scope.$watch('formData.mortgageFee', function(){
                scope.calculateTotalExpenditure();
            });

            scope.$watch('formData.familyExpenses', function(){
                scope.calculateTotalExpenditure();
            });

            scope.$watch('formData.totalInstallments', function(){
                scope.calculateTotalExpenditure();
            });

            scope.calculateTotalExpenditure = function () {
                scope.formData.totalExpenditures=0;
                let rentFee = Number(scope.formData.rentFee?scope.formData.rentFee:0);
                let mortgageFee = Number(scope.formData.mortgageFee?scope.formData.mortgageFee:0);
                let familyExpenses = Number(scope.formData.familyExpenses?scope.formData.familyExpenses:0);
                let totalInstallments = Number(scope.formData.totalInstallments?scope.formData.totalInstallments:0);
                scope.formData.totalExpenditures=(rentFee + mortgageFee + familyExpenses + totalInstallments);

                return scope.formData.totalExpenditures;
            }

            scope.$watch('formData.totalIncome', function(){
                scope.calculateAvailableMonthly();
            });

            scope.$watch('formData.totalExpenditures', function(){
                scope.calculateAvailableMonthly();
            });

            scope.calculateAvailableMonthly = function () {
                scope.formData.availableMonthly=0;
                let totalIncome = Number(scope.formData.totalIncome?scope.formData.totalIncome:0);
                let totalExpenditures = Number(scope.formData.totalExpenditures?scope.formData.totalExpenditures:0);
                scope.formData.availableMonthly=(totalIncome-totalExpenditures);

                return scope.formData.availableMonthly;
            }

            scope.$watch('formData.monthlyPaymentCapacity', function(){
                scope.calculatePaymentCapacity();
            });
            scope.$watch('formData.availableMonthly', function(){
                scope.calculatePaymentCapacity();
            });

            scope.$watch('formData.proposedFee', function(){
                scope.calculatePaymentCapacity();
            });

            scope.calculatePaymentCapacity = function () {
                scope.formData.paymentCapacity=0;
                let monthlyPaymentCapacity = Number(scope.formData.monthlyPaymentCapacity?scope.formData.monthlyPaymentCapacity:0);
                let availableMonthly = Number(scope.formData.availableMonthly?scope.formData.availableMonthly:0);
                let proposedFee = Number(scope.formData.proposedFee?scope.formData.proposedFee:0);
                let minimumCapacity = monthlyPaymentCapacity < availableMonthly ? monthlyPaymentCapacity : availableMonthly;
                scope.formData.paymentCapacity=(proposedFee/ minimumCapacity).toFixed(1);

                return scope.formData.paymentCapacity;
            }

            scope.$watch('formData.facilitatorProposedValue', function(){
                scope.calculateFacValue();
            });

            scope.$watch('formData.inventories', function(){
                scope.calculateFacValue();
            });

            scope.calculateFacValue = function () {
                scope.formData.facValue=0;
                let facilitatorProposedValue = Number(scope.formData.facilitatorProposedValue?scope.formData.facilitatorProposedValue:0);
                let inventories = Number(scope.formData.inventories?scope.formData.inventories:0);
                scope.formData.facValue=(facilitatorProposedValue/ inventories).toFixed(1);

                return scope.formData.facValue;
            }

            scope.$watch('formData.totalInstallments', function(){
                scope.calculateDebtLevel();
            });

            scope.$watch('formData.availableMonthly', function(){
                scope.calculateDebtLevel();
            });

            scope.calculateDebtLevel = function () {
                scope.formData.debtLevel=0;
                let totalInstallments = Number(scope.formData.totalInstallments?scope.formData.totalInstallments:0);
                let availableMonthly = Number(scope.formData.availableMonthly?scope.formData.availableMonthly:0);
                scope.formData.debtLevel=(totalInstallments/ availableMonthly).toFixed(1);

                return scope.formData.debtLevel;
            }

            scope.$watch('formData.salesValue', function(){
                scope.calculateBusinessProfit(scope.formData.salesValue, scope.formData.businessPurchases)
            });

            scope.$watch('formData.businessPurchases', function(){
                scope.calculateBusinessProfit(scope.formData.salesValue, scope.formData.businessPurchases)
            });

            scope.calculateBusinessProfit = function (sales, purchases) {
                scope.formData.businessProfit=0;
                scope.formData.businessProfit=Number(sales?sales:0) - Number(purchases?purchases:0);
                return scope.formData.businessProfit;
            }
            scope.updateRequiredPrequalificationCount = function (index) {
                let count = 0;
                if (scope.paeRequiredGuaranteeOptions[index].selected){
                    scope.paeRequiredGuaranteeOptions[index].quantity=1;
                }else{
                    scope.paeRequiredGuaranteeOptions[index].quantity=0;
                }
                for (doc in scope.paeRequiredGuaranteeOptions){
                    if (doc.selected){
                        console.log("updated required docs to true")
                        scope.requiresGuaranteeDocuments=true;
                        break;
                    }
                }
            }

            scope.onGuarantyFileSelect = function($files, parentIndex, childIndex, currentDoc){
                // Ensure the array exists
                if (!scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)]) {
                    scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)] = [];
                }

                var file = $files[0];
                var docData = {
                    file: file,
                    name: currentDoc.documentName,
                    description: currentDoc.description,
                    categoryId: currentDoc.categoryId
                };

                // Check if the file is an image
                if (file && file.type && file.type.startsWith('image/')) {
                    // Extract EXIF metadata from the image
                    if (typeof EXIF !== 'undefined') {
                        EXIF.getData(file, function() {
                            var metaData = {};
                            var allMetaData = EXIF.getAllTags(this);

                            // Copy all EXIF tags to metaData object
                            if (allMetaData){
                                metaData['DateTime'] = allMetaData.DateTime;
                                allMetaData.GPSLatitudeRef?metaData['GPSLatitudeRef']=allMetaData.GPSLatitudeRef:"N/A";
                                allMetaData.GPSLatitude?metaData['GPSLatitude']=allMetaData.GPSLatitude:"N/A";
                                allMetaData.GPSLongitudeRef?metaData['GPSLongitudeRef']=allMetaData.GPSLongitudeRef:"N/A";
                                allMetaData.GPSLongitude?metaData['GPSLongitude']=allMetaData.GPSLongitude:"N/A";
                            }

                            // Add metadata to document data
                            docData.metaData = metaData;
                            console.log("EXIF metadata extracted:", metaData);

                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                    } else {
                        console.warn("EXIF library not loaded");
                    }
                }

                // Store the file(s) at the correct index
                scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)][parentIndex] = docData;
                console.log("Files selected for guaranty document upload:",scope.paeRequiredGuaranteeDocuments );

            }

            scope.requiresGuaranteeDocs = function () {
                let requiresGuaranteeDocs = false;
                for (let i=0; i<scope.paeRequiredGuaranteeOptions.length; i++){
                    let guaranteeOption = scope.paeRequiredGuaranteeOptions[i];
                    if (guaranteeOption.selected){
                        requiresGuaranteeDocs = true;
                        break;
                    }
                }
                scope.requiresGuaranteeDocuments =  requiresGuaranteeDocs;
            }

            scope.processAcceptedType= function (typeAccepted){
                if (typeAccepted){
                    //resolve file type for these accepted types
                    if (typeAccepted === 'PDF/IMAGE'){
                        return 'application/pdf,image/*';
                    }
                    else if (typeAccepted === 'PDF'){
                        return 'application/pdf';
                    }
                    else if (typeAccepted === 'WORD'){
                        return 'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    }
                    else if (typeAccepted === 'EXCEL'){
                        return 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    }
                    else if (typeAccepted === 'IMAGE') {
                        return 'image/*';
                    }
                }
            }

            scope.hasDraftGuaranteeDoc = function (requiredDoc, guaranteeIndex) {
                if (!scope.draftPaeDocuments || !requiredDoc) return false;

                return (
                    scope.draftPaeDocuments[requiredDoc.id] &&
                    scope.draftPaeDocuments[requiredDoc.id]
                        .some(d => d.guaranteeNo === (guaranteeIndex + 1))
                );
            };

            scope.getDraftGuaranteeDoc = function (requiredDoc, guaranteeIndex) {
                if (!scope.draftPaeDocuments || !requiredDoc) return null;

                return scope.draftPaeDocuments[requiredDoc.id]
                    ?.find(d => d.guaranteeNo === (guaranteeIndex + 1)) || null;
            };

            scope.uploadDraftDocuments = function (draftId) {

                for (let i = 0; i < scope.loanDocuments.length; i++) {

                    let loanDocument = scope.loanDocuments[i];

                    Upload.upload({
                        url: $rootScope.hostUrl + API_VERSION + '/loanapplicationdraft/' + draftId + '/documents',
                        data: { name : loanDocument.name, description : loanDocument.description, documentType : loanDocument.documentType, file: loanDocument.file},
                    }).then(function (resp) {

                        scope.draftDocuments.push({
                            documentId: resp.data.resourceId,
                            name: loanDocument.file.name,
                            description: loanDocument.description,
                            documentType: loanDocument.documentType
                        });
                    });
                }
            }

            scope.uploadDraftPaeDocuments = function (draftId) {
                if (!draftId) {
                    console.log("First save draft without documents")
                    return Promise.resolve();
                }

                if (!scope.paeRequiredGuaranteeDocuments || Object.keys(scope.paeRequiredGuaranteeDocuments).length === 0) {
                    console.log("Not draft pae documents to upload");
                    return Promise.resolve();
                }

                let uploadPromises = [];
                if (scope.paeRequiredGuaranteeOptions && scope.paeRequiredGuaranteeOptions.length > 0){

                    for (let i=0; i<scope.paeRequiredGuaranteeOptions.length; i++){

                        if (scope.paeRequiredGuaranteeOptions[i].selected){

                            let extraData = scope.paeRequiredGuaranteeOptions[i].extraData;
                            
                            for (let j=0; j<scope.paeRequiredGuaranteeOptions[i].quantity; j++) {

                                if (extraData && extraData.length > 0) {

                                    for (let k = 0; k < extraData.length; k++) {
                                        let requiredDoc = extraData[k];
                                        let key = "GUARANTEEDOC_" + requiredDoc.id;

                                        if ( !scope.paeRequiredGuaranteeDocuments[key] || !scope.paeRequiredGuaranteeDocuments[key][j]) {
                                                continue;
                                        }
                                        let fileWrapper = scope.paeRequiredGuaranteeDocuments[key][j];

                                        if (!fileWrapper || !fileWrapper.file) {
                                            continue;
                                        }
                                        
                                        if (!scope.draftPaeDocuments) {
                                            scope.draftPaeDocuments = {};
                                        }

                                        if (!scope.draftPaeDocuments[requiredDoc.id]) {
                                            scope.draftPaeDocuments[requiredDoc.id] = [];
                                        }

                                        let alreadySaved = false;

                                        if (
                                            scope.draftPaeDocuments &&
                                            scope.draftPaeDocuments[requiredDoc.id]
                                        ) {
                                            alreadySaved = scope.draftPaeDocuments[requiredDoc.id]
                                                .some(d => d.guaranteeNo === (j + 1));
                                        }

                                        if (alreadySaved) {
                                            continue;
                                        }

                                        console.log("\n\n\n===>Uploading guarantee darft document: ", fileWrapper);

                                        let promise = Upload.upload({
                                            url: $rootScope.hostUrl + API_VERSION + '/loanapplicationdraft/' + draftId + '/documents',
                                            data: {
                                                name: fileWrapper.name,
                                                description: `${fileWrapper.name}(GUARANTEE_${j + 1})`,
                                                documentType: fileWrapper.categoryId,
                                                documentPurpose: j + 1,
                                                guaranteeNo: j + 1,
                                                metaData: JSON.stringify(fileWrapper.metaData || {}),
                                                file: fileWrapper.file
                                            }
                                        }).then(function (resp) {
                                            scope.draftPaeDocuments[requiredDoc.id].push({
                                                documentId: resp.data.resourceId,
                                                guaranteeNo: j + 1,
                                                name: fileWrapper.file.name
                                            });

                                        });

                                        uploadPromises.push(promise);
                                    }
                                }
                            }
                        }
                    }
                }
                $timeout(function () {
                    scope.$applyAsync();
                });
                return Promise.all(uploadPromises);
            };


            scope.partialSave = function () {

                //scope.submit(true);

                var payload = angular.copy(scope.formData);

                payload.paeRequiredGuaranteeOptions = angular.copy(scope.paeRequiredGuaranteeOptions);
                payload.paeRequiredGuaranteeDocuments = angular.copy(scope.paeRequiredGuaranteeDocuments);

                payload.documents = scope.draftDocuments;
                payload.paeDocuments = scope.draftPaeDocuments;
                
                if (scope.draftId) {

                    resourceFactory.loanApplicationDraftResource.update(
                        { draftId: scope.draftId },
                        {
                            currentStep: scope.step,
                            loanProductId: scope.formData.productId,
                            payloadJson: angular.toJson(payload)
                        }
                    );

                } else {

                    var requestData = {
                        clientId: scope.clientId,
                        loanProductId: scope.formData.productId,
                        currentStep: scope.step,
                        payloadJson: angular.toJson(payload)
                    };

                    resourceFactory.loanApplicationDraftResource.save(
                        requestData,
                        function (response) {
                            console.log('Saved draft', response);
                            scope.draftId = response.resourceId;
                        },
                        function (error) {
                            console.error('Error saving draft', error);
                        }
                    );
                }
            };


            if (scope.draftId) {
                resourceFactory.loanApplicationDraftResource.get(
                    { draftId: routeParams.draftId },
                    function (data) {
                        scope.draftId = data.id;
                        scope.draftStep = data.currentStep;
                        scope.draftPayload = angular.fromJson(data.payloadJson);
                        scope.prequalificationChange(scope.draftPayload.prequalificationId)
                    }
                );
            }

            function toDate(value) {
                if (!value) {
                    return null;
                }

                var parsed = Date.parse(value);
                if (!isNaN(parsed)) {
                    return new Date(parsed);
                }

                console.warn('Not date parsed automatically:', value);
                return null;
            }

            function hydrateDraft(payload) {
                if (!payload) return;

                angular.merge(scope.formData, payload);

                delete scope.formData.loanDocuments;
                delete scope.formData.paeRequiredGuaranteeOptions;
                delete scope.formData.paeRequiredGuaranteeDocuments;
                delete scope.formData.documents;
                delete scope.formData.paeDocuments;

                scope.date = scope.date || {};

                scope.date.first = toDate(payload.submittedOnDate, payload.dateFormat, payload.locale);
                scope.date.second = toDate(payload.expectedDisbursementDate, payload.dateFormat, payload.locale);
                scope.date.third = toDate(payload.interestChargedFromDate, payload.dateFormat, payload.locale);
                scope.date.fourth = toDate(payload.repaymentsStartingFromDate, payload.dateFormat, payload.locale);
                scope.date.fifth = toDate(payload.dateRequested, payload.dateFormat, payload.locale);
                scope.date.sixth = toDate(payload.dateOfBirth, payload.dateFormat, payload.locale);

                // --- Garantías ---
                if (payload.paeRequiredGuaranteeOptions && payload.paeRequiredGuaranteeOptions.length > 0) {
                    scope.paeRequiredGuaranteeOptions = angular.copy(payload.paeRequiredGuaranteeOptions);
                    scope.requiresGuaranteeDocs();
                }

                // --- Charges ---
                if (payload.charges && payload.charges.length > 0) {
                    scope.charges = payload.charges.map(c => ({
                        chargeId: c.chargeId,
                        amount: c.amount,
                        dueDate: toDate(c.dueDate, payload.dateFormat, payload.locale),
                        name: resolveChargeName(c.chargeId),
                        currency: scope.loanaccountinfo.currency,
                        chargeCalculationType: {},
                        chargeTimeType: {}
                    }));
                }

                // --- Collateral ---
                if (payload.collateral) {
                    scope.collaterals = payload.collateral.map(c => ({
                        collateralId: c.clientCollateralId,
                        quantity: c.quantity
                    }));
                }

                // --- Draft documents ---
                if (payload.documents) {
                    scope.draftDocuments = payload.documents;
                }

                // --- Draft PAE documents ---
                if (payload.paeDocuments) {
                    scope.draftPaeDocuments = payload.paeDocuments;
                }
                
                Object.keys(payload.paeDocuments).forEach(function(docId) {

                    const key = "GUARANTEEDOC_" + docId;

                    scope.paeRequiredGuaranteeDocuments[key] = scope.paeRequiredGuaranteeDocuments[key] || [];

                    payload.paeDocuments[docId].forEach(function(doc) {

                        scope.paeRequiredGuaranteeDocuments[key].push({
                            name: doc.name,
                            documentId: doc.documentId

                        });
                    });
                });

                $timeout(function () {
                    scope.$applyAsync();
                });

            }

            function resolveChargeName(chargeId) {
                if (!scope.loanaccountinfo || !scope.loanaccountinfo.chargeOptions) {
                    return '';
                }

                var match = scope.loanaccountinfo.chargeOptions.find(c => c.id === chargeId);
                return match ? match.name : '';
            }

        }

        

    });
    mifosX.ng.application.controller('NewLoanAccAppController', ['$scope', '$routeParams', 'ResourceFactory', '$location','$uibModal', 'dateFilter', 'UIConfigService', 'WizardHandler', '$translate',  'API_VERSION',  'Upload',  '$rootScope', '$timeout', mifosX.controllers.NewLoanAccAppController]).run(function ($log) {
        $log.info("NewLoanAccAppController initialized");
    });
}(mifosX.controllers || {}));
