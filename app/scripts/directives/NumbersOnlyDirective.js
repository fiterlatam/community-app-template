(function (module) {
    mifosX.directives = _.extend(module, {
        NumbersOnlyDirective: function ($filter, $locale, $parse) {
            return {
                require: 'ngModel',
                link: function (scope, element, attr, ngModelCtrl) {
                    function fromUser(text) {
                        if (text) {
                            var transformedInput = text.replace(/[^0-9]/g, '');

                            if (transformedInput !== text) {
                                ngModelCtrl.$setViewValue(transformedInput);
                                ngModelCtrl.$render();
                            }
                            return transformedInput;
                        }
                        return undefined;
                    }
                    ngModelCtrl.$parsers.push(fromUser);
                }
            };
       }
    });
}(mifosX.directives || {}));
mifosX.ng.application.directive("numbersOnly", ['$filter', '$locale','$parse', mifosX.directives.NumbersOnlyDirective]).run(function ($log) {
    $log.info("NumbersOnlyDirective initialized");
});
