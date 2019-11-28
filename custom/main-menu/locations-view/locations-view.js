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
                'fields':'id,name,quick_contact_c,business_type_c,account_type,assigned_user_id,assigned_user_name,gps_latitud_c,gps_longitud_c,visit_status_c,estrellas_c,photography_c',
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
                    var contextoApiCuentas=this;
                    //Se establece height dinámicamente, con base a la altura de la ventana
                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                    var mapDiv = document.getElementById("map");

                    var map=plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'zoom': 7
                            }
                        });

                    if(data.records.length>0){

                        //Inicializando infowindow
                        var infowindow = new plugin.google.maps.HtmlInfoWindow();

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
                                });

                                marker.on(plugin.google.maps.event.MARKER_CLICK, function(markers, info) {

                                    document.getElementById("map").setAttribute("style", "width: 100%;height: 300px");
                                    var idCuenta=info.getOptions().title;
                                    var definicionCuenta=self.search(idCuenta, self.defCuentas);

                                    /*<img id="lugar_cuenta" src="https://www.google.com/maps/about/images/mymaps/mymaps-desktop-16x9.png">
                                    <img id="lugar_cuenta" src="https://www.google.com/maps/about/images/mymaps/mymaps-desktop-16x9.png">*/
                                    if(definicionCuenta.photography_c != ""){

                                        var urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);
                                        $('#imageSection').html('<img id="lugar_cuenta" src="'+urlImage+'">');
                                    }else{
                                        $('#imageSection').html('<img id="lugar_cuenta" src="img/defaultImageMap.png">');
                                    }
                                    
                                    var contenido='<p><i class="icon icon-building-o"></i> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"> '+definicionCuenta.name+'</a></p>'+
                                    '<p><i class="icon icon-user-o"></i> Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                    '<p><i class="icondefault icon icon-building"></i> Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                    '<p><i class="icondefault icon icon-th"></i> Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>';

                                    $('#nameStars').children('div').eq(0).html('<h1>'+definicionCuenta.name+'<h1>');

                                    //Llenando sección con las estrellas
                                    var estrellas=definicionCuenta.estrellas_c;
                                    if(estrellas=="" || estrellas ==0){
                                        var contenidoEstrellas='<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">';

                                        $('#star_container').html(contenidoEstrellas);
                                    }else{

                                        var contenidoEstrellas='';

                                        for(var i=0;i<estrellas;i++){
                                            contenidoEstrellas+='<img style="margin: 0px 15px 15px 0px;" src="img/estrella.png" width="25">';
                                        }
                                        var estrellas_restantes= 5-estrellas;
                                        if(estrellas>0){
                                            for(var i=0;i<estrellas_restantes;i++){
                                                contenidoEstrellas+='<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">';
                                            }
                                        }

                                        $('#star_container').html(contenidoEstrellas);
                                    }

                                    $('#section_info').show();
                                    $('#section_info').html(contenido);

                                    //infowindow.setContent(contenido);
                                    //infowindow.open(this);
                                    //this.trigger(plugin.google.maps.event.MARKER_CLICK);

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

    search:function(key,defCuentas){
        for(var i=0;i<defCuentas.length;i++){
            if(defCuentas[i].id===key){
            return defCuentas[i];
            }
        }
    },

    generarURLImage : function (module, id, field,_hash) {
        var url = app.api.buildFileURL({
            module : module,
            id : id,
            field : field 
        }) + "&_hash=" + _hash;
        return url;
    },  

    onAfterRender(){
        document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
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
