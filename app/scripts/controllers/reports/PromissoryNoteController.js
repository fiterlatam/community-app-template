(function (module) {

    mifosX.controllers = _.extend(module, {
        PromissoryNoteController: function ($scope, resourceFactory, $translate) {

            // LISTA DE PLANTILLAS
            $scope.templates = [
                { id: 1, name: "Pagaré sin fiador con testigo" },
                { id: 2, name: "Pagaré sin fiador sin testigo" },
                { id: 3, name: "Pagaré con fiador y con testigo para clienta" },
                { id: 4, name: "Pagaré con fiador sin testigo" },
                { id: 5, name: "Pagaré con fiador y con testigo para cliente y fiador" },
                { id: 6, name: "Pagaré con fiador y con testigo para fiador" }

            ];

            $scope.formData = {};
            $scope.credits = [];
            $scope.showCreditSelect = false;
            $scope.showWitnessFields = false;
            $scope.loanSelected = {};

            // Cuando se escoge plantilla
            $scope.onTemplateSelected = function () {
                $scope.showCreditSelect = true;
            };

            // BUSCAR CRÉDITOS EN VIVO
            $scope.searchLoans = function () {

                if (!$scope.searchLoan || $scope.searchLoan.trim() === "") {
                    $scope.credits = [];
                    return;
                }

                resourceFactory.globalSearch.search(
                    {
                        query: $scope.searchLoan,
                        resource: "loans",
                        exactMatch: false
                    },
                    function (data) {
                        $scope.credits = data.map(function (loan) {
                            return {
                                id: loan.entityId,
                                name: loan.entityAccountNo + " - " + loan.parentName
                            };
                        });
                    }
                );
            };


            // Cuando seleccionan un crédito
            $scope.$watch("formData.loanId", function (newVal) {
                if (newVal) {
                    $scope.showWitnessFields = true;
                }
                resourceFactory.searchLoan
            });

            // Acción final
            $scope.generate = function () {
                console.log("DATOS A ENVIAR:", $scope.formData);
                alert("Generando pagaré personalizado...");
            };

        }
    });

    mifosX.ng.application.controller(
        'PromissoryNoteController',
        ['$scope', 'ResourceFactory', '$translate', mifosX.controllers.PromissoryNoteController]
    );

}(mifosX.controllers || {}));
