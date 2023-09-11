(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewHardpolicyValidationController: function (scope, routeParams, route, dateFilter, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
            scope.prequalificationId = routeParams.prequalificationId;
            resourceFactory.prequalificationValidationResource.get({prequalificationId: routeParams.prequalificationId}, function (data) {
                    scope.prequalification = data.prequalification;
                    scope.members = data.members;
                });
              scope.checkValidationColor = function (colorName) {
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
        }
    });

    mifosX.ng.application.controller('ViewHardpolicyValidationController', ['$scope', '$routeParams', '$route', 'dateFilter', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.ViewHardpolicyValidationController]).run(function ($log) {
        $log.info("ViewHardpolicyValidationController initialized");
    });
}(mifosX.controllers || {}));
