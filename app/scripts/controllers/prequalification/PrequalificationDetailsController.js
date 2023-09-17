(function (module) {
    mifosX.controllers = _.extend(module, {
        PrequalificationDetailsController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.groupData = {};
            scope.formData = {};
            scope.groupMembers = [];
            scope.prequalificationDocuments = [];
            scope.showValidatePolicies = routeParams.showValidatePolicies == 'true' ? true : false;
            resourceFactory.prequalificationResource.get({groupId: routeParams.groupId}, function (data) {
                scope.groupData = data;
                scope.groupMembers = data.groupMembers;
            });

            resourceFactory.entityDocumentsResource.getAllDocuments({entity: 'prequalifications',entityId: routeParams.groupId}, function (data) {
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
                Upload.upload({
                    url: $rootScope.hostUrl + API_VERSION + '/prequalification/' + routeParams.groupId+ '/comment',
                    data: {name:scope.groupData.groupName, description : scope.formData.description, comment : scope.formData.comments, file: scope.formData.file},
                }).then(function (data) {
                    // to fix IE not refreshing the model
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                    location.path('/prequalificationGroups/new');
                });
            };

            scope.resolveMemberStatus = function (statusId) {
                if (statusId==='ACTIVE'){
                    return 'text-danger';
                }
                if (statusId==='INACTIVE'){
                    return 'text-warning';
                }
                if (statusId==='NONE'){
                    return 'text-success';
                }
            }

            scope.resolveBureaStatus = function (statusId) {
                if (statusId==='BUREAU_AVAILABLE'){
                    return 'A';
                }else {
                    return 'NA';
                }
            }
            scope.policyCheckColor = function (redValidationCount) {
                    if (redValidationCount > 0){
                         return 'text-danger';
                    }
                    return 'text-success'
            }
            scope.validateHardPolicy = function(){
                resourceFactory.prequalificationChecklistResource.validate({prequalificationId: routeParams.groupId}, {}, function (data) {
                    route.reload();
               });
            }

            scope.validateBeaural = function(){
                resourceFactory.prequalificationChecklistResource.bureauValidation({prequalificationId: routeParams.groupId}, {}, function (data) {
                    route.reload();
               });
            }

            scope.onFileSelect = function (files) {
                scope.formData.file = files[0];
            };

            scope.showSupportDocumentUploadPage = function(){
                var allowedStatuses =  [400, 200];
                if(scope.groupData.status){
                    return allowedStatuses.includes(scope.groupData.status.id)
                }
                return false;
            }
        }
    });

    mifosX.ng.application.controller('PrequalificationDetailsController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.PrequalificationDetailsController]).run(function ($log) {
        $log.info("PrequalificationDetailsController initialized");
    });
}(mifosX.controllers || {}));
