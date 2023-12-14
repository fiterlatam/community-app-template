(function (module) {
    mifosX.filters = _.extend(module, {
        FormatByLocale: function ($filter, $locale) {
            return function (input) {
                if (isNaN(input)) {
                    return input;
                } else {
                    //TODO- Add number formatting also
                    if (input != "" && input != undefined) {
                        if ($locale.id == 'es') {
                            return input.toLocaleString('en');
                        } else {
                            return input.toLocaleString($locale.id);
                        }
                    };
                };
            }
        }
    });
    mifosX.ng.application.filter('FormatByLocale', ['$filter', '$locale', mifosX.filters.FormatByLocale]).run(function ($log) {
        $log.info("FormatByLocale filter initialized");
    });
}(mifosX.filters || {}));
