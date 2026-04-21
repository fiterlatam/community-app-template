(function (module) {
    mifosX.controllers = _.extend(module, {
        LoginFormController: function (scope, authenticationService, resourceFactory, httpService, $timeout,$uibModal, localStorageService) {
            scope.loginCredentials = {};
            scope.passwordDetails = {};
            scope.authenticationFailed = false;
            scope.showLoading = false;

            scope.twoFactorRequired = false;
            scope.twoFactorDeliveryMethods = {};
            scope.selectedDeliveryMethodName = null;
            scope.otpRequestData = {};
            scope.otpToken = null;
            scope.selectedDeliveryMethodName = null;
            scope.twofactorRememberMe = false;

            scope.login = function () {
                scope.authenticationFailed = false;
                scope.showLoading = true;
                authenticationService.authenticateWithUsernamePassword(scope.loginCredentials);
               // delete scope.loginCredentials.password;
            };

            scope.$on("UserAuthFailureEvent", function (event, data, status) {
                timer = $timeout(function(){
                    delete scope.loginCredentials.password;
                },1000);
                scope.authenticationFailed = true;
                if(status != 401) {
                    scope.authenticationErrorMessage = scope.extractError(data,'error.connection.failed');
                    scope.showLoading = false;
                } else {
                    scope.authenticationErrorMessage = scope.extractError(data,'error.login.failed');
                    scope.showLoading = false;
                }
            });

            scope.extractError = function (data,defaultmsg) {
                msg = defaultmsg;
                if (data && data.errors && data.errors.length > 0) {
                    msg=data.errors[0].userMessageGlobalisationCode;
                }
                return msg;
            }

            scope.$on("UserAuthenticationSuccessEvent", function (event, data) {
                scope.showLoading = false;
                scope.authenticationFailed = false;
                scope.twoFactorRequired = false;
                scope.otpRequested = false;
                timer = $timeout(function(){
                    delete scope.loginCredentials.password;
                },2000);

                delete scope.otpToken;
                scope.otpTokenError = false;
                scope.twofactorRememberMe = false;
             });

            scope.$on("UserAuthenticationTwoFactorRequired", function (event, data) {
                scope.showLoading = false;
                scope.twoFactorRequired = true;
                resourceFactory.twoFactorResource.getDeliveryMethods(function (data) {
                    scope.twoFactorDeliveryMethods = data;
                });
            });

            /*This logic is no longer required as enter button is binded with text field for submit.
            $('#pwd').keypress(function (e) {
                if (e.which == 13) {
                    scope.login();
                }
            });*/

            /*$('#repeatPassword').keypress(function (e) {
                if (e.which == 13) {
                    scope.updatePassword();
                }
            });*/

            scope.updatePassword = function (){
                resourceFactory.selfServiceResource.update({'userId': scope.loggedInUserId},scope.passwordDetails, function (data) {
                    //clear the old authorization token
                    httpService.cancelAuthorization();
                    scope.authenticationFailed = false;
                    scope.resetPassword=  false;
                    scope.loginCredentials.password = scope.passwordDetails.password;
                    authenticationService.authenticateWithUsernamePassword(scope.loginCredentials);
                });
            };

            // Move to auth service probably
            scope.requestOTP = function () {
                if(scope.selectedDeliveryMethodName != null) {
                    scope.showLoading = true;
                    resourceFactory.twoFactorResource.requestOTP({deliveryMethod: scope.selectedDeliveryMethodName, extendedToken: scope.twofactorRememberMe}, function (data) {
                        scope.showLoading = false;
                        if(data.deliveryMethod !== null) {
                            scope.otpRequestData.deliveryMethod = data.deliveryMethod;
                            scope.otpRequestData.expireDate = new Date(data.reqestTime + data.tokenLiveTimeInSec * 1000);
                            scope.otpRequested = true;
                        }
                    });
                    scope.selectedDeliveryMethodName = null;
                }
            };

            scope.validateOTP = function () {
                if(scope.otpToken !== null) {
                    scope.showLoading = true;
                    authenticationService.validateOTP(scope.otpToken, scope.twofactorRememberMe);
                }
            };

            scope.$on("TwoFactorAuthenticationFailureEvent", function (event, data, status) {
                scope.showLoading = false;
                scope.otpToken = null;
                if(status == 403) {
                    scope.otpErrorMessage = 'error.otp.validate.invalid';
                } else {
                    scope.otpErrorMessage = 'error.otp.validate.other';
                }
                scope.otpTokenError = true;
            });

            scope.promptPasswordReset = function() {
                $uibModal.open({
                    templateUrl: 'resetpassword.html',
                    controller: ModalInstanceCtrl
                });
            }

            var ModalInstanceCtrl = function ($scope, $uibModalInstance) {
                $scope.formData = {};
                $scope.requested = false;
                $scope.isLoading = false;
                $scope.save = function (staffId) {
                    $scope.isLoading=true;
                    let command = $scope.requested? 'resetPassword':'requestPasswordReset';
                    scope.removeTwoFactorTokenFromStorage($scope.formData.username)

                    resourceFactory.resetUserAccountResource.update({
                        'username': $scope.formData.username,'command': command,
                        'logoutDevices':$scope.formData.logoutDevices,'otp':$scope.formData.otp}, $scope.formData, function (data) {
                            $scope.isLoading=false;
                        if ($scope.requested) {
                            $uibModalInstance.close('activate');
                            scope.authenticationErrorMessage = 'err.msg.newpassword.sent'
                        }else{
                            $scope.requested = true;
                        }
                    },function (err){
                        $scope.isLoading=false;
                    });
                };
                $scope.cancel = function () {
                    $uibModalInstance.dismiss('cancel');
                };


            };

            scope.removeTwoFactorTokenFromStorage = function (username) {
                scope.isClearing=true;
                console.log("Removing two-factor token from storage for user "+ username);

                timer = $timeout(function(){
                    scope.isClearing=false;
                },2000);

                var storageData = localStorageService.getFromLocalStorage("twofactor");
                if(!storageData) {
                    return;
                }

                delete storageData[username]
                localStorageService.removeFromLocalStorage("twofactor");
                localStorageService.addToLocalStorage('twofactor', storageData);
                timer = $timeout(function(){
                    scope.isClearing=false;
                },2000);
            };


        }
    });
    mifosX.ng.application.controller('LoginFormController', ['$scope', 'AuthenticationService', 'ResourceFactory', 'HttpService','$timeout','$uibModal','localStorageService', mifosX.controllers.LoginFormController]).run(function ($log) {
        $log.info("LoginFormController initialized");
    });
}(mifosX.controllers || {}));
