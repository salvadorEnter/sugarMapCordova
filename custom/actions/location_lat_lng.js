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

                if(self.elmodelo.module=='Accounts' && (self.elmodelo.get('billing_address_street')=='' || self.elmodelo.get('billing_address_street')==undefined) &&
                  (self.elmodelo.get('billing_address_city')=='' || self.elmodelo.get('billing_address_city')==undefined) &&
                  (self.elmodelo.get('billing_address_state')=='' || self.elmodelo.get('billing_address_state')==undefined) &&
                  (self.elmodelo.get('billing_address_country')=='' || self.elmodelo.get('billing_address_country')==undefined) &&
                  (self.elmodelo.get('billing_address_postalcode')=='' || self.elmodelo.get('billing_address_postalcode')==undefined)
                  ){

                  //Llamar a api para obtener dirección a partir de lat y long
                var lat=position.coords.latitude;
                var lng=position.coords.longitude;
                var urlGeocode='https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key=AIzaSyCVh5NcPi98UVoKI6wTVpiVBDZOht4rltc';
                $.get(urlGeocode, function(data, status){
                  if(status=="success"){
                    if(data.results.length>0){

                      var cant_componentes=data.results[0].address_components.length;
                      if(cant_componentes>0){
                        var calle='';
                        var ciudad='';
                        var estado='';
                        var pais='';
                        var cp='';

                        for (var i = 0; i < cant_componentes ; i++) {

                          //Armando call
                          if(data.results[0].address_components[i].types.includes('premise')){
                            calle+=data.results[0].address_components[i].long_name;
                          }
                          if(data.results[0].address_components[i].types.includes('route')){
                            calle+=' '+data.results[0].address_components[i].long_name;
                          }
                          if(data.results[0].address_components[i].types.includes('street_number')){
                            calle+=' '+data.results[0].address_components[i].long_name;
                          }

                          //Armando ciudad
                          if(data.results[0].address_components[i].types.includes('locality')){
                            ciudad+=data.results[0].address_components[i].long_name;
                          }

                          //Armando estado
                          if(data.results[0].address_components[i].types.includes('administrative_area_level_1')){
                            estado+=data.results[0].address_components[i].long_name;
                          }

                          //Armando pais
                          if(data.results[0].address_components[i].types.includes('country')){
                            pais+=data.results[0].address_components[i].long_name;
                          }

                          //Armando pais
                          if(data.results[0].address_components[i].types.includes('postal_code')){
                            cp+=data.results[0].address_components[i].long_name;
                          }

                        }//end for

                        self.elmodelo.set({
                          billing_address_street: calle,
                          billing_address_city: ciudad,
                          billing_address_state: estado,
                          billing_address_country: pais,
                          billing_address_postalcode: cp,
                          }, { silent: true });

                          self.elmodelo.save({}, {
                          // Pass a list of fields to be sent to the server
                              fields: [
                                'gps_latitud_c',
                                'gps_longitud_c',
                                'billing_address_street',
                                'billing_address_city',
                                'billing_address_state',
                                'billing_address_country',
                                'billing_address_postalcode'
                              ],
                              complete: () => {
                                  // Close the alert when save operation completes
                              }
                          });

                      }
                    }

                  }
                });

                }else{

                  //Solo guardar lat y lng
                  self.elmodelo.save({}, {
                    // Pass a list of fields to be sent to the server
                    fields: [
                      'gps_latitud_c',
                      'gps_longitud_c',
                    ],
                    complete: () => {
                      // Close the alert when save operation completes
                    }
                  });

                }//fin else
                
              },//fin successCb
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