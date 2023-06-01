(function (module) {
    mifosX.controllers = _.extend(module, {
        ViewPortfolioPlanningController: function (scope, routeParams, route, location, resourceFactory) {
            scope.centers=[];
            
            resourceFactory.portfolioPlanningResource.get({portfolioId: routeParams.id}, function (data) {
                scope.portfolio = data;

                // centers associated with this portfolio
                if (data.detailedPlanningData) {
                    scope.detailedPlanningData = data.detailedPlanningData;
                    scope.convertTimeArrayToObject('meetingStartTime');
                    scope.convertTimeArrayToObject('meetingEndTime');
                }
            });

            scope.convertTimeArrayToObject = function(timeFieldName){
                var date = new Date();
                for(var i in scope.detailedPlanningData){
                    scope.detailedPlanningData[i][timeFieldName] =  new Date(date.getFullYear(), date.getMonth(), date.getDay(), scope.detailedPlanningData[i][timeFieldName][0], scope.detailedPlanningData[i][timeFieldName][1], 0);
                }
            };
        }

    });
    mifosX.ng.application.controller('ViewPortfolioPlanningController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', mifosX.controllers.ViewPortfolioPlanningController]).run(function ($log) {
        $log.info("ViewPortfolioPlanningController initialized");
    });
}(mifosX.controllers || {}));