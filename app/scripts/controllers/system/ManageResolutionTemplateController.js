(function (module) {
    mifosX.controllers = _.extend(module, {
        ManageResolutionTemplateController: function (scope, resourceFactory) {

            scope.formData = {};
            scope.template = {};
            scope.columnLabels = {};

            scope.search = function () {
                scope.template = {};
                scope.columnLabels = {};

                resourceFactory.templateResource.getTemplateDetails({ templateId: 1}, function (data) {
                    scope.template = data;
                    scope.errorMessage = '';

                    if (data.text) {
                        try {
                            let parsed = data.text;

                            if (typeof parsed === "string") {
                                parsed = JSON.parse(parsed);
                            }
                            scope.columnLabels = parsed;

                        } catch (e) {
                            console.error("Error parseando JSON:", e);
                            scope.columnLabels = {};
                        }
                    }
                });
            };


            scope.save = function () {

                if (!scope.template.entity) {
                    return;
                }

                var payload = {
                    name: scope.template.name,
                    text: JSON.stringify(scope.columnLabels),
                    entity: scope.template.entity === 'loan' ? 1 : 0,
                    type: scope.template.type === 'Document' ? 0 : 2
                };

                resourceFactory.templateResource.update({templateId: 1 }, payload, function () {
                    scope.search();
                },
                    function (error) {
                        if (error.data?.errors?.length) {
                            scope.errorMessage = error.data.errors[0].defaultUserMessage;
                        }
                    });
            };

            scope.updateLabel = function (key, event) {
                scope.columnLabels[key] = event.target.innerText.trim();
            };

            scope.search();
        }
    });

    mifosX.ng.application.controller('ManageResolutionTemplateController',
        ['$scope', 'ResourceFactory',
            mifosX.controllers.ManageResolutionTemplateController]).run(function ($log) {
                $log.info("ManageResolutionTemplateController initialized");
            });
}(mifosX.controllers || {}));

