(function (module) {
    mifosX.controllers = _.extend(module, {
        EditCommitteeController: function (scope, routeParams, route, location, resourceFactory) {
            scope.first = {};
            scope.available = [];
            scope.selected = [];
            scope.selectedUsers = [] ;
            scope.availableUsers = [];

            let requestParams = {orderBy: 'description', sortOrder: 'ASC'};
            resourceFactory.committeeTemplateResource.get(requestParams, function (data) {
                scope.committees = data.committees;
            });

            resourceFactory.committeeResource.get({committeeId: routeParams.id}, function (data) {
                scope.formData = data;
                scope.formData.id = data.id;
                scope.formData.limit = data.committeeApprovalLimits?data.committeeApprovalLimits[0].limit:1;
                scope.selectedUsers = data.selectedUsers;
                scope.availableUsers = data.availableUsers;
                scope.committeeId = data.id;
                scope.formData.users = [];

                // --- exceptionLimits pre-population ---
                scope.belowExceptionLimits = scope.belowExceptionLimits || [];
                scope.aboveExceptionLimits = scope.aboveExceptionLimits || [];
                // clear any previous (in case of re-load)
                scope.belowExceptionLimits.length = 0;
                scope.aboveExceptionLimits.length = 0;
                if (Array.isArray(data.committeeApprovalLimits)) {
                    data.committeeApprovalLimits.forEach(function (lim) {
                        if (lim && lim.condition === 'LESS_THAN') {
                            scope.belowExceptionLimits.push({
                                fromAmount: lim.fromAmount,
                                toAmount: lim.toAmount,
                                condition: lim.condition,
                                limit: lim.limit,
                                id: lim.id,
                                isNew: lim.isNew === true ? true : false
                            });
                        } else if (lim && lim.condition === 'GREATER_THAN') {
                            scope.aboveExceptionLimits.push({
                                fromAmount: lim.fromAmount,
                                toAmount: lim.toAmount,
                                condition: lim.condition,
                                limit: lim.limit,
                                id: lim.id,
                                isNew: lim.isNew === true ? true : false
                            });
                        }
                    });
                    // sort by fromAmount to keep predictable order
                    scope.belowExceptionLimits.sort(function (a,b){return a.fromAmount - b.fromAmount;});
                    scope.aboveExceptionLimits.sort(function (a,b){return a.fromAmount - b.fromAmount;});
                    // set next "from" (previous toAmount + 1) or 0 if none
                    if (scope.belowLimitInput) {
                        scope.belowLimitInput.from = scope.belowExceptionLimits.length > 0 ? (scope.belowExceptionLimits[scope.belowExceptionLimits.length - 1].toAmount + 1) : 0;
                    }
                    if (scope.aboveLimitInput) {
                        scope.aboveLimitInput.from = scope.aboveExceptionLimits.length > 0 ? (scope.aboveExceptionLimits[scope.aboveExceptionLimits.length - 1].toAmount + 1) : 0;
                    }
                }
                // --- end exceptionLimits pre-population ---
            });

            scope.addUser = function () {
                for (var i in this.available) {
                    for (var j in scope.availableUsers) {
                        if (scope.availableUsers[j].userId == this.available[i]) {
                            var temp = scope.availableUsers[j];
                            scope.selectedUsers.push(temp);
                            scope.availableUsers.splice(j, 1);
                        }
                    }
                }
                //We need to remove selected items outside above loop. If we don't remove, we can see empty item appearing
                //If we remove available items in above loop, all items will not be moved to selectedUsers
                for (var i in this.available) {
                    for (var j in scope.selectedUsers) {
                        if (scope.selectedUsers[j].userId == this.available[i]) {
                            scope.available.splice(i, 1);
                        }
                    }
                }
            };

            scope.removeUser = function () {
                for (var i in this.selected) {
                    for (var j in scope.selectedUsers) {
                        if (scope.selectedUsers[j].userId == this.selected[i]) {
                            var temp = scope.selectedUsers[j];
                            scope.availableUsers.push(temp);
                            scope.selectedUsers.splice(j, 1);
                        }
                    }
                }
                //We need to remove selected items outside above loop. If we don't remove, we can see empty item appearing
                //If we remove selected items in above loop, all items will not be moved to availableUsers
                for (var i in this.selected) {
                    for (var j in scope.availableUsers) {
                        if (scope.availableUsers[j].userId == this.selected[i]) {
                            scope.selected.splice(i, 1);
                        }
                    }
                }
            };

            // Approval limits logic (split into below and above exception limits)
            scope.belowExceptionLimits = scope.belowExceptionLimits || [];
            scope.aboveExceptionLimits = scope.aboveExceptionLimits || [];

            scope.belowLimitInput = { from: 0, to: null };
            scope.aboveLimitInput = { from: 0, to: null };

            function addLimit(list, input) {
                if (input.from != null && input.to != null && input.to > input.from) {
                    var condition = (list === scope.belowExceptionLimits) ? 'LESS_THAN' : 'GREATER_THAN';
                    list.push({ fromAmount: input.from, toAmount: input.to, condition: condition });
                    // next from becomes last to + 1
                    var nextFrom = input.to + 1;
                    input.from = nextFrom;
                    input.to = null;
                }
            }

            // Add remove-last functions for exception limits
            scope.removeLastBelowLimit = function () {
                if (scope.belowExceptionLimits && scope.belowExceptionLimits.length) {
                    scope.belowExceptionLimits.pop();
                    scope.belowLimitInput.from = scope.belowExceptionLimits.length ? (scope.belowExceptionLimits[scope.belowExceptionLimits.length - 1].toAmount + 1) : 0;
                }
            };
            scope.removeLastAboveLimit = function () {
                if (scope.aboveExceptionLimits && scope.aboveExceptionLimits.length) {
                    scope.aboveExceptionLimits.pop();
                    scope.aboveLimitInput.from = scope.aboveExceptionLimits.length ? (scope.aboveExceptionLimits[scope.aboveExceptionLimits.length - 1].toAmount + 1) : 0;
                }
            };

            scope.addBelowLimit = function () { addLimit(scope.belowExceptionLimits, scope.belowLimitInput); };
            scope.addAboveLimit = function () { addLimit(scope.aboveExceptionLimits, scope.aboveLimitInput); };

            scope.submit = function () {
                for (var i in scope.selectedUsers) {
                    scope.formData.users.push(scope.selectedUsers[i].userId) ;
                }
                delete scope.formData.selectedUsers;
                delete scope.formData.availableUsers;
                delete scope.formData.committeeApprovalLimits;

                // attach limits (optional: backend may ignore if unsupported)
                scope.formData.belowExceptionLimits = scope.belowExceptionLimits;
                scope.formData.aboveExceptionLimits = scope.aboveExceptionLimits;

                resourceFactory.committeeResource.update({'committeeId': scope.committeeId}, this.formData, function (data) {
                    location.path('/viewcommittee/' + data.resourceId);
                });
            };
        }
    });
    mifosX.ng.application.controller('EditCommitteeController', ['$scope', '$routeParams', '$route', '$location', 'ResourceFactory', mifosX.controllers.EditCommitteeController]).run(function ($log) {
        $log.info("EditCommitteeController initialized");
    });
}(mifosX.controllers || {}));
