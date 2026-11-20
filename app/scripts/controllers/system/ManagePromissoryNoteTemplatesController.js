(function (module) {
    mifosX.controllers = _.extend(module, {
        ManagePromissoryNoteTemplatesController: function (scope, resourceFactory) {

            scope.formData = {};
            scope.templates = [];
            scope.selectedTemplate = null;
            scope.flag = false;

            scope.search = function () {
                scope.templates = [];
                scope.flag = false;

                // La API actual solo expone GET /promissorynote sin filtro de búsqueda
                resourceFactory.promissoryNoteTemplateResource.getAll(function (data) {
                    scope.templates = data;
                    scope.flag = scope.templates && scope.templates.length > 0;
                    scope.errorMessage = '';
                });
            };

            /**
             * Selección de una plantilla para edición.
             */
            scope.select = function (template) {
                scope.selectedTemplate = angular.copy(template);
            };

            /**
             * Cancelar la edición.
             */
            scope.cancelEdit = function () {
                scope.selectedTemplate = null;
            };

            /**
             * Guardar cambios en la plantilla seleccionada.
             * Envía únicamente los campos editables definidos en la entidad:
             *  - blockOne
             *  - blockTwo
             *  - name
             *  - title
             */
            scope.save = function () {
                if (!scope.selectedTemplate || !scope.selectedTemplate.id) {
                    return;
                }

                var payload = {
                    templateId: scope.selectedTemplate.id,
                    blockOne: scope.selectedTemplate.blockOne,
                    blockTwo: scope.selectedTemplate.blockTwo,
                    name: scope.selectedTemplate.name,
                    title: scope.selectedTemplate.title
                };

                resourceFactory.promissoryNoteTemplateResource.update(payload, function () {
                    scope.search();
                    scope.selectedTemplate = null;
                },
                    function (error) {
                        if (error.data?.errors?.length) {
                            scope.errorMessage = error.data.errors[0].defaultUserMessage;
                        }
                    });
            };

            // Carga inicial
            scope.search();
        }
    });

    mifosX.ng.application.controller('ManagePromissoryNoteTemplatesController',
        ['$scope', 'ResourceFactory',
            mifosX.controllers.ManagePromissoryNoteTemplatesController]).run(function ($log) {
                $log.info("ManagePromissoryNoteTemplatesController initialized");
            });
}(mifosX.controllers || {}));

