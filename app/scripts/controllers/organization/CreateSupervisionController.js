(function (module) {
    mifosX.controllers = _.extend(module, {
        CreateSupervisionController: function (scope, resourceFactory, location, dateFilter) {
            scope.supervisions = [];
            scope.first = {};
            scope.tf = "HH:mm";

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.supervisionTemplateResource.get(requestParams, function (data) {
                scope.parentOfficesOptions = data.parentOfficesOptions;
                scope.responsibleUserOptions = data.responsibleUserOptions;
                scope.formData = {
                    parentId: scope.parentOfficesOptions[0].id,
                    responsibleUserId: scope.responsibleUserOptions[0].id
                }
            });

            scope.submit = function () {
                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;

                resourceFactory.supervisionResource.save(this.formData, function (data) {
                    location.path('/viewsupervision/' + data.resourceId);
                });
            };
        }
    });
    mifosX.ng.application.controller('CreateSupervisionController', ['$scope', 'ResourceFactory', '$location', 'dateFilter', mifosX.controllers.CreateSupervisionController]).run(function ($log) {
        $log.info("CreateSupervisionController initialized");
    });
}(mifosX.controllers || {}));
