(function (module) {
    mifosX.controllers = _.extend(module, {
        RestructureCreditsController: function (scope, resourceFactory, routeParams, location, dateFilter,$uibModal) {
            scope.clientId = routeParams.clientId;
            scope.isextenstion = routeParams.isextenstion;
            scope.formData = {};
            scope.currentLoans = [];
            scope.currentLoanData = {};
            scope.loandetails = {};
            scope.inparams = {resourceType: 'template', activeOnly: 'true',clientId:routeParams.clientId};
            scope.formData.clientId = routeParams.clientId;
            scope.chargeFormData = {}; //For charges
            scope.outstandingBalance=0;
            scope.restructureData;
            scope.waiveInterest = false;
            scope.waiveChargesAndFees = false;
            scope.product;
            scope.formData.facValue=0;

            scope.fetchTemplateData = function () {
                resourceFactory.restructurecreditsResource.template({
                    clientId: scope.clientId,
                    isextenstion: scope.isextenstion, locale: scope.optlang.code, dateFormat: scope.df,
                    disbursementDate: dateFilter(scope.formData.disbursementDate, scope.df),
                    anotherResource: 'template'
                }, function (data) {

                    scope.waiveInterest = data.waiveInterest;
                    scope.waiveChargesAndFees = data.waiveChargesAndFees;
                    scope.activeLoans = data.activeLoans;
                    scope.clientData = data.clientData;
                    scope.requestData = data.requestData;
                    scope.loanProductData = data.loanProductData;
                    scope.clientPrequalificatoins = data.clientPrequalificatoins;
                    if (data.requestData) {
                        scope.retrieveLoanProductTemplate(data.requestData);
                        scope.fetchAdditinalDataTemplate()
                    }
                });
            };

            scope.fetchTemplateData();

            scope.$watch('formData.disbursementDate',function(){
                if (scope.formData.disbursementDate)
                    scope.fetchTemplateData();
            });

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


            scope.cancel = function () {
                location.path('/viewclient/' + scope.clientId);
            };
            scope.computeTotalBalance = function () {
                scope.outstandingBalance =scope.formData.totalRequestedAmount? scope.formData.totalRequestedAmount:0;
                for (let i=0; i<scope.activeLoans.length; i++) {
                    if (scope.activeLoans[i].selected){
                        let principalOutstanding = scope.activeLoans[i].summary.principalOutstanding||0;
                        let totalInterestOutstanding = scope.activeLoans[i].summary.interestOutstanding && !scope.waiveInterest ? scope.activeLoans[i].summary.interestOutstanding : 0;
                        let totalFeeChargesOutstanding = scope.activeLoans[i].summary.feeChargesOutstanding && !scope.waiveChargesAndFees ? scope.activeLoans[i].summary.feeChargesOutstanding : 0;
                        let totalPenaltyChargesOutstanding = scope.activeLoans[i].summary.penaltyChargesOutstanding && !scope.waiveChargesAndFees ? scope.activeLoans[i].summary.penaltyChargesOutstanding : 0;
                        let totalOutstandingBalance = Number(principalOutstanding) +
                            Number(totalInterestOutstanding) +
                            Number(totalFeeChargesOutstanding) +
                            Number(totalPenaltyChargesOutstanding);
                        scope.outstandingBalance = (scope.outstandingBalance - Number(totalOutstandingBalance)).toFixed(2)
                    }
                }
            };

            scope.computeOutstanding = function (summary) {
                let principalOutstanding = summary.principalOutstanding||0;
                let totalInterestOutstanding = summary.interestOutstanding && !scope.waiveInterest ? summary.interestOutstanding : 0;
                let totalFeeChargesOutstanding = summary.feeChargesOutstanding && !scope.waiveChargesAndFees ? summary.feeChargesOutstanding : 0;
                let totalPenaltyChargesOutstanding = summary.penaltyChargesOutstanding && !scope.waiveChargesAndFees ? summary.penaltyChargesOutstanding : 0;
                let totalOutstandingBalance = Number(principalOutstanding) +
                    Number(totalInterestOutstanding) +
                    Number(totalFeeChargesOutstanding) +
                    Number(totalPenaltyChargesOutstanding);
                return totalOutstandingBalance;
            };

            scope.retrieveLoanProductTemplate = function (requestData) {
                scope.inparams.productId = requestData.productId;
                scope.formData.productId = requestData.productId;
                scope.inparams.templateType = 'individual';
                scope.formData.loanType = 'individual';

                scope.inparams.staffInSelectedOfficeOnly = true;

                resourceFactory.loanResource.get(scope.inparams, function (data) {
                    scope.loanaccountinfo = data;
                    scope.product = data.product;

                    scope.previewClientLoanAccInfo();
                    scope.loandetails.interestValue = scope.loanaccountinfo.interestType.value;
                    scope.loandetails.amortizationValue = scope.loanaccountinfo.amortizationType.value;
                    scope.loandetails.interestCalculationPeriodValue = scope.loanaccountinfo.interestCalculationPeriodType.value;
                    scope.loandetails.transactionProcessingStrategyValue = scope.formValue(scope.loanaccountinfo.transactionProcessingStrategyOptions, scope.formData.transactionProcessingStrategyId, 'id', 'name');
                    scope.datatables = data.datatables;
                    scope.handleDatatables(scope.datatables);
                    scope.disabled = false;
                    scope.productType = scope.product.ownerTypeOption.value;
                });

                resourceFactory.loanResource.get({
                    resourceType: 'template',
                    templateType: 'collateral',
                    productId: requestData.productId,
                    clientId: scope.clientId,
                    fields: 'id,loanCollateralOptions'
                }, function (data) {
                    scope.collateralOptions = data.loanCollateralOptions || [];
                });
            };

            scope.formValue = function (array, model, findattr, retAttr) {
                findattr = findattr ? findattr : 'id';
                retAttr = retAttr ? retAttr : 'value';
                console.log("finding: "+findattr, retAttr, model);
                return _.find(array, function (obj) {
                    return obj[findattr] === model;
                })[retAttr];
            };

            scope.removeLoan = function (index) {
                scope.currentLoans.splice(Number(index), 1)
                scope.calculateTotals()
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

                            if (datatable.columnHeaderData[i].columnDisplayType == 'DATETIME') {
                                scope.formDat.datatables[index].data[datatable.columnHeaderData[i].columnName] = {};
                            }
                        });
                    });
                }
            };



            scope.resolveDateTime = function (dateTime) {
                if (dateTime){
                    let year = dateTime[0]
                    let month = dateTime[1].toString().padStart(2,'0');
                    let date = dateTime[2].toString().padStart(2,'0');
                    let hour = dateTime[3].toString().padStart(2,'0');
                    let minute = dateTime[4].toString().padStart(2,'0');
                    let seconds = dateTime[5].toString().padStart(2,'0');
                    return ""+ year +"-"+ month+"-"+ date+" "+ hour+":"+ minute+":"+ seconds;
                }
            };

            scope.submit = function () {
                console.log("selected loans: \n\n"+ JSON.stringify(scope.activeLoans))
                let selectedLoans = []
                for (let i=0; i<scope.activeLoans.length; i++){
                    if (scope.activeLoans[i].selected){
                        selectedLoans.push(scope.activeLoans[i].id)
                    }
                };

                var disbursementDate = dateFilter(scope.formData.disbursementDate, scope.dft);


                let formData = {
                    ...this.formData,
                    clientId:scope.clientId,
                    selectedLoanIds: selectedLoans,
                    disbursementDate: disbursementDate,
                    outstandingBalance: scope.outstandingBalance,
                    prequalificationId: scope.formData.prequalificationId,
                    locale : scope.optlang.code,
                    dateFormat: scope.dft
                }

                resourceFactory.restructurecreditsResource.save({clientId:scope.clientId},formData,function(data){
                    location.path('/viewclient/' + scope.clientId);
                });


            };

            scope.processRequest = function (action) {
                scope.action = action;
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
                $uibModal.open({
                    templateUrl: 'processRequest.html',
                    controller: ProcessRequestCtrl
                });
            }

            var ProcessRequestCtrl = function ($scope, $uibModalInstance) {
                $scope.action = scope.action;
                scope.formData.principal = scope.requestData.totalLoanAmount;
                $scope.processRequest = function () {

                    let formData = {
                        requestId:scope.requestData.id,
                        transactionDate : dateFilter(new Date(), scope.df),
                        notes : scope.requestData.comments,
                        locale : scope.optlang.code,
                        dateFormat: scope.df,
                        loanData: scope.formData
                    };

                    console.log("final sending : "+ JSON.stringify(formData));

                    resourceFactory.restructurecreditsResource.save({clientId:scope.clientId, anotherresource: scope.action}, formData, function (data) {
                        $uibModalInstance.close('delete');
                        location.path('/viewclient/' + scope.clientId);
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
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
                scope.formData.principal = scope.loanaccountinfo.principal;
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
                scope.loandetails.interestValue = scope.loanaccountinfo.interestType.value;
                scope.formData.interestCalculationPeriodType = scope.loanaccountinfo.interestCalculationPeriodType.id;
                scope.loandetails.interestCalculationPeriodValue = scope.loanaccountinfo.interestCalculationPeriodType.value;
                scope.formData.allowPartialPeriodInterestCalcualtion = scope.loanaccountinfo.allowPartialPeriodInterestCalcualtion;
                scope.formData.inArrearsTolerance = scope.loanaccountinfo.inArrearsTolerance;
                scope.formData.graceOnPrincipalPayment = scope.loanaccountinfo.graceOnPrincipalPayment;
                scope.formData.graceOnInterestPayment = scope.loanaccountinfo.graceOnInterestPayment;
                scope.formData.graceOnArrearsAgeing = scope.loanaccountinfo.graceOnArrearsAgeing;
                scope.formData.transactionProcessingStrategyId = scope.loanaccountinfo.transactionProcessingStrategyId;
                scope.loandetails.transactionProcessingStrategyValue = scope.formValue(scope.loanaccountinfo.transactionProcessingStrategyOptions, scope.formData.transactionProcessingStrategyId, 'id', 'name');
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
                // console.log("prods: \n\n"+ JSON.stringify(scope.products));
                // scope.loandetails.productName = scope.formValue(scope.products, scope.formData.productId, 'id', 'name');
                scope.formData.rates = scope.loanaccountinfo.product.rates;
                if (scope.formData.rates && scope.formData.rates.length > 0) {
                    scope.rateFlag = true;
                }
                scope.rateOptions = [];

                console.log("form data to send: "+ JSON.stringify(scope.formData));
            };

            scope.selectedPrequalification = function (index) {
                console.log("selected prequalification: "+ index);
                //filter clientPrequalificatoins to get the selected prequalification where id = index
                let selectedPrequalification = scope.clientPrequalificatoins.filter(prequalification => prequalification.id == index)[0];

                this.formData.productId = selectedPrequalification.productId;
                this.formData.totalRequestedAmount = selectedPrequalification.totalRequestedAmount;
                scope.outstandingBalance = selectedPrequalification.totalRequestedAmount;

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

            scope.calculateTotals = function (){
                scope.formData.totalExternalLoanAmount = 0;
                scope.formData.totalInstallments = 0;
                angular.forEach(scope.currentLoans, function (currentLoan, index) {
                    scope.formData.totalExternalLoanAmount += Number(currentLoan.totalLoanBalance?Number(currentLoan.totalLoanBalance):0);
                    scope.formData.totalInstallments += Number(currentLoan.charges?Number(currentLoan.charges):0);
                });
            }

            scope.addCurrentLoansDetails = function () {
                scope.currentLoans.push(scope.currentLoanData);
                scope.currentLoanData = {}

                scope.formData.externalLoans = scope.currentLoans;
                scope.calculateTotals();
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

        }

    });
    mifosX.ng.application.controller('RestructureCreditsController', ['$scope', 'ResourceFactory', '$routeParams', '$location', 'dateFilter','$uibModal', mifosX.controllers.RestructureCreditsController]).run(function ($log) {
        $log.info("RestructureCreditsController initialized");
    });
}(mifosX.controllers || {}));
