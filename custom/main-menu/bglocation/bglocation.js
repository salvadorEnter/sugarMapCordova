const customization = require('%app.core%/customization');
const device = require('%app.core%/device');
const dialog = require('%app.core%/dialog');
const NomadView = require('%app.views%/nomad-view');
const geolocation = require('%app.core%/geolocation');

customization.registerMainMenuItem({
    label: 'Recorridos',

    iconKey: 'actions.map',
    rank: 0,
    handler() {
        app.controller.loadScreen({
            isDynamic: true,
            view: RecorridosView,
        });
    },

});

// Registrando nueva ruta citas_edit
customization.registerRoutes([{
    name: 'recorridos',      // Uniquely identifies the route
    steps: 'recorridos_steps',     // Route hash fragment: '#hello'

    handler(options) {
        app.controller.loadScreen({
            isDynamic: true,
            view: RecorridosView,
        });
    }
}]);

//Definición de nueva vista para edición de Citas
let RecorridosView = customization.extend(NomadView, {
    // Se especifica el nombre del template
    template: 'bglocation',

    // Configure the header
    headerConfig: {
        title: 'Recorridos',
        buttons: {
            save: {label: 'Listo'},
            cancel: {label: 'Regresar'},
        },
    },

    //Definición de eventos
    events: {
        'click .setBackground': 'clickBackground',
    },

    time:null,

    initialize(options) {
        self = this;
        this._super(options);

        this.pluginInitialize();
    },

    // Initialize plugin
    pluginInitialize() {
        var plugin    = cordova.plugins.backgroundMode;

        plugin.setDefaults({ color: 'F14F4D' });
        plugin.overrideBackButton();

        plugin.on('activate', this.onModeActivated);
        plugin.on('deactivate', this.onModeDeactivated);
        plugin.on('enable', this.onModeEnabled);
        plugin.on('disable', this.onModeDisabled);
    },

    clickBackground(event){

        var plugin = cordova.plugins.backgroundMode;
        $(event.currentTarget).addClass('disabled');
        plugin.setEnabled(!plugin.isEnabled());

    },

    // Update badge once mode gets activated
    onModeActivated: function() {
        var counter = 0;

        cordova.plugins.backgroundMode.disableWebViewOptimizations(); 
        self=this;
        this.timer = setInterval(function () {
            counter++;

            console.log('Running since ' + counter + ' sec');

            //cordova.plugins.notification.badge.set(counter);

            if (counter % 45 === 0) {
                //self.obtenerUbicacion();
                geolocation.getCurrentPosition({
                  successCb: (position) => {
                    console.log("LA POSITIONN");

                    //self.createRecordLocation(position.coords.latitude,position.coords.longitude);
                    var newAccount={
                        "name":"registro generado en bg ",
                        "gps_latitud_c":position.coords.latitude,
                        "gps_longitud_c":position.coords.longitude
                    };

                    var url = app.api.buildURL("Accounts", '', {}, {});

                    app.api.call("create", url, newAccount, {
                        success: data => {

                            console.log("SUUCCESS");

                        },
                        error: er => {

                        },

                        complete: () => {

                        },
                    });//fin api call

                },
                errorCb: (errCode, errMessage) => {

                    app.logger.debug(`Ubicación no disponible: ${errCode} - ${errMessage}`);
                },
                enableHighAccuracy: false,
                timeout: 300000,
            });

            }
        }, 1000);
    },

    obtenerUbicacion:function(){
        self=this;
        geolocation.getCurrentPosition({
            successCb: (position) => {
                console.log("LA POSITIONN");
                //self.createRecordLocation(position.coords.latitude,position.coords.longitude);

            },
            errorCb: (errCode, errMessage) => {

                app.logger.debug(`Ubicación no disponible: ${errCode} - ${errMessage}`);
            },
            enableHighAccuracy: false,
            timeout: 300000,
        });

    },

    createRecordLocation:function(lat,lng){

        var newAccount={
            "name":"registro generado en bg ",
            "gps_latitud_c":lat,
            "gps_longitud_c":lng
        };

        var url = app.api.buildURL("Accounts", '', {}, {});

        app.api.call("create", url, newAccount, {
            success: data => {

                console.log("SUUCCESS");

            },
            error: er => {

            },

            complete: () => {

            },
        });//fin api call

    },

    // Reset badge once deactivated
    onModeDeactivated: function() {
        //cordova.plugins.notification.badge.clear();
        clearInterval(this.timer);
    },

    onModeEnabled:function(){
        var btn = document.getElementById('backgroundButton');
        //app.setButtonClass(btn, true);
        console.log('Se ha habilitado el plugin backgroundd');
        //cordova.plugins.notification.badge.registerPermission();
    },

     // Update CSS classes
     onModeDisabled: function() {
        var btn = document.getElementById('mode');
        //this.setButtonClass(btn, false);
        console.log('Se ha deshabilitado el plugin backgroundd');

    },
});

module.exports = RecorridosView;
