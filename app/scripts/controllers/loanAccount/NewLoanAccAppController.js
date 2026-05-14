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

            scope.onGuarantorTypeChange = function(columnHeader, datatable, rowIndex){

                if(columnHeader.columnName !== 'guarantorType_cd_tipo_fiador_tercero' && columnHeader.columnName !== 'guarantee_cd_tipo_garantia'){
                    return;
                }

                var dtIndex = scope.datatables.indexOf(datatable);
                var tableData = scope.formData.datatables[dtIndex].data;
                var selectedId = scope.isDatatableMultiple(datatable) && angular.isNumber(rowIndex)
                    ? tableData[rowIndex][columnHeader.columnName]
                    : tableData[columnHeader.columnName];

                var selectedOption = columnHeader.columnValues.find(function(v){ return v.id == selectedId; });
                if(!selectedOption) return;

                var guarantorName = selectedOption.value.toLowerCase().trim();
                scope.paeRequiredGuaranteeOptions.forEach(function(option){
                    var optionName = option.name.toLowerCase().trim();
                    if(optionName === guarantorName){
                        option.selected = true;
                        option.quantity = 1;
                    }
                    if(optionName === 'documentacion deudora'){
                        option.selected = true;
                        option.locked = true;
                        option.quantity = 1;
                    }
                });
            };

            /**
             * Sincroniza p_fiador desde Guarantee Evaluation: cuando se marcan/desmarcan
             * opciones (Fiador asalariado, Fiador empresario, etc.) o se cambia la cantidad,
             * se crean o quitan registros en p_fiador con el tipo correspondiente.
             */
            scope.syncPFiadorFromGuaranteeEvaluation = function () {
                if (!scope.paeRequiredGuaranteeOptions || !scope.fiadorDatatable || scope.fiadorDatatableIndex == null ||
                    !scope.formData.datatables || !scope.formData.datatables[scope.fiadorDatatableIndex]) {
                    return;
                }
                var fiadorDt = scope.fiadorDatatable;
                var fiadorIndex = scope.fiadorDatatableIndex;
                var colHeader = fiadorDt.columnHeaderData && fiadorDt.columnHeaderData.find(function (c) {
                    return c.columnName === 'guarantorType_cd_tipo_fiador_tercero' || c.columnName === 'guarantee_cd_tipo_garantia';
                });
                if (!colHeader || !colHeader.columnValues || !colHeader.columnValues.length) {
                    return;
                }
                var desired = [];
                scope.paeRequiredGuaranteeOptions.forEach(function (option) {
                    if (!option.selected || !option.quantity || option.locked) { return; }
                    var optionName = (option.name || '').toLowerCase().trim();
                    if (optionName === 'documentacion deudora') { return; }
                    var match = colHeader.columnValues.find(function (v) {
                        return (v.value || '').toLowerCase().trim() === optionName;
                    });
                    if (!match) { return; }
                    var typeId = match.id !== undefined ? match.id : match.value;
                    for (var q = 0; q < option.quantity; q++) {
                        desired.push({ guarantorTypeId: typeId });
                    }
                });
                var currentData = scope.formData.datatables[fiadorIndex].data;
                var currentFormDat = scope.formDat.datatables[fiadorIndex] && scope.formDat.datatables[fiadorIndex].data;
                if (!Array.isArray(currentData)) { currentData = []; }
                if (!Array.isArray(currentFormDat)) { currentFormDat = []; }
                var newData = [];
                var newFormDat = [];
                for (var i = 0; i < desired.length; i++) {
                    var typeId = desired[i].guarantorTypeId;
                    var existingRow = currentData[i];
                    var existingFormDatRow = currentFormDat[i];
                    var existingTypeId = existingRow && (existingRow.guarantorType_cd_tipo_fiador_tercero != null
                        ? existingRow.guarantorType_cd_tipo_fiador_tercero
                        : existingRow.guarantee_cd_tipo_garantia);
                    var newFormDatRow;
                    if (existingRow && existingTypeId == typeId) {
                        newData.push(existingRow);
                        newFormDatRow = existingFormDatRow || {};
                    } else {
                        var newRow = { locale: scope.optlang.code };
                        newFormDatRow = {};
                        angular.forEach(fiadorDt.columnHeaderData, function (col, idx) {
                            if (col.columnName === 'guarantorType_cd_tipo_fiador_tercero' || col.columnName === 'guarantee_cd_tipo_garantia') {
                                newRow[col.columnName] = typeId;
                            }
                            if (fiadorDt.columnHeaderData[idx].columnDisplayType === 'DATE') {
                                var today = new Date();
                                today.setHours(0, 0, 0, 0);
                                newFormDatRow[col.columnName] = new Date(today);
                            } else if (fiadorDt.columnHeaderData[idx].columnDisplayType === 'DATETIME') {
                                var today = new Date();
                                today.setHours(0, 0, 0, 0);
                                newFormDatRow[col.columnName] = { date: new Date(today), time: new Date() };
                            }
                        });
                        newData.push(newRow);
                    }
                    newFormDat.push(newFormDatRow);
                }
                scope.formData.datatables[fiadorIndex].data = newData;
                scope.formDat.datatables[fiadorIndex].data = newFormDat;
                var accordionOpen = {};
                if (newData.length > 0) { accordionOpen[0] = true; }
                scope.datatableAccordionOpen[fiadorIndex] = accordionOpen;
            };

            /**
             * Sincroniza p_garante desde Guarantee Evaluation: cuando se marcan/desmarcan
             * opciones que coinciden con tipos de garantía (guaranteeType_cd_tipo_garantia),
             * se crean o quitan registros en p_garante con el tipo correspondiente.
             */
            scope.syncPGaranteFromGuaranteeEvaluation = function () {
                if (!scope.paeRequiredGuaranteeOptions || !scope.garanteDatatable || scope.garanteDatatableIndex == null ||
                    !scope.formData.datatables || !scope.formData.datatables[scope.garanteDatatableIndex]) {
                    return;
                }
                var garanteDt = scope.garanteDatatable;
                var garanteIndex = scope.garanteDatatableIndex;
                var colHeader = garanteDt.columnHeaderData && garanteDt.columnHeaderData.find(function (c) {
                    return c.columnName === 'guaranteeType_cd_tipo_garantia';
                });
                if (!colHeader || !colHeader.columnValues || !colHeader.columnValues.length) {
                    return;
                }
                var desired = [];
                scope.paeRequiredGuaranteeOptions.forEach(function (option) {
                    if (!option.selected || !option.quantity || option.locked) { return; }
                    var optionName = (option.name || '').toLowerCase().trim();
                    if (optionName === 'documentacion deudora') { return; }
                    var match = colHeader.columnValues.find(function (v) {
                        return (v.value || '').toLowerCase().trim() === optionName;
                    });
                    if (!match) { return; }
                    var typeId = match.id !== undefined ? match.id : match.value;
                    for (var q = 0; q < option.quantity; q++) {
                        desired.push({ guaranteeTypeId: typeId });
                    }
                });
                var currentData = scope.formData.datatables[garanteIndex].data;
                var currentFormDat = scope.formDat.datatables[garanteIndex] && scope.formDat.datatables[garanteIndex].data;
                if (!Array.isArray(currentData)) { currentData = []; }
                if (!Array.isArray(currentFormDat)) { currentFormDat = []; }
                var newData = [];
                var newFormDat = [];
                for (var i = 0; i < desired.length; i++) {
                    var typeId = desired[i].guaranteeTypeId;
                    var existingRow = currentData[i];
                    var existingFormDatRow = currentFormDat[i];
                    var existingTypeId = existingRow && existingRow.guaranteeType_cd_tipo_garantia;
                    var newFormDatRow;
                    if (existingRow && existingTypeId == typeId) {
                        newData.push(existingRow);
                        newFormDatRow = existingFormDatRow || {};
                    } else {
                        var newRow = { locale: scope.optlang.code };
                        newFormDatRow = {};
                        angular.forEach(garanteDt.columnHeaderData, function (col, idx) {
                            if (col.columnName === 'guaranteeType_cd_tipo_garantia') {
                                newRow[col.columnName] = typeId;
                            }
                            if (garanteDt.columnHeaderData[idx].columnDisplayType === 'DATE') {
                                var today = new Date();
                                today.setHours(0, 0, 0, 0);
                                newFormDatRow[col.columnName] = new Date(today);
                            } else if (garanteDt.columnHeaderData[idx].columnDisplayType === 'DATETIME') {
                                var today = new Date();
                                today.setHours(0, 0, 0, 0);
                                newFormDatRow[col.columnName] = { date: new Date(today), time: new Date() };
                            }
                        });

                        // fecha_avaluo
                        // guaranteeType_cd_tipo_garantia
                        // YesNo_cd_is_real_estate_owned_by_a_third_party
                        // YesNo_cd_is_registered_real_estate
                        // valor_garantia
                        // created_at
                        // updated_at
                        // registeredMortgage_cd_hipoteca_registrada
                        // detalle_garantia
                        newData.push(newRow);
                    }
                    newFormDat.push(newFormDatRow);
                }
                scope.formData.datatables[garanteIndex].data = newData;
                scope.formDat.datatables[garanteIndex].data = newFormDat;
                var accordionOpen = {};
                if (newData.length > 0) { accordionOpen[0] = true; }
                scope.datatableAccordionOpen[garanteIndex] = accordionOpen;
            };


            scope.setAllNo = function () {

                if(!scope.datatables || !scope.formData.datatables){
                    return;
                }

                angular.forEach(scope.datatables, function(datatable, dtIndex){

                    var tableData = scope.formData.datatables[dtIndex];
                    if(!tableData || !tableData.data) return;

                    var isMultiple = scope.isDatatableMultiple(datatable);
                    var rows = isMultiple ? tableData.data : [tableData.data];

                    angular.forEach(rows, function(row){
                        angular.forEach(datatable.columnHeaderData, function(column){

                            if(column.columnDisplayType === 'BOOLEAN'){
                                row[column.columnName] = false;
                            }

                            if(column.columnValues && column.columnValues.length){
                                var noOption = column.columnValues.find(function(opt){
                                    if(!opt.value) return false;
                                    var v = opt.value.toString().toLowerCase();
                                    return v === 'no' || v === 'false' || v === 'n';
                                });
                                if(noOption){
                                    row[column.columnName] = noOption.id !== undefined ? noOption.id : noOption.value;
                                }
                            }
                        });
                    });

                });
            };

            /** Solo en p_solicitante: pone NO en estos 11 campos SI/NO (se usa desde el botón "NO a todo" en solicitante). */
            var SOLICITANTE_NO_COLUMNS = [
                'YesNo_cd_propiedad_negocio_falsa', 'YesNo_cd_referencias_personales_falsas', 'YesNo_cd_referencias_comerciales_falsas',
                'YesNo_cd_relacion_laboral_falsa', 'YesNo_cd_denuncias_judiciales_civiles_penales', 'YesNo_cd_es_policia_militar_abogado',
                'YesNo_cd_solicitante_rechazada_o_morosa_PA', 'YesNo_cd_deuda_vencida_mayor_30_dias', 'YesNo_cd_asesores_credito_supervisor_fiador',
                'YesNo_cd_lider_agencia_fiador', 'YesNo_cd_solicitante_familiar_colaborador_PDA'
            ];
            scope.setSolicitanteNoToSpecific = function () {
                if (!scope.datatables || !scope.formData.datatables) { return; }
                var dtIndex = -1;
                for (var i = 0; i < scope.datatables.length; i++) {
                    if (scope.datatables[i].registeredTableName === 'p_solicitante' || scope.datatables[i].registeredTableName === 'CP_solicitante') {
                        dtIndex = i;
                        break;
                    }
                }
                if (dtIndex === -1) { return; }
                var datatable = scope.datatables[dtIndex];
                var row = scope.formData.datatables[dtIndex].data;
                if (!row || typeof row !== 'object') { return; }
                angular.forEach(SOLICITANTE_NO_COLUMNS, function (columnName) {
                    var column = datatable.columnHeaderData && datatable.columnHeaderData.find(function (c) { return c.columnName === columnName; });
                    if (!column || !column.columnValues) { return; }
                    var noOption = column.columnValues.find(function (opt) {
                        if (!opt.value) return false;
                        var v = opt.value.toString().toLowerCase();
                        return v === 'no' || v === 'false' || v === 'n';
                    });
                    if (noOption) {
                        row[columnName] = noOption.id !== undefined ? noOption.id : noOption.value;
                    }
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
                        scope.draftPayload.datatables.forEach(function (savedDt) {
                            var liveDt = scope.formData.datatables
                                .find(function (dt) { return dt.registeredTableName === savedDt.registeredTableName; });
                            if (liveDt) {
                                liveDt.data = angular.copy(savedDt.data);
                            }
                        });
                        scope.syncFormDatFromDraftDatatables();
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
                            option.quantity = 1;
                        }
                    });
                    $timeout(function () {
                        scope.syncPFiadorFromGuaranteeEvaluation();
                        scope.syncPGaranteFromGuaranteeEvaluation();
                    }, 0);

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
                    templateType: 'groupAdditionals',
                    productId: scope.formData.productId
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

            scope.isDatatableMultiple = function (datatable) {
                if (!datatable || !datatable.columnHeaderData) return false;
                if (datatable._isMultiple !== undefined) return datatable._isMultiple;
                var hasIdPk = datatable.columnHeaderData.some(function (col) {
                    return col.columnName === 'id' && col.isColumnPrimaryKey === true;
                });
                datatable._isMultiple = !!hasIdPk;
                return datatable._isMultiple;
            };

            scope.addDatatableRow = function (datatable, dtIndex) {
                var datatables = scope.datatables;
                var isMultiple = scope.isDatatableMultiple(datatable);
                if (!isMultiple) return;
                if (!scope.datatableAccordionOpen[dtIndex]) scope.datatableAccordionOpen[dtIndex] = {};
                var newDataRow = { locale: scope.optlang.code };
                var newFormDatRow = {};
                angular.forEach(datatable.columnHeaderData, function (colHeader, i) {
                    if (datatable.columnHeaderData[i].columnDisplayType === 'DATE') {
                        var today = new Date();
                        today.setHours(0, 0, 0, 0);
                        newFormDatRow[colHeader.columnName] = new Date(today);
                    } else if (datatable.columnHeaderData[i].columnDisplayType === 'DATETIME') {
                        var today = new Date();
                        today.setHours(0, 0, 0, 0);
                        newFormDatRow[colHeader.columnName] = {
                            date: new Date(today),
                            time: new Date()
                        };
                    }
                });
                scope.formData.datatables[dtIndex].data.push(newDataRow);
                scope.formDat.datatables[dtIndex].data.push(newFormDatRow);
            };

            scope.removeDatatableRow = function (dtIndex, rowIndex) {
                scope.formData.datatables[dtIndex].data.splice(rowIndex, 1);
                scope.formDat.datatables[dtIndex].data.splice(rowIndex, 1);
            };

            scope.toggleDestinoAccordion = function (dtIndex, rowIndex) {
                if (!scope.datatableAccordionOpen[dtIndex]) scope.datatableAccordionOpen[dtIndex] = {};
                var isCurrentlyOpen = scope.datatableAccordionOpen[dtIndex][rowIndex];
                angular.forEach(scope.datatableAccordionOpen[dtIndex], function (val, key) {
                    scope.datatableAccordionOpen[dtIndex][key] = false;
                });
                scope.datatableAccordionOpen[dtIndex][rowIndex] = !isCurrentlyOpen;
            };

            scope.ensureFormDatDateForMultiple = function (dtIndex, rowIndex, colName, displayType) {
                var formDatRow = scope.formDat.datatables[dtIndex] && scope.formDat.datatables[dtIndex].data && scope.formDat.datatables[dtIndex].data[rowIndex];
                if (!formDatRow) return false;
                var val = formDatRow[colName];
                if (displayType === 'DATE') {
                    if (!(val instanceof Date)) {
                        formDatRow[colName] = val ? new Date(val) : (function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
                    }
                    return true;
                }
                if (displayType === 'DATETIME') {
                    if (!val || typeof val !== 'object') {
                        var today = new Date();
                        today.setHours(0, 0, 0, 0);
                        formDatRow[colName] = { date: new Date(today), time: new Date() };
                    } else {
                        if (!(val.date instanceof Date)) val.date = val.date ? new Date(val.date) : new Date();
                        if (val.time == null) val.time = new Date();
                    }
                    return true;
                }
                return false;
            };

            scope.syncFormDatFromDraftDatatables = function () {
                if (!scope.datatables || !scope.formData.datatables || !scope.formDat.datatables) return;
                var today = new Date();
                today.setHours(0, 0, 0, 0);
                angular.forEach(scope.datatables, function (datatable, index) {
                    var dtData = scope.formData.datatables[index] && scope.formData.datatables[index].data;
                    var formDatEntry = scope.formDat.datatables[index];
                    if (!formDatEntry || !datatable.columnHeaderData) return;
                    if (datatable._isMultiple && Array.isArray(dtData)) {
                        while (formDatEntry.data.length < dtData.length) {
                            var newRow = {};
                            angular.forEach(datatable.columnHeaderData, function (col, i) {
                                if (col.columnDisplayType === 'DATE') newRow[col.columnName] = new Date(today);
                                if (col.columnDisplayType === 'DATETIME') newRow[col.columnName] = { date: new Date(today), time: new Date() };
                            });
                            formDatEntry.data.push(newRow);
                        }
                        formDatEntry.data.splice(dtData.length);
                        angular.forEach(dtData, function (row, rowIdx) {
                            var fdRow = formDatEntry.data[rowIdx] || (formDatEntry.data[rowIdx] = {});
                            angular.forEach(datatable.columnHeaderData, function (col) {
                                if (col.columnDisplayType === 'DATE' && row[col.columnName] != null) {
                                    var d = row[col.columnName];
                                    fdRow[col.columnName] = d instanceof Date ? d : new Date(d);
                                }
                                if (col.columnDisplayType === 'DATETIME' && row[col.columnName] != null) {
                                    var dt = row[col.columnName];
                                    if (typeof dt === 'object' && dt.date != null) {
                                        fdRow[col.columnName] = { date: dt.date instanceof Date ? dt.date : new Date(dt.date), time: dt.time || new Date() };
                                    }
                                }
                            });
                        });
                    } else if (!datatable._isMultiple && dtData && typeof dtData === 'object' && !Array.isArray(dtData)) {
                        angular.forEach(datatable.columnHeaderData, function (col) {
                            if (col.columnDisplayType === 'DATE') {
                                var val = dtData[col.columnName];
                                formDatEntry.data[col.columnName] = val != null ? (val instanceof Date ? val : new Date(val)) : new Date(today);
                            }
                            if (col.columnDisplayType === 'DATETIME') {
                                var val = dtData[col.columnName];
                                if (val != null && typeof val === 'object' && val.date != null) {
                                    formDatEntry.data[col.columnName] = { date: val.date instanceof Date ? val.date : new Date(val.date), time: val.time || new Date() };
                                } else {
                                    formDatEntry.data[col.columnName] = { date: new Date(today), time: new Date() };
                                }
                            }
                        });
                    }
                });
            };

            scope.datatableAccordionOpen = {};

            scope.handleDatatables = function (datatables) {
                if (!_.isUndefined(datatables) && datatables.length > 0) {
                    scope.formData.datatables = [];
                    scope.formDat.datatables = [];
                    scope.noOfTabs = datatables.length + 1;
                    angular.forEach(datatables, function (datatable, index) {
                        var headers = datatable.columnHeaderData;
                        var hasIdPk = headers && headers.some(function (col) {
                            return col.columnName === 'id' && col.isColumnPrimaryKey === true;
                        });
                        datatable._isMultiple = !!hasIdPk;
                        var isMultiple = datatable._isMultiple;
                        scope.updateColumnHeaders(datatable.columnHeaderData);

                        if (isMultiple) {
                            scope.formData.datatables[index] = {
                                registeredTableName: datatable.registeredTableName,
                                data: []
                            };
                            scope.formDat.datatables[index] = { data: [] };
                            scope.datatableAccordionOpen[index] = { 0: true };
                            scope.addDatatableRow(datatable, index);
                        } else {
                            scope.formDat.datatables[index] = { data: {} };
                            scope.formData.datatables[index] = {
                                registeredTableName: datatable.registeredTableName,
                                data: { locale: scope.optlang.code }
                            };
                        }

                        if (!isMultiple) {
                            angular.forEach(datatable.columnHeaderData, function (colHeader, i) {
                                if (datatable.columnHeaderData[i].columnDisplayType === 'DATETIME' || datatable.columnHeaderData[i].columnDisplayType === 'DATE') {
                                    var column = datatable.columnHeaderData[i];
                                    var columnName = column.columnName;
                                    var today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (column.columnDisplayType === 'DATE') {
                                        scope.formDat.datatables[index].data[columnName] = new Date(today);
                                    } else {
                                        scope.formDat.datatables[index].data[columnName] = { date: new Date(today), time: new Date() };
                                    }
                                }
                            });
                        }
                    });
                    scope.datatableStepOrder = {};
                    scope.destinoDatatable = null;
                    scope.destinoDatatableIndex = null;
                    scope.fiadorDatatable = null;
                    scope.fiadorDatatableIndex = null;
                    scope.garanteDatatable = null;
                    scope.garanteDatatableIndex = null;
                    // Orden: P_solicitante/CP_solicitante(10), GuaranteeEvaluation(20), Documentos(30+), p_fiador(40), p_garante(41), Detalles(50), Términos(60), Cargos(70), Adicionales(80), Review(90)
                    var orderByTableName = { 'p_solicitante': 10, 'CP_solicitante': 10, 'p_fiador': 40, 'p_garantia': 41 };
                    var otherStepOrder = 42;
                    angular.forEach(datatables, function (d, i) {
                        if (d.registeredTableName === 'p_destino') {
                            scope.destinoDatatableIndex = i;
                            scope.destinoDatatable = d;
                        } else if (d.registeredTableName === 'p_fiador') {
                            scope.fiadorDatatableIndex = i;
                            scope.fiadorDatatable = d;
                        } else if (d.registeredTableName === 'p_garantia') {
                            scope.garanteDatatableIndex = i;
                            scope.garanteDatatable = d;
                        }
                        if (d.registeredTableName !== 'p_destino') {
                            scope.datatableStepOrder[i] = orderByTableName[d.registeredTableName] !== undefined
                                ? orderByTableName[d.registeredTableName]
                                : otherStepOrder++;
                        }
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
                var found = _.find(array, function (obj) {
                    return obj[findattr] === model;
                });
                return found ? found[retAttr] : undefined;
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
                if(this.formData.loanAdditionalDataPAE){
                    this.formData.loanAdditionalDataPAE.caseId = this.formData.caseId;
                    for (var cartegoryName in scope.formData.loanAdditionalDataPAE) {
                        if (scope.formData.loanAdditionalDataPAE.hasOwnProperty(cartegoryName)) {
                            let paeAdditionalCategory = scope.formData.loanAdditionalDataPAE[cartegoryName];

                            for (var propertyName in paeAdditionalCategory) {
                                if (paeAdditionalCategory.hasOwnProperty(propertyName)) {
                                    if(scope.isAdditionalDateProperty(propertyName)){
                                        var propertyValue =  paeAdditionalCategory[propertyName];
                                        paeAdditionalCategory[propertyName] = dateFilter(propertyValue, scope.df);
                                    }
                                }
                            }
                            scope.formData.loanAdditionalDataPAE[cartegoryName] = paeAdditionalCategory;

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
                    scope.dateFormat = scope.df + " " + scope.tf;
                    angular.forEach(scope.datatables, function (datatable, index) {
                        scope.columnHeaders = datatable.columnHeaderData;
                        var isMultiple = datatable._isMultiple === true;
                        if (isMultiple) {
                            var dataArray = scope.formData.datatables[index].data;
                            var formDatArray = scope.formDat.datatables[index].data;
                            for (var rowIdx = 0; rowIdx < dataArray.length; rowIdx++) {
                                angular.forEach(scope.columnHeaders, function (colHeader, i) {
                                    if (scope.columnHeaders[i].columnDisplayType === 'DATE') {
                                        if (formDatArray[rowIdx] && !_.isUndefined(formDatArray[rowIdx][scope.columnHeaders[i].columnName])) {
                                            dataArray[rowIdx][scope.columnHeaders[i].columnName] = dateFilter(formDatArray[rowIdx][scope.columnHeaders[i].columnName], scope.dateFormat);
                                        }
                                    } else if (scope.columnHeaders[i].columnDisplayType === 'DATETIME') {
                                        var dt = formDatArray[rowIdx] && formDatArray[rowIdx][scope.columnHeaders[i].columnName];
                                        if (dt && !_.isUndefined(dt.date) && !_.isUndefined(dt.time)) {
                                            dataArray[rowIdx][scope.columnHeaders[i].columnName] = dateFilter(dt.date, scope.df) + " " + dateFilter(dt.time, scope.tf);
                                        }
                                    }
                                });
                                dataArray[rowIdx].dateFormat = scope.dateFormat;
                            }
                        } else {
                            angular.forEach(scope.columnHeaders, function (colHeader, i) {
                                if (scope.columnHeaders[i].columnDisplayType == 'DATE') {
                                    if (!_.isUndefined(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName])) {
                                        scope.formData.datatables[index].data[scope.columnHeaders[i].columnName] = dateFilter(scope.formDat.datatables[index].data[scope.columnHeaders[i].columnName], scope.dateFormat);
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
                        }
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
                                                continue;
                                            }
                                            alert('Required guarantee document is not uploaded for guarantee no. ' + (j + 1) + ': ' + requiredDoc.documentName);
                                            return;
                                        }

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
                    delete scope.formData.loanAdditionalDataPAE;
                    resourceFactory.individualPrequalificationResource.loanAdditionalData({productId: scope.formData.productId, clientId: scope.clientId, caseId: caseId, locale: scope.optlang.code}, function(data){

                        if (scope.product.ownerTypeOption.value === 'PAE'){
                            scope.processPaeAdditionalDataTemplate(data, caseId)
                        }else{
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
                        }
                    });
                }
           }

            scope.processPaeAdditionalDataTemplate = function (data, caseId){
                scope.formData.loanAdditionalDataPAE = data;
                scope.formData.caseId = caseId;
                if(scope.formData.loanAdditionalDataPAE){
                    for (var cartegoryName in scope.formData.loanAdditionalDataPAE) {
                        if (scope.formData.loanAdditionalDataPAE.hasOwnProperty(cartegoryName)) {
                            let paeAdditionalCategory = scope.formData.loanAdditionalDataPAE[cartegoryName];

                            for (var propertyName in paeAdditionalCategory) {
                                if (paeAdditionalCategory.hasOwnProperty(propertyName)) {
                                    if(scope.isAdditionalDateProperty(propertyName)){
                                        var propertyValue =  paeAdditionalCategory[propertyName];
                                        paeAdditionalCategory[propertyName] = new Date(propertyValue);
                                        if (propertyName === 'dateOpened') {
                                            paeAdditionalCategory[propertyName] = new Date(propertyValue.slice(0,3));
                                        }
                                    }
                                }
                            }
                            scope.formData.loanAdditionalDataPAE[cartegoryName] = paeAdditionalCategory;

                        }
                    }
                }
            }

           scope.isAdditionalDateProperty = function(propertyName){
               var dateFields = ["fechaInicio", "cFechaNacimiento", "fechaPrimeraReunion",
                   "dateOpened", "fechaSolicitud", "fecha_solicitud", "fechaFin", "fecha_estacionalidad",
                   "fecha_inico_operaciones", "fecha_integraciones", "fecha_inventario", "fecha_nacimiento_solicitante",
                   "fecha_nacimiento_solicitante", "fecha_visita","fecha_inicio_negocio","fechaSupervision"];
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
                   "total_precio_ventas","total_recibido","total_vehiculos",
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
                        scope.requiresGuaranteeDocuments=true;
                        break;
                    }
                }
                scope.syncPFiadorFromGuaranteeEvaluation();
                scope.syncPGaranteFromGuaranteeEvaluation();
            }

            scope.updateGuaranteeQuantityAndSyncFiador = function () {
                scope.syncPFiadorFromGuaranteeEvaluation();
                scope.syncPGaranteFromGuaranteeEvaluation();
            };

            /** Muestra el tab p_fiador solo si en Guarantee Evaluation hay al menos una opción seleccionada que coincida con un tipo de fiador. */
            scope.shouldShowFiadorStep = function () {
                if (!scope.paeRequiredGuaranteeOptions || !scope.fiadorDatatable || scope.fiadorDatatableIndex == null) { return false; }
                var col = scope.fiadorDatatable.columnHeaderData && scope.fiadorDatatable.columnHeaderData.find(function (c) {
                    return c.columnName === 'guarantorType_cd_tipo_fiador_tercero' || c.columnName === 'guarantee_cd_tipo_garantia';
                });
                if (!col || !col.columnValues || !col.columnValues.length) { return false; }
                for (var i = 0; i < scope.paeRequiredGuaranteeOptions.length; i++) {
                    var opt = scope.paeRequiredGuaranteeOptions[i];
                    if (!opt.selected || !opt.quantity || opt.locked) { continue; }
                    var name = (opt.name || '').toLowerCase().trim();
                    if (name === 'documentacion deudora') { continue; }
                    var match = col.columnValues.some(function (v) { return (v.value || '').toLowerCase().trim() === name; });
                    if (match) { return true; }
                }
                return false;
            };

            /** Muestra el tab p_garante solo si en Guarantee Evaluation hay al menos una opción seleccionada que coincida con un tipo de garantía. */
            scope.shouldShowGaranteStep = function () {
                if (!scope.paeRequiredGuaranteeOptions || !scope.garanteDatatable || scope.garanteDatatableIndex == null) { return false; }
                var col = scope.garanteDatatable.columnHeaderData && scope.garanteDatatable.columnHeaderData.find(function (c) {
                    return c.columnName === 'guaranteeType_cd_tipo_garantia';
                });
                if (!col || !col.columnValues || !col.columnValues.length) { return false; }
                for (var i = 0; i < scope.paeRequiredGuaranteeOptions.length; i++) {
                    var opt = scope.paeRequiredGuaranteeOptions[i];
                    if (!opt.selected || !opt.quantity || opt.locked) { continue; }
                    var name = (opt.name || '').toLowerCase().trim();
                    if (name === 'documentacion deudora') { continue; }
                    var match = col.columnValues.some(function (v) { return (v.value || '').toLowerCase().trim() === name; });
                    if (match) { return true; }
                }
                return false;
            };

            /** Campos de p_destino que solo se muestran cuando loanPurposeOptions_cd_destino es "Consolidación de deudas". */
            var DESTINO_CONSOLIDACION_ONLY_COLUMNS = [
                'YesNo_cd_debt_purchased_from_unknown_lender_inst',
                'YesNo_cd_loan_amount_purchased_less_q250k',
                'YesNo_cd_debt_purchased_less_than_80',
                'YesNo_cd_debts_consolidated_shown_credit_bureaus'
            ];
            scope.showDestinoColumn = function (columnName, dtIndex, rowIndex) {
                if (!scope.destinoDatatable || scope.destinoDatatableIndex == null) { return true; }
                if (DESTINO_CONSOLIDACION_ONLY_COLUMNS.indexOf(columnName) === -1) { return true; }
                var col = scope.destinoDatatable.columnHeaderData && scope.destinoDatatable.columnHeaderData.find(function (c) {
                    return c.columnName === 'loanPurposeOptionsPAE_cd_destino';
                });
                if (!col || !col.columnValues) { return false; }
                var row = scope.formData.datatables[dtIndex] && scope.formData.datatables[dtIndex].data && scope.formData.datatables[dtIndex].data[rowIndex];
                if (!row) { return false; }
                var selectedVal = row[col.columnName];
                var consolidacionOption = col.columnValues.find(function (v) {
                    var label = (v.value || '').toLowerCase().trim();
                    return label === 'consolidación de deudas' || label === 'consolidacion de deudas';
                });
                return consolidacionOption && (consolidacionOption.id == selectedVal || consolidacionOption.value == selectedVal);
            };
            var GARANTIA_PRENDARIA_AND_VEHICULO_ONLY_COLUMNS = [
                'guaranteeType_cd_tipo_garantia',
                'valor_garantia',
                'fecha_avaluo',
                'detalle_garantia'
            ];

            var GARANTIA_DERECHOS_AND_HIPOTECA_ONLY_COLUMNS = [
                'guaranteeType_cd_tipo_garantia',
                'valor_garantia',
                'fecha_avaluo',
                'YesNo_cd_is_real_estate_owned_by_a_third_party',
                'YesNo_cd_is_registered_real_estate',
                'registeredMortgage_cd_hipoteca_registrada',
                'detalle_garantia',
            ];

            scope.showGaranteeColumn = function (columnName, dtIndex, rowIndex) {
                if (!scope.garanteDatatable || scope.garanteDatatableIndex == null) { return true; }
                if (GARANTIA_PRENDARIA_AND_VEHICULO_ONLY_COLUMNS.indexOf(columnName) !== -1) { return true; }
                var typeCol = scope.garanteDatatable.columnHeaderData && scope.garanteDatatable.columnHeaderData.find(function (c) {
                    return c.columnName === 'guaranteeType_cd_tipo_garantia';
                });
                if (!typeCol || !typeCol.columnValues) { return true; }
                var row = scope.formData.datatables[dtIndex] && scope.formData.datatables[dtIndex].data && scope.formData.datatables[dtIndex].data[rowIndex];

                if (!row) { return true; }
                var selectedVal = row[typeCol.columnName];

                if (selectedVal == null || selectedVal === '') { return columnName === typeCol.columnName; }
                var selectedOption = typeCol.columnValues.find(function (v) {
                    return v.id == selectedVal || v.value == selectedVal;
                });
                var typeKey = selectedOption ? (selectedOption.value || '').toLowerCase().trim() : '';
                if (columnName === typeCol.columnName) { return true; }
                if (typeKey==='hipoteca'|| typeKey==='derechos posesorios'){
                    var allowed = GARANTIA_DERECHOS_AND_HIPOTECA_ONLY_COLUMNS;
                    return allowed && allowed.indexOf(columnName) !== -1;
                }

            };

            /** Columnas de p_fiador que siempre se muestran (para todos los tipos). */
            var FIADOR_ALWAYS_SHOW_COLUMNS = [
                'professionGuarantor_cd_profesion_fiador', 'apellido_casada', 'primer_apellido', 'otros_nombres',
                'segundo_apellido', 'segundo_nombre', 'primer_nombre', 'DPI_fiador_tercero', 'fecha_vencimiento_DPI',
                'direccion_notificaciones', 'fecha_nacimiento', 'edad', 'nacionalidad_cd_nacionalidad', 'numero_telefonico', 'readWrite_cd_puede_leer_escribir'
            ];
            /** Campos de p_fiador por tipo (guarantorType_cd_tipo_fiador_tercero). Solo se muestran los listados para el tipo seleccionado. */
            var FIADOR_TYPE_COLUMNS = {
                'fiador empresario': [
                    'classificationOptions_cd_actividad_economica', 'nombre_empresa', 'yearsOperating_cd_years_operando',
                    'YesNo_cd_dispuesto_firmar_solicitud_titulo', 'YesNo_cd_conoce_ingresos', 'YesNo_cd_conoce_precios_venta_compra',
                    'YesNo_cd_conoce_frecuencia_compra_inventario', 'YesNo_cd_conoce_proveedores_costos_lugar', 'YesNo_cd_maneja_negocio',
                    'YesNo_cd_negocio_inscrito_RTU', 'YesNo_cd_patente_comercio_nombre_cliente', 'YesNo_cd_facturas_recibos_de_compra_cliente',
                    'YesNo_cd_tarjeta_salud_cliente', 'monto_ventas_mensuales', 'costo_ventas_totales', 'total_gastos_negocio',
                    'total_gastos_familiares', 'cuotas_prestamos_externos', 'diferencia_ingresos_gastos', 'couta_nuevo_credito_pae','disponible_pagar_cuota'
                ],
                'fiador asalariado': [
                    'classificationOptions_cd_actividad_economica', 'nombre_empresa', 'fecha_ingreso_empleo_actual',
                    'YesNo_cd_dispuesto_firmar_solicitud_titulo', 'cuotas_prestamos', 'disponible_pagar_cuota','ingresos','disponible'
                ],
                'fiador moral': ['YesNo_cd_dispuesto_firmar_solicitud_titulo'],
                'otorgante de la garantía': ['YesNo_cd_dispuesto_firmar_solicitud_titulo']
            };
            scope.showFiadorColumn = function (columnName, dtIndex, rowIndex) {
                if (!scope.fiadorDatatable || scope.fiadorDatatableIndex == null) { return true; }
                if (FIADOR_ALWAYS_SHOW_COLUMNS.indexOf(columnName) !== -1) { return true; }
                var typeCol = scope.fiadorDatatable.columnHeaderData && scope.fiadorDatatable.columnHeaderData.find(function (c) {
                    return c.columnName === 'guarantorType_cd_tipo_fiador_tercero' || c.columnName === 'guarantee_cd_tipo_garantia';
                });
                if (!typeCol || !typeCol.columnValues) { return true; }
                var row = scope.formData.datatables[dtIndex] && scope.formData.datatables[dtIndex].data && scope.formData.datatables[dtIndex].data[rowIndex];
                if (!row) { return true; }
                var selectedVal = row[typeCol.columnName];
                if (selectedVal == null || selectedVal === '') { return columnName === typeCol.columnName; }
                var selectedOption = typeCol.columnValues.find(function (v) {
                    return v.id == selectedVal || v.value == selectedVal;
                });
                var typeKey = selectedOption ? (selectedOption.value || '').toLowerCase().trim() : '';
                if (columnName === typeCol.columnName) { return true; }
                var allowed = FIADOR_TYPE_COLUMNS[typeKey];
                return allowed && allowed.indexOf(columnName) !== -1;
            };

            scope.onGuarantyFileSelect = function($files, parentIndex, childIndex, currentDoc){
                // Ensure the array exists
                if (!scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)]) {
                    scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)] = [];
                }

                var file = $files[0];
                var maxSize = 5; // 5MB
                if (file) {
                    let size = file.size;
                    if ((size / (1024 * 1024)).toFixed(1) > maxSize) {
                        alert('File size: ' + (size / (1024 * 1024)).toFixed(1) + 'MB exceeds limit: ' + maxSize + 'MB. Please select a smaller file.');
                        // Clear the file input element
                        var inputElement = document.getElementById('grFile_' + parentIndex + '_' + childIndex);
                        if (inputElement) {
                            inputElement.value = '';
                        }
                        // Clear the ng-model binding
                        if (scope.guarantyFiles && scope.guarantyFiles[parentIndex]) {
                            scope.guarantyFiles[parentIndex][childIndex] = null;
                        }
                        // Remove any previously stored doc data for this slot
                        if (scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)]) {
                            delete scope.paeRequiredGuaranteeDocuments["GUARANTEEDOC_"+(currentDoc.id)][parentIndex];
                        }
                        return;
                    }
                }
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
                    return Promise.resolve();
                }

                if (!scope.paeRequiredGuaranteeDocuments || Object.keys(scope.paeRequiredGuaranteeDocuments).length === 0) {
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
