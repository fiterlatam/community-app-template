(function (module) {
    mifosX.controllers = _.extend(module, {        
        ViewCausesController: function (scope, resourceFactory, location, paginatorService) {
            scope.searchData = [];
            scope.audit = [];
            scope.formData = {};

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.causesTemplateResource.get(requestParams, function (data) {
                scope.currencyOptions = data.currencyOptions;
            });

            var fetchFunction = function (offset, limit, callback) {

                var params = {};
                params.offset = offset;
                params.limit = limit;

                if (scope.formData.searchText) {
                    params.searchText = scope.formData.searchText;
                }

                scope.saveSC();
                resourceFactory.CausesResource.retrieveCauses(params, function (data) {
                    scope.searchData.pageItems = data.pageItems;

                    if (scope.searchData.pageItems == '')
                        scope.flag = false;
                    else
                        scope.flag = true;

                    scope.row = [];
                    callback(data);
                });
            };

            scope.delete = function (id) {
                var params = {};            
                params.causeId = id;

                resourceFactory.CausesResource.deleteCause(params, function (data) {
                    scope.search();
                });
            };

            scope.update = function (id) {                
                location.path('/updatecause/' + id);               
            };

            scope.search = function () {
                scope.audit = paginatorService.paginate(fetchFunction, 20);
            };
            scope.search();
        }
    });
    mifosX.ng.application.controller('ViewCausesController', ['$scope', 'ResourceFactory', '$location', 'PaginatorService', mifosX.controllers.ViewCausesController]).run(function ($log) {
        $log.info("ViewCausesController initialized");
    });
}(mifosX.controllers || {}));