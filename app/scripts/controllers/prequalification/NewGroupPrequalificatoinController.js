(function (module) {
    mifosX.controllers = _.extend(module, {
        NewGroupPrequalificatoinController: function (scope, routeParams, route, dateFilter, location, resourceFactory, validationService, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.agenciesList = [];
            scope.portfoliosList = [];
            scope.centersList = [];
            scope.groupsList = [];
            scope.productsList = [];
            scope.facilitators = [];
            scope.yesNo = [{value: "YES", name: "Yes"}, {value: "NO", name: "No"}];
            scope.restrictDate = new Date();
            scope.formData = {};
            scope.formData.members = [];
            scope.membersForm = {
               workWithPuente: "YES"
            };
            scope.memberDetailsForm;
            scope.groupData;
            scope.membersList = [];
            scope.tf = "HH:mm";

            resourceFactory.prequalificationTemplateResource.get(function (data) {
                scope.agenciesList = data.agencies
                scope.centersList = data.centerData
                scope.productsList = data.loanProducts
                scope.facilitators = data.facilitators
                scope.formData.prequalilficationTimespan = Number(data.prequalilficationTimespan)
            });

            scope.addMemberData = function () {
                var uiValidationErrors = [];
                if (!validationService.checkDPI(scope.membersForm.dpi)) {
                    uiValidationErrors.push({
                        message: `${scope.membersForm.dpi} DPI provided is invalid`
                    });
                } else {
                    for (var i = 0; i < scope.formData.members.length; i++ ){
                        if (scope.formData.members[i].dpi === scope.membersForm.dpi){
                             uiValidationErrors.push({message: `${scope.membersForm.dpi} DPI ya está tomada!`});
                             this.uiValidationErrors = uiValidationErrors;
                             return;
                        }
                    }
                    var reqDate = dateFilter(scope.membersForm.dob, scope.df);
                    scope.membersForm.dob = reqDate;
                    scope.membersForm['locale'] = scope.optlang.code;
                    scope.membersForm['dateFormat'] = scope.df;
                    scope.formData.members.push(scope.membersForm);
                    scope.membersForm = {
                       puente: "YES"
                    };
                    scope.memberDetailsForm.$setUntouched();
                    scope.memberDetailsForm.$setPristine();

                }
                this.uiValidationErrors = uiValidationErrors;
            }

           scope.removeMember = function (index) {
                scope.formData.members.splice(index,1);
           };

            scope.getGroupsByCenterId = function (centerId) {
                scope.groupsList = [];

                resourceFactory.centerResource.get({centerId: centerId,associations: 'groupMembers'}, function (data) {
                    scope.groupsList = data.groupMembers;
                });
            }

            scope.getGroupMembers = function (groupId) {

                resourceFactory.groupResource.get({groupId: groupId, associations: 'clientMembers'}, function (data) {
                    scope.group = data;
                    if(data.clientMembers){
                        scope.isGroupMembersAvailable = (data.clientMembers.length>0);
                        scope.membersList = data.clientMembers;
                        scope.groupData = data;

                        if (scope.groupData.meetingStartTime) {
                            scope.groupData.meetingStartTime = dateFilter(scope.groupData.meetingStartTime, scope.tf);
                        }
                        if (scope.groupData.meetingEndTime) {
                            scope.groupData.meetingEndTime = dateFilter(scope.groupData.meetingEndTime, scope.tf);
                        }
                    }
                    scope.isClosedGroup = data.status.value == 'Closed';
                    scope.staffData.staffId = data.staffId;
                });
            }

            scope.prequalifyGroup = function (){
                console.log("submitting form data")
                scope.formData.locale = scope.optlang.code;
                scope.formData.individual = false;
                scope.formData.dateFormat = scope.df;
                if (scope.membersList.length > 0){
                    let newMemberData = [];
                    for (var i = 0; i < scope.membersList.length; i++) {
                        let memberData = {};
                        memberData.clientId = scope.membersList[i].id ;
                        memberData.name = scope.membersList[i].displayName ;
                        memberData.dpi = scope.membersList[i].dpiNumber ;
                        if(scope.membersList[i].dateOfBirth){
                            memberData.dob = dateFilter(new Date(scope.membersList[i].dateOfBirth),scope.df);
                        }
                        memberData.amount = scope.membersList[i].requestedAmount ;
                        memberData.locale = scope.optlang.code;
                        memberData.dateFormat = scope.df;
                        scope.formData.members.push(memberData)
                    }
                }


                resourceFactory.prequalificationResource.prequalifyExistingGroup({groupId: scope.formData.groupId,anotherResource:'prequalifyGroup'},this.formData, function (data) {
                    location.path('prequalification/' + data.resourceId + '/viewdetails');
                });
            }

            scope.requestPrequalification = function () {
                console.log("submitting form data")
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;
                this.formData.individual = false;

                // this.formData.members.forEach(function(member){
                //     member.locale = scope.optlang.code;
                //     member.dateFormat = scope.df;
                // })
                resourceFactory.prequalificationResource.save(this.formData, function (data) {
                    location.path('prequalification/' + data.resourceId + '/viewdetails');
                });
            }

            scope.generatePrequalificationNumber = function (){
                var agencyId = this.formData.agencyId
                var groupId = this.formData.groupId
                return "PRECAL-"+agencyId+"-"+groupId.toString().padStart(4,"0")
            }

            scope.resolveTime = function (time) {
                let hour = time[0];
                let minute = time[1];
                let seconds = time[2];
                return hour.toString().padStart(2,"0")+':'+minute.toString().padStart(2,"0")+':'+seconds.toString().padStart(2,"0");
            }

        }
    });

    mifosX.ng.application.controller('NewGroupPrequalificatoinController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', 'ValidationService', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.NewGroupPrequalificatoinController]).run(function ($log) {
        $log.info("NewGroupPrequalificatoinController initialized");
    });
}(mifosX.controllers || {}));
