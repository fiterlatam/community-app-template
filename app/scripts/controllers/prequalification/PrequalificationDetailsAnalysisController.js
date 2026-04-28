(function (module) {
    mifosX.controllers = _.extend(module, {
        PrequalificationDetailsAnalysisController: function (scope, routeParams, route, dateFilter, location, resourceFactory, $http, $uibModal, API_VERSION, $timeout, $rootScope, Upload,$sce,JSZipService) {

            scope.groupData = {};
            scope.formData = {};
            scope.groupId = routeParams.groupId;
            scope.groupMembers = [];
            scope.memberBuroEvidence = [];
            scope.bureauStatusOptions = [
                {label:'A', value:'A'},
                {label:'B', value:'B'},
                {label:'C', value:'C'},
                {label:'D', value:'D'},
            ];
            scope.prequalificationDocuments = [];
            scope.paeLoandocuments = [];
            scope.showValidatePolicies = routeParams.showValidatePolicies == 'true' ? true : false;
            scope.prequalificationType = routeParams.prequalificationType;
            scope.previousPageUrl = "#/prequalificationAnalysis/"+routeParams.prequalificationType;
            scope.showAllComments = false;
            scope.showAllExceptionComments = false;
            scope.showDownloading = false;
            scope.previewUrl;

            scope.fetchPrequalificationDetails = function () {
                resourceFactory.prequalificationResource.get({groupId: routeParams.groupId}, function (data) {
                    scope.groupData = data;
                    scope.showArgueButton = false;
                    if(scope.groupData.renegotiations && scope.groupData.renegotiations.length){
                        console.log(scope.groupData.renegotiations)
                        let lastRenegotiation = scope.groupData.renegotiations.reduce((max, current) => {
                            return current.id > max.id ? current : max;
                        });
                        console.log(lastRenegotiation)

                        scope.showArgueButton = lastRenegotiation.status === 'REJECTED';
                    }

                    scope.groupMembers = data.groupMembers;
                    scope.formData.listComments = data.listComments || [];
                    scope.formData.exceptionListComments = data.exceptionListComments || [];

                    scope.yellowValidationCount = scope.groupMembers.reduce((acc, member) => {
                        return acc + (member.yellowValidationCount || 0);
                    }, 0);

                    scope.redValidationCount = scope.groupMembers.reduce((acc, member) => {
                        return acc + (member.redValidationCount || 0);
                    }, 0);

                    scope.orangeValidationCount = scope.groupMembers.reduce((acc, member) => {
                        return acc + (member.orangeValidationCount || 0);
                    }, 0);

                    console.log("group data", JSON.stringify(scope.groupData));
                    console.log("current session data", JSON.stringify(scope.currentSession));
                    scope.formData.isAllMembersSelected = true;
                    for (var i = 0; i < scope.groupMembers.length; i++ ){
                        scope.groupMembers[i].isSelected = scope.formData.isAllMembersSelected;
                    }
                    scope.getPaeLoanDocuments();
                });
            }

            scope.fetchPrequalificationDetails();

            resourceFactory.entityDocumentsResource.getAllDocuments({
                entity: 'prequalifications',
                entityId: routeParams.groupId
            }, function (data) {
                for (var l in data) {

                    var bldocs = {};
                    bldocs = API_VERSION + '/' + data[l].parentEntityType + '/' + data[l].parentEntityId + '/documents/' + data[l].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                    data[l].docUrl = bldocs;
                    if (data[l].fileName)
                        if (data[l].fileName.toLowerCase().indexOf('.zip') != -1) data[l].fileIsImage = false;
                        else data[l].fileIsImage = true;
                    if (data[l].type)
                        if (data[l].type.toLowerCase().indexOf('zip') != -1) data[l].fileIsImage = false;
                        else data[l].fileIsImage = true;
                }
                scope.prequalificationDocuments = data;
            });

            //------------------------- DOWNLOAD DOCUMENTS ----------------------------------
            scope.downloadDocument = function (doc) {

                const url = API_VERSION + '/' + doc.parentEntityType + '/' + doc.parentEntityId +
                    '/documents/' + doc.id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;


                $http({
                    method: 'GET',
                    url: $rootScope.hostUrl + url,
                    responseType: 'arraybuffer',
                }).then(function (response) {

                    const blob = new Blob([response.data], { type: response.headers('Content-Type') });
                    const fileName = doc.fileName || 'documento';
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }).catch(function (error) {
                    console.error('Error al descargar el documento:', error);
                    alert('No se pudo descargar el documento.');
                });
            };



            scope.submit = function () {
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/' + routeParams.groupId + '/comment',
                    data: {
                        name: scope.groupData.groupName,
                        description: scope.formData.description,
                        comment: scope.formData.comments,
                        file: scope.formData.file
                    },
                }).then(function (data) {
                    // to fix IE not refreshing the model
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                    location.path('/prequalificationGroups/new');
                });
            };

            scope.resolveMemberStatus = function (statusId) {
                if (statusId === 'ACTIVE') {
                    return 'text-danger';
                }else{
                    return 'text-success';
                }
            }

            scope.resolveBureaStatus = function (statusId) {
                if (statusId === 'BUREAU_AVAILABLE') {
                    return 'A';
                } else {
                    return 'NA';
                }
            }
            scope.policyCheckColor = function (member) {
                if (member.redValidationCount > 0) {
                    return 'text-danger';
                }else if(member.orangeValidationCount > 0||member.yellowValidationCount > 0){
                    return 'text-warning';
                }else{
                    return 'text-success'
                }
            }
            scope.policyCountColor = function (member) {
                let redValidationCount = member.redValidationCount||0;
                let orangeValidationCount = member.orangeValidationCount || 0;
                let yellowValidationCount = member.yellowValidationCount || 0;
                if (redValidationCount > 0) {
                    return Number(redValidationCount)+Number(orangeValidationCount)+Number(yellowValidationCount);
                }else if(Number(orangeValidationCount) > 0 || yellowValidationCount > 0){
                    return Number(orangeValidationCount)+Number(yellowValidationCount);
                }else{
                    return '0'
                }
            }
            scope.validateHardPolicy = function () {
                resourceFactory.prequalificationChecklistResource.validate({prequalificationId: routeParams.groupId}, {}, function (data) {
                    route.reload();
                });
            }


            scope.validateBeaural = function () {
                resourceFactory.prequalificationChecklistResource.bureauValidation({prequalificationId: routeParams.groupId}, {}, function (data) {
                    route.reload();
                });
            }

            scope.onFileSelect = function (files) {
                scope.formData.file = files[0];
            };

            scope.onEvidenceSelect = function (files,index) {
                scope.groupMembers[Number(index)].file = files[0]
            };
            scope.obSubmitEvidence = function () {
                for (let i=0; i<scope.groupMembers.length; i++){
                    let groupMember = scope.groupMembers[i];
                    if ((groupMember.agencyBureauStatus != groupMember.bureauCheckStatus.code) && groupMember.documentCount<=0 && !groupMember.file){
                        scope.error = true;
                        scope.errorMsg = "Proporcione un documento para el cliente Nombre "+groupMember.name+" - DPI "+groupMember.dpi+" " +
                            "a fin de justificar el cambio de Buro";
                        setTimeout(() => {
                            scope.error = false;
                            scope.errorMsg = null;
                        }, 2000);

                        return;
                    }
                }

                for (let i=0; i<scope.groupMembers.length; i++){
                    let groupMember = scope.groupMembers[i];
                    if (groupMember.file){
                        scope.uploadBuroDocument(groupMember)
                    }
                }

            };

            scope.processRenegotiation =  function (renengotiation,action,buttonLabel){
                scope.renegotiationId=renengotiation.id
                scope.processAnalysisRequest(action,buttonLabel,'renegociación');
            }

            scope.uploadBuroDocument = function (member){
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/members/' + routeParams.groupId ,
                    data: {
                        memberId: member.id,
                        dpi: member.name + ' - ('+member.dpi+')',
                        description: "Buro Documento",
                        file: member.file
                    },
                }).then(function (data) {
                    // to fix IE not refreshing the model
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                    location.path('/prequalificationsmenu');
                });
            }

            scope.showSupportDocumentUploadPage = function () {
                var allowedStatuses = [400, 200];
                if (scope.groupData.status) {
                    return allowedStatuses.includes(scope.groupData.status.id)
                }
                return false;
            }


            scope.viewHardPolicyValidation = function (memberId) {
                resourceFactory.prequalificationValidationResource.get({
                    prequalificationId: routeParams.groupId,
                    clientId: memberId
                }, function (data) {
                    scope.memberHardPolicyResults = data

                    $uibModal.open({
                        templateUrl: 'viewMemberHardPolicy.html',
                        controller: ViewMemberHardPolicyCtrl
                    });
                });
            }

            scope.reloadPage = function(){
                // scope.routeTo("/prequalificationsmenu");
                scope.report = false;
                scope.preview = false;
            }

            var ViewMemberHardPolicyCtrl = function ($scope, $uibModalInstance) {
                $scope.memberResults = scope.memberHardPolicyResults;

                $scope.checkValidationColor = function (colorName) {
                    if (colorName) {
                        if ('RED' === colorName.toUpperCase()) {
                            return 'text-danger';
                        }

                        if ('YELLOW' === colorName.toUpperCase()) {
                            return 'text-warning';
                        }

                        if ('GREEN' === colorName.toUpperCase()) {
                            return 'text-success';
                        }

                        if ('GREEN' === colorName.toUpperCase()) {
                            return 'text-success';
                        }

                        if ('ORANGE' === colorName.toUpperCase()) {
                            return 'text-warning';
                        }
                    }
                    return '';
                }

                $scope.colorLabel = function (colorName) {
                    if(colorName){
                        if('RED' === colorName.toUpperCase()){
                            return 'label.color.red';
                        }else if('YELLOW' === colorName.toUpperCase()){
                            return 'label.color.yellow';
                        }else if('GREEN' === colorName.toUpperCase()){
                            return 'label.color.green';
                        }else if('ORANGE' === colorName.toUpperCase()){
                            return 'label.color.orange';
                        }else{
                            return null;
                        }
                    }
                    return null;
                }

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            var ConfirmationModalCtrl = function ($scope, $uibModalInstance) {
                $scope.confirmationMessage = scope.confirmationMessage;
                $scope.partTwoMessage = scope.partTwoMessage;
                $scope.confirm = function () {
                    var members = [];
                    var atLeastOneMemberSelected = false;
                    for (var i = 0; i < scope.groupMembers.length; i++ ){
                        var isSelected = scope.groupMembers[i].isSelected;
                        if(isSelected){
                           atLeastOneMemberSelected = true;
                        }
                        members.push({id: scope.groupMembers[i].id, isSelected: isSelected});
                    }
                    resourceFactory.prequalificationChecklistResource.processAnalysis(
                        {prequalificationId: routeParams.groupId, command: scope.analysisStatus},
                        {action: scope.analysisStatus,comments:scope.formData.comments, members: members,renegotiationId:scope.renegotiationId},
                        function (data) {
                            if (data.resourceIdentifier) {
                                scope.routeTo("/editloanaccount/" + data.resourceIdentifier);
                                $uibModalInstance.dismiss('okay');
                                return;
                            }
                            if (data.reportToPrint){
                                scope.printReport(data);

                            }
                            scope.routeTo("/prequalificationsmenu");
                            $uibModalInstance.dismiss('okay');
                        });
                }
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.printReport= function(data){
                console.log("going to print report "+data.reportToPrint)
                scope.report = true;
                var reportURL = $rootScope.hostUrl + API_VERSION + "/runreports/" + encodeURIComponent(data.reportToPrint);
                reportURL += "?output-type=" + encodeURIComponent('PDF') + "&tenantIdentifier=" + $rootScope.tenantIdentifier+"&locale="+scope.optlang.code;
                var reportParams = "";
                reportParams += encodeURIComponent("R_prequalificationId") + "=" + encodeURIComponent(data.resourceId);
                reportParams += "&" + encodeURIComponent("R_loanId") + "=" + encodeURIComponent(data.loanId);
                if (reportParams > "") {
                    reportURL += "&" + reportParams;
                }
                reportURL = $sce.trustAsResourceUrl(reportURL);
                reportURL = $sce.valueOf(reportURL);
                $http.get(reportURL, {responseType: 'arraybuffer'})
                    .then(function(response) {
                        let data = response.data;
                        let status = response.status;
                        let headers = response.headers;
                        let config = response.config;
                        var contentType = headers('Content-Type');
                        var file = new Blob([data], {type: contentType});
                        var fileContent = URL.createObjectURL(file);
                        scope.reportURL = $sce.trustAsResourceUrl(fileContent);
                    }).catch(function(error){
                    console.log(JSON.stringify(error))
                    $log.error(`Error loading ${scope.reportType} report`);
                    $log.error(error);
                });
            }

            scope.routeTo = function (path) {
                location.path(path);
            }

            scope.getDifference = function (num1, num2) {
                return Number(num1) - Number(num2);
            }

            scope.resolveTotalRequestedAmount = function () {
                let total = 0;
                for (let i = 0; i < scope.groupMembers.length; i++) {
                    total += Number(scope.groupMembers[i].requestedAmount);
                }
                return total;
            }
            scope.resolveTotalApprovedAmount = function () {
                let total = 0;
                for (let i = 0; i < scope.groupMembers.length; i++) {
                    total += Number(scope.groupMembers[i].approvedAmount);
                }
                return total;
            }

            scope.editAmount = function (index) {
                scope.groupMembers[index].isEdit = true;
            }

            scope.updateApprovedAmount = function (member) {
                var data = {
                    "approvedAmount": member.approvedAmount,
                    "requestedAmount": member.requestedAmount,
                    "comments": member.comments,
                    "agencyBureauStatus": member.agencyBureauStatus,
                    "id": member.id,
                    "name": member.name,
                    "dpi": member.dpi,
                    "locale": scope.optlang.code,
                    "interestRatePerPeriod": member.interestRatePerPeriod,
                    "principal": member.requestedAmount,
                    "loanTermFrequency": member.period
                };
                delete data.isEdit;
                resourceFactory.prequalificationResource.updateMember({
                    groupId: routeParams.groupId,
                    memberId: member.id
                }, data, function (data) {
                    if (data.resourceIdentifier) {
                        scope.routeTo("/prequalificationsmenu");
                        scope.groupMembers[index].isEdit = false;
                    }
                });
            }

            scope.assignToSelf = function () {
               scope.processAnalysisRequest('assigntoself','label.button.assigntoself')
            }

            scope.processAnalysisRequest = function (status, inMessage, partTwoMessage=undefined) {
                scope.analysisStatus = status;
                scope.confirmationMessage = inMessage
                scope.partTwoMessage = partTwoMessage
                $uibModal.open({
                    templateUrl: 'confirmationModal.html',
                    controller: ConfirmationModalCtrl
                });
            }

            scope.routeToClientView = function (clientId) {
                location.path('/viewclient/' + clientId);
            };

            scope.viewBuroResult = function (memberId) {
                scope.buroCheckResult = {};
                console.log("======GP ID===========\n\n")
                console.log(memberId)
                console.log("======GP MEMBERS===========\n\n")
                console.log(JSON.stringify(scope.groupMembers))
                if(scope.groupMembers && scope.groupMembers.length > 0){
                    for (let i = 0; i < scope.groupMembers.length; i++){
                        if(scope.groupMembers[i].id === memberId){
                            scope.buroCheckResult = scope.groupMembers[i].buroData;
                        }
                    }
                }

                $uibModal.open({
                    templateUrl: 'viewBuroResultAnalysis.html',
                    controller: viewBuroResultAnalysisCtrl
                });
            };

            var viewBuroResultAnalysisCtrl = function ($scope, $uibModalInstance) {
                var result = Object.assign({}, scope.buroCheckResult);
                $scope.buroCheckResult = result;
                if(result.fecha){
                    $scope.buroCheckResult.fecha = new Date(... result.fecha);
                }
                $scope.cancel = function () {
                    $uibModalInstance.close();
                };
            };


            scope.selectAllMembers = function(){
                for (var i = 0; i < scope.groupMembers.length; i++ ){
                     scope.groupMembers[i].isSelected = scope.formData.isAllMembersSelected;
                }
            }


            // -----------------------------Sección nuevo documento--------------------------------

            // Abrir modal para subir documento
            scope.openUploadDocumentModal = function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'uploadDocumentModal.html',
                    controller: UploadDocumentModalCtrl
                });

                modalInstance.result.then(function (document) {
                    // Al cerrar el modal con éxito, subir el documento
                    scope.uploadDocument(document.description, document.file);
                });
            };

            // Controlador del modal
            var UploadDocumentModalCtrl = function ($scope, $uibModalInstance) {
                $scope.document = {
                    description: '',
                    file: null
                };

                $scope.upload = function () {
                    if (!$scope.document.file || !$scope.document.description) {
                        alert("Debe proporcionar un archivo y una descripción");
                        return;
                    }
                    $uibModalInstance.close($scope.document);
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.uploadDocument = function (description, file) {
                if (!file) {
                    alert("Debe seleccionar un archivo");
                    return;
                }

                let fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/members/' + routeParams.groupId,
                    data: {
                        dpi: fileNameWithoutExt,
                        description: description,
                        file: file
                    },
                }).then(function (data) {
                    if (!scope.$$phase) scope.$apply();
                    location.path('/prequalificationsmenu');
                });
            };

            //------------------------------- Add comment -------------------------------------------------

            scope.submitComment = function() {
                if (!scope.formData || !scope.formData.comments || scope.formData.comments.trim() === '') {
                    alert("Debe ingresar un comentario de excepción antes de enviar.");
                    return;
                }

                // Construcción del cuerpo a enviar
                let dataToSend = {
                    name: scope.groupData.groupName,
                    description: 'normal',
                    comment: scope.formData.comments
                };

                // Envío del comentario sin archivo
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/' + routeParams.groupId + '/comment',
                    data: dataToSend,
                }).then(function (response) {
                    if (!scope.$$phase) scope.$apply();
                    alert("Comentario añadido exitosamente.");
                    scope.formData.comments = '';
                }, function (error) {
                    alert("Ocurrió un error al intentar guardar el comentario.");
                });
            }

            //------------------------------- Sección añadir comentario de exepción ----------------------------------

            scope.submitExceptionComment = function () {
                // Validar que exista comentario
                if (!scope.formData || !scope.formData.exceptionComment || scope.formData.exceptionComment.trim() === '') {
                    alert("Debe ingresar un comentario de excepción antes de enviar.");
                    return;
                }

                // Construcción del cuerpo a enviar
                let dataToSend = {
                    name: scope.groupData.groupName,
                    description: 'exception',
                    comment: scope.formData.exceptionComment
                };

                // Envío del comentario sin archivo
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/' + routeParams.groupId + '/comment',
                    data: dataToSend,
                }).then(function (response) {
                    if (!scope.$$phase) scope.$apply();
                    alert("Comentario añadido exitosamente.");
                    scope.formData.exceptionComment = '';

                }, function (error) {
                    alert("Ocurrió un error al intentar guardar el comentario de excepción.");
                });
            };


            // --------------------------------------------- NEW REJECTED VIEW ----------------------------------
            scope.rejectPrequalification = function () {
                resourceFactory.codeValueNameResource.getAllCodeValues({ codeName: 'Rejected Prequalification Options' }).$promise
                    .then(function (data) {
                        scope.rejectReasons = data;

                        var modalInstance = $uibModal.open({
                            templateUrl: 'rejectPrequalificationModal.html',
                            controller: RejectModalCtrl,
                            resolve: {
                                reasons: function () { return scope.rejectReasons; }
                            }
                        });

                        modalInstance.result.then(function (result) {
                            resourceFactory.prequalificationChecklistResource.processAnalysis(
                                {
                                    prequalificationId: routeParams.groupId,
                                    command: 'rejectanalysis'
                                },
                                {
                                    action: 'rejectanalysis',
                                    reasonId: result.reasonId,
                                    comments: result.comment,
                                    members: scope.groupMembers.map(m => ({ id: m.id, isSelected: true }))
                                },
                                function (response) {
                                    alert("Solicitud rechazada correctamente");
                                    scope.routeTo("/prequalificationsmenu");
                                }
                            );
                        });
                    })
                    .catch(function (err) {
                        console.error("Error cargando razones de rechazo:", err);
                    });
            };


            var RejectModalCtrl = ['$scope', '$uibModalInstance', 'reasons', function ($scope, $uibModalInstance, reasons) {
                $scope.reasons = reasons;
                $scope.selectedReason = null;
                $scope.optionalComment = "";

                $scope.confirm = function () {
                    if (!$scope.selectedReason) {
                        alert("Debe seleccionar una razón de rechazo");
                        return;
                    }

                    $uibModalInstance.close({
                        reasonId: $scope.selectedReason,
                        comment: $scope.optionalComment
                    });
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            }];





            // -----------------------------Sección Argumentar caso--------------------------------

            // Abrir modal para argumentar caso
            scope.argueACase = function () {
                var modalInstance = $uibModal.open({
                    templateUrl: 'argueACase.html',
                    controller: argueACaseModalCtrl
                });

                modalInstance.result.then(function (document) {
                    // Al cerrar el modal con éxito, subir el documento
                    scope.uploadDocument(document.description, document.file);
                });
            };

            // Controlador del modal para argumentar caso
            var argueACaseModalCtrl = function ($scope, $uibModalInstance) {
                $scope.document = {
                    description: '',
                    file: null
                };

                $scope.upload = function () {
                    if (!$scope.document.description) {
                        alert("Debe proporcionar una descripción");
                        return;
                    }
                    $uibModalInstance.close($scope.document);
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.processAnalysisRenegotiation = function (status, inMessage) {
                scope.analysisStatus = status;
                scope.confirmationMessage = inMessage
                $uibModal.open({
                    templateUrl: 'renegotiationModal.html',
                    controller: RenegotiationModalCtrl
                });
            }

            scope.processRenegotiationAction = function (status, inMessage) {
                scope.analysisStatus = status;
                scope.confirmationMessage = inMessage
                $uibModal.open({
                    templateUrl: 'renegotiationConfirmationModal.html',
                    controller: RenegotiationConfirmationModalCtrl
                });
            }

            scope.uploadDocument = function (description, file) {

                let fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/members/' + routeParams.groupId,
                    data: {
                        dpi: fileNameWithoutExt,
                        description: description,
                        file: file,
                        sendToCommittee: true,
                        comment: description
                    },
                }).then(function (data) {
                    if (!scope.$$phase) scope.$apply();
                    location.path('/prequalificationsmenu');
                });
            };

            var RenegotiationModalCtrl = function ($scope, $uibModalInstance) {
                $scope.confirmationMessage = scope.confirmationMessage;
                $scope.groupMember = scope.groupMembers? scope.groupMembers[0]: {};
                $scope.renegotiationData = {
                    locale: scope.optlang.code,
                };
                $scope.confirm = function () {
                    resourceFactory.prequalificationChecklistResource.processAnalysis(
                        {prequalificationId: routeParams.groupId, command: scope.analysisStatus},
                        {action: scope.analysisStatus,comments:scope.formData.comments, renegotiationData: $scope.renegotiationData},
                        function (data) {
                            scope.fetchPrequalificationDetails();
                            $uibModalInstance.dismiss('okay');
                        });
                }
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };
            var RenegotiationConfirmationModalCtrl = function ($scope, $uibModalInstance) {
                $scope.isApproval = true;
                resourceFactory.codeValueNameResource.getAllCodeValues({ codeName: 'Rejected Prequalification Options' }).$promise
                    .then(function (data) {
                        $scope.rejectReasons = data;
                    });
                $scope.confirmationMessage = scope.confirmationMessage;
                $scope.groupMember = scope.groupMembers? scope.groupMembers[0]: {};
                $scope.renegotiationData = {
                    locale: scope.optlang.code,
                };
                $scope.confirm = function () {
                    resourceFactory.prequalificationChecklistResource.processAnalysis(
                        {prequalificationId: routeParams.groupId, command: "approverenegotiation"},
                        {action: "approverenegotiation",comments:scope.formData.comments, renegotiationData: $scope.renegotiationData},
                        function (data) {
                            scope.fetchPrequalificationDetails();
                            $uibModalInstance.dismiss('okay');
                        });
                }
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
                $scope.rejectRenegotiation = function () {
                    $scope.isApproval = !$scope.isApproval;
                };

                $scope.confirmReject = function () {
                    resourceFactory.prequalificationChecklistResource.processAnalysis(
                        {prequalificationId: routeParams.groupId, command: "rejectrenegotiation"},
                        {action: "rejectrenegotiation",comments:scope.formData.comments, renegotiationData: $scope.renegotiationData},
                        function (data) {
                            scope.fetchPrequalificationDetails();
                            $uibModalInstance.dismiss('okay');
                        });
                };
            };
            //--------------- COMMENTS VIEW ----------------
            scope.visibleComments = function () {
                if (!scope.formData || !scope.formData.listComments) return [];
                return scope.showAllComments
                    ? scope.formData.listComments
                    : scope.formData.listComments.slice(0, 2);
            };

            scope.visibleExceptionComments = function () {
                if (!scope.formData || !scope.formData.exceptionListComments) return [];
                return scope.showAllExceptionComments
                    ? scope.formData.exceptionListComments
                    : scope.formData.exceptionListComments.slice(0, 2);
            };

            scope.updateShowAllExceptionComments = function () {
                scope.showAllExceptionComments = !scope.showAllExceptionComments;
            }

            scope.updateShowAllComments = function () {
                scope.showAllComments = !scope.showAllComments;
            }

            // Add downloadAllPaeDocuments to scope
            scope.downloadAllDocuments = function() {
                if (!scope.prequalificationDocuments || scope.prequalificationDocuments.length === 0) {
                    alert('No documents to download.');
                    return;
                }
                var zip = new JSZipService.getJSZip();
                var pdfFolder = zip.folder('PDF');
                var excelFolder = zip.folder('EXCEL');
                var otherFolder = zip.folder('OTROS');
                var count = 0;
                var zipFilename = (scope.groupData.prequalificationNumber || 'PRECAL_'+routeParams.groupId) + '_documents.zip';
                var failed = [];

                // Get auth headers from session/local storage
                var sessionData = null;
                try {
                    sessionData = JSON.parse(localStorage.getItem('sessionData')) || JSON.parse(sessionStorage.getItem('sessionData'));
                } catch (e) {}
                var authHeader = {};
                if (sessionData && sessionData.authenticationKey) {
                    if (sessionData.authenticationKey.startsWith('Bearer ') || sessionData.authenticationKey.startsWith('bearer ')) {
                        authHeader['Authorization'] = sessionData.authenticationKey;
                    } else {
                        authHeader['Authorization'] = 'Basic ' + sessionData.authenticationKey;
                    }
                }
                // Add tenant header if available
                authHeader['Fineract-Platform-TenantId'] = "default";
                var tenant = localStorage.getItem('Fineract-Platform-TenantId') || sessionStorage.getItem('Fineract-Platform-TenantId');
                if (tenant) {
                    authHeader['Fineract-Platform-TenantId'] = tenant;
                }

                // Add 2FA token header if available
                var tokenData = localStorage.getItem('mifosX.twofactor');
                if (tokenData) {
                    let userData = JSON.parse(localStorage.getItem('mifosX.userData'));
                    let username = userData && userData.username;
                    let parsed = JSON.parse(tokenData);
                    let entry = username && parsed[username];
                    let token = entry && entry.token;

                    if (token) authHeader['fineract-platform-tfa-token'] = token;
                }

                scope.prequalificationDocuments.forEach(function(doc) {
                    var url = scope.hostUrl + doc.docUrl;
                    var documentName =  doc.name+'_'+doc.id || doc.description || ('document_' + doc.id);
                    var fileName =  doc.fileName || doc.name || ('document_' + doc.id);


                    fetch(url, { credentials: 'include', headers: authHeader })
                        .then(function(response) {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.blob();
                        })
                        .then(function(blob) {
                            var lowerName = fileName.toLowerCase();
                            var targetFolder;
                            if (lowerName.endsWith('.pdf')) {
                                targetFolder = pdfFolder;
                            }else if(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')|| lowerName.endsWith('.csv')){
                                targetFolder=excelFolder
                            } else {
                                targetFolder = otherFolder;
                            }
                            targetFolder.file(documentName, blob);

                            count++;
                            if (count === scope.prequalificationDocuments.length) {
                                zip.generateAsync({ type: 'blob' }).then(function(content) {
                                    saveAs(content, zipFilename);
                                });
                            }
                        })
                        .catch(function(err) {
                            failed.push(documentName);
                            count++;
                            if (count === scope.prequalificationDocuments.length) {
                                if (failed.length > 0) {
                                    alert('Some files could not be downloaded: ' + failed.join(', '));
                                }
                                if (failed.length < scope.prequalificationDocuments.length) {
                                    zip.generateAsync({ type: 'blob' }).then(function(content) {
                                        saveAs(content, zipFilename);
                                    });
                                }

                            }
                        });
                });
            };

            scope.downloadAllPaeDocuments = function() {
                scope.showDownloading=true;
                if (!scope.paeLoandocuments || scope.paeLoandocuments.length === 0) {
                    alert('No documents to download.');
                    scope.showDownloading=false
                    return;
                }
                var zip = new JSZipService.getJSZip();
                var pdfFolder = zip.folder('PDF');
                var excelFolder = zip.folder('EXCEL');
                var otherFolder = zip.folder('OTROS');
                var count = 0;
                var zipFilename = (scope.groupData.prequalificationNumber || 'PRECAL_'+routeParams.groupId) + '_documents.zip';
                var failed = [];

                // Get auth headers from session/local storage
                var sessionData = null;
                try {
                    sessionData = JSON.parse(localStorage.getItem('sessionData')) || JSON.parse(sessionStorage.getItem('sessionData'));
                } catch (e) {
                    scope.showDownloading=false
                }
                var authHeader = {};
                if (sessionData && sessionData.authenticationKey) {
                    if (sessionData.authenticationKey.startsWith('Bearer ') || sessionData.authenticationKey.startsWith('bearer ')) {
                        authHeader['Authorization'] = sessionData.authenticationKey;
                    } else {
                        authHeader['Authorization'] = 'Basic ' + sessionData.authenticationKey;
                    }
                }
                // Add tenant header if available
                authHeader['Fineract-Platform-TenantId'] = "default";
                var tenant = localStorage.getItem('Fineract-Platform-TenantId') || sessionStorage.getItem('Fineract-Platform-TenantId');
                if (tenant) {
                    authHeader['Fineract-Platform-TenantId'] = tenant;
                }

                // Add 2FA token header if available
                var tokenData = localStorage.getItem('mifosX.twofactor');
                if (tokenData) {
                    let userData = JSON.parse(localStorage.getItem('mifosX.userData'));
                    let username = userData && userData.username;
                    let parsed = JSON.parse(tokenData);
                    let entry = username && parsed[username];
                    let token = entry && entry.token;

                    if (token) authHeader['fineract-platform-tfa-token'] = token;
                }

                scope.paeLoandocuments.forEach(function(doc) {
                    var url = scope.hostUrl + doc.docUrl;
                    var fileName =  doc.fileName || doc.name || ('document_' + doc.id);
                    var ext = fileName.lastIndexOf('.') !== -1 ? fileName.substring(fileName.lastIndexOf('.')) : '';
                    var documentName = (doc.name + '_' + doc.id || doc.description || ('document_' + doc.id)) + ext;


                    fetch(url, { credentials: 'include', headers: authHeader })
                        .then(function(response) {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.blob();
                        })
                        .then(function(blob) {
                            var lowerName = fileName.toLowerCase();
                            var targetFolder;
                            if (lowerName.endsWith('.pdf')) {
                                targetFolder = pdfFolder;
                            }else if(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')|| lowerName.endsWith('.csv')){
                                targetFolder=excelFolder
                            } else {
                                targetFolder = otherFolder;
                            }
                            targetFolder.file(documentName, blob);

                            count++;
                            if (count === scope.paeLoandocuments.length) {
                                zip.generateAsync({ type: 'blob' }).then(function(content) {
                                    saveAs(content, zipFilename);
                                });
                            }
                        })
                        .catch(function(err) {
                            failed.push(documentName);
                            count++;
                            if (count === scope.paeLoandocuments.length) {
                                if (failed.length > 0) {
                                    alert('Some files could not be downloaded: ' + failed.join(', '));
                                }
                                if (failed.length < scope.paeLoandocuments.length) {
                                    zip.generateAsync({ type: 'blob' }).then(function(content) {
                                        saveAs(content, zipFilename);
                                    });
                                }

                            }
                        });
                });
                scope.showDownloading=false
            };

            scope.previewDocument = function (document) {
                scope.previewUrl = undefined;
                scope.isLoading=  true;

                var url = scope.hostUrl + document.docUrl;

                scope.preview =  true;

                // Get auth headers from session/local storage
                var sessionData = null;
                try {
                    sessionData = JSON.parse(localStorage.getItem('sessionData')) || JSON.parse(sessionStorage.getItem('sessionData'));
                } catch (e) {}
                var authHeader = {};
                if (sessionData && sessionData.authenticationKey) {
                    if (sessionData.authenticationKey.startsWith('Bearer ') || sessionData.authenticationKey.startsWith('bearer ')) {
                        authHeader['Authorization'] = sessionData.authenticationKey;
                    } else {
                        authHeader['Authorization'] = 'Basic ' + sessionData.authenticationKey;
                    }
                }
                // Add tenant header if available
                authHeader['Fineract-Platform-TenantId'] = "default";
                var tenant = localStorage.getItem('Fineract-Platform-TenantId') || sessionStorage.getItem('Fineract-Platform-TenantId');
                if (tenant) {
                    authHeader['Fineract-Platform-TenantId'] = tenant;
                }

                // Add 2FA token header if available
                var tokenData = localStorage.getItem('mifosX.twofactor');
                if (tokenData) {
                    let userData = JSON.parse(localStorage.getItem('mifosX.userData'));
                    let username = userData && userData.username;
                    let parsed = JSON.parse(tokenData);
                    let entry = username && parsed[username];
                    let token = entry && entry.token;

                    if (token) authHeader['fineract-platform-tfa-token'] = token;
                }

                fetch(url, { credentials: 'include', headers: authHeader })
                    .then(function(response) {
                        if (!response.ok) throw new Error('Network response was not ok');
                        scope.isLoading=  false;
                        return response.blob();
                    })
                    .then(function(blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        scope.previewUrl = $sce.trustAsResourceUrl(blobUrl);
                        scope.isLoading=  false;
                    })
                    .catch(function(err) {
                        console.log('Some files could not be downloaded');
                        scope.isLoading=  false;
                    });


                //timeout 10 seconds and close preview
                $timeout(function(){
                    scope.preview =  false;
                    scope.isLoading=  false;
                },80000);
            };


            scope.getPaeLoanDocuments = function () {
                let loanId = scope.groupMembers[0].loanId;
                if (loanId){
                    console.log("Fetching PAE Loan Documents");
                    resourceFactory.entityDocumentsResource.getAllDocuments({
                        entity: 'paeloandocs',
                        entityId: loanId
                    }, function (data) {
                        for (var l in data) {

                            var bldocs = {};
                            bldocs = API_VERSION + '/' + data[l].parentEntityType + '/' + data[l].parentEntityId + '/documents/' + data[l].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                            data[l].docUrl = bldocs;
                            data[l].fileIsImage = true;
                            if (data[l].fileName)
                                data[l].fileIsImage = data[l].fileName.toLowerCase().indexOf('.zip') == -1;
                            if (data[l].type)
                                data[l].fileIsImage = data[l].type.toLowerCase().indexOf('zip') == -1;
                        }
                        scope.paeLoandocuments = data;
                    });
                }
            };
            scope.deletePaeDocument = function (documentId, index) {
                let loanId = scope.groupMembers[0].loanId;

                resourceFactory.entityDocumentsResource.delete({entity: "paeloandocs", entityId: loanId, documentId: documentId}, '', function (data) {
                    scope.paeLoandocuments.splice(index, 1);
                });
            };

            scope.deletePrequalDocument = function (documentId, index) {
                resourceFactory.entityDocumentsResource.delete({entity: "prequalifications", entity: scope.groupId, documentId: documentId}, '', function (data) {
                    scope.prequalificationDocuments.splice(index, 1);
                });
            };

        }
    });

    mifosX.ng.application.controller('PrequalificationDetailsAnalysisController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload','$sce','JSZipService', mifosX.controllers.PrequalificationDetailsAnalysisController]).run(function ($log) {
        $log.info("PrequalificationDetailsAnalysisController initialized");
    });
}(mifosX.controllers || {}));
