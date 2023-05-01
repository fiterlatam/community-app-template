(function (module) {
    mifosX.controllers = _.extend(module, {
        EditPortfolioCenterController: function (scope, routeParams, resourceFactory, location, dateFilter) {
            scope.formData = {};
            scope.cityOptions = [];
            scope.stateOptions = [];
            scope.countryOptions = [];
            scope.parentOfficesOptions = [];
            scope.responsibleUserOptions = [];
            scope.tf = "HH:mm";

            portfolioId = routeParams.portfolioId;
            portfolioCenterId = routeParams.portfolioCenterId;

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.portfolioCenterTemplateResource.get({portfolioId:portfolioId}, function (data) {
                scope.cityOptions = data.cityOptions;
                scope.stateOptions = data.stateOptions;
                scope.countryOptions = data.countryOptions;
                scope.parentOfficesOptions = data.parentOfficesOptions;
                scope.responsibleUserOptions = data.responsibleUserOptions;
            });

            resourceFactory.portfolioCenterResource.get({portfolioId:portfolioId, portfolioCenterId: portfolioCenterId}, function (data) {
                scope.formData = data;
                scope.formData.cityId = data.city.id;
                scope.formData.stateId = data.state.id;
                scope.formData.countryId = data.country.id;

            });

            scope.submit = function () {
                // remove extra fields from form data
                delete this.formData.parentName;
                delete this.formData.city;
                delete this.formData.state;
                delete this.formData.country;
                delete this.formData.responsibleUserName;

                this.formData.locale = scope.optlang.code;
                this.formData.dateFormat = scope.df;

                 resourceFactory.portfolioCenterResource.update({'portfolioCenterId': portfolioCenterId}, this.formData, function (data) {
                    location.path('/viewportfolio/' + portfolioId);
                });
            };
        }
    });
    mifosX.ng.application.controller('EditPortfolioCenterController', ['$scope', '$routeParams', 'ResourceFactory', '$location', 'dateFilter', mifosX.controllers.EditPortfolioCenterController]).run(function ($log) {
        $log.info("EditPortfolioCenterController initialized");
    });
}(mifosX.controllers || {}));
