(function (module) {
    mifosX.controllers = _.extend(module, {
        NewGroupPrequalificatoinController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

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
            scope.membersForm = {};
            scope.memberDetailsForm;

            resourceFactory.prequalificationTemplateResource.get(function (data) {
                scope.agenciesList = data.agencies
                scope.portfoliosList = data.portfolioData
                scope.productsList = data.loanProducts
                scope.facilitators = data.facilitators
            });


            scope.getPortfolioCenters = function (portfolioId) {
                resourceFactory.portfolioResource.get({portfolioId: portfolioId}, function (data) {
                    scope.centersList = data.centers;
                });
            }

            scope.getCenterGroups = function (centerId) {
                console.log("going to fetch groups for center: " + centerId)
                resourceFactory.portfolioCenterResource.get({
                    portfolioId: scope.formData.portfolioId,
                    portfolioCenterId: centerId
                }, function (data) {
                    scope.groupsList = data.groups;
                });
            }

            scope.submit = function () {
                this.formData.locale = scope.optlang.code;

                resourceFactory.blacklistResource.save(this.formData, function (data) {
                    location.path('blacklist/' + data.resourceId + '/viewdetails');
                });
            }

            scope.addMemberData = function () {
                var reqDate = dateFilter(scope.membersForm.dob, scope.df);

                scope.membersForm.dob = reqDate;
                scope.membersForm['locale'] = scope.optlang.code;
                scope.membersForm['dateFormat'] = scope.df;

                scope.formData.members.push(scope.membersForm);
                scope.membersForm = {}
                scope.memberDetailsForm.$setUntouched();
                scope.memberDetailsForm.$setPristine();

            }

            scope.requestPrequalification = function () {
                console.log("submitting form data")
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;

                // this.formData.members.forEach(function(member){
                //     member.locale = scope.optlang.code;
                //     member.dateFormat = scope.df;
                // })
                resourceFactory.prequalificationResource.save(this.formData, function (data) {
                    location.path('prequalification/' + data.resourceId + '/viewdetails');
                });
            }

        }
    });

    mifosX.ng.application.controller('NewGroupPrequalificatoinController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.NewGroupPrequalificatoinController]).run(function ($log) {
        $log.info("NewGroupPrequalificatoinController initialized");
    });
}(mifosX.controllers || {}));
