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
    route:'locations_view'
});

// Registrando nueva ruta citas_edit
customization.registerRoutes([{
    name: 'locations',      // Uniquely identifies the route
    steps: 'locations_view',     // Route hash fragment: '#hello'

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

    currentLatitud:null,
    currentLng:null,

    // Configure the header
    headerConfig: {
        title: 'Ubicaciones',
        buttons: {
            //save: {label: 'Listo'},
            /*cancel: {label: 'Regresar'},*/
            mainMenu: true
        },
    },

    //Definición de eventos
    events: {
        'click #linkCuenta': 'navigateCuenta',
        'click .tablinks':'openTab'
    },

    initialize(options) {
        self = this;
        this._super(options);
        this.defCuentas=[];
        this.getCuentas();
        this.obtenerUbicacion();
    },

    getCuentas(){

        self=this;

        var params = {
                'fields':'id,name,quick_contact_c,business_type_c,account_type,assigned_user_id,assigned_user_name,gps_latitud_c,gps_longitud_c,visit_status_c,estrellas_c,photography_c',
                'order_by':'date_modified:DESC',
                'max_num':-1
            };

        var url = app.api.buildURL("GetAccountsForMap", '', {}, {});

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

                                marker.on(plugin.google.maps.event.INFO_CLICK, function() {
                                    // Hide the infoWindow
                                    marker.hideInfoWindow();
                                });

                                marker.on(plugin.google.maps.event.MARKER_CLICK, function(markers, info) {

                                    //document.getElementById("map").setAttribute("style", "width: 100%;height: 400px");
                                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                                    var idCuenta=info.getOptions().title;
                                    var definicionCuenta=self.search(idCuenta, self.defCuentas);
                                    var urlImage='';
                                    if(definicionCuenta.photography_c != "" && definicionCuenta.photography_c !=null){
                                        urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);

                                        //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="40%">');
                                    }else{
                                        //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="img/defaultImageMap.png" width="40%">');
                                        urlImage='img/sugar_crm_icon.png';
                                    }

                                    var domicilio='';
                                    if(definicionCuenta.calle != null && definicionCuenta.calle != "" && definicionCuenta.calle !=undefined &&
                                    definicionCuenta.ciudad !=null && definicionCuenta.ciudad != "" && definicionCuenta.ciudad !=undefined){
                                        domicilio='<b> '+definicionCuenta.calle+', '+definicionCuenta.ciudad+'<br>'+
                                        definicionCuenta.estado+' ' +definicionCuenta.cp +'<br>'+
                                        definicionCuenta.pais+'</b>';
                                    }
                                    var contenido='<p>Nombre del negocio: <input type = "hidden" value="'+definicionCuenta.id+'"><font id="linkCuenta" color="#0679c8">'+definicionCuenta.name+'</font></p>'+
                                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                                    '<p>Domicilio: '+domicilio+'</p>';

                                    //$('#nameStars').children('div').eq(0).html('<h1>'+definicionCuenta.name+'<h1>');

                                    var contenidoUsuario='<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+' "target="_blank">'+definicionCuenta.reporta +'</a></p>';

                                    //Llenando sección con las estrellas
                                    var estrellas=definicionCuenta.estrellas_c;
                                    if(estrellas=="" || estrellas ==0 || estrellas ==null){
                                        var contenidoEstrellas='<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                        '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">';

                                        //$('#star_container').html(contenidoEstrellas);
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

                                        //$('#star_container').html(contenidoEstrellas);
                                    }

                                    //$('#section_info').show();
                                    //$('#section_info').html(contenido);

                                    //$('#contenidoUsuario').html(contenidoUsuario);
                                    // var urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);
                                    //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="40%">');
                                    //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="img/defaultImageMap.png" width="40%">');
                                    /*
                                    var contenidoInfoWindow='<div class="container" style="width:300px; height:300px;">'+
                                            '<ul class="nav nav-tabs">'+
                                                '<li class="active">'+
                                                    '<a data-toggle="tab" href="#menu1">'+
                                                        'Información de Cuenta'+
                                                    '</a>'+
                                                '</li>'+
                                                '<li>'+
                                                    '<a data-toggle="tab" href="#menu2">'+
                                                        'Usuario'+
                                                    '</a>'+
                                                '</li>'+
                                            '</ul>'+
                                            '<div class="tab-content">'+
                                                '<div id="menu1" class="tab-pane fade in active">'+
                                                    '<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImageIw+'" width="100">'+
                                                    '<p> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"target="_blank"> '+definicionCuenta.name+'</a></p>'+
                                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                                    '<p>Domicilio:'+domicilio+'</p>'+
                                                '</div>'+
                                                '<div id="menu2" class="tab-pane fade">'+
                                                    '<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+'" target="_blank">'+definicionCuenta.reporta +'</a></p>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>';
                                        */

                                        var contenidoInfoWindow='<div class="tab" style="width: 330px;">'+
                                        '<button class="tablinks" style="background-color:#bfbbbb">Cuenta</button>'+
                                        '<button class="tablinks">Usuario</button>'+
                                        '<button class="tablinks">Analiticos</button>'+
                                        '</div>'+
                                        '<div id="Cuenta" class="tabcontent">'+
                                            '<div id="contenidoCuenta" style="padding: 10px;">'+
                                                    '<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="100">'+
                                                    '<p> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"target="_blank"> '+definicionCuenta.name+'</a></p>'+
                                                    /*
                                                    '<div>'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/estrella_blanca.png" width="25">'
                                                    '</div>'+
                                                    */
                                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                                    '<p>Domicilio:'+domicilio+'</p>'+            
                                            '</div>'+
                                        '</div>'+
                                        '<div id="Usuario" class="tabcontent" style="display:none">'+
                                            '<div id="contenidoUsuario" style="padding: 10px;">'+
                                                    '<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+'" target="_blank">'+definicionCuenta.reporta +'</a></p>'+
                                            '</div>'+
                                        '</div>'+
                                        '<div id="Analiticos" class="tabcontent" style="display:none">'+
                                            '<div id="contenidoAnaliticos" style="padding: 10px;">'+
                                                    '<img style="margin: 0px 15px 15px 0px;" src="img/snapshot.png" width="300px">'+
                                            '</div>'+
                                        '</div>';

                                    infowindow.setContent(contenidoInfoWindow);
                                    infowindow.open(this);

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

    obtenerUbicacion(){
        self=this;

         app.alert.show('getLatLng', {
              level: 'load',
              closeable: false,
              messages: 'Cargando, por favor espere',
            });
        geolocation.getCurrentPosition({
              successCb: (position) => {
                app.alert.dismiss('getLatLng');

                self.currentLatitud=position.coords.latitude;
                self.currentLng=position.coords.longitude;
                document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                    var mapDiv = document.getElementById("map");

                    var map=plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'zoom': 7
                            }
                        });

                    var currentLocationMarker = map.addMarker({
                                    'position': {"lat":self.currentLatitud,"lng":self.currentLng},
                                    'title': 'Usted está aquí',
                                    'icon': {
                                        'url': 'img/iconCurrentLocation.png'
                                    }
                                });

                        // Show the infoWindow
                    currentLocationMarker.showInfoWindow();
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

    },

    navigateCuenta:function(evt){

        var idCuenta=$(evt.currentTarget).siblings('input').val();

        app.controller.navigate('Accounts/'+idCuenta);

    },

    openTab:function(evt){
        var pestana=$(evt.currentTarget).text();
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        $(evt.currentTarget).attr('style','background-color:#bfbbbb');
        $(evt.currentTarget).siblings().attr('style',"")
        switch(pestana){
            case "Cuenta":
                $('#Cuenta').show();
                $('#Usuario').hide();
                $('#Analiticos').hide();
            break;

            case "Usuario":
                $('#Usuario').show();
                $('#Cuenta').hide();
                $('#Analiticos').hide();
            break;

            case "Analiticos":
                $('#Analiticos').show();
                $('#Cuenta').hide();
                $('#Usuario').hide();
            break;

        }//switch
        
        /*
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(pestana).style.display = "block";
        evt.currentTarget.className += " active";
        */

    },

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
