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
            $scope.errorMessages = [];

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
                    // resourceFactory.LoanAccountResource.getLoanAccountDetails({ loanId: newVal, associations: 'all', exclude: 'guarantors,futureSchedule' }, function (data) {
                    // });
                    resourceFactory.loanResourceTemplates.get({loanId: newVal}, function (data) {
                        $scope.formData.witnessName = data?.lider_agencia;
                        $scope.formData.witnessDPI = data?.user_dpi;
                        $scope.formData.fiadorAddress = data?.direccion_fiador;
                        $scope.formData.fiadorName = data?.nombre_fiador;
                        $scope.formData.fiadorDPI = data?.dpi_fiador;
                        $scope.formData.fiadorWitness = data?.lider_agencia;
                        $scope.formData.fiadorWitnessDPI = data?.user_dpi;
                        $scope.formData.agencyId = data?.agencyId;
                    });

                    $scope.showWitnessFields = true;
                }
            });

            // Acción final
            $scope.generate = function () {
                console.log("DATOS A ENVIAR:", $scope.formData);
                $scope.errorMessages = [];
                resourceFactory.runReportsPromissory.generate(
                    $scope.formData,
                    function (response) {

                        // Tomar el Base64 desderespuesta
                        var base64 = response.pdfBase64;

                        //  convertir base64 a Blob
                        var byteCharacters = atob(base64);
                        var byteNumbers = new Array(byteCharacters.length);
                        for (var i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        var byteArray = new Uint8Array(byteNumbers);
                        var blob = new Blob([byteArray], { type: "application/pdf" });

                        // Crear URL temporal
                        var blobUrl = URL.createObjectURL(blob);

                        // Crear link invisible y empezar descarga
                        var link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = "promissory_note.pdf";
                        document.body.appendChild(link);
                        link.click();

                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                    },
                    function (error) {
                        $scope.errorMessages = [];

                        if (error.data && error.data.errors && error.data.errors.length) {
                            error.data.errors.forEach(function (err) {
                                $scope.errorMessages.push(err.defaultUserMessage);
                            });
                        } else {
                            $scope.errorMessages.push('Unexpected error occurred');
                        }
                    }
                );
            };

        }
    });

    mifosX.ng.application.controller(
        'PromissoryNoteController',
        ['$scope', 'ResourceFactory', '$translate', mifosX.controllers.PromissoryNoteController]
    );

}(mifosX.controllers || {}));
