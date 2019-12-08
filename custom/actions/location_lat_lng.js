const customization = require('%app.core%/customization');
const device = require('%app.core%/device');
const dialog = require('%app.core%/dialog');
const geolocation = require('%app.core%/geolocation');

customization.registerRecordAction({
    modules: ['Accounts','Quotes','Meetings'],
    name: 'location',
    types: ['context-menu', 'toolbar'],
    label: 'Ubicación',

    // The icon must be defined in config/app.json
    iconKey: 'actions.location',
    rank: 3,

    // Customize action button state.
    stateHandlers: {
        isVisible(view, model) {
            var flag=false;
            if(model.get('gps_latitud_c') == undefined || model.get('gps_latitud_c')=='' || model.get('gps_latitud_c')==null){
                flag=true;
            }
            return flag;
        },
    },

    handler(view, model) {
        this.elmodelo=model;
        self=this;
        app.alert.show('getLatLng', {
              level: 'load',
              closeable: false,
              messages: 'Cargando, por favor espere',
            });
        geolocation.getCurrentPosition({
              successCb: (position) => {
                app.alert.dismiss('getLatLng');
                
                self.elmodelo.set({
                  gps_latitud_c:  position.coords.latitude,
                  gps_longitud_c: position.coords.longitude,
                }, { silent: true });
                
                self.elmodelo.save({
                }, {
                    // Pass a list of fields to be sent to the server
                    fields: [
                      'gps_latitud_c',
                      'gps_longitud_c',
                    ],
                    complete: () => {
                        // Close the alert when save operation completes
                    }
                });
                
              },
              errorCb: (errCode, errMessage) => {
                app.alert.dismiss('getLatLng');
                app.alert.show('getLatLngError', {
                    level: 'error',
                    autoClose: true,
                    messages: 'No se ha podido obtener la ubicación',
                });
              },
              enableHighAccuracy: false,
              timeout: 300000,
            });

    	       
    },//handler
});