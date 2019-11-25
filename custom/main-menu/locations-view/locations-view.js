const customization = require('%app.core%/customization');
const device = require('%app.core%/device');
const dialog = require('%app.core%/dialog');
const NomadView = require('%app.views%/nomad-view');
const geolocation = require('%app.core%/geolocation');
const FilteredListView = require('%app.views.list%/filtered-list-view');

customization.registerMainMenuItem({
    label: 'Consultar ubicaciones',

    iconKey: 'actions.location-view',
    rank: 0,
    handler() {
        app.controller.loadScreen({
            isDynamic: true,
            view: LocationsView,
        });
    },

});

// Registrando nueva ruta citas_edit
customization.registerRoutes([{
    name: 'locations',      // Uniquely identifies the route
    steps: 'locations_steps',     // Route hash fragment: '#hello'

    handler(options) {
        app.controller.loadScreen({
            isDynamic: true,
            view: LocationsView,
        });
    }
}]);

//Definición de nueva vista para edición de Citas
let LocationsView = customization.extend(NomadView, {
    // Se especifica el nombre del template
    template: 'locations-view',

    defCuentas: null,
    // Configure the header
    headerConfig: {
        title: 'Ubicaciones',
        buttons: {
            save: {label: 'Listo'},
            cancel: {label: 'Regresar'},
        },
    },

    initialize(options) {
        self = this;
        this._super(options);
        this.defCuentas=[];
        this.getCuentas();
    },

    getCuentas(){

        self=this;

        var params = {
                'fields':'id,name,quick_contact_c,business_type_c,account_type,assigned_user_id,assigned_user_name,gps_latitud_c,gps_longitud_c,visit_status_c',
                'order_by':'date_modified:DESC',
                'max_num':-1
            };

        var url = app.api.buildURL("Accounts", '', {}, params);

        app.alert.show('accounts_load', {
                level: 'load',
                closeable: false,
                messages: app.lang.get('LBL_LOADING'),
            });

            app.api.call("read", url, null, {
                success: data => {

                    self.defCuentas=data.records;

                    var mapDiv = document.getElementById("map");

                    /*
                    var map = plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'latLng': {"lat": 19.4326018, "lng": -99.13320490000001},
                            'zoom': 7
                            }
                    });*/

                    var map=plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'zoom': 7
                            }
                        });

                    if(data.records.length>0){
                        // Add markers
                        var bounds = [];
                        for(var i=0;i<data.records.length;i++){

                            if(data.records[i].gps_latitud_c !="" && data.records[i].gps_longitud_c != ""){

                                 var icono='';
                                 switch(data.records[i].visit_status_c){
                                    
                                    case "Planificado":
                                        icono = "img/icon-negro_.png";
                                    break;
                                    
                                    case "Realizado":
                                        icono = "img/icon-verde_.png";
                                    break;
                                    
                                    case "Reprogramado":
                                        icono = "img/icon-azul_.png";
                                    break;
                                    case "Cancelado":
                                        icono = "img/icon-rojo_.png";
                                    break;

                                    case "":
                                        icono = "img/icon-negro_.png";
                                    break;

                                    default:
                                        icono = "img/icon-negro_.png";
                                }//switch
                                
                                bounds.push({"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c});

                                var marker = map.addMarker({
                                    'position': {"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c},
                                    'title': data.records[i].id,
                                    'icon': {
                                        'url': icono
                                    }
                                }, function(marker) {
                                    // Show the infoWindow
                                    marker.showInfoWindow();
                                });
                            }//if lat lng
                        }//for

                        // Set a camera position that includes all markers.
                        map.moveCamera({
                            target: bounds
                        });
                    }//if length data.records
                },//end success api call
                error: er => {
                        app.alert.show('api_carga_error', {
                            level: 'error',
                            autoClose: true,
                            messages: 'Error al cargar datos: '+er,
                        });
                },
                complete: () => {
                        app.alert.dismiss('accounts_load');
                },
            });//App.api.call
    },//end getCuentas

    onAfterRender(){
        var mapDiv = document.getElementById("map");

        // Initialize the map plugin
        var map = plugin.google.maps.Map.getMap(mapDiv);

        // You have to wait the MAP_READY event.
        map.one(plugin.google.maps.event.MAP_READY, this.onMapInit);
    },

    onMapInit(map) {

        // Add a marker
        /*
        map.addMarker({
            'position': {"lat": 19.4326018, "lng": -99.13320490000001},
            'title': "MARKER ESTATICO!"
        }, function(marker) {
            // Show the infoWindow
            marker.showInfoWindow();
        });
        */

    }
});

module.exports = LocationsView;
