(function (module) {
    mifosX.controllers = _.extend(module, {
        PortfoliosPlanningController: function (scope, resourceFactory, location) {

            scope.routeTo = function (id) {
                location.path('/viewportfolioplanning/' + id);
            };

            scope.deepCopy = function (obj) {
                if (Object.prototype.toString.call(obj) === '[object Array]') {
                    var out = [], i = 0, len = obj.length;
                    for (; i < len; i++) {
                        out[i] = arguments.callee(obj[i]);
                    }
                    return out;
                }
                if (typeof obj === 'object') {
                    var out = {}, i;
                    for (i in obj) {
                        out[i] = arguments.callee(obj[i]);
                    }
                    return out;
                }
                return obj;
            }

            scope.PortfoliosPerPage =15;
            resourceFactory.portfolioResource.getAllPortfoliosForCurrentUser(function (data) {
                scope.portfolios = scope.deepCopy(data);

                function sortByParentId(a, b) {
                    return a.parentId - b.parentId;
                }

                data.sort(sortByParentId);

            });
        }
    });
    mifosX.ng.application.controller('PortfoliosPlanningController', ['$scope', 'ResourceFactory', '$location', mifosX.controllers.PortfoliosPlanningController]).run(function ($log) {
        $log.info("PortfoliosPlanningController initialized");
    });
}(mifosX.controllers || {}));