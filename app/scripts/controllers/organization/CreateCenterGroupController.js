(function (module) {
    mifosX.controllers = _.extend(module, {
        CreateCenterGroupController: function (scope, routeParams, resourceFactory, location, dateFilter) {
            scope.formData = {};
            scope.parentOfficesOptions = [];
            scope.responsibleUserOptions = [];
            scope.statusOptions = [];
            scope.portfolioCenterOptions = [];
            scope.tf = "HH:mm";
            let portfolioId = routeParams.portfolioId
            let portfolioCenterId = routeParams.portfolioCenterId;

            resourceFactory.portfolioCenterByCurrentUserResource.get({portfolioId:portfolioId},function(data)
            {
                scope.portfolioCenterOptions = data;
            });

            resourceFactory.centerGroupTemplateResource.get({portfolioCenterId:portfolioCenterId}, function (data) {
                scope.parentOfficesOptions = data.parentOfficesOptions;
                scope.responsibleUserOptions = data.responsibleUserOptions;
                scope.statusOptions = data.statusOptions;
                scope.formData = {
                    portfolioCenterId: parseInt(portfolioCenterId),
                    portfolioId: parseInt(portfolioId)
                }
            });

            scope.submit = function () {
                // remove extra fields from form data
                delete this.formData.parentName;
                delete this.formData.status;
                delete this.formData.responsibleUserName;
                delete this.formData.portfolioId;

                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;

                this.formData.formationDate = dateFilter(scope.formData.formationDate, scope.df);

                if (scope.formData.meetingStartTime) {
                    this.formData.meetingStartTime = dateFilter(scope.formData.meetingStartTime, scope.tf);
                }
                if (scope.formData.meetingEndTime) {
                    this.formData.meetingEndTime = dateFilter(scope.formData.meetingEndTime, scope.tf);
                }

                 resourceFactory.centerGroupResource.save({'portfolioId': portfolioId, 'portfolioCenterId': portfolioCenterId}, this.formData, function (data) {
                    location.path('/viewcentergroups/' + portfolioId + "/" + portfolioCenterId);
                });
            };
        }
    });
    mifosX.ng.application.controller('CreateCenterGroupController', ['$scope', '$routeParams', 'ResourceFactory', '$location', 'dateFilter', mifosX.controllers.CreateCenterGroupController]).run(function ($log) {
        $log.info("CreateCenterGroupController initialized");
    });
}(mifosX.controllers || {}));
