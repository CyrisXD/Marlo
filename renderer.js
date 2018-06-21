// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var app = angular.module('Arlo', ['ngMaterial']);
const {
    shell,
    ipcRenderer
} = require('electron')


app.controller('myCtrl', function ($scope, $http, $filter, $mdDialog) {

    // ===============================
    // OPEN EXTERNAL LINK 
    // ===============================
    $scope.openURL = function (url) {
        shell.openExternal(url);
    };

    // ===============================
    // ROTATE ACTION FOR REFRESH ICON
    // ===============================
    $scope.loginResize = function () {
        ipcRenderer.send('resize-login')
    };

    // ===============================
    // ROTATE ACTION FOR REFRESH ICON
    // ===============================
    $scope.rotateIcon = function ($event) {
        var elem = $event.currentTarget;
        elem.classList.add("fa-spin");
        $scope.getLibrary();
        setTimeout(function () {
            elem.classList.remove("fa-spin");
        }, 1000)
    }

    // =========================
    // LOG IN AND GET TOKEN
    // =========================
    $scope.logIn = function (username, password) {

        var credentials = {
            "email": username,
            "password": password
        };

        $http({
            method: 'POST',
            url: 'https://arlo.netgear.com/hmsweb/login/v2',
            data: credentials,
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function successCallback(response) {
            stash.set('userProfile', response.data)
            $scope.userProfile = response.data;
            $scope.initProfile();
            ipcRenderer.send('resize-profile');
        }, function errorCallback(err) {
            $scope.loginError = err.data.data.message;
            console.log(err)
        });

    }

    // =========================
    // GET CURRENT MODE
    // =========================
    $scope.getCurrentMode = function () {

        $http({
            method: 'GET',
            url: 'https://arlo.netgear.com/hmsweb/users/devices/automation/active',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': $scope.userProfile.data.token,
                'schemaVersion': 1
            }
        }).then(function successCallback(response) {
            if (response.data.data[0].activeModes[0] == 'mode1') {
                $scope.activeMode = 'Armed'
            } else if (response.data.data[0].activeModes[0] == 'mode0') {
                $scope.activeMode = 'Disarmed'
            } else {
                $scope.activeMode = 'Unavailable'
            }
        }, function errorCallback(err) {
            $scope.logOut(err)
            console.log(err)
        });

    }


    // =========================
    // GET DEVICES
    // =========================
    var getDevices = function () {

        $http({
            method: 'GET',
            url: 'https://arlo.netgear.com/hmsweb/users/devices/',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': $scope.userProfile.data.token
            }
        }).then(function successCallback(response) {
            $scope.devices = response.data.data
        }, function errorCallback(err) {
            $scope.logOut(err)
            console.log(err)
        });

    }


    // =========================
    // ARM/DISARM ARLO
    // =========================
    $scope.changeMode = function (mode) {

        $scope.activeMode = 'Loading';

        var body = {
            "from": $scope.userProfile.data.userId,
            "to": $scope.devices[0].deviceId,
            "action": "set",
            "responseUrl": "",
            "resource": "modes",
            "transId": "web!!" + new Date().getTime(),
            "publishResponse": true,
            "properties": {
                "active": mode
            }
        };

        $http({
            method: 'POST',
            url: 'https://arlo.netgear.com/hmsweb/users/devices/notify/' + $scope.devices[0].deviceId,
            data: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': $scope.userProfile.data.token,
                'xCloudId': $scope.devices[0].xCloudId
            }
        }).then(function successCallback(response) {
            stash.set('devices', response.data)
            setTimeout(function () {
                $scope.getCurrentMode();
            }, 2000)
        }, function errorCallback(err) {
            $scope.logOut(err)
            console.log(err)
        });

    }

    // =========================
    // GET LIBRARY
    // =========================
    $scope.getLibrary = function () {

        var fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - 5);

        $scope.fromDate = $filter('date')(fromDate, "yyyyMMdd")
        $scope.toDate = $filter('date')(Date.now(), "yyyyMMdd")

        var body = {
            "dateFrom": $scope.fromDate,
            "dateTo": $scope.toDate
        }
        $http({
            method: 'POST',
            url: 'https://arlo.netgear.com/hmsweb/users/library/',
            data: body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': $scope.userProfile.data.token
            }
        }).then(function successCallback(response) {
            $scope.library = response.data.data;
        }, function errorCallback(err) {
            $scope.logOut(err)
            console.log(err)
        });
    };


    // =========================
    // LOG OUT
    // =========================
    $scope.logOut = function (data) {
        stash.cut('userProfile')
        if (data) {
            alert(data.data.data.message);
        }
        ipcRenderer.send('logout')
    };

    // =========================
    // QUIT APP
    // =========================
    $scope.quit = function () {
        ipcRenderer.send('quit')
    };

    // =========================
    // ENABLE/DISABLE AUTO START
    // =========================
    $scope.addRemoveStartup = function (data) {
        if (data === true) {
            ipcRenderer.send('enable-startup')
            stash.set('autostart', true)
        } else {
            ipcRenderer.send('disable-startup')
            stash.set('autostart', false)
        }

    }


    // ============
    // RUN ACTION
    // ============
    $scope.initProfile = function () {
        if (stash.get('userProfile')) {
            $scope.userProfile = stash.get('userProfile');
            $scope.getCurrentMode();
            getDevices();
            $scope.getLibrary();
        }
        // Set the auto-start checkbox
        if (stash.get('autostart')) {
            $scope.autostart = stash.get('autostart');
        } else {
            stash.set('autostart', false)
        }
    }

    $scope.initProfile();

});

//==========================
// Copy/Paste Fix for MacOS
//==========================
const electron = require('electron');
const remote = electron.remote;
const Menu = remote.Menu;

const InputMenu = Menu.buildFromTemplate([{
        label: 'Undo',
        role: 'undo',
    }, {
        label: 'Redo',
        role: 'redo',
    }, {
        type: 'separator',
    }, {
        label: 'Cut',
        role: 'cut',
    }, {
        label: 'Copy',
        role: 'copy',
    }, {
        label: 'Paste',
        role: 'paste',
    }, {
        type: 'separator',
    }, {
        label: 'Select all',
        role: 'selectall',
    },
]);

document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
        if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
            InputMenu.popup(remote.getCurrentWindow());
            break;
        }
        node = node.parentNode;
    }
});