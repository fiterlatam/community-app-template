(function (module) {
    mifosX.controllers = _.extend(module, {
        ClientIdentifierController: function (scope, routeParams, location, resourceFactory, dateFilter) {
            scope.clientId = routeParams.clientId;
            scope.formData = {};
            scope.documenttypes = [];
            scope.validityDate = new Date ();
            scope.statusTypes = [{
                id: 1,
                label: 'Active'
            }, {
                id: 2,
                label: 'Inactive',
            }];
            resourceFactory.clientIdenfierTemplateResource.get({clientId: routeParams.clientId}, function (data) {
                scope.documenttypes = data.allowedDocumentTypes;
                scope.formData.documentTypeId = data.allowedDocumentTypes[0].id;
            });

            scope.submit = function () {
                if (scope.validityDate) {
                    this.formData.validityDate = dateFilter(scope.validityDate, scope.df);
                }

                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;

                resourceFactory.clientIdenfierResource.save({clientId: scope.clientId}, this.formData, function (data) {
                    location.path('/viewclient/' + data.clientId);
                });
            };

        }
    });
    mifosX.ng.application.controller('ClientIdentifierController', ['$scope', '$routeParams', '$location', 'ResourceFactory', 'dateFilter', mifosX.controllers.ClientIdentifierController]).run(function ($log) {
        $log.info("ClientIdentifierController initialized");
    });
}(mifosX.controllers || {}));

