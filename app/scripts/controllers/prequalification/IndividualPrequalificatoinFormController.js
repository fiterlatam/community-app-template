(function (module) {
    mifosX.controllers = _.extend(module, {
        IndividualPrequalificatoinFormController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {

            scope.memberDetailsForm;
            scope.groupData;
            scope.membersList = [];
            scope.tf = "HH:mm";
            scope.yesNo = [{value: "YES", name: "Yes"}, {value: "NO", name: "No"}];


            // Evita el envío duplicado (doble clic) mientras la petición está en curso
            scope.isSubmitting = false;

            scope.prequalify = function () {
                if (scope.isSubmitting) {
                    return;
                }
                scope.isSubmitting = true;
                var reqDate = dateFilter(scope.membersForm.dob, scope.df);

                scope.membersForm.individual = true;
                scope.membersForm.dob = reqDate;
                scope.membersForm['locale'] = scope.optlang.code;
                scope.membersForm['dateFormat'] = scope.df;

                resourceFactory.individualPrequalificationResource.save(scope.membersForm, function (data) {
                    location.path('prequalifications/individualprequalifications');
                }, function () {
                    scope.isSubmitting = false;
                });
            }
        }
    });

    mifosX.ng.application.controller('IndividualPrequalificatoinFormController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.IndividualPrequalificatoinFormController]).run(function ($log) {
        $log.info("IndividualPrequalificatoinFormController initialized");
    });
}(mifosX.controllers || {}));
