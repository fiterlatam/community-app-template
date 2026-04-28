(function (module) {
    mifosX.controllers = _.extend(module, {
        PrequalificationDetailsController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload,JSZipService,$sce,$http,$log) {

            scope.groupData = {};
            scope.isEdit = false;
            scope.formData = {};
            scope.groupId = routeParams.groupId;
            scope.groupMembers = [];
            scope.prequalificationDocuments = [];
            scope.viewPolicyCheckResults = false;
            scope.groupingType = routeParams.groupingType;
            scope.previousPageUrl = "#/prequalificationsmenu";
            if (routeParams.groupingType === 'group'){
                scope.previousPageUrl = "#/prequalificationGroups/group/list";
            }

            if (routeParams.groupingType === 'individual'){
                scope.previousPageUrl = "#/prequalificationGroups/individual/list";
            }
            scope.hasRedValidations = false;

            resourceFactory.prequalificationResource.get({groupId: routeParams.groupId}, function (data) {
                scope.groupData = data;
                // Show the results if the status is HARD_POLICY_CHECKED (700) and subsequence
                if(data.status.id >= 700){
                   scope.viewPolicyCheckResults = true;
                }
                scope.groupMembers = data.groupMembers;
                if (scope.groupingType === 'individual'){
                    let countRedValidations = 0;
                    for(const i in scope.groupMembers){
                        if(scope.groupMembers[i].redValidationCount > 0 || scope.groupMembers[i].activeBlacklistCount > 0){
                            countRedValidations++;
                        }
                    }
                    if(countRedValidations > 0){
                        scope.hasRedValidations = true;
                    }
                } else if (scope.groupingType === 'group'){
                    let countRedValidations = data.redValidationCount || 0;
                    for(const i in scope.groupMembers){
                        if(scope.groupMembers[i].redValidationCount > 0 || scope.groupMembers[i].activeBlacklistCount > 0){
                            countRedValidations++;
                        }
                    }
                    if(countRedValidations > 0){
                        scope.hasRedValidations = true;
                    }
                }
                scope.getPaeLoanDocuments();
            });

            resourceFactory.entityDocumentsResource.getAllDocuments({
                entity: 'prequalifications',
                entityId: routeParams.groupId
            }, function (data) {
                for (var l in data) {

                    var bldocs = {};
                    bldocs = API_VERSION + '/' + data[l].parentEntityType + '/' + data[l].parentEntityId + '/documents/' + data[l].id + '/attachment?tenantIdentifier=' + $rootScope.tenantIdentifier;
                    data[l].docUrl = bldocs;
                    if (data[l].fileName)
                        if (data[l].fileName.toLowerCase().indexOf('.jpg') != -1 || data[l].fileName.toLowerCase().indexOf('.jpeg') != -1 || data[l].fileName.toLowerCase().indexOf('.png') != -1)
                            data[l].fileIsImage = true;
                    if (data[l].type)
                        if (data[l].type.toLowerCase().indexOf('image') != -1)
                            data[l].fileIsImage = true;
                }
                scope.prequalificationDocuments = data;
            });

            scope.submit = function () {
                if (routeParams.groupingType === 'individual' || routeParams.groupingType === 'pae'){
                    scope.groupData.groupName = scope.groupData.prequalificationNumber;
                }
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
                    location.path('/prequalificationGroups/'+routeParams.groupingType+'/list');
                });
            };

            scope.resolveMemberStatus = function (statusId) {
                if (statusId === 'ACTIVE') {
                    return 'text-danger';
                }else {
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

            scope.requestForUpdates = function () {
                $uibModal.open({
                    templateUrl: 'requestForUpdatesView.html',
                    controller: RequestUpdatesCtrl
                });
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

            scope.showSupportDocumentUploadPage = function () {
                var allowedStatuses = [400, 200];
                if (scope.groupData.status) {
                    return allowedStatuses.includes(scope.groupData.status.id)
                }
                return false;
            };

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
            };

            scope.viewBuroResult = function (memberId) {
                scope.buroCheckResult = {};
                if(scope.groupMembers && scope.groupMembers.length > 0){
                    for (let i = 0; i < scope.groupMembers.length; i++){
                        if(scope.groupMembers[i].id === memberId){
                            scope.buroCheckResult = scope.groupMembers[i].buroData;
                        }
                    }
                }
                $uibModal.open({
                    templateUrl: 'viewBuroResult.html',
                    controller: ViewBuroResultCtrl
                });
            };

            scope.processAnalysisRequest = function (status, inMessage) {
                scope.analysisStatus = status;
                scope.confirmationMessage = inMessage
                $uibModal.open({
                    templateUrl: 'confirmationModal.html',
                    controller: ConfirmationModalCtrl
                });
            }

            scope.getTimelineTooltip = function(item) {
                var html = '';
                if (item.changedBy) html += 'Cambiado por: ' + item.changedBy + '\n';
                if (item.changeDate) html += 'Fecha: ' + item.changeDate + '\n';
                if (item.comments) html += 'Comentarios: ' + item.comments;
                return html;
            };

            scope.getFilteredExpectedTimeline = function() {
                if (!scope.groupData.expectedTimeline || !scope.groupData.currentTimeline) return [];
                // Find the object with the maximum index
                var maxIndexObj = scope.groupData.currentTimeline.reduce(function(prev, curr) {
                    return (prev.index > curr.index) ? prev : curr;
                });
                var maxStatusId = maxIndexObj.statusData.id;
                // Find the position of maxStatusId in expectedTimeline
                var maxIdx = scope.groupData.expectedTimeline.findIndex(function(step) {
                    return step.id === maxStatusId;
                });
                // If not found, show all
                if (maxIdx === -1) return scope.groupData.expectedTimeline;
                // Show all expected steps up to and including maxIdx
                return scope.groupData.currentTimeline;
            };

            var RequestUpdatesCtrl = function ($scope, $uibModalInstance) {
                $scope.updateData = {};

                $scope.submit = function () {
                    resourceFactory.prequalificationChecklistResource.requestUpdates({prequalificationId: routeParams.groupId}, {comments:$scope.updateData.comments}, function (data) {
                        $uibModalInstance.dismiss('cancel');
                        route.reload();
                    });
                };

                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            var ViewBuroResultCtrl = function ($scope, $uibModalInstance) {
                var result = Object.assign({}, scope.buroCheckResult);
                $scope.buroCheckResult = result;
                if(result.fecha){
                    $scope.buroCheckResult.fecha = new Date(... result.fecha);
                }
                $scope.cancel = function () {
                    $uibModalInstance.close();
                };
            };

            var ViewMemberHardPolicyCtrl = function ($scope, $uibModalInstance) {
                $scope.memberResults = scope.memberHardPolicyResults;

                $scope.checkValidationColor = function (colorName) {
                    if(colorName){
                        if('RED' === colorName.toUpperCase()){
                            return 'text-danger';
                        }

                        if('YELLOW' === colorName.toUpperCase()){
                            return 'text-warning';
                        }

                        if('GREEN' === colorName.toUpperCase()){
                            return 'text-success';
                        }

                        if('GREEN' === colorName.toUpperCase()){
                            return 'text-success';
                        }

                        if('ORANGE' === colorName.toUpperCase()){
                            return 'text-warning';
                        }
                    }
                    return '';
                }

                $scope.colorLabel = function (colorName) {
                    console.log("going to validate color: "+colorName)
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
                $scope.confirm = function () {
                    resourceFactory.prequalificationChecklistResource.processAnalysis(
                        {prequalificationId: routeParams.groupId, command: scope.analysisStatus},
                        {action: scope.analysisStatus,comments:scope.formData.comments},
                        function (data) {
                            scope.routeTo("/prequalificationsmenu");
                            $uibModalInstance.dismiss('okay');
                        });
                }
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };
            };

            scope.routeTo = function (path) {
                location.path(path);
            }

            scope.updateRequestedAmount = function (member) {

                var data = {
                    "requestedAmount": member.requestedAmount,
                    "comments": member.comments,
                    "id": member.id,
                    "name": member.name,
                    "dpi": member.dpi,
                    "locale": scope.optlang.code,
                };
                delete data.isEdit;
                resourceFactory.prequalificationResource.updateMember({
                    groupId: routeParams.groupId,
                    memberId: member.id
                }, data, function (data) {
                    if (data.resourceIdentifier) {
                        route.reload();
                        scope.groupMembers[index].isEdit = false;
                    }
                });
            }

            scope.editRequestedAmount = function (index) {
                scope.groupMembers[index].isEditRequested = true;
            }


            scope.routeToClientView = function (clientId) {
                location.path('/viewclient/' + clientId);
            };

            scope.isStepCompleted = function(step) {
                if (!scope.groupData.currentTimeline) return false;
                return scope.groupData.currentTimeline.some(function(t) {
                    return t.statusData && t.statusData.id === step.id;
                });
            };
            scope.downloadCommiteeReport = function() {
                scope.printReport()
            };

            scope.printReport= function(){
                console.log("going to print report ")
                scope.report = true;
                var reportURL = $rootScope.hostUrl + API_VERSION + "/runreports/" + encodeURIComponent("Commitee Approval Report");
                reportURL += "?output-type=" + encodeURIComponent('PDF') + "&tenantIdentifier=" + $rootScope.tenantIdentifier+"&locale="+scope.optlang.code;
                var reportParams = "";
                reportParams += encodeURIComponent("R_prequalificationId") + "=" + encodeURIComponent(scope.groupData.id);
                reportParams += "&" + encodeURIComponent("R_loanId") + "=" + encodeURIComponent(scope.groupData.groupMembers[0].loanId);
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
            scope.reloadPage = function(){
                scope.report = false;
                scope.preview = false;
            }

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


            scope.previewDocument = function (document) {
                scope.previewUrl = undefined;
                scope.isLoading=  true;
                var url = scope.hostUrl + document.docUrl;

                scope.preview =  !scope.preview;

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
                    scope.false=  true;
                },80000);
            }

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


            scope.downloadAllPaeDocuments = function() {
                scope.showDownloading=true;
                scope.isLoading=  true;
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
                            scope.showDownloading=false
                        });
                });
                scope.showDownloading=false
            };

            scope.deletePaeDocument = function (documentId, index) {
                let loanId = scope.groupMembers[0].loanId;

                resourceFactory.entityDocumentsResource.delete({entity: "paeloandocs", entityId: loanId, documentId: documentId}, '', function (data) {
                    scope.paeLoandocuments.splice(index, 1);
                });
            };

            scope.deletePrequalDocument = function (documentId, index) {
                resourceFactory.entityDocumentsResource.delete({entity: "prequalifications", entityId: scope.groupId, documentId: documentId}, '', function (data) {
                    scope.prequalificationDocuments.splice(index, 1);
                });
            };



        }
    });

    mifosX.ng.application.controller('PrequalificationDetailsController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', 'JSZipService', '$sce', '$http','$log', mifosX.controllers.PrequalificationDetailsController]).run(function ($log) {
        $log.info("PrequalificationDetailsController initialized");
    });
}(mifosX.controllers || {}));
