(function (module) {
    mifosX.controllers = _.extend(module, {
        AddToBlacklistController: function (scope, routeParams, route, location, resourceFactory, http, $uibModal, API_VERSION, $timeout, $rootScope, Upload) {
            scope.client = null;
            scope.typificationOptions = [];
            scope.loanProductOptions = [];

            scope.formData={};


            resourceFactory.blacklistTemplateResource.get({clientId: routeParams.clientId}, function (data) {
                scope.client = data;
                scope.formData['dpiNumber'] = data.dpi
                scope.formData['clientName'] = data.clientName
                scope.typificationOptions= data.typificationOptions
                scope.loanProductOptions= data.loanProducts
            });



            scope.submit=function (){
                this.formData.locale = scope.optlang.code;

                resourceFactory.blacklistResource.save({clientId: routeParams.clientId}, this.formData, function (data) {
                    location.path('/viewclient/' + routeParams.clientId );
                });
            }

        }
    });

    mifosX.ng.application.controller('AddToBlacklistController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', '$http', '$uibModal', 'API_VERSION', '$timeout', '$rootScope', 'Upload', mifosX.controllers.AddToBlacklistController]).run(function ($log) {
        $log.info("AddToBlacklistController initialized");
    });
}(mifosX.controllers || {}));
