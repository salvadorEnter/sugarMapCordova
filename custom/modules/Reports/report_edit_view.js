const app = SUGAR.App;
const customization = require('%app.core%/customization');
const NomadView = require('%app.views%/nomad-view');
const SelectionListView = require('%app.views.list%/selection-list-view');
const MultiEnumField = require('%app.fields%/multienum/multienum');

// Extend custom Hello World from the base view 
let ReportsView = customization.extend(NomadView, {
    // Specify the name of HBS template
    template: 'report_edit_view',
    
    // Configure the header
    headerConfig: {
        title: 'Reportes',
        buttons: {
            mainMenu: true,
        }
    },

    //Definición de eventos
    events: {
        'change select[name="columnas_visibles"]': 'onChangeColumns',
        'change select[name="available_fields"]': 'onChangeFiltro',
        'change select.fieldOperator':'initFieldValue',
        //'click .btnGenerar':'downloadReportPDF',
        'click .btnGenerar':'createFilterAndDownload',
        'click .removeItem':'removerFiltro',
        'click .removeColumn':'removerColumnaSeleccionada',
        'change .fieldValue':'validateEmptyValues'

    },

    initialize(options) {

        this._super('initialize', [options]);
        this.filtros=[];
        this.showTable=false;
        this.$idown=true;
        this.serverURL=app.api.serverUrl.split('/rest/v11_1')[0];

        //Inicializando arreglo para establecer valor vacío a opciones de campos disponibles

        this.campos_disponibles=[{'nombre':'','etiqueta':''}];

        //Cargando el mapeo de opciones que se deben de cargar dependiendo al tipo de campo seleccionado
        this.loadFilterOperators();
        this._operatorsWithNoValues = ['$empty', '$not_empty'];

        //Llenando dropdown con los campos disponibles para filtrar del módulo de Cuentas
        this.campos=this.getFilterFields('Accounts');

        
        for (var key in this.campos) {

            if(this.campos[key].type != undefined)

                var opcion={
                    'nombre':this.campos[key].name,
                    'etiqueta':app.lang.get(this.campos[key].vname, 'Accounts')
                };
                this.campos_disponibles.push(opcion);
            }

            self=this;

        },

    /*
    * Obtiene los campos disponibles para filtrar pertenecientes a un módulo en específico 
    */
    getFilterFields: function(moduleName) {
        var moduleMeta = app.metadata.getModule(moduleName),
        fieldMeta = moduleMeta.fields,
        fields = {};
        if (moduleMeta.filters) {
            _.each(moduleMeta.filters, function(templateMeta) {
                if (templateMeta.meta && templateMeta.meta.fields) {
                    fields = _.extend(fields, templateMeta.meta.fields);
                }
            });
        }

        _.each(fields, function(fieldFilterDef, fieldName) {
            var fieldMetaData = app.utils.deepCopy(fieldMeta[fieldName]);
            if (_.isEmpty(fieldFilterDef)) {
                fields[fieldName] = fieldMetaData || {};
            } else {
                fields[fieldName] = _.extend({name: fieldName}, fieldMetaData, fieldFilterDef);
            }
            delete fields[fieldName]['readonly'];
        });

        return fields;
    },

    loadFilterOperators:function(module="Accounts"){

        //this.filterOperatorMap = app.metadata.getFilterOperators(module);
        this.filterOperatorMap={
            "email" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "text" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "textarea" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "currency" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "int" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$in" : "es cualquiera de"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "double" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "float" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "decimal" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"},
            ],
            "date" : [
            {"$equals" : "es igual a"},
            {"$lt" : "antes"},
            {"$gt" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"},
            ],
            "datetime" : [
            {"$starts" : "es igual a"},
            {"$lte" : "antes"},
            {"$gte" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"}
            ],
            "datetimecombo" : [
            {"$starts" : "es igual a"},
            {"$lte" : "antes"},
            {"$gte" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"},
            ],
            "bool" : [
            {"$equals" : "es"}
            ],
            "relate" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"},
            ],
            "teamset" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"}
            ],
            "phone" : [
            {"$starts" : "empieza con"},
            {"$equals" : "es"},
            ],
            "radioenum" : [
            {"$equals" : "es"},
            {"$not_equals" : "no es"},
            ],
            "parent" : [
            {"$equals" : "es"},
            ],
            "tag" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"},
            {"$empty" : "está vacío"},
            {"$not_empty" : "no está vacío"}
            ],
            "multienum":[
            {"$contains":"es cualquiera de"},
            {"$not_contains" :"no es cualquiera de"}
            ],
            "enum":[ 
            {"$in": "es cualquiera de"},
            {"$not_in": "no es cualquiera de"},
            {"$empty" : "está vacío"},
            {"$not_empty": "no está vacío"}
            ],
            "varchar": [
            {"$equals" : "combinaciones exactas"},
            {"$starts": "empieza con"}
            ],
            "name" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],    
        }
    },  

    onChangeColumns:function(e){
        var etiqueta=$(e.currentTarget).find('option:selected').text();
        var nombre_campo=$(e.currentTarget).val();

        var campoCreado='<label class="field__label '+nombre_campo+'">'+etiqueta+'  <i class="icondefault icon icon-remove removeColumn"></i></label>';

        $('.selectedColumnsReport').append(campoCreado);

        //Eliminando opción elegida para evitar crear un filtro con el mismo campo
        $("select[name='columnas_visibles'] option[value='"+nombre_campo+"']").remove();

    },

    onChangeFiltro:function(e){

        var campo=$(e.currentTarget).find('option:selected').text();
        var nombre_campo=$(e.currentTarget).val();

        var tipo=this.campos[nombre_campo].type;
        var opciones='';

        for(var i=0;i<this.filterOperatorMap[tipo].length;i++){

            for(var clave in this.filterOperatorMap[tipo][i]){

                var etiqueta_operador=App.lang.get(this.filterOperatorMap[tipo][i][clave],['Accounts','Filters']);
                opciones+="<option value='"+clave+"'>"+etiqueta_operador+"</option>";

            }
        }

        var nuevoCampo='<div class="field field--enum fieldEnumOperator"><label class="field__label '+nombre_campo+ ' '+ campo +'">'+campo+'  <i class="icondefault icon icon-remove inert multienum-list__remove removeItem"></i></label><div class="field__controls"><select name="opciones_fitros" class="fieldOperator">'+opciones+'</select><i class="icondefault icon icon-caret-down selectArrow-icon"></i></div>';
        //var nuevoCampo='<div class="field field--enum fieldEnumOperator"><label class="field__label '+nombre_campo+'">'+campo+'</label><div class="field__controls"><select name="opciones_fitros" class="fieldOperator">'+opciones+'</select><i class="icondefault icon icon-remove inert multienum-list__remove removeItem"></i></div>';

        $('.selectedFieldsFilter').append(nuevoCampo);
        
        //Eliminando opción elegida para evitar crear un filtro con el mismo campo
        $("select[name='available_fields'] option[value='"+nombre_campo+"']").remove();

        $('select.fieldOperator').trigger('change');

    },

    initFieldValue:function(e){

        var valor_operador=$(e.currentTarget).val();

        if(!this._operatorsWithNoValues.includes(valor_operador)){

            //Obteniendo el nombre del campo para poder obtener su tipo
            var clases=$(e.currentTarget).parent().siblings('label').attr('class').split(' ');
            var fieldName=clases[1];

            var campoConstruido=this.buildFieldValue(fieldName);

            if($(e.currentTarget).parent().parent().children('.field').length==0){

                $(e.currentTarget).parent().parent().append(campoConstruido);
            }else{
                //Removiendo el campo y reemplazandolo por uno nuevo
                $(e.currentTarget).parent().parent().children('.field').eq(0).remove();
                $(e.currentTarget).parent().parent().append(campoConstruido);
            }

        }else{
            if($(e.currentTarget).parent().parent().children('.field').length>0){
                $(e.currentTarget).parent().parent().children('.field').eq(0).remove();

            }
        }

    },

    buildFieldValue:function(name){

        var fieldType=this.campos[name].type;

        var tiposText=['email','text','textarea','phone','varchar','name'];
        var tiposSelect=['enum'];

        var campo=''

        if(tiposText.includes(fieldType)){

            campo=`<div class="field">
            <div class="field__controls">
            <span class="input-wrapper">
            <input type="text"  class="fieldValue" autocorrect="" value="" name="">
            <i class="icondefault icon icon-remove clear-button"></i>
            </span>
            </div>
            </div>`;

        }else if(tiposSelect.includes(fieldType)){

            var lista_opciones=App.metadata.getModule('Accounts','fields')[name].options;

            var opciones=App.lang.getAppListStrings(lista_opciones);

            var strOpciones='';
            for(var key in opciones){

                strOpciones+='<option value="'+key+'">'+opciones[key]+'</option>';
            }

            campo=`<div class="field field--enum opciones_`+name +`">
            <div class="field__controls">
            <select name="select_`+name +`" class="fieldValue">`
            +strOpciones+
            `</select>
            <i class="icondefault icon icon-caret-down selectArrow-icon"></i>
            </div>
            </div`;
        }

        return campo;

    },

    createFilterAndDownload:function(e){

        if(this.validateEmptyColumns()==true){


            self.filtros=[];

            $('.selectedFieldsFilter').children('.fieldEnumOperator').each(function(index, element) {
                var nombre_campo=$(this).children('label')[0].classList[1];
                var operator=$(this).children().eq(1).find('select.fieldOperator').val();
                var valor="";
                if($(this).find('.fieldValue').length>0){

                    valor=$(this).find('.fieldValue').val();
                }

                var filtro={
                    "nombre_campo":nombre_campo,
                    "operator":operator,
                    "valor":valor
                }

                self.filtros.push(filtro);

            });

            var headers=[];
            var columnas_seleccionadas=$('.selectedColumnsReport').children().length;
            if(columnas_seleccionadas > 0){
                for(var i=0;i<columnas_seleccionadas;i++){

                    headers.push($('.selectedColumnsReport').children()[i].classList[1]);
                }

            }
            var strHeaders=headers.join();

            var strFiltro=this.buildFilterUrl(strHeaders,this.filtros);

            this.headers=strHeaders.split(',')

            var strFiltro='Accounts?'+strFiltro;

            var url=app.api.buildURL(strFiltro,null, null, null);


            app.alert.show('filters_load', {
                level: 'load',
                closeable: false,
                messages: app.lang.get('LBL_LOADING'),
            });

            app.api.call("read", url, {}, {
                success: data => {

                    if(data.records.length>0){

                        var urlPDF=app.api.buildURL("GeneratePDFdoc", '', {}, {});

                        var params = {
                            'filters': data.records,
                            'headers':self.headers
                        };

                        app.api.call("create", urlPDF, {data: params}, {
                            success: data => {

                                $('.downloadReport').removeClass('hide');

                                var serverURL=app.api.serverUrl.split('/rest/v11_1')[0];
                                
                                //self.downloadFile('algo',file);
                                app.alert.dismiss('filters_load');

                            },
                            error: er => {
                                app.alert.show('api_carga_error', {
                                    level: 'error',
                                    autoClose: true,
                                    messages: 'Error al cargar datos: '+er,
                                });
                            },
                            complete: () => {

                                // Oculta alerta hasta que la petición se haya completado
                                app.alert.dismiss('filters_load');
                                
                            },
                        });
                        
                    }else{

                        app.alert.show('results_not_found', {
                            level: 'warning',
                            autoClose: false,
                            messages: 'No se encontraron resultados con las condiciones indicadas',
                        });
                        app.alert.dismiss('filters_load');

                    }                

                },
                error: er => {

                },
                complete: () => {


                },
            });


        }else{
            app.alert.show('api_carga_error', {
                level: 'error',
                autoClose: false,
                messages: 'Favor de elegir las columnas visibles en el reporte',
            });
        }



    },

    validateEmptyColumns:function(){

        if($('.selectedColumnsReport').children().length==0){

            return false;

        }else{

            return true;
        }
    },

    removerFiltro:function(e){
        $(e.currentTarget).parent().parent().remove();

        //Añadir nuevamente a las opciones disponibles el item removido
        var valor=$(e.currentTarget).parent()[0].classList[1];
        var etiqueta=$(e.currentTarget).parent()[0].classList[2];

        $("select[name='available_fields'] option").eq(0).after($("<option></option>").val(valor).html(etiqueta));

    },

    removerColumnaSeleccionada:function(e){

        $(e.currentTarget).parent().remove();

        var valor=$(e.currentTarget).parent()[0].classList[1];
        var etiqueta=$(e.currentTarget).parent().eq(0).text().trim();

        $("select[name='columnas_visibles'] option").eq(0).after($("<option></option>").val(valor).html(etiqueta));

    },

    validateEmptyValues:function(e){
        var valores=$('.fieldValue');
        if(valores.length>0){
            var count=0;
            for(var i=0;i<valores.length;i++){

                if(valores.eq(i).val() !=""){
                    count++;
                }
            }

            if(valores.length == count){
                $('.btnGenerar').removeClass('disabled');
                $('.btnGenerar').attr('style','');

            }else{
                $('.btnGenerar').addClass('disabled');
                $('.btnGenerar').attr('style','pointer-events:none');
            }
        }
    },

    buildFilterUrl:function(encabezados,filtros){

        //var columnas="&fields=name,assigned_user_name,industry&max_num=-1";
        var columnas="&fields="+encabezados+"&max_num=-1";
        var strFiltro="";
        for(var i=0;i<filtros.length;i++){
            if(i != filtros.length-1){
                if(filtros[i].operator=='$in'){
                    strFiltro+="filter["+i+"]["+filtros[i].nombre_campo+"]["+filtros[i].operator+"][]="+filtros[i].valor+'&';
                }else{
                    strFiltro+="filter["+i+"]["+filtros[i].nombre_campo+"]["+filtros[i].operator+"]="+filtros[i].valor+'&';
                }
            }else{

                if(filtros[i].operator=='$in'){

                    strFiltro+="filter["+i+"]["+filtros[i].nombre_campo+"]["+filtros[i].operator+"][]="+filtros[i].valor;
                }else{

                    strFiltro+="filter["+i+"]["+filtros[i].nombre_campo+"]["+filtros[i].operator+"][]="+filtros[i].valor;
                }
            }
            
        }

        strFiltro+=columnas;

        return strFiltro;
        
    },

    downloadFile:function(data, fileName, type="text/plain") {
        // Create an invisible A element
        /*
        const a = document.createElement("a");
        a.style.display = "none";
        document.body.appendChild(a);

          // Set the HREF to a Blob representation of the data to be downloaded
        /*
        a.href = window.URL.createObjectURL(
            new Blob([data], { type })
        );
        */
        /*
        a.href=fileName;

         // Use download attribute to set set desired file name
         a.setAttribute("download", fileName);

         // Trigger the download by simulating click
         a.click();

         // Cleanup
        //window.URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
        */

        var link = document.createElement('a');
        link.href = fileName;
        link.download = 'report.pdf';
        link.dispatchEvent(new MouseEvent('click'));
        //document.body.removeChild(link);

    },

});

// Register custom route "hello"
/*
customization.registerRoutes([{
    name: 'reports',      // Uniquely identifies the route
    steps: 'reports',     // Route hash fragment: '#hello'
    
    handler() {
        // Load HelloWorld view when the route is navigated to.
        app.controller.loadScreen(ReportsView);
    }
}]);

// Register a new action in the main menu
customization.registerMainMenuItem({

    label: app.lang.get('Reportes'),   // Displayable label
    iconKey: 'actions.module',               // Icon key from config/app.json
    route: 'reports',                         // Name of the route to navigate to when the action is selected
    rank: 0,                                // Identifies the position of the action in the menu
    
});
*/
module.exports = ReportsView;